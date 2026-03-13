import { updateMetaByName } from "../../utils";
import toast from "react-hot-toast";
import {
  generateTelegramInviteLink,
} from "../../utils/telegramInvites";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";

export async function handleSaveInterviews({
  majorKey,
  setIsSaving,
  internalDate, internalLink, internalLinkType,
  internalLocationName, internalLocationUrl, internalTelegramGroupId,
  leadershipDate, leadershipLink, leadershipLinkType,
  leadershipLocationName, leadershipLocationUrl, leadershipTelegramGroupId,
  employerDate, employerLink, employerLinkType,
  employerLocationName, employerLocationUrl, employerTelegramGroupId,
}) {
  if (!majorKey) return;
  setIsSaving(true);
  try {
    const now = Date.now();
    const normalizeLocation = (name, url) => {
      const n = String(name || "").trim();
      const u = String(url || "").trim();
      return n || u;
    };
    await updateMetaByName(majorKey, {
      interviewInternal: {
        date: internalDate || "",
        link: internalLink || "",
        linkType: internalLinkType || "zoom",
        locationName: normalizeLocation(internalLocationName, internalLocationUrl),
        locationUrl: internalLocationUrl || "",
        telegramGroupId:
          internalLinkType === "telegram" ? internalTelegramGroupId || "" : "",
        updatedAt: now,
      },
      interviewLeadership: {
        date: leadershipDate || "",
        link: leadershipLink || "",
        linkType: leadershipLinkType || "zoom",
        locationName: normalizeLocation(leadershipLocationName, leadershipLocationUrl),
        locationUrl: leadershipLocationUrl || "",
        telegramGroupId:
          leadershipLinkType === "telegram" ? leadershipTelegramGroupId || "" : "",
        updatedAt: now,
      },
      interviewEmployer: {
        date: employerDate || "",
        link: employerLink || "",
        linkType: employerLinkType || "zoom",
        locationName: normalizeLocation(employerLocationName, employerLocationUrl),
        locationUrl: employerLocationUrl || "",
        telegramGroupId:
          employerLinkType === "telegram" ? employerTelegramGroupId || "" : "",
        updatedAt: now,
      },
      updatedAt: now,
    });
    toast.success("Zusätzliche Informationen gespeichert!");
  } catch (e) {
    toast.error("Speichern fehlgeschlagen.");
  } finally {
    setIsSaving(false);
  }
}

export async function handleSaveMeta({
  majorKey,
  metaName,
  metaSlug,
  metaTitle,
  setIsSavingMeta,
  setMetaValidationError,
}) {
  if (!majorKey) return;
  const safeName = String(metaName || "").trim();
  const safeSlug = String(metaSlug || "").trim();
  const safeTitle = String(metaTitle || "").trim();
  if (!safeName || !safeSlug || !safeTitle) {
    setMetaValidationError("Barcha maydonlarni to'ldiring.");
    return;
  }
  setIsSavingMeta(true);
  setMetaValidationError("");
  try {
    const nameQuery = query(
      collection(db, "meta"),
      where("name", "==", safeName),
      limit(10),
    );
    const nameSnap = await getDocs(nameQuery);
    const existingDocs = nameSnap.docs.filter((d) => d.id !== majorKey);
    if (existingDocs.length > 0) {
      setMetaValidationError(
        `"${safeName}" nomi allaqachon mavjud. Boshqa nom tanlang.`,
      );
      setIsSavingMeta(false);
      return;
    }
    const slugQuery = query(
      collection(db, "meta"),
      where("slug", "==", safeSlug),
      limit(10),
    );
    const slugSnap = await getDocs(slugQuery);
    const existingSlugDocs = slugSnap.docs.filter((d) => d.id !== majorKey);
    if (existingSlugDocs.length > 0) {
      setMetaValidationError(
        `"${safeSlug}" slug allaqachon mavjud. Boshqa slug tanlang.`,
      );
      setIsSavingMeta(false);
      return;
    }
    const now = Date.now();
    await updateMetaByName(majorKey, {
      name: safeName,
      slug: safeSlug,
      title: safeTitle,
      updatedAt: now,
    });
    toast.success("Yo'nalish ma'lumotlari saqlandi!");
  } catch (e) {
    setMetaValidationError("Saqlashda xatolik yuz berdi.");
  } finally {
    setIsSavingMeta(false);
  }
}

export async function handleGenerateAndCopyInvite(
  groupId,
  scope,
  setInviteCopyLoading,
) {
  const safe = String(groupId || "").trim();
  if (!safe) {
    toast.error("Telegram group tanlanmagan.");
    return;
  }
  setInviteCopyLoading((p) => ({ ...p, [scope]: true }));
  try {
    const { invite_link } = await generateTelegramInviteLink({
      groupId: safe,
    });
    await navigator.clipboard.writeText(invite_link);
    toast.success("Invite link nusxalandi.");
  } catch (e) {
    toast.error("Invite link yaratib bo'lmadi.");
  } finally {
    setInviteCopyLoading((p) => ({ ...p, [scope]: false }));
  }
}
