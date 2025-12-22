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



