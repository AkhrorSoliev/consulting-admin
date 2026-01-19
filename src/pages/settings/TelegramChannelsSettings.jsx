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
import { generateTelegramChannelInviteLink } from "../../utils/telegramInvites";

function normalizeChatId(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (!/^-?\d+$/.test(s)) return "";
  return s;
}

export default function TelegramChannelsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = !loadingRole && role === "super_admin";
  const isAdmin = !loadingRole && role === "admin";
  const canAccess = isSuperAdmin || isAdmin;

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState({});
  const [addingChannel, setAddingChannel] = useState(false);
  const [newChannelForm, setNewChannelForm] = useState({ name: "", chat_id: "" });

  const canEdit = canAccess;

  async function upsertByChatId({ name, chat_id, active }) {
    const safeChatId = normalizeChatId(chat_id);
    if (!safeChatId) throw new Error("invalid chat_id");
    const safeName = String(name || "").trim() || safeChatId;

    const q = query(
      collection(db, "telegram_channels"),
      where("chat_id", "==", safeChatId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      await updateDoc(doc(db, "telegram_channels", d.id), {
        name: safeName,
        chat_id: safeChatId,
        active: active !== false,
      });
      return { id: d.id, updated: true };
    }

    const res = await addDoc(collection(db, "telegram_channels"), {
      name: safeName,
      chat_id: safeChatId,
      active: active !== false,
      linksSentCount: 0,
      linksGeneratedCount: 0,
      createdAt: serverTimestamp(),
    });
    return { id: res.id, created: true };
  }

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "telegram_channels"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setChannels(list);
        setLoading(false);
      },
      (err) => {
        toast.error("Telegram kanallar yuklanmadi.");
        setLoading(false);
      }
    );
    return () => unsub?.();
  }, []);

  const stats = useMemo(() => {
    const total = channels.length;
    const active = channels.filter((c) => c?.active !== false).length;
    const linksGeneratedTotal = channels.reduce((acc, c) => {
      const n = Number(c?.linksGeneratedCount ?? c?.linksSentCount);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    const linksDispatchedTotal = channels.reduce((acc, c) => {
      const n = Number(c?.linksDispatchedCount);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return {
      total,
      active,
      inactive: total - active,
      linksGeneratedTotal,
      linksDispatchedTotal,
    };
  }, [channels]);

  const mergedRows = useMemo(() => {
    return channels
      .map((c) => {
        const chatId = String(c?.chat_id || "").trim();
        const docId = String(c?.id || "").trim();
        const name = String(c?.name || c?.id || "").trim();
        const active = c?.active !== false;
        const linksGeneratedCount = Number(
          c?.linksGeneratedCount ?? c?.linksSentCount
        );
        const linksDispatchedCount = Number(c?.linksDispatchedCount);
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
  }, [channels]);

  const toggleActive = async (id, next) => {
    if (!canEdit) {
      toast.error("Ruxsat yo'q.");
      return;
    }
    const safeId = String(id || "").trim();
    if (!safeId) return;
    try {
      await updateDoc(doc(db, "telegram_channels", safeId), {
        active: Boolean(next),
      });
    } catch (e) {
      toast.error("O'zgartirib bo'lmadi.");
    }
  };

  const handleGenerateLink = async (channelId) => {
    if (!canEdit) {
      toast.error("Ruxsat yo'q.");
      return;
    }
    setGeneratingLink((prev) => ({ ...prev, [channelId]: true }));
    try {
      const result = await generateTelegramChannelInviteLink({ channelId });
      if (result?.invite_link) {
        await navigator.clipboard.writeText(result.invite_link);
        toast.success("Link yaratildi va nusxalandi!");
      } else {
        toast.error("Link yaratib bo'lmadi.");
      }
    } catch (e) {
      toast.error(
        "Link yaratishda xatolik: " + (e?.message || "Noma'lum xatolik")
      );
    } finally {
      setGeneratingLink((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Ruxsat yo'q.");
      return;
    }
    const safeName = String(newChannelForm.name || "").trim();
    const safeChatId = normalizeChatId(newChannelForm.chat_id);
    if (!safeChatId) {
      toast.error("Chat ID noto'g'ri formatda.");
      return;
    }
    try {
      await upsertByChatId({ name: safeName, chat_id: safeChatId, active: true });
      toast.success("Kanal qo'shildi.");
      setNewChannelForm({ name: "", chat_id: "" });
      setAddingChannel(false);
    } catch (err) {
      toast.error("Kanal qo'shib bo'lmadi.");
    }
  };

  if (loadingRole) {
    return <div className="text-sm text-base-content/60">Yuklanmoqda...</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-100 p-4">
        <h2 className="text-lg font-semibold">Ruxsat yo'q</h2>
        <p className="text-sm text-error">
          Bu bo'lim uchun <span className="font-mono">role=admin</span> yoki{" "}
          <span className="font-mono">role=super_admin</span> kerak.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Telegram Channels</h2>
        <p className="text-sm text-base-content/70">
          Yangiliklar kanallari ro'yxati. Bir martalik taklif linki yaratib, 1-bosqichda qabul qilingan nomzodlarga avtomatik yuboriladi.
        </p>
      </div>

      <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
        <div className="text-sm opacity-70">
          <strong>💡 Qanday ishlaydi:</strong> Botni kanalga admin sifatida qo'shing.
          Keyin kanal chat_id sini qo'lda qo'shing (kanallar avtomatik aniqlanmaydi).
          1-bosqichda qabul qilingan nomzodlarga yangiliklar kanaliga a'zo bo'lish uchun bir martalik link yuboriladi.
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setAddingChannel(!addingChannel)}
          >
            {addingChannel ? "Bekor qilish" : "+ Kanal qo'shish"}
          </button>
        </div>

        {addingChannel && (
          <form onSubmit={handleAddChannel} className="flex flex-col sm:flex-row gap-2 p-3 bg-base-200 rounded-lg">
            <input
              type="text"
              className="input input-sm input-bordered flex-1"
              placeholder="Kanal nomi"
              value={newChannelForm.name}
              onChange={(e) => setNewChannelForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              type="text"
              className="input input-sm input-bordered flex-1"
              placeholder="Chat ID (masalan: -1001234567890)"
              value={newChannelForm.chat_id}
              onChange={(e) => setNewChannelForm((f) => ({ ...f, chat_id: e.target.value }))}
              required
            />
            <button type="submit" className="btn btn-sm btn-success">
              Qo'shish
            </button>
          </form>
        )}

        {mergedRows.length === 0 ? (
          <div className="text-sm opacity-70">
            {loading
              ? "Yuklanmoqda..."
              : "Hali kanallar yo'q. Yuqoridagi tugma orqali kanal qo'shing."}
          </div>
        ) : (
          <div className="divide-y divide-base-200 rounded-lg border border-base-200">
            {mergedRows.map((row) => {
              const name = String(row?.name || "").trim();
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
                    {hasChat && (
                      <div className="text-xs font-mono opacity-50 select-all">
                        chat_id: {row.chat_id}
                      </div>
                    )}
                    {showStats && (
                      <div className="text-xs opacity-70">
                        Generated:{" "}
                        <span className="font-mono font-semibold">
                          {safeGen}
                        </span>{" "}
                        · Sent:{" "}
                        <span className="font-mono font-semibold">
                          {safeSent}
                        </span>
                        {!hasChat && (
                          <span className="opacity-70">
                            {" "}
                            · Sozlanmagan
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {docId && checked && (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline btn-info"
                        onClick={() => handleGenerateLink(docId)}
                        disabled={generatingLink[docId]}
                        title="Link yaratish"
                      >
                        {generatingLink[docId] ? "..." : "🔗 Link"}
                      </button>
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
                            toast.success("Tizimga qo'shildi.");
                          } catch (err) {
                            toast.error("O'zgartirib bo'lmadi.");
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
          <div className="stat-title">Links generated</div>
          <div className="stat-value">{stats.linksGeneratedTotal}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Links sent</div>
          <div className="stat-value">{stats.linksDispatchedTotal}</div>
        </div>
      </div>
    </div>
  );
}
