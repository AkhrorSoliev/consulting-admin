// Convert "dd.mm.yyyy" -> "yyyy-mm-dd" for <input type="date">
export function toInputDate(ddmmyyyy) {
  if (!ddmmyyyy || typeof ddmmyyyy !== "string") return "";
  const m = ddmmyyyy.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

// Convert "yyyy-mm-dd" -> "dd.mm.yyyy" for display/storage
export function fromInputDate(yyyymmdd) {
  if (!yyyymmdd || typeof yyyymmdd !== "string") return "";
  const m = yyyymmdd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return yyyymmdd;
  const [, yyyy, mm, dd] = m;
  return `${dd}.${mm}.${yyyy}`;
}

// Convert "dd.mm.yyyy" or "mm.yyyy" -> "yyyy-mm" for <input type="month">
export function toInputMonth(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  // Try dd.mm.yyyy
  let m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, , mm, yyyy] = m;
    return `${yyyy}-${mm}`;
  }
  // Try mm.yyyy
  m = dateStr.match(/^(\d{2})\.(\d{4})$/);
  if (m) {
    const [, mm, yyyy] = m;
    return `${yyyy}-${mm}`;
  }
  return "";
}

// Convert "yyyy-mm" -> "mm.yyyy" for display/storage
export function fromInputMonth(yyyymm) {
  if (!yyyymm || typeof yyyymm !== "string") return "";
  const m = yyyymm.match(/^(\d{4})-(\d{2})$/);
  if (!m) return yyyymm;
  const [, yyyy, mm] = m;
  return `${mm}.${yyyy}`;
}
