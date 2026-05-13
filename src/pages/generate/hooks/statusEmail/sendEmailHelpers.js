import { increment } from "firebase/firestore";
import toast from "react-hot-toast";
import {
  trackTelegramInviteSent,
} from "../../../../utils/telegramInvites";
import { sendStatusViaTelegram } from "../../../../utils/telegram";
import { removeUserFromTelegramGroups } from "../../../../utils/removeFromTelegramGroups";
import { updateDocument, getUserFromFirestore } from "../../../../utils";

const TELEGRAM_UNREACHABLE_PATTERNS = [
  "user is deactivated",
  "bot was blocked by the user",
  "chat not found",
  "user not found",
  "peer_id_invalid",
];

function isTelegramUnreachableError(errorMsg) {
  const lower = String(errorMsg || "").toLowerCase();
  return TELEGRAM_UNREACHABLE_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Attempt to also deliver the status email via Telegram.
 * If the candidate's Telegram account is unreachable (deactivated,
 * blocked, or chat not found), clear the stored telegramId so we
 * don't keep retrying on every future stage email.
 */
export async function trySendViaTelegram(docCv, params, { col, docId } = {}) {
  const candidateTelegramId = docCv?.telegramId;
  if (!candidateTelegramId) return;
  try {
    await sendStatusViaTelegram({
      telegramId: candidateTelegramId,
      statusValue: params.stepValue,
      firstName: params.formCv.personalInfo.name,
      lastName: params.formCv.personalInfo.lastName,
      stageDecision: params.normalizedDecision,
      decisionNote: params.decisionNote,
      additionalInfo: params.info,
      copyOverrides: params.finalCopyOverrides,
      dataExchangeLink: params.dataExchangeLink,
      channelInviteLink: params.channelInviteLink,
    });
    toast.success("Nachricht auch per Telegram gesendet! \u{1F4F1}");
  } catch (telegramError) {
    console.error("Telegram send error:", telegramError);
    const errorMsg = telegramError?.message || String(telegramError);

    if (isTelegramUnreachableError(errorMsg)) {
      toast(
        "E-Mail gesendet. Telegram: Konto deaktiviert oder Bot blockiert — Telegram-ID wurde entfernt.",
        { icon: "ℹ️", duration: 6000 },
      );
      if (col && docId) {
        try {
          await updateDocument(col, docId, { telegramId: null });
        } catch (_) {
          // best-effort cleanup
        }
      }
      return;
    }

    toast.error(
      `E-Mail wurde gesendet, aber Telegram-Nachricht konnte nicht gesendet werden. Fehler: ${errorMsg}`,
    );
  }
}

/**
 * Track telegram invite counter (best-effort).
 */
export async function tryTrackTelegramInvite(info, telegramGroupIdForStage) {
  try {
    const usedTelegramLink =
      String(info?.linkType || "").toLowerCase() === "telegram" &&
      Boolean(telegramGroupIdForStage);
    if (usedTelegramLink) {
      await trackTelegramInviteSent({
        groupId: telegramGroupIdForStage,
        count: 1,
      });
    }
  } catch (e) {
    toast.error(
      "E-Mail wurde gesendet, aber Telegram-Zähler konnte nicht aktualisiert werden.",
    );
  }
}

/**
 * Persist email-send counters to Firestore (best-effort).
 */
export async function tryStoreEmailMeta({
  col, docId, user, emailSentAt, stepValue,
  normalizedDecision, selectedExample, decisionNote,
  emailMeta, setEmailMeta,
}) {
  try {
    let userData = null;
    if (user?.uid) {
      userData = await getUserFromFirestore(user.uid);
    }
    const displayName =
      userData?.displayName || user?.displayName || user?.email || "Admin";
    const photoURL =
      userData?.avatar || userData?.photoURL || user?.photoURL || "";

    const stageBase = `stageMeta.${stepValue}`;
    const updatePayload = {
      "emailMeta.count": increment(1),
      "emailMeta.lastSentAt": emailSentAt,
      "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
      "emailMeta.lastSentByUid": user?.uid || "",
      "emailMeta.lastSentByName": displayName,
      "emailMeta.lastSentByPhoto": photoURL,
      "emailMeta.lastSentType": "status",
      "emailMeta.lastSentStage": stepValue,
      "emailMeta.lastSentDecision": normalizedDecision,
      [`${stageBase}.decision`]: normalizedDecision,
      [`${stageBase}.decidedAt`]: emailSentAt,
      [`${stageBase}.decidedBy`]: user?.email || user?.uid || "admin",
      [`${stageBase}.decisionNote`]: String(decisionNote || "").trim(),
    };
    if (stepValue === "stage_2" && selectedExample === "example2") {
      updatePayload[`${stageBase}.sentWithLeadership`] = true;
    }
    await updateDocument(col, docId, updatePayload);
    setEmailMeta({
      count: (emailMeta.count || 0) + 1,
      lastSentAt: emailSentAt,
      lastSentBy: user?.email || user?.uid || "admin",
      lastSentByUid: user?.uid || "",
      lastSentByName: displayName,
      lastSentByPhoto: photoURL,
      lastSentType: "status",
    });
  } catch (e) {
    // best-effort
  }
}

/**
 * Handle post-rejection tasks: remove from Telegram groups, prompt delete.
 */
export async function handleRejection({
  id, formCv, docCv, setDeleteTarget, setDeleteModalOpen,
}) {
  const itemId = String(id || "").trim();
  const targetEmail = String(formCv?.personalInfo?.email || "").trim();
  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const targetName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const candidateTelegramIdForRemoval = docCv?.telegramId;
  if (candidateTelegramIdForRemoval) {
    try {
      toast("Foydalanuvchi Telegram guruhlaridan chiqarilmoqda...", {
        autoClose: 2000,
      });
      const result = await removeUserFromTelegramGroups(
        candidateTelegramIdForRemoval,
      );
      if (result.ok) {
        const msg =
          result.removed > 0
            ? `Foydalanuvchi ${result.removed} ta guruhdan chiqarildi`
            : "Foydalanuvchi guruhlarda topilmadi";
        toast.success(msg);
      }
    } catch (removeErr) {
      toast.error(
        "Telegram guruhlaridan chiqarishda xatolik. Davom etilmoqda...",
      );
    }
  }

  if (itemId) {
    setDeleteTarget({ id: itemId, email: targetEmail, name: targetName });
    setDeleteModalOpen(true);
  }
}
