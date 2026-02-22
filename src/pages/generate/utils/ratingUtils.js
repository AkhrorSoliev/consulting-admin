export function normalizeRating(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const clamped = Math.min(5, Math.max(0.5, numeric));
  return Math.round(clamped * 2) / 2;
}

export function formatRatingForUi(value) {
  const normalized = normalizeRating(value);
  if (normalized === null) return "";
  return Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(1);
}
