/**
 * Shared helper / normalizer functions used across stats modules.
 * All functions here are internal to the stats package.
 */

export function safeKey(input, fallback = "unknown") {
  const raw = String(input ?? "").trim();
  if (!raw) return fallback;
  return raw
    .replace(/[./[\]#?$\\]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function toAge(ddmmyyyy) {
  try {
    if (!ddmmyyyy || typeof ddmmyyyy !== "string") return null;
    const m = ddmmyyyy.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
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

export const AGE_BUCKETS = [
  { label: "18-24", from: 18, to: 24 },
  { label: "25-34", from: 25, to: 34 },
  { label: "35-44", from: 35, to: 44 },
  { label: "45-54", from: 45, to: 54 },
  { label: "55+", from: 55, to: 200 },
];

export function ageToBucketLabel(age) {
  const def = AGE_BUCKETS.find((b) => age >= b.from && age <= b.to) || null;
  return def ? def.label : null;
}

function parseMonthOrDateToMonthIndex(str) {
  const raw = String(str || "").trim();
  if (!raw) return null;
  if (raw.toLowerCase() === "bis heute") return null;

  let m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, , mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
  }

  m = raw.match(/^(\d{2})\.(\d{4})$/);
  if (m) {
    const [, mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
  }

  m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (m) {
    const [, yyyy, mm] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
  }

  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.getFullYear() * 12 + d.getMonth();
  } catch {
    // ignore
  }
  return null;
}

export function computeExperienceYears(docData) {
  const expList = Array.isArray(docData?.berufserfahrung)
    ? docData.berufserfahrung
    : [];
  if (expList.length === 0) return 0;

  const nowIdx = new Date().getFullYear() * 12 + new Date().getMonth();
  let totalMonths = 0;
  expList.forEach((exp) => {
    const startIdx = parseMonthOrDateToMonthIndex(exp?.beginn);
    const endRaw = String(exp?.ende || "").trim();
    const endIdx =
      !endRaw || endRaw.toLowerCase() === "bis heute"
        ? nowIdx
        : parseMonthOrDateToMonthIndex(endRaw);
    if (typeof startIdx === "number" && typeof endIdx === "number") {
      const diff = endIdx - startIdx;
      if (diff > 0) totalMonths += diff;
    }
  });
  return totalMonths / 12;
}

export function experienceBucketLabel(years) {
  if (years <= 1) return "0-1 Jahr";
  if (years <= 3) return "1-3 Jahre";
  if (years <= 5) return "3-5 Jahre";
  return "5+ Jahre";
}

export function normalizeGender(genderValue) {
  const g = String(genderValue || "")
    .trim()
    .toLowerCase();
  if (["männlich", "maennlich", "m", "male"].includes(g)) return "male";
  if (["weiblich", "w", "female", "f"].includes(g)) return "female";
  return "unknown";
}

export function normalizeMaritalStatus(val) {
  const s = String(val || "")
    .trim()
    .toLowerCase();
  if (!s) return "unknown";
  if (s.includes("ledig")) return "single";
  if (s.includes("verheiratet")) return "married";
  return "other";
}

export function normalizeLangLevel(val) {
  const lv = String(val || "")
    .trim()
    .toUpperCase();
  const allowed = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return allowed.includes(lv) ? lv : "UNKNOWN";
}

export function extractDiplomas(payload) {
  const docs = payload?.documents || {};
  return Array.isArray(docs?.diplomas) ? docs.diplomas : [];
}

export function extractCertificates(payload) {
  const docs = payload?.documents || {};
  return Array.isArray(docs?.certificates) ? docs.certificates : [];
}

export function extractCertificateDetails(payload) {
  const docs = payload?.documents || {};
  return Array.isArray(docs?.certificatesDetailed)
    ? docs.certificatesDetailed
    : [];
}

export function hasNoLanguageCertificateFlag(payload) {
  return Boolean(payload?.documents?.noLanguageCertificate);
}
