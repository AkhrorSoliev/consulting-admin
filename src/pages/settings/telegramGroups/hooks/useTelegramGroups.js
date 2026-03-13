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
import { db } from "../../../../firebase/config";

function normalizeChatId(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (!/^-?\d+$/.test(s)) return "";
  return s;
}

export default function useTelegramGroups({ canEdit }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState({});

  async function upsertByChatId({ name, chat_id, active }) {
    const safeChatId = normalizeChatId(chat_id);
    if (!safeChatId) throw new Error("invalid chat_id");
    const safeName = String(name || "").trim() || safeChatId;

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
      () => {
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

  return {
    groups,
    loading,
    generatingLink,
    setGeneratingLink,
    stats,
    mergedRows,
    toggleActive,
    upsertByChatId,
  };
}
