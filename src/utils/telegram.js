import { auth } from "../firebase/config";
import { buildTelegramStatusMessage } from "./statusEmail";
import {
  htmlToTelegramHtml,
  escapeTelegramHtml,
} from "./telegramHtml";

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
 * Telegram rejects messages longer than 4096 characters. Cut on a line
 * boundary and re-close any inline tag that was left open by the cut.
 */
function clampTelegramHtml(text, limit = 3900) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const boundary = cut.lastIndexOf("\n");
  let body = (boundary > limit * 0.5 ? cut.slice(0, boundary) : cut).trimEnd();

  const open = [];
  const tagRe = /<(\/?)(b|i|u|s|code|pre|a)\b[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(body)) !== null) {
    const tag = m[2].toLowerCase();
    if (m[1] === "/") {
      const idx = open.lastIndexOf(tag);
      if (idx !== -1) open.splice(idx, 1);
    } else {
      open.push(tag);
    }
  }
  while (open.length) body += `</${open.pop()}>`;
  return `${body}\n…`;
}

/**
 * Convert HTML (an email template or plain text) into Telegram-safe HTML.
 * @param {string} htmlContent - HTML or plain-text content
 * @param {string} subject - Optional headline rendered above the body
 * @returns {string} Telegram-formatted message
 */
export function convertEmailToTelegramFormat(htmlContent, subject) {
  const body = htmlToTelegramHtml(htmlContent);
  const title = String(subject || "").trim();
  if (!title) return clampTelegramHtml(body);
  const header = `\u{1F4E7} <b>${escapeTelegramHtml(title)}</b>`;
  return clampTelegramHtml(body ? `${header}\n\n${body}` : header);
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ok === false) {
      const detail = String(
        data.details || data.error || `HTTP ${response.status}`,
      );
      const lower = detail.toLowerCase();
      const isExpectedUnreachable =
        lower.includes("user is deactivated") ||
        lower.includes("bot was blocked by the user") ||
        lower.includes("chat not found") ||
        lower.includes("user not found") ||
        lower.includes("peer_id_invalid");

      if (!isExpectedUnreachable) {
        console.error("Telegram API Error:", {
          status: response.status,
          errorData: data,
          telegramId,
          messageLength: message?.length,
          parseMode,
          hasKeyboard: !!keyboard,
        });
        console.error("Full error details:", JSON.stringify(data, null, 2));
        console.error("Message preview:", message?.substring(0, 500));
      }
      throw new Error(detail);
    }

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
  channelInviteLink,
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
    channelInviteLink,
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
