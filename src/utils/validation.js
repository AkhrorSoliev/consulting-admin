function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

// Phone format in this project is stored as: "+<code> <masked body>"
// Example: "+998 90 123 45 67" -> body digits length = 9
export function getPhoneBodyDigits(full) {
  const raw = String(full || "").trim();
  if (!raw) return "";
  const firstSpace = raw.indexOf(" ");
  if (firstSpace < 0) return "";
  const body = raw.slice(firstSpace + 1);
  return digitsOnly(body);
}

export function isPhoneComplete(full, expectedBodyDigits = 9) {
  const raw = String(full || "").trim();
  if (!raw) return false;
  const firstSpace = raw.indexOf(" ");
  if (firstSpace < 0) return false;
  const bodyDigits = getPhoneBodyDigits(raw);
  return bodyDigits.length === expectedBodyDigits;
}

export function isEmailValid(email) {
  const v = String(email || "").trim();
  if (!v) return false;
  // Simple + safe email validation (same as used in Create.jsx rules)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function normalizePassportNumber(v) {
  const raw = String(v || "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  // Keep only letters/digits, then format as "AA 0000000"
  const alnum = raw.replace(/[^A-Z0-9]/g, "");
  const letters = alnum.replace(/[^A-Z]/g, "").slice(0, 2);
  const digits = alnum.replace(/[^\d]/g, "").slice(0, 7);
  if (!letters && !digits) return "";
  if (letters.length === 2 && digits.length > 0) return `${letters} ${digits}`;
  return `${letters}${digits ? ` ${digits}` : ""}`.trim();
}

export function isPassportNumberValid(v) {
  const norm = normalizePassportNumber(v);
  if (!norm) return false;
  return /^[A-Z]{2}\s\d{7}$/.test(norm);
}





