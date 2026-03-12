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

// Generate soft/pc skills based on provided CV context
export function generateSkills(cv, kind) {
  const lowerIncludes = (text, sub) =>
    String(text || "")
      .toLowerCase()
      .includes(String(sub || "").toLowerCase());

  const existingSoft = cv?.skills?.softSkills || [];
  const existingPc = cv?.skills?.pcSkills || [];

  const softPoolBase = [
    "Teamarbeit",
    "Kommunikationsfähigkeit",
    "Problemlösungsfähigkeit",
    "Zeitmanagement",
    "Selbstorganisation",
    "Verantwortungsbewusstsein",
    "Flexibilität",
    "Konfliktlösung",
    "Stressresistenz",
    "Kundenorientierung",
  ];

  const pcPoolBase = [
    "Microsoft Word",
    "Microsoft Excel",
    "Microsoft PowerPoint",
    "Google Docs",
    "Google Sheets",
    "Google Slides",
    "Microsoft Outlook",
    "Windows",
    "Internetrecherche",
    "Canva",
  ];

  const contextSoft = [];
  const contextPc = [];

  const experience = Array.isArray(cv?.experience) ? cv.experience : [];
  experience.forEach((exp) => {
    if (lowerIncludes(exp.position, "admin")) {
      contextSoft.push("Organisationstalent");
      contextPc.push("Microsoft Excel");
    }
    if (
      lowerIncludes(exp.position, "teacher") ||
      lowerIncludes(exp.position, "o'qit")
    ) {
      contextSoft.push("Präsentationsfähigkeit");
      contextPc.push("PowerPoint");
    }
    if (Array.isArray(exp.responsibilities)) {
      const joined = exp.responsibilities.join(" ").toLowerCase();
      if (joined.includes("mijoz") || joined.includes("kunde")) {
        contextSoft.push("Kundenkommunikation");
      }
      if (
        joined.includes("hisob") ||
        joined.includes("report") ||
        joined.includes("bericht")
      ) {
        contextPc.push("Google Sheets");
        contextPc.push("Excel (Pivot, Diagramme)");
      }
    }
  });

  const education = Array.isArray(cv?.education) ? cv.education : [];
  education.forEach((edu) => {
    if (
      lowerIncludes(edu.degree, "iqtisod") ||
      lowerIncludes(edu.degree, "wirtschaft")
    ) {
      contextPc.push("Excel (Formeln, Diagramme)");
      contextSoft.push("Analytisches Denken");
    }
    if (
      lowerIncludes(edu.institution, "universität") ||
      lowerIncludes(edu.institution, "universitet")
    ) {
      contextSoft.push("Selbstständiges Lernen");
    }
  });

  const pickNew = (pool, existing, limit = 4) => {
    const unique = [];
    const have = new Set(existing.map((s) => String(s).toLowerCase()));
    pool.forEach((item) => {
      const key = String(item).toLowerCase();
      if (
        !have.has(key) &&
        !unique.map((u) => String(u).toLowerCase()).includes(key)
      ) {
        unique.push(item);
      }
    });
    return unique.slice(0, limit);
  };

  if (kind === "soft") {
    const pool = [...contextSoft, ...softPoolBase];
    return pickNew(pool, existingSoft, 4);
  } else {
    const pool = [...contextPc, ...pcPoolBase];
    return pickNew(pool, existingPc, 4);
  }
}
