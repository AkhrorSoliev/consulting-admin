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
import { db } from "../../firebase/config";
import { fetchTelegramGroupsFromUpdates } from "../../utils/telegramInvites";

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

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggested, setSuggested] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  const canEdit = isSuperAdmin;

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

  async function refreshTelegramGroupsFromBot({ toastOnSuccess = false } = {}) {
    if (!isSuperAdmin) return;
    setLoadingSuggested(true);
    try {
      const chats = await fetchTelegramGroupsFromUpdates({ limit: 100 });
      setSuggested(Array.isArray(chats) ? chats : []);
      if (toastOnSuccess) toast.success("Yangilandi.");
    } catch (e) {
      console.error("fetchTelegramGroupsFromUpdates failed:", e);
      setSuggested([]);
      toast.error(
        "Telegram’dan guruhlar olinmadi. Bot guruh ichida kamida 1 ta xabar ko‘rgan bo‘lishi kerak."
      );
    } finally {
      setLoadingSuggested(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSuperAdmin) return;
      await refreshTelegramGroupsFromBot({ toastOnSuccess: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

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
        console.error("telegram_groups snapshot error:", err);
        toast.error("Telegram guruhlar yuklanmadi.");
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
    const map = new Map();

    // Firestore (authoritative for active)
    for (const g of Array.isArray(groups) ? groups : []) {
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

      if (chatId) {
        map.set(`chat:${chatId}`, {
          key: `chat:${chatId}`,
          source: "firestore",
          docId,
          chat_id: chatId,
          name: name || chatId,
          active,
          linksGeneratedCount: safeGenerated,
          linksDispatchedCount: safeDispatched,
        });
      } else if (docId) {
        // Legacy/misconfigured doc: keep it visible by doc id
        map.set(`doc:${docId}`, {
          key: `doc:${docId}`,
          source: "firestore",
          docId,
          chat_id: "",
          name: name || docId,
          active,
          linksGeneratedCount: safeGenerated,
          linksDispatchedCount: safeDispatched,
        });
      }
    }

    // Suggested (not yet in Firestore)
    for (const c of Array.isArray(suggested) ? suggested : []) {
      const chatId = String(c?.chat_id || "").trim();
      if (!chatId) continue;
      const key = `chat:${chatId}`;
      if (map.has(key)) continue;
      const name = String(c?.name || "").trim();
      map.set(key, {
        key,
        source: "suggested",
        docId: "",
        chat_id: chatId,
        name: name || chatId,
        active: false,
        linksGeneratedCount: 0,
        linksDispatchedCount: 0,
      });
    }

    const rows = Array.from(map.values());
    rows.sort((a, b) => {
      // active first, then "new", then name
      if (a.active !== b.active) return a.active ? -1 : 1;
      const aNew = a.source === "suggested";
      const bNew = b.source === "suggested";
      if (aNew !== bNew) return aNew ? -1 : 1;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    return rows;
  }, [groups, suggested]);

  const toggleActive = async (id, next) => {
    if (!canEdit) {
      toast.error("Faqat super admin.");
      return;
    }
    const safeId = String(id || "").trim();
    if (!safeId) return;
    try {
      await updateDoc(doc(db, "telegram_groups", safeId), {
        active: Boolean(next),
      });
    } catch (e) {
      console.error("toggle telegram group active failed:", e);
      toast.error("O‘zgartirib bo‘lmadi.");
    }
  };

  if (loadingRole) {
    return <div className="text-sm text-base-content/60">Wird geladen...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-100 p-4">
        <h2 className="text-lg font-semibold">Kein Zugriff</h2>
        <p className="text-sm text-error">
          Bu bo‘lim uchun <span className="font-mono">role=super_admin</span>{" "}
          kerak.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Telegram Groups</h2>
        <p className="text-sm text-base-content/70">
          Active = ON bo‘lsa tizimda ko‘rinadi, OFF bo‘lsa tizimda ko‘rinmaydi.
          Refresh esa botdan ro‘yxatni yangilab, yangi guruh bor-yo‘qligini
          tekshiradi.
        </p>
      </div>

      <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-sm btn-outline btn-primary"
            onClick={() =>
              refreshTelegramGroupsFromBot({ toastOnSuccess: true })
            }
            disabled={loadingSuggested}
          >
            {loadingSuggested ? "Yuklanmoqda..." : "Refresh"}
          </button>
        </div>

        {mergedRows.length === 0 ? (
          <div className="text-sm opacity-70">
            {loading || loadingSuggested
              ? "Yuklanmoqda..."
              : "Hozircha guruh yo‘q."}
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
                      <div className="text-xs opacity-70">Yangi</div>
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
                          <span className="opacity-70"> · Sozlanmagan</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center">
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
                            // Suggested (not in Firestore yet): only ON creates/imports it.
                            if (!next) return;
                            await upsertByChatId({
                              name: name || "",
                              chat_id: row.chat_id,
                              active: true,
                            });
                            toast.success("Tizimga qo‘shildi.");
                          } catch (err) {
                            console.error(err);
                            toast.error("O‘zgartirib bo‘lmadi.");
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
          <div className="stat-title">Jami</div>
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
    </div>
  );
}
