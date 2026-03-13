import toast from "react-hot-toast";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { generateTelegramChannelInviteLink } from "../../../../utils/telegramInvites";

function normalizeChatId(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (!/^-?\d+$/.test(s)) return "";
  return s;
}

export { normalizeChatId };

export default function useChannelActions({
  canEdit,
  newChannelForm,
  setNewChannelForm,
  setAddingChannel,
  setGeneratingLink,
}) {
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

  return {
    upsertByChatId,
    toggleActive,
    handleGenerateLink,
    handleAddChannel,
  };
}
