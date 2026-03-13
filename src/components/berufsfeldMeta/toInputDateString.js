export default function toInputDateString(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // yyyy-mm-ddThh:mm (datetime-local)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    // dd.mm.yyyy -> yyyy-mm-dd
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  }
  if (typeof value === "number") {
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }
  return "";
}
