import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import useUserRole from "../../../../hooks/useUserRole";
import { db } from "../../../../firebase/config";
import useChannelActions from "./useChannelActions";

export default function useTelegramChannels() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = !loadingRole && role === "super_admin";
  const isAdmin = !loadingRole && role === "admin";
  const canAccess = isSuperAdmin || isAdmin;
  const canEdit = canAccess;

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState({});
  const [addingChannel, setAddingChannel] = useState(false);
  const [newChannelForm, setNewChannelForm] = useState({ name: "", chat_id: "" });

  const {
    upsertByChatId,
    toggleActive,
    handleGenerateLink,
    handleAddChannel,
  } = useChannelActions({
    canEdit,
    newChannelForm,
    setNewChannelForm,
    setAddingChannel,
    setGeneratingLink,
  });

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

  return {
    loadingRole,
    canAccess,
    canEdit,
    loading,
    stats,
    mergedRows,
    generatingLink,
    addingChannel,
    setAddingChannel,
    newChannelForm,
    setNewChannelForm,
    toggleActive,
    handleGenerateLink,
    handleAddChannel,
    upsertByChatId,
  };
}
