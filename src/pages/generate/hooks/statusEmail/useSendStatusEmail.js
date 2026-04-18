import toast from "react-hot-toast";
import {
  buildStatusEmailTemplate,
} from "../../../../utils/statusEmail";
import { sendBrevoEmail } from "../../../../utils/brevo";
import { createEmptyStageInfo, getTelegramGroupIdForStage } from "../../utils";
import {
  normalizeStageFormInfo,
  getNextStepValue,
  stageRequiresAdditionalInfo,
} from "./helpers";
import {
  trySendViaTelegram,
  tryTrackTelegramInvite,
  tryStoreEmailMeta,
  handleRejection,
} from "./sendEmailHelpers";
import { maybeGenerateTelegramLink, buildEmailParams } from "./buildEmailParams";

/**
 * Build and dispatch a status email for a given pipeline step.
 * Returns a callable async function.
 */
export function makeSendStatusEmail({
  id, resolvedMajor, formCv, isLimitedAdmin, user, docCv,
  metaInfo, emailTemplatesMap, selectedExample, statusValue,
  sendingEmailLockRef, setSendingStepValue, setEmailMeta, emailMeta,
  persistStatus, setStatusValue, setPendingStageStep,
  setIsStageEmailModalOpen, setDeleteTarget, setDeleteModalOpen,
}) {
  return async function sendStatusEmail(
    stepValue,
    { stageDecision: decisionRaw, decisionNote, additionalInfo } = {},
  ) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("E-Mails können nur für die aktuelle Stufe gesendet werden.");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    if (!recipientEmail) {
      toast.error("E-Mail-Adresse des Kandidaten wurde nicht gefunden.");
      return;
    }
    if (sendingEmailLockRef.current) {
      toast("E-Mail wird gesendet, bitte warten...");
      return;
    }

    sendingEmailLockRef.current = true;
    setSendingStepValue(stepValue);

    try {
      const normalizedDecision =
        decisionRaw === "rejected" ? "rejected" : "accepted";
      const emailSentAt = Date.now();
      const needsInfo = stageRequiresAdditionalInfo(stepValue, selectedExample);
      const info =
        normalizedDecision === "accepted" && needsInfo
          ? normalizeStageFormInfo(additionalInfo)
          : createEmptyStageInfo();

      const tgGroupId = getTelegramGroupIdForStage(metaInfo, stepValue);

      // Validate required fields for accepted stages that actually schedule
      // a meeting (date+link/location). stage_2_result va stage_2 example1 —
      // faqat natija xabari, validatsiya o'tkazib yuboriladi.
      if (normalizedDecision === "accepted" && needsInfo) {
        const hasLink =
          Boolean(info.link) ||
          (Boolean(info?.useGeneratedLink) && Boolean(tgGroupId));
        if (!info.dateTime) { toast.error("Datum/Uhrzeit fehlt."); return; }
        if (!hasLink && !Boolean(info.locationName || info.locationUrl)) {
          toast.error("Bitte Link oder Standort angeben.");
          return;
        }
      }

      try {
        await maybeGenerateTelegramLink(info, normalizedDecision, tgGroupId);
      } catch (e) {
        const msg = e.message === "TELEGRAM_GROUP_NOT_CONFIGURED"
          ? "Telegram guruh sozlanmagan (Einstellungen'dan tanlang)."
          : "Telegram-Einladungslink konnte nicht erstellt werden.";
        toast.error(msg);
        return;
      }

      const { finalCopyOverrides, channelInviteLink, dataExchangeLink } =
        await buildEmailParams({
          stepValue, normalizedDecision, docId,
          emailTemplatesMap, selectedExample,
        });

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stepValue,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: normalizedDecision,
        decisionNote, additionalInfo: info,
        copyOverrides: finalCopyOverrides,
        dataExchangeLink, channelInviteLink,
      });

      const res = await sendBrevoEmail({
        to: recipientEmail, subject, message, htmlContent,
      });
      if (res?.success === false) {
        throw new Error("E-Mail wurde nicht gesendet (success=false).");
      }

      await trySendViaTelegram(docCv, {
        stepValue, formCv, normalizedDecision, decisionNote,
        info, finalCopyOverrides, dataExchangeLink, channelInviteLink,
      });
      tryTrackTelegramInvite(info, tgGroupId);
      toast.success("Status-E-Mail wurde gesendet.");

      await tryStoreEmailMeta({
        col, docId, user, emailSentAt, stepValue,
        normalizedDecision, selectedExample, decisionNote,
        emailMeta, setEmailMeta,
      });

      if (normalizedDecision === "accepted") {
        const withLeadership =
          stepValue === "stage_2" && selectedExample === "example2";
        const nextValue =
          getNextStepValue(stepValue, { withLeadership }) || stepValue;
        await persistStatus(nextValue, { silent: true });
        setStatusValue(nextValue);
      }

      setPendingStageStep(null);
      setIsStageEmailModalOpen(false);

      if (normalizedDecision === "rejected") {
        await handleRejection({
          id, formCv, docCv, setDeleteTarget, setDeleteModalOpen,
        });
      }
    } catch (err) {
      toast.error(
        "Fehler beim Senden der E-Mail. Bitte später erneut versuchen.",
      );
    } finally {
      setSendingStepValue(null);
      sendingEmailLockRef.current = false;
    }
  };
}
