function monthYearToSortKey(dateStr) {
  const raw = String(dateStr || "").trim();
  if (!raw) return null;
  if (raw.toLowerCase() === "bis heute") return Number.POSITIVE_INFINITY;

  // dd.mm.yyyy
  let m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, , mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
    return null;
  }

  // mm.yyyy
  m = raw.match(/^(\d{2})\.(\d{4})$/);
  if (m) {
    const [, mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
    return null;
  }

  // yyyy-mm (sometimes comes from inputs)
  m = raw.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const [, yyyy, mm] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
    return null;
  }

  return null;
}

function timelineItemSortKey(item) {
  const endKey = monthYearToSortKey(item?.endDate);
  if (endKey !== null) return endKey;
  const startKey = monthYearToSortKey(item?.startDate);
  if (startKey !== null) return startKey;
  return Number.NEGATIVE_INFINITY;
}

// Sort timeline arrays (experience/education) so the most recent entry is first.
export function sortTimelineItemsDesc(items) {
  if (!Array.isArray(items) || items.length <= 1)
    return Array.isArray(items) ? items : [];
  return items
    .map((item, idx) => ({
      item,
      idx,
      key: timelineItemSortKey(item),
      startKey: monthYearToSortKey(item?.startDate) ?? Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (b.key !== a.key) return b.key - a.key;
      if (b.startKey !== a.startKey) return b.startKey - a.startKey;
      return a.idx - b.idx;
    })
    .map((x) => x.item);
}
