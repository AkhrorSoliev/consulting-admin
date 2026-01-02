import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import useUserRole from "../../hooks/useUserRole";
import { db, auth } from "../../firebase/config";
import { generateTelegramInviteLink } from "../../utils/telegramInvites";

function normalizeChatId(raw) {
  // Telegram chat_id can be a number or string like "-100123...".
  const s = String(raw ?? "").trim();
  if (!s) return "";
  // Basic validation: must look like an integer (allow leading "-")
  if (!/^-?\d+$/.test(s)) return "";
  return s;
}

export default function TelegramGroupsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = !loadingRole && role === "super_admin";
  const isAdmin = !loadingRole && role === "admin";
  const canAccess = isSuperAdmin || isAdmin;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState({});
  const [showMembersModal, setShowMembersModal] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingMember, setRemovingMember] = useState({});

  const canEdit = canAccess;

  async function upsertByChatId({ name, chat_id, active }) {
    const safeChatId = normalizeChatId(chat_id);
    if (!safeChatId) throw new Error("invalid chat_id");
    const safeName = String(name || "").trim() || safeChatId;

    // If exists by chat_id, update. Else create new.
    const q = query(
      collection(db, "telegram_groups"),
      where("chat_id", "==", safeChatId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      await updateDoc(doc(db, "telegram_groups", d.id), {
        name: safeName,
        chat_id: safeChatId,
        active: active !== false,
      });
      return { id: d.id, updated: true };
    }

    const res = await addDoc(collection(db, "telegram_groups"), {
      name: safeName,
      chat_id: safeChatId,
      active: active !== false,
      linksSentCount: 0,
      createdAt: serverTimestamp(),
    });
    return { id: res.id, created: true };
  }

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "telegram_groups"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setGroups(list);
        setLoading(false);
      },
      (err) => {
        toast.error("Telegram-Gruppen konnten nicht geladen werden.");
        setLoading(false);
      }
    );
    return () => unsub?.();
  }, []);

  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter((g) => g?.active !== false).length;
    const linksGeneratedTotal = groups.reduce((acc, g) => {
      const n = Number(g?.linksGeneratedCount ?? g?.linksSentCount);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    const linksDispatchedTotal = groups.reduce((acc, g) => {
      const n = Number(g?.linksDispatchedCount);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return {
      total,
      active,
      inactive: total - active,
      linksGeneratedTotal,
      linksDispatchedTotal,
    };
  }, [groups]);

  const mergedRows = useMemo(() => {
    return groups
      .map((g) => {
        const chatId = String(g?.chat_id || "").trim();
        const docId = String(g?.id || "").trim();
        const name = String(g?.name || g?.id || "").trim();
        const active = g?.active !== false;
        const linksGeneratedCount = Number(
          g?.linksGeneratedCount ?? g?.linksSentCount
        );
        const linksDispatchedCount = Number(g?.linksDispatchedCount);
        const safeGenerated = Number.isFinite(linksGeneratedCount)
          ? linksGeneratedCount
          : 0;
        const safeDispatched = Number.isFinite(linksDispatchedCount)
          ? linksDispatchedCount
          : 0;

        return {
          key: chatId ? `chat:${chatId}` : `doc:${docId}`,
          source: "firestore",
          docId,
          chat_id: chatId,
          name: name || chatId || docId,
          active,
          linksGeneratedCount: safeGenerated,
          linksDispatchedCount: safeDispatched,
        };
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [groups]);

  const toggleActive = async (id, next) => {
    if (!canEdit) {
      toast.error("Keine Berechtigung.");
      return;
    }
    const safeId = String(id || "").trim();
    if (!safeId) return;
    try {
      await updateDoc(doc(db, "telegram_groups", safeId), {
        active: Boolean(next),
      });
    } catch (e) {
      toast.error("Konnte nicht geändert werden.");
    }
  };

  const handleGenerateLink = async (groupId) => {
    if (!canEdit) {
      toast.error("Keine Berechtigung.");
      return;
    }
    setGeneratingLink((prev) => ({ ...prev, [groupId]: true }));
    try {
      const result = await generateTelegramInviteLink({ groupId });
      if (result?.invite_link) {
        await navigator.clipboard.writeText(result.invite_link);
        toast.success("Link erstellt und in die Zwischenablage kopiert!");
      } else {
        toast.error("Link konnte nicht erstellt werden.");
      }
    } catch (e) {
      toast.error(
        "Fehler beim Erstellen des Links: " +
          (e?.message || "Unbekannter Fehler")
      );
    } finally {
      setGeneratingLink((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleShowMembers = async (groupId) => {
    setShowMembersModal(groupId);
    setLoadingMembers(true);
    setMembers([]);
    try {
      const response = await fetchGroupMembers(groupId);
      setMembers(response?.members || []);
    } catch (e) {
      toast.error("Fehler beim Laden der Mitglieder.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (groupId, userId) => {
    if (!canEdit) {
      toast.error("Keine Berechtigung.");
      return;
    }
    const key = `${groupId}_${userId}`;
    setRemovingMember((prev) => ({ ...prev, [key]: true }));
    try {
      await removeTelegramGroupMember({ groupId, userId });
      toast.success("Mitglied aus der Gruppe entfernt.");
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (e) {
      toast.error("Fehler beim Entfernen des Mitglieds.");
    } finally {
      setRemovingMember((prev) => ({ ...prev, [key]: false }));
    }
  };

  async function fetchGroupMembers(groupId) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    const bases = getFunctionsBaseCandidates();
    for (const base of bases) {
      try {
        const url = `${base}/getTelegramGroupMembers?groupId=${encodeURIComponent(
          groupId
        )}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json?.ok) return json;
      } catch (e) {
        continue;
      }
    }
    throw new Error("Failed to fetch members");
  }

  async function removeTelegramGroupMember({ groupId, userId }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    const bases = getFunctionsBaseCandidates();
    for (const base of bases) {
      try {
        const url = `${base}/removeTelegramGroupMember`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ groupId, userId }),
        });
        const json = await res.json();
        if (res.ok && json?.ok) return json;
      } catch (e) {
        continue;
      }
    }
    throw new Error("Failed to remove member");
  }

  function getFunctionsBaseCandidates() {
    const env = import.meta.env || {};
    const explicit = String(env.VITE_FUNCTIONS_BASE || "").trim();
    if (explicit) return [explicit.replace(/\/+$/, "")];
    const out = [];
    const projectId = String(env.VITE_FIREBASE_PROJECT_ID || "").trim();
    if (projectId) {
      out.push(`https://us-central1-${projectId}.cloudfunctions.net`);
      out.push(`https://europe-west3-${projectId}.cloudfunctions.net`);
    }
    return out.filter(Boolean);
  }

  if (loadingRole) {
    return <div className="text-sm text-base-content/60">Wird geladen...</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-100 p-4">
        <h2 className="text-lg font-semibold">Kein Zugriff</h2>
        <p className="text-sm text-error">
          Für diesen Bereich ist <span className="font-mono">role=admin</span>{" "}
          oder <span className="font-mono">role=super_admin</span> erforderlich.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Telegram Groups</h2>
        <p className="text-sm text-base-content/70">
          Active = ON bedeutet sichtbar im System, OFF bedeutet nicht sichtbar.
          Refresh aktualisiert die Liste vom Bot und prüft auf neue Gruppen
        </p>
      </div>

      <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
        <div className="text-sm opacity-70">
          <strong>💡 So funktioniert es:</strong> Fügen Sie den Bot als Admin
          zur Gruppe hinzu und schreiben Sie eine Nachricht in die Gruppe. Die
          Gruppe erscheint automatisch hier.
        </div>

        {mergedRows.length === 0 ? (
          <div className="text-sm opacity-70">
            {loading
              ? "Wird geladen..."
              : "Noch keine Gruppen. Fügen Sie den Bot zur Gruppe hinzu und schreiben Sie eine Nachricht."}
          </div>
        ) : (
          <div className="divide-y divide-base-200 rounded-lg border border-base-200">
            {mergedRows.map((row) => {
              const name = String(row?.name || "").trim();
              const isNew = row?.source === "suggested";
              const docId = String(row?.docId || "").trim();
              const checked = row?.active === true;
              const gen = Number(row?.linksGeneratedCount);
              const sent = Number(row?.linksDispatchedCount);
              const safeGen = Number.isFinite(gen) ? gen : 0;
              const safeSent = Number.isFinite(sent) ? sent : 0;
              const showStats = row?.source === "firestore";
              const hasChat = Boolean(String(row?.chat_id || "").trim());
              return (
                <div
                  key={row.key}
                  className="p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{name || "—"}</div>
                    {isNew ? (
                      <div className="text-xs opacity-70">Neu</div>
                    ) : showStats ? (
                      <div className="text-xs opacity-70">
                        Generated:{" "}
                        <span className="font-mono font-semibold">
                          {safeGen}
                        </span>{" "}
                        · Sent:{" "}
                        <span className="font-mono font-semibold">
                          {safeSent}
                        </span>
                        {!hasChat ? (
                          <span className="opacity-70">
                            {" "}
                            · Nicht konfiguriert
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {docId && checked && (
                      <>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-info"
                          onClick={() => handleGenerateLink(docId)}
                          disabled={generatingLink[docId]}
                          title="Link erstellen"
                        >
                          {generatingLink[docId] ? "..." : "🔗 Link"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-warning"
                          onClick={() => handleShowMembers(docId)}
                          title="Mitglieder anzeigen"
                        >
                          👥 Mitglieder
                        </button>
                      </>
                    )}
                    <label className="label cursor-pointer gap-2">
                      <span className="text-sm">Active</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={checked}
                        onChange={async (e) => {
                          const next = Boolean(e.target.checked);
                          try {
                            if (docId) {
                              await toggleActive(docId, next);
                              return;
                            }
                            if (!next) return;
                            await upsertByChatId({
                              name: name || "",
                              chat_id: row.chat_id,
                              active: true,
                            });
                            toast.success("Zum System hinzugefügt.");
                          } catch (err) {
                            toast.error("Konnte nicht geändert werden.");
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="stats stats-vertical sm:stats-horizontal shadow border border-base-300 bg-base-100">
        <div className="stat">
          <div className="stat-title">Gesamt</div>
          <div className="stat-value text-primary">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Active</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Inactive</div>
          <div className="stat-value">{stats.inactive}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Links generated (jami)</div>
          <div className="stat-value">{stats.linksGeneratedTotal}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Links sent (jami)</div>
          <div className="stat-value">{stats.linksDispatchedTotal}</div>
        </div>
      </div>

      {showMembersModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowMembersModal(null)}
        >
          <div
            className="bg-base-100 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gruppenmitglieder</h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowMembersModal(null)}
              >
                ✕
              </button>
            </div>
            {loadingMembers ? (
              <div className="text-center py-8 text-sm opacity-70">
                Wird geladen...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-70">
                Keine Mitglieder gefunden oder Bot ist kein Admin in der Gruppe.
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-base-300"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {member.first_name || "—"}
                      </div>
                      <div className="text-xs opacity-70">
                        {member.username ? `@${member.username}` : ""}
                        {member.status ? ` · ${member.status}` : ""}
                      </div>
                    </div>
                    {member.status !== "creator" &&
                      member.status !== "administrator" && (
                        <button
                          type="button"
                          className="btn btn-xs btn-error"
                          onClick={() =>
                            handleRemoveMember(showMembersModal, member.user_id)
                          }
                          disabled={
                            removingMember[
                              `${showMembersModal}_${member.user_id}`
                            ]
                          }
                        >
                          {removingMember[
                            `${showMembersModal}_${member.user_id}`
                          ]
                            ? "..."
                            : "Entfernen"}
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
