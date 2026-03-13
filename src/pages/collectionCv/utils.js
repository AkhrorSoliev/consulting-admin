/**
 * Calculate age from a DD.MM.YYYY date string.
 * Returns null when the value cannot be parsed or is out of range.
 */
export function calculateAgeFromDDMMYYYY(value) {
  try {
    if (!value || typeof value !== "string") return null;
    const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
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
  } catch {
    return null;
  }
}

/**
 * Convert a createdAt value (number / string / Firestore Timestamp) to a JS Date.
 */
export function toDateFromMetaCreatedAt(value) {
  if (!value) return null;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      const d = new Date(n);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      try {
        const d = value.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
      } catch {
        return null;
      }
    }
    if (typeof value.seconds === "number") {
      const d = new Date(value.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/**
 * Format a createdAt value as a German date-time string (Asia/Tashkent).
 */
export function formatCreatedAt(value) {
  const d = toDateFromMetaCreatedAt(value);
  if (!d) return "\u2014";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tashkent",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}
