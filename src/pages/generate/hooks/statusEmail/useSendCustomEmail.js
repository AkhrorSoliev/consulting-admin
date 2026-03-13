import { increment } from "firebase/firestore";
import toast from "react-hot-toast";
import { buildStatusEmailTemplate } from "../../../../utils/statusEmail";
import { trackTelegramInviteSent } from "../../../../utils/telegramInvites";
import { sendBrevoEmail } from "../../../../utils/brevo";
import { sendEmailViaTelegram } from "../../../../utils/telegram";
import { updateDocument, getUserFromFirestore } from "../../../../utils";
import { CANDIDATE_STATUS_DEFAULT } from "../../../../constants/candidateStatus";
import { getTelegramGroupIdForStage, splitCustomEmailBody } from "../../utils";
import {
  getStageAdditionalInfo,
  stripStatusLineFromCustomEmail,
} from "./helpers";

/**
 * Build the sendCustomEmail async function.
 */
export function makeSendCustomEmail({
  id,
  resolvedMajor,
  formCv,
  isLimitedAdmin,
  user,
  docCv,
  metaInfo,
  statusValue,
  sendingEmailLockRef,
  setSendingStepValue,
  emailMeta,
  setEmailMeta,
  setIsCustomEmailModalOpen,
}) {
  return async function sendCustomEmail({ to, emailTitle, subject, bodyText }) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    const recipientEmail = String(to || "").trim();
    if (!recipientEmail) {
      toast.error("Empfänger-E-Mail (To) ist nicht ausgefüllt.");
      return;
    }
    const safeStatusValue =
      String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const firstName = String(formCv.personalInfo.name || "");
    const lastName = String(formCv.personalInfo.lastName || "");
    const additionalInfo = getStageAdditionalInfo(metaInfo, safeStatusValue);

    const { mainText, nextStepNote, hasMain, hasNote } =
      splitCustomEmailBody(bodyText);
    if (!hasMain) {
      toast.error(
        "Im Textbereich muss mindestens 1 Absatz (Haupttext) enthalten sein.",
      );
      return;
    }
    const subjectRaw = String(subject || "").trim();
    if (!subjectRaw) {
      toast.error("Betreff ist nicht ausgefüllt.");
      return;
    }

    const overrides = {
      emailTitle: String(emailTitle || "").trim()
        ? String(emailTitle)
        : undefined,
      subject: subjectRaw,
      mainText,
      nextStepNote: hasNote ? nextStepNote : "",
      emphasizeMainText: false,
    };

    const {
      subject: builtSubject,
      message,
      htmlContent,
    } = buildStatusEmailTemplate({
      statusValue: safeStatusValue,
      firstName,
      lastName,
      stageDecision: "accepted",
      decisionNote: "",
      additionalInfo,
      copyOverrides: overrides,
    });

    const safeSubject = String(builtSubject || "").trim();
    if (!safeSubject) {
      toast.error("Betreff ist nicht ausgefüllt.");
      return;
    }
    if (sendingEmailLockRef.current) {
      toast("E-Mail wird gesendet, bitte warten...");
      return;
    }

    sendingEmailLockRef.current = true;
    setSendingStepValue("custom");

    try {
      const emailSentAt = Date.now();
      const finalMessage = stripStatusLineFromCustomEmail(message);
      const finalHtml = stripStatusLineFromCustomEmail(htmlContent);

      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject: safeSubject,
        message: finalMessage,
        htmlContent: finalHtml || undefined,
      });
      if (res?.success === false) {
        throw new Error("E-Mail wurde nicht gesendet (success=false).");
      }

      // Also send via Telegram
      const candidateTelegramId = docCv?.telegramId;
      if (candidateTelegramId) {
        try {
          await sendEmailViaTelegram({
            telegramId: candidateTelegramId,
            subject: safeSubject,
            htmlContent: finalHtml,
          });
          toast.success("Nachricht auch per Telegram gesendet! \u{1F4F1}");
        } catch (telegramError) {
          toast.error(
            "E-Mail wurde gesendet, aber Telegram-Nachricht konnte nicht gesendet werden.",
          );
        }
      }

      // Track telegram invite counter
      try {
        const usedTelegramLink =
          String(additionalInfo?.linkType || "").toLowerCase() === "telegram";
        const tgGroupId = getTelegramGroupIdForStage(
          metaInfo,
          safeStatusValue,
        );
        if (usedTelegramLink && tgGroupId) {
          await trackTelegramInviteSent({ groupId: tgGroupId, count: 1 });
        }
      } catch (e) {
        // best-effort
      }

      toast.success("Benutzerdefinierte E-Mail wurde gesendet.");

      // Store email counters
      try {
        const col = String(resolvedMajor?.collectionName || "").trim();
        const docId = String(id || "").trim();
        if (col && docId) {
          let userData = null;
          if (user?.uid) {
            userData = await getUserFromFirestore(user.uid);
          }
          const displayName =
            userData?.displayName ||
            user?.displayName ||
            user?.email ||
            "Admin";
          const photoURL =
            userData?.avatar || userData?.photoURL || user?.photoURL || "";

          await updateDocument(col, docId, {
            "emailMeta.count": increment(1),
            "emailMeta.lastSentAt": emailSentAt,
            "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
            "emailMeta.lastSentByUid": user?.uid || "",
            "emailMeta.lastSentByName": displayName,
            "emailMeta.lastSentByPhoto": photoURL,
            "emailMeta.lastSentType": "custom",
          });
          setEmailMeta({
            count: (emailMeta.count || 0) + 1,
            lastSentAt: emailSentAt,
            lastSentBy: user?.email || user?.uid || "admin",
            lastSentByUid: user?.uid || "",
            lastSentByName: displayName,
            lastSentByPhoto: photoURL,
            lastSentType: "custom",
          });
        }
      } catch (e) {
        // best-effort
      }

      setIsCustomEmailModalOpen(false);
    } catch (err) {
      toast.error(
        "Fehler beim Senden der benutzerdefinierten E-Mail. Bitte später erneut versuchen.",
      );
    } finally {
      setSendingStepValue(null);
      sendingEmailLockRef.current = false;
    }
  };
}
