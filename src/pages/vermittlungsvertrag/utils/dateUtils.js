export function todayDdMmYyyy() {
  try {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

export function getTodayDate() {
  return new Date();
}

export function addYearsToDate(date, years) {
  try {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  } catch {
    return new Date();
  }
}

export function formatDateToDdMmYyyy(date) {
  try {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}
