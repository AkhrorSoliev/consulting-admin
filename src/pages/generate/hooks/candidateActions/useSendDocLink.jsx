import { useState } from "react";
import toast from "react-hot-toast";
import { sendBrevoEmail } from "../../../../utils/brevo";
import { sendEmailViaTelegram } from "../../../../utils/telegram";

/**
 * Sub-hook for send-document-link modal logic.
 */
export function useSendDocLink({ id, formCv, docCv }) {
  const [isSendDocLinkModalOpen, setIsSendDocLinkModalOpen] = useState(false);
  const [isSendingDocLink, setIsSendingDocLink] = useState(false);

  function openSendDocLinkModal() {
    setIsSendDocLinkModalOpen(true);
  }

  function closeSendDocLinkModal() {
    setIsSendDocLinkModalOpen(false);
  }

  async function handleSendDocLinkSubmit(e, customMessage) {
    e?.preventDefault();
    const candidateDocId = String(id || "").trim();
    if (!candidateDocId) {
      toast.error("Keine Dokument-ID vorhanden.");
      return;
    }

    const dataExchangeUrl = `https://admin.consultinguz.de/dataExchange/${candidateDocId}`;
    const candidateEmail = String(formCv.personalInfo.email || "").trim();
    const candidateTelegramId = docCv?.telegramId;

    if (!candidateEmail && !candidateTelegramId) {
      toast.error("Kandidat hat weder E-Mail noch Telegram.");
      return;
    }

    setIsSendingDocLink(true);

    try {
      let emailSent = false;
      let telegramSent = false;

      if (candidateEmail) {
        try {
          const emailSubject = "Dokument-Upload-Link";
          const emailMessage = `${customMessage}\n\n🔗 Link: ${dataExchangeUrl}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Dokument-Upload</h2>
              <p style="white-space: pre-line;">${customMessage}</p>
              <p style="margin: 20px 0;">
                <a href="${dataExchangeUrl}"
                   style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Dokumente hochladen
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">Oder kopieren Sie diesen Link: ${dataExchangeUrl}</p>
            </div>
          `;

          const result = await sendBrevoEmail({
            to: candidateEmail,
            subject: emailSubject,
            message: emailMessage,
            htmlContent: emailHtml,
          });

          if (result.success) {
            emailSent = true;
          } else {
            throw new Error("E-Mail wurde nicht gesendet.");
          }
        } catch (error) {
          console.error("Fehler beim Senden der E-Mail:", error);
          toast.error("Fehler beim Senden der E-Mail.");
        }
      }

      if (candidateTelegramId) {
        try {
          const telegramMessage = `${customMessage}

🔗: ${dataExchangeUrl}

━━━━━━━━━━━━━━━
❗ Agar biror muammo bo'lsa,
👉 @sh_yodgorov bilan bog'laning.

━━━━━━━━━━━━━━━
Ushbu bot va @consulting_uzb kanalida qolishingizni so'raymiz.`;

          await sendEmailViaTelegram({
            telegramId: candidateTelegramId,
            subject: "Hujjat yuklash havolasi",
            htmlContent: telegramMessage,
          });

          telegramSent = true;
        } catch (error) {
          console.error("Fehler beim Senden über Telegram:", error);
          toast.error("Fehler beim Senden über Telegram.");
        }
      }

      if (emailSent || telegramSent) {
        const messages = [];
        if (emailSent) messages.push("E-Mail");
        if (telegramSent) messages.push("Telegram");
        toast.success(
          `Link erfolgreich gesendet via ${messages.join(" und ")}.`,
        );
        closeSendDocLinkModal();
      } else {
        toast.error("Link konnte nicht gesendet werden.");
      }
    } catch (error) {
      console.error("Fehler beim Senden des Links:", error);
      toast.error("Fehler beim Senden des Links.");
    } finally {
      setIsSendingDocLink(false);
    }
  }

  return {
    isSendDocLinkModalOpen,
    isSendingDocLink,
    openSendDocLinkModal,
    closeSendDocLinkModal,
    handleSendDocLinkSubmit,
  };
}
