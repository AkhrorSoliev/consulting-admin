/**
 * Low-level utility helpers shared across status-email modules.
 */

export function escapeHtml(value) {
  // Only escape characters that would break HTML structure
  // Telegram supports UTF-8 directly, so curly quotes don't need escaping
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildFullName(firstName, lastName) {
  const parts = [String(firstName || "").trim(), String(lastName || "").trim()];
  const full = parts.filter(Boolean).join(" ").trim();
  return full || "hurmatli nomzod";
}

export function formatInterviewDateTime(value) {
  if (!value) return "";
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);

    const formatter = new Intl.DateTimeFormat("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tashkent",
    });

    const parts = formatter.formatToParts(parsed).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    if (parts.year && parts.month && parts.day && parts.hour && parts.minute) {
      return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} (Toshkent vaqti)`;
    }

    return formatter.format(parsed);
  } catch {
    return String(value);
  }
}

export function buildKeyValueBlock(title, rows) {
  const safeRows = Array.isArray(rows) ? rows.filter((r) => r && r.value) : [];
  if (safeRows.length === 0) return "";
  const lines = safeRows.map((r) => `${r.label}: ${r.value}`);
  return [title, ...lines].join("\n");
}

export function normalizeDecision(decisionRaw) {
  return decisionRaw === "rejected" ? "rejected" : "accepted";
}

export function applyCopyOverrides(copy, overrides) {
  const base = copy && typeof copy === "object" ? copy : {};
  const o = overrides && typeof overrides === "object" ? overrides : {};
  return {
    ...base,
    emailTitle:
      o.emailTitle !== undefined ? String(o.emailTitle || "") : base.emailTitle,
    statusLabel:
      o.statusLabel !== undefined
        ? String(o.statusLabel || "")
        : base.statusLabel,
    subject: o.subject !== undefined ? String(o.subject || "") : base.subject,
    mainText:
      o.mainText !== undefined ? String(o.mainText || "") : base.mainText,
    nextStepNote:
      o.nextStepNote !== undefined
        ? String(o.nextStepNote || "")
        : base.nextStepNote,
    channelsText:
      o.channelsText !== undefined
        ? String(o.channelsText || "")
        : base.channelsText,
    emphasizeMainText:
      o.emphasizeMainText !== undefined
        ? Boolean(o.emphasizeMainText)
        : base.emphasizeMainText,
  };
}
