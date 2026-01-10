import { auth } from "../firebase/config";
import { buildTelegramStatusMessage } from "./statusEmail";

function getFunctionsBaseUrl() {
  const env = import.meta.env || {};
  const explicit = String(env.VITE_FUNCTIONS_BASE || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const projectId = String(env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (projectId) {
    return `https://us-central1-${projectId}.cloudfunctions.net`;
  }
  return "https://us-central1-consulting-bdb74.cloudfunctions.net";
}

/**
 * Convert HTML email template to Telegram-friendly format (LEGACY - for custom emails)
 * @param {string} htmlContent - HTML content from email
 * @param {string} subject - Email subject
 * @returns {string} Telegram-formatted message
 */
export function convertEmailToTelegramFormat(htmlContent, subject) {
  if (!htmlContent) return "";

  // Remove HTML tags but preserve structure
  let text = htmlContent
    // Convert headers
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n<b>$1</b>\n")
    // Convert bold
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "<b>$1</b>")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "<b>$1</b>")
    // Convert italic
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "<i>$1</i>")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "<i>$1</i>")
    // Convert links
    .replace(
      /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
      '<a href="$1">$2</a>'
    )
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    // Convert lists
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?[uo]l[^>]*>/gi, "\n")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Add subject as header if provided
  if (subject) {
    text = `📧 <b>${subject}</b>\n\n${text}`;
  }

  return text;
}

/**
 * Send a message to a Telegram user via bot
 * @param {string} telegramId - Telegram user ID
 * @param {string} message - Message to send (HTML formatted)
 * @param {string} parseMode - Parse mode (default: HTML)
 * @param {Array} keyboard - Optional inline keyboard buttons
 * @returns {Promise<{ok: boolean, sent?: boolean, error?: string}>}
 */
export async function sendTelegramMessage(
  telegramId,
  message,
  parseMode = "HTML",
  keyboard = null
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const url = `${getFunctionsBaseUrl()}/sendTelegramMessage`;

    // Log the message being sent for debugging
    console.log("Sending Telegram message:", {
      telegramId,
      messageLength: message?.length,
      parseMode,
      keyboardButtons: keyboard?.length || 0,
      messagePreview: message?.substring(0, 200),
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        telegramId,
        message,
        parseMode,
        keyboard,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Telegram API Error:", {
        status: response.status,
        errorData,
        telegramId,
        messageLength: message?.length,
        parseMode,
        hasKeyboard: !!keyboard,
      });
      console.error("Full error details:", JSON.stringify(errorData, null, 2));
      console.error("Message preview:", message?.substring(0, 500));
      throw new Error(
        errorData.details || errorData.error || `HTTP ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Send status email via Telegram with clean formatting
 * @param {Object} params
 * @param {string} params.telegramId - Telegram user ID
 * @param {string} params.statusValue - Status value (stage_1, stage_2, etc.)
 * @param {string} params.firstName - Candidate first name
 * @param {string} params.lastName - Candidate last name
 * @param {string} params.stageDecision - Decision (accepted/rejected)
 * @param {string} params.decisionNote - Optional decision note
 * @param {Object} params.additionalInfo - Additional info (dateTime, link, location)
 * @param {Object} params.copyOverrides - Copy overrides from template
 * @param {string} params.dataExchangeLink - DataExchange link for stage_4 accepted
 * @returns {Promise<{ok: boolean, sent?: boolean, error?: string}>}
 */
export async function sendStatusViaTelegram({
  telegramId,
  statusValue,
  firstName,
  lastName,
  stageDecision,
  decisionNote,
  additionalInfo,
  copyOverrides,
  dataExchangeLink,
}) {
  const { message, keyboard } = buildTelegramStatusMessage({
    statusValue,
    firstName,
    lastName,
    stageDecision,
    decisionNote,
    additionalInfo,
    copyOverrides,
    dataExchangeLink,
  });
  return sendTelegramMessage(telegramId, message, "HTML", keyboard);
}

/**
 * Send email content via Telegram (for custom emails)
 * @param {Object} params
 * @param {string} params.telegramId - Telegram user ID
 * @param {string} params.subject - Email subject
 * @param {string} params.htmlContent - HTML email content
 * @returns {Promise<{ok: boolean, sent?: boolean, error?: string}>}
 */
export async function sendEmailViaTelegram({
  telegramId,
  subject,
  htmlContent,
}) {
  const telegramMessage = convertEmailToTelegramFormat(htmlContent, subject);
  return sendTelegramMessage(telegramId, telegramMessage, "HTML");
}
