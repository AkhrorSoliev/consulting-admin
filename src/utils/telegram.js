import { auth } from "../firebase/config";

const FUNCTIONS_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://us-central1-consulting-admin-uz.cloudfunctions.net"
    : "http://127.0.0.1:5001/consulting-admin-uz/us-central1";

/**
 * Convert HTML email template to Telegram-friendly format
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

  // Add branding footer
  text += "\n\n━━━━━━━━━━━━━━━\n📱 ConsultingUZ";

  return text;
}

/**
 * Send a message to a Telegram user via bot
 * @param {string} telegramId - Telegram user ID
 * @param {string} message - Message to send (HTML formatted)
 * @param {string} parseMode - Parse mode (default: HTML)
 * @returns {Promise<{ok: boolean, sent?: boolean, error?: string}>}
 */
export async function sendTelegramMessage(
  telegramId,
  message,
  parseMode = "HTML"
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const url = `${FUNCTIONS_BASE_URL}/sendTelegramMessage`;

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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.details || errorData.error || `HTTP ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    throw error;
  }
}

/**
 * Send email content via Telegram
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
