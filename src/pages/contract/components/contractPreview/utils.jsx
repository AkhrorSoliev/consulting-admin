/**
 * Shared utility functions for the contract live preview.
 */

export function arePageIndexGroupsEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (!Array.isArray(pa) || !Array.isArray(pb) || pa.length !== pb.length)
      return false;
    for (let j = 0; j < pa.length; j++) {
      if (pa[j] !== pb[j]) return false;
    }
  }
  return true;
}

export function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatDdMmYyyy(value) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

export function parseMoneyEur(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  // allow "1.200", "1200", "1 200", "1200,50"
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // thousand separators
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatEur(n) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "";
  try {
    return `${new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: num % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num)} €`;
  } catch {
    return `${String(num)} €`;
  }
}

export function normalizeMaybeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  // allow http(s) only for now; avoids pdf.js trying to fetch weird schemes
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw;
}

export function SafeInline({ children, className }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: escapeHtml(children) }}
    />
  );
}

// A4 page dimension constants (shared across components)
export const A4_WIDTH_PT = 595;
export const A4_HEIGHT_PT = 842;
export const PT_TO_PX = 96 / 72;
export const A4_WIDTH_PX = A4_WIDTH_PT * PT_TO_PX;
export const A4_HEIGHT_PX = A4_HEIGHT_PT * PT_TO_PX;
// Match Word "Normal" margins: 1 inch on all sides = 72pt
export const PAGE_MARGIN_PT = 72;
