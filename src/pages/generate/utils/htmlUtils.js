export function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function plainTextToSimpleHtml(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const paras = raw.split(/\n{2,}/g);
  return paras
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function formatCommentDate(val) {
  if (!val) return "";
  try {
    if (val?.seconds)
      return new Date(val.seconds * 1000).toLocaleString("de-DE");
    if (typeof val === "number") return new Date(val).toLocaleString("de-DE");
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toLocaleString("de-DE");
  } catch (err) {}
  return "";
}

export function splitCustomEmailBody(raw) {
  const normalized = String(raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  // first blank line separates main vs note
  const parts = normalized.split(/\n\s*\n/);
  const main = String(parts[0] || "").trim();
  const note = parts.slice(1).join("\n\n").trim();
  return {
    mainText: main,
    nextStepNote: note,
    hasMain: Boolean(main),
    hasNote: Boolean(note),
  };
}
