/**
 * Format a Firestore timestamp or JS timestamp to German date string.
 * @param {*} value - timestamp value
 * @returns {string}
 */
export function formatTimestamp(value) {
  if (!value) return "";
  try {
    let date;
    if (typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "object" && typeof value.toDate === "function") {
      date = value.toDate();
    } else if (typeof value === "object" && typeof value.seconds === "number") {
      date = new Date(value.seconds * 1000);
    } else {
      return "";
    }
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * Calculate age from a German-format date string (DD.MM.YYYY).
 * @param {string} geburtsdatum
 * @returns {number|null}
 */
export function calculateAge(geburtsdatum) {
  if (!geburtsdatum || typeof geburtsdatum !== "string") return null;
  const m = geburtsdatum.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const birth = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 1 || age > 120) return null;
  return age;
}

/**
 * Calculate average age from statsDoc demographics.
 * @param {Object} statsDoc
 * @returns {number|null}
 */
export function calculateAvgAge(statsDoc) {
  const cnt = Number(statsDoc?.demographics?.age?.count) || 0;
  const sum = Number(statsDoc?.demographics?.age?.sum) || 0;
  if (cnt <= 0) return null;
  return Math.round((sum / cnt) * 10) / 10;
}
