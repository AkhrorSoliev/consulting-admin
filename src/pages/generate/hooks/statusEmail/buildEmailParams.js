import { db } from "../../../../firebase/config";
import { getStatusEmailCopy } from "../../../../utils/statusEmail";
import {
  generateTelegramInviteLink,
  generateTelegramChannelInviteLink,
} from "../../../../utils/telegramInvites";
import {
  makeEmailTemplateId,
  toCopyOverridesFromTemplateDoc,
} from "../../../../utils/emailTemplates";

/**
 * Generate telegram invite link if the user opted for auto-generation.
 * Mutates `info` in place.
 */
export async function maybeGenerateTelegramLink(
  info,
  normalizedDecision,
  telegramGroupIdForStage,
) {
  if (normalizedDecision !== "accepted" || !info?.useGeneratedLink) return;
  if (telegramGroupIdForStage) {
    const { invite_link } = await generateTelegramInviteLink({
      groupId: telegramGroupIdForStage,
    });
    info.link = invite_link;
    info.linkType = "telegram";
  } else {
    throw new Error("TELEGRAM_GROUP_NOT_CONFIGURED");
  }
}

/**
 * Resolve email template copy overrides and auxiliary links.
 */
export async function buildEmailParams({
  stepValue,
  normalizedDecision,
  docId,
  emailTemplatesMap,
  selectedExample,
}) {
  const templateId = makeEmailTemplateId(stepValue, normalizedDecision);
  const templateDoc = emailTemplatesMap?.[templateId] || null;
  const copyOverrides =
    toCopyOverridesFromTemplateDoc(templateDoc) || undefined;
  const baseCopy = getStatusEmailCopy(stepValue, normalizedDecision);

  let finalCopyOverrides = copyOverrides;
  if (
    stepValue === "stage_2" &&
    normalizedDecision === "accepted" &&
    baseCopy.examples
  ) {
    const sel = baseCopy.examples.find((ex) => ex.id === selectedExample);
    if (sel) {
      finalCopyOverrides = { ...copyOverrides, mainText: sel.content };
    }
  }

  const dataExchangeLink =
    stepValue === "stage_4" && normalizedDecision === "accepted"
      ? `https://admin.consultinguz.de/dataExchange/${docId}`
      : "";

  let channelInviteLink = "";
  if (stepValue === "stage_1" && normalizedDecision === "accepted") {
    try {
      const { getDocs, query, collection, where, limit } =
        await import("firebase/firestore");
      const q = query(
        collection(db, "telegram_channels"),
        where("active", "==", true),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const { invite_link } = await generateTelegramChannelInviteLink({
          channelId: snap.docs[0].id,
        });
        channelInviteLink = invite_link;
      }
    } catch (err) {
      console.warn("Channel invite link generation failed:", err);
    }
  }

  return { finalCopyOverrides, channelInviteLink, dataExchangeLink };
}
