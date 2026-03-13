/**
 * Build a clean Telegram-formatted message (no HTML email conversion).
 */

import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
} from "../../constants/candidateStatus";
import {
  escapeHtml,
  buildFullName,
  formatInterviewDateTime,
  normalizeDecision,
  applyCopyOverrides,
} from "./helpers";
import { pickStageCopy } from "./stageCopy";
import { buildTelegramKeyboard } from "./telegramKeyboard";

/**
 * @param {Object} params
 * @returns {Object} { message: string, keyboard: Array } Telegram message with inline keyboard
 */
export function buildTelegramStatusMessage({
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
  const normalizedStatusValue = statusValue || CANDIDATE_STATUS_DEFAULT;
  const status = getCandidateStatus(normalizedStatusValue);
  const fullName = buildFullName(firstName, lastName);

  const decision = normalizeDecision(stageDecision);
  const copy = applyCopyOverrides(
    pickStageCopy(normalizedStatusValue, decision),
    copyOverrides
  );

  const statusLabelText = String(
    copy.statusLabel !== undefined && String(copy.statusLabel || "").trim()
      ? copy.statusLabel
      : status.label
  ).trim();

  const emailTitle = String(
    copy.emailTitle || "Ariza holati yangilandi"
  ).trim();
  const mainText = String(copy.mainText || "").trim();
  const nextStepNote = String(copy.nextStepNote || "").trim();

  // Build message parts with new improved format
  const parts = [];

  // Header with emoji
  parts.push(`📧 <b>${escapeHtml(emailTitle)}</b>`);
  parts.push("");

  // Greeting
  parts.push(`👤 <b>Hurmatli ${escapeHtml(fullName)},</b>`);
  parts.push("");

  // Main intro
  parts.push(
    `Sizning arizangiz holatini yangiladik. Quyida joriy holat va keyingi qadamlar bilan tanishishingiz mumkin.`
  );
  parts.push("");

  // Status
  parts.push(`🟢 <b>Holat: ${escapeHtml(statusLabelText)}</b>`);
  parts.push("");

  // Main text
  if (mainText) {
    parts.push(`📋 <b>Ma'lumot:</b>`);
    parts.push(`${escapeHtml(mainText)}`);
    parts.push("");
  }

  // Next step note
  if (nextStepNote) {
    parts.push(`${escapeHtml(nextStepNote)}`);
    parts.push("");
  }

  // Decision note
  if (decisionNote) {
    parts.push(`💬 <i>Qo'shimcha izoh:</i> ${escapeHtml(decisionNote)}`);
    parts.push("");
  }

  // Additional info section
  const dt = String(additionalInfo?.dateTime || "").trim();
  const link = String(additionalInfo?.link || "").trim();
  const locName = String(additionalInfo?.locationName || "").trim();
  const locUrl = String(additionalInfo?.locationUrl || "").trim();
  const dataExchangeLinkTg = String(dataExchangeLink || "").trim();
  const channelInviteLinkTg = String(channelInviteLink || "").trim();

  if (dt || link || locName || locUrl || dataExchangeLinkTg || channelInviteLinkTg) {
    parts.push(`━━━━━━━━━━━━━━━`);
    parts.push(`📋 <b>Qo'shimcha ma'lumotlar:</b>`);
    parts.push("");

    if (dt) {
      parts.push(
        `🗓 <b>Sana / Vaqt: ${escapeHtml(formatInterviewDateTime(dt))}</b>`
      );
    }
    if (link) {
      const linkType = String(additionalInfo?.linkType || "").toLowerCase();
      const linkLabel =
        linkType === "telegram"
          ? "Suhbat uchun Telegram havolasi"
          : "Suhbat uchun havola";
      parts.push(
        `🔗 <b>${linkLabel}:</b> <a href="${link}">Guruhga qo'shilish</a>`
      );
    }
    if (locName || locUrl) {
      if (locUrl) {
        parts.push(
          `📍 <b>Lokatsiya:</b> <a href="${locUrl}">${escapeHtml(
            locName || "Manzilni ko'rish"
          )}</a>`
        );
      } else {
        parts.push(`📍 <b>Lokatsiya:</b> ${escapeHtml(locName)}`);
      }
    }
    if (dataExchangeLinkTg) {
      parts.push(
        `📄 <b>Hujjatlar yuklash havolasi:</b> <a href="${dataExchangeLinkTg}">Hujjatlarni yuklash</a>`
      );
    }
    if (channelInviteLinkTg) {
      parts.push(
        `📢 <b>Yangiliklar kanaliga a'zo bo'lish:</b> <a href="${channelInviteLinkTg}">Kanalga qo'shilish</a>`
      );
    }
    parts.push("");
  }

  // Channels info with improved formatting
  parts.push(`━━━━━━━━━━━━━━━`);
  parts.push(`📢 <b>Foydali havolalar:</b>`);
  parts.push("");
  parts.push(
    `📌 <b>ConsultingUz rasmiy kanali:</b> <a href="https://t.me/Consulting_UZB">Kanalga o'tish</a>`
  );
  parts.push(
    `📍 <b>O'zbekiston bo'ylab nemis tili markazlarimiz:</b> <a href="https://t.me/dafsprachzentrum">Markazlar ro'yxati</a>`
  );
  parts.push("");
  parts.push(`━━━━━━━━━━━━━━━`);
  parts.push("");

  // Closing
  parts.push(`🤝 <b>Hurmat bilan,</b>`);
  parts.push(`<b>ConsultingUz jamoasi</b>`);

  // Build inline keyboard
  const keyboard = buildTelegramKeyboard({
    link,
    linkType: String(additionalInfo?.linkType || "").toLowerCase(),
    dataExchangeLinkTg,
    channelInviteLinkTg,
  });

  return {
    message: parts.join("\n"),
    keyboard: keyboard.length > 0 ? keyboard : null,
  };
}

