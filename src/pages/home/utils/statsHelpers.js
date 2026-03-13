export const toAge = (ddmmyyyy) => {
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
};

export const ageBucket = (age) => {
  if (age >= 18 && age <= 24) return "18-24";
  if (age >= 25 && age <= 34) return "25-34";
  if (age >= 35 && age <= 44) return "35-44";
  if (age >= 45 && age <= 54) return "45-54";
  if (age >= 55) return "55+";
  return null;
};

export const normalizeGender = (val) => {
  const g = String(val || "")
    .trim()
    .toLowerCase();
  if (["männlich", "maennlich", "m", "male"].includes(g)) return "male";
  if (["weiblich", "w", "female", "f"].includes(g)) return "female";
  return "unknown";
};

export const normalizeMarital = (val) => {
  const s = String(val || "")
    .trim()
    .toLowerCase();
  if (!s) return "unknown";
  if (s.includes("ledig")) return "single";
  if (s.includes("verheiratet")) return "married";
  return "other";
};

export const normalizeLevel = (val) => {
  const lv = String(val || "")
    .trim()
    .toUpperCase();
  const allowed = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return allowed.includes(lv) ? lv : "UNKNOWN";
};

export const parseMonth = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (s.toLowerCase() === "bis heute") return null;
  let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, 1);
  m = s.match(/^(\d{2})\.(\d{4})$/);
  if (m) return new Date(Number(m[2]), Number(m[1]) - 1, 1);
  m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const expBucket = (payload) => {
  const exp = Array.isArray(payload?.berufserfahrung)
    ? payload.berufserfahrung
    : [];
  if (exp.length === 0) return "0-1 Jahr";
  let totalMonths = 0;
  exp.forEach((e) => {
    const start = parseMonth(e?.beginn);
    const end =
      String(e?.ende || "")
        .trim()
        .toLowerCase() === "bis heute"
        ? new Date()
        : parseMonth(e?.ende);
    if (!start) return;
    const endD = end || new Date();
    const months =
      (endD.getFullYear() - start.getFullYear()) * 12 +
      (endD.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  });
  const years = totalMonths / 12;
  if (years <= 1) return "0-1 Jahr";
  if (years <= 3) return "1-3 Jahre";
  if (years <= 5) return "3-5 Jahre";
  return "5+ Jahre";
};

export const extractDiplomas = (payload) => {
  const att = payload?.attachments || {};
  const docs = payload?.documents || {};
  const dok = payload?.dokumente || {};
  if (Array.isArray(att?.diplomas)) return att.diplomas;
  if (Array.isArray(docs?.diplomas)) return docs.diplomas;
  if (Array.isArray(dok?.diplome)) return dok.diplome;
  return [];
};

export const extractCerts = (payload) => {
  const att = payload?.attachments || {};
  const docs = payload?.documents || {};
  const dok = payload?.dokumente || {};
  if (Array.isArray(att?.languageCertificates))
    return att.languageCertificates;
  if (Array.isArray(docs?.certificates)) return docs.certificates;
  if (Array.isArray(dok?.zertifikate)) return dok.zertifikate;
  return [];
};

export const extractCertDetails = (payload) => {
  const att = payload?.attachments || {};
  const docs = payload?.documents || {};
  if (Array.isArray(att?.languageCertificatesDetailed))
    return att.languageCertificatesDetailed;
  if (Array.isArray(docs?.certificatesDetailed))
    return docs.certificatesDetailed;
  if (Array.isArray(payload?.languageCertificatesDetailed))
    return payload.languageCertificatesDetailed;
  return [];
};

export const noLangCertFlag = (payload) =>
  Boolean(payload?.attachments?.noLanguageCertificate);

export const safeKey = (input) =>
  String(input ?? "")
    .trim()
    .replace(/[./[\]#?$\\]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
