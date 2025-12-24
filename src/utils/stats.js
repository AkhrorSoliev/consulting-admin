import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

export const STATS_COLLECTION = "stats";
export const GLOBAL_STATS_DOC_ID = "global";
export const CURRENT_STATS_DOC_ID = "current";

export function statsDocRef(docId) {
  return doc(db, STATS_COLLECTION, String(docId || "").trim());
}

function safeKey(input, fallback = "unknown") {
  const raw = String(input ?? "").trim();
  if (!raw) return fallback;
  // Firestore field paths use dot notation; avoid dots/slashes in dynamic keys.
  return raw
    .replace(/[./[\]#?$\\]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function toAge(ddmmyyyy) {
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

const AGE_BUCKETS = [
  { label: "18-24", from: 18, to: 24 },
  { label: "25-34", from: 25, to: 34 },
  { label: "35-44", from: 35, to: 44 },
  { label: "45-54", from: 45, to: 54 },
  { label: "55+", from: 55, to: 200 },
];

function ageToBucketLabel(age) {
  const def = AGE_BUCKETS.find((b) => age >= b.from && age <= b.to) || null;
  return def ? def.label : null;
}

function parseMonthOrDateToMonthIndex(str) {
  const raw = String(str || "").trim();
  if (!raw) return null;
  if (raw.toLowerCase() === "bis heute") return null; // treat as "now"

  // dd.mm.yyyy
  let m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, , mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
  }

  // mm.yyyy
  m = raw.match(/^(\d{2})\.(\d{4})$/);
  if (m) {
    const [, mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
  }

  // yyyy-mm or yyyy-mm-dd
  m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (m) {
    const [, yyyy, mm] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
  }

  // Fallback: JS Date (ISO strings etc.)
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.getFullYear() * 12 + d.getMonth();
  } catch {
    // ignore
  }
  return null;
}

function computeExperienceYears(docData) {
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

function experienceBucketLabel(years) {
  if (years <= 1) return "0-1 Jahr";
  if (years <= 3) return "1-3 Jahre";
  if (years <= 5) return "3-5 Jahre";
  return "5+ Jahre";
}

function normalizeGender(genderValue) {
  const g = String(genderValue || "")
    .trim()
    .toLowerCase();
  if (["männlich", "maennlich", "m", "male"].includes(g)) return "male";
  if (["weiblich", "w", "female", "f"].includes(g)) return "female";
  return "unknown";
}

function normalizeMaritalStatus(val) {
  const s = String(val || "")
    .trim()
    .toLowerCase();
  if (!s) return "unknown";
  if (s.includes("ledig")) return "single";
  if (s.includes("verheiratet")) return "married";
  return "other";
}

function normalizeLangLevel(val) {
  const lv = String(val || "")
    .trim()
    .toUpperCase();
  const allowed = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return allowed.includes(lv) ? lv : "UNKNOWN";
}

function extractDiplomas(payload) {
  const att = payload?.attachments || {};
  const docs = payload?.documents || {};
  const dok = payload?.dokumente || {};
  const list =
    (Array.isArray(att?.diplomas) ? att.diplomas : []) ||
    (Array.isArray(docs?.diplomas) ? docs.diplomas : []) ||
    (Array.isArray(dok?.diplome) ? dok.diplome : []);
  // prefer attachments if present; else fall back
  if (Array.isArray(att?.diplomas)) return att.diplomas;
  if (Array.isArray(docs?.diplomas)) return docs.diplomas;
  if (Array.isArray(dok?.diplome)) return dok.diplome;
  return Array.isArray(list) ? list : [];
}

function extractCertificates(payload) {
  const att = payload?.attachments || {};
  const docs = payload?.documents || {};
  const dok = payload?.dokumente || {};

  // For stats, "certificates" mostly represent language certificates in this app.
  if (Array.isArray(att?.languageCertificates)) return att.languageCertificates;
  if (Array.isArray(docs?.certificates)) return docs.certificates;
  if (Array.isArray(dok?.zertifikate)) return dok.zertifikate;
  return [];
}

function extractCertificateDetails(payload) {
  const att = payload?.attachments || {};
  const docs = payload?.documents || {};
  // New schema: detailed rows with { url, type }
  if (Array.isArray(att?.languageCertificatesDetailed))
    return att.languageCertificatesDetailed;
  if (Array.isArray(docs?.certificatesDetailed)) return docs.certificatesDetailed;
  if (Array.isArray(payload?.languageCertificatesDetailed))
    return payload.languageCertificatesDetailed;
  return [];
}

function hasNoLanguageCertificateFlag(payload) {
  return Boolean(payload?.attachments?.noLanguageCertificate);
}

export function buildCandidateStatsIncrements(major, payload, options = {}) {
  return buildCandidateStatsIncrementsWithFactor(major, payload, 1, options);
}

export function buildCandidateStatsIncrementsWithFactor(
  major,
  payload,
  factor,
  options = {}
) {
  const f = typeof factor === "number" ? factor : 1;
  const inc = {};
  const majorLabel = options?.majorLabel || major;
  const majorKey = safeKey(majorLabel);
  const leadRaw =
    payload?.lead ??
    payload?.tracking?.lead ??
    payload?.meta?.lead ??
    payload?.source?.lead;
  const leadKey = safeKey(leadRaw, "");

  // Totals
  inc["totals.candidates"] = increment(1 * f);
  inc[`totals.byMajor.${majorKey}`] = increment(1 * f);
  if (leadKey) {
    inc[`totals.byLead.${leadKey}`] = increment(1 * f);
    inc[`totals.byMajorLead.${majorKey}.${leadKey}`] = increment(1 * f);
  }

  // Gender
  const gender = normalizeGender(payload?.persoenlicheDaten?.geschlecht);
  inc[`demographics.gender.${gender}`] = increment(1 * f);

  // Age
  const age = toAge(payload?.persoenlicheDaten?.geburtsdatum);
  if (typeof age === "number") {
    const bucket = ageToBucketLabel(age);
    if (bucket)
      inc[`demographics.ageBuckets.${safeKey(bucket)}`] = increment(1 * f);
    inc["demographics.age.count"] = increment(1 * f);
    inc["demographics.age.sum"] = increment(age * f);
  } else {
    inc["demographics.age.unknown"] = increment(1 * f);
  }

  // Driving license
  const hasDl = Boolean(payload?.persoenlicheDaten?.fuehrerschein);
  inc[`personal.drivingLicense.${hasDl ? "has" : "none"}`] = increment(1 * f);
  if (hasDl) {
    const typ = safeKey(
      payload?.persoenlicheDaten?.fuehrerscheinTyp,
      "UNKNOWN"
    );
    inc[`personal.drivingLicenseTypes.${typ}`] = increment(1 * f);
  }

  // Marital status
  const marital = normalizeMaritalStatus(
    payload?.persoenlicheDaten?.familienstand
  );
  inc[`demographics.marital.${marital}`] = increment(1 * f);

  // Children
  const noKids = Boolean(payload?.persoenlicheDaten?.keinKinder);
  const kidsRaw = String(payload?.persoenlicheDaten?.kinderAnzahl || "")
    .trim()
    .replace(/[^\d]/g, "");
  const kidsCount = kidsRaw ? Number(kidsRaw) : 0;
  if (noKids || kidsCount <= 0) {
    inc["demographics.children.none"] = increment(1 * f);
  } else {
    inc["demographics.children.has"] = increment(1 * f);
    inc["demographics.children.total"] = increment(kidsCount * f);
  }

  // Experience
  const years = computeExperienceYears(payload);
  const expBucket = experienceBucketLabel(years);
  inc[`career.experienceBuckets.${safeKey(expBucket)}`] = increment(1 * f);
  inc["career.experience.count"] = increment(1 * f);
  inc["career.experience.yearsSum"] = increment(
    (Math.round(years * 10) / 10) * f
  );

  // Education
  const edu = Array.isArray(payload?.ausbildung) ? payload.ausbildung : [];
  inc["education.entriesTotal"] = increment(edu.length * f);
  inc[`education.candidates.${edu.length > 0 ? "has" : "none"}`] = increment(
    1 * f
  );

  // Diplomas / Certificates (files)
  const diplomas = extractDiplomas(payload);
  const langCerts = extractCertificates(payload);

  inc["attachments.diplomas.filesTotal"] = increment(diplomas.length * f);
  inc[
    `attachments.diplomas.candidates.${diplomas.length > 0 ? "has" : "none"}`
  ] = increment(1 * f);
  const dipBucket =
    diplomas.length >= 4
      ? "4+"
      : diplomas.length >= 1
      ? String(diplomas.length)
      : "0";
  inc[`attachments.diplomas.countBuckets.${safeKey(dipBucket)}`] = increment(
    1 * f
  );

  const noLangCert = hasNoLanguageCertificateFlag(payload);
  const hasLangCert = !noLangCert && langCerts.length > 0;
  inc["attachments.languageCertificates.filesTotal"] = increment(
    langCerts.length * f
  );
  inc[
    `attachments.languageCertificates.candidates.${
      hasLangCert ? "has" : "none"
    }`
  ] = increment(1 * f);

  // Language certificate types (only when a file exists and type is specified)
  if (hasLangCert) {
    const detailed = extractCertificateDetails(payload);
    if (Array.isArray(detailed) && detailed.length > 0) {
      detailed.forEach((row) => {
        const url = String(row?.url || "").trim();
        const type = String(row?.type || "").trim();
        if (!url || !type) return;
        inc[`attachments.languageCertificates.byType.${safeKey(type)}`] =
          increment(1 * f);
      });
    }
  }

  // Skills: languages + level counts, plus totals for soft/pc skill lists
  const sprachen = payload?.faehigkeiten?.sprachen || {};
  if (sprachen && typeof sprachen === "object") {
    Object.entries(sprachen).forEach(([langName, level]) => {
      const ln = safeKey(langName, "UNKNOWN");
      inc[`skills.languages.counts.${ln}`] = increment(1 * f);
      const lv = normalizeLangLevel(level);
      inc[`skills.languageLevels.${safeKey(lv)}`] = increment(1 * f);
      inc["skills.languages.entriesTotal"] = increment(1 * f);
    });
  }

  const soft = Array.isArray(payload?.faehigkeiten?.sozialkompetenzen)
    ? payload.faehigkeiten.sozialkompetenzen
    : [];
  const pc = Array.isArray(payload?.faehigkeiten?.pcKenntnisse)
    ? payload.faehigkeiten.pcKenntnisse
    : [];
  inc["skills.soft.entriesTotal"] = increment(soft.length * f);
  inc["skills.pc.entriesTotal"] = increment(pc.length * f);

  // Housekeeping
  inc["meta.lastCandidateCreatedAt"] = Date.now();
  inc["meta.updatedAt"] = Date.now();
  inc["meta.countersVersion"] = 1;

  return inc;
}

export async function addCandidateWithStats(major, payload, options = {}) {
  return addCandidateWithDualStats(major, payload, options);
}

export async function addCandidateWithDualStats(major, payload, options = {}) {
  const safeMajor = String(major || "").trim();
  if (!safeMajor) throw new Error("addCandidateWithStats: major is empty");

  const colRef = collection(db, safeMajor);
  const candidateRef = doc(colRef); // generate id client-side once
  const allTimeRef = statsDocRef(GLOBAL_STATS_DOC_ID);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);
  const increments = buildCandidateStatsIncrementsWithFactor(
    safeMajor,
    payload,
    1,
    options
  );

  try {
    await runTransaction(db, async (tx) => {
      tx.set(candidateRef, payload);
      // Ensure stats docs exist, then update using field-paths (dot notation).
      tx.set(
        allTimeRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.set(
        currentRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(allTimeRef, increments);
      tx.update(currentRef, increments);
    });
    return { id: candidateRef.id, statsUpdated: true };
  } catch (err) {
    // If stats are locked down (permission denied), still allow candidate submission.
    if (err?.code === "permission-denied") {
      // eslint-disable-next-line no-console
      console.warn("Stats update not permitted; saving candidate only.");
      await setDoc(candidateRef, payload);
      return { id: candidateRef.id, statsUpdated: false, reason: "stats-permission-denied" };
    }
    throw err;
  }
}

export async function incrementDirectionsTotal() {
  const allTimeRef = statsDocRef(GLOBAL_STATS_DOC_ID);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);
  await setDoc(
    allTimeRef,
    {
      totals: { directions: increment(1) },
      meta: { updatedAt: Date.now(), countersVersion: 1 },
    },
    { merge: true }
  );
  await setDoc(
    currentRef,
    {
      totals: { directions: increment(1) },
      meta: { updatedAt: Date.now(), countersVersion: 1 },
    },
    { merge: true }
  );
}

export function subscribeToGlobalStats(callback) {
  return subscribeToStatsDoc(GLOBAL_STATS_DOC_ID, callback);
}

export function subscribeToCurrentStats(callback) {
  return subscribeToStatsDoc(CURRENT_STATS_DOC_ID, callback);
}

export function subscribeToStatsDoc(docId, callback) {
  const ref = statsDocRef(docId);
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? snap.data() : null);
    },
    (err) => {
      console.error("subscribeToStatsDoc error:", err);
      callback(null, err);
    }
  );
}

export async function deleteCandidateWithCurrentStats(
  major,
  docId,
  options = {}
) {
  const safeMajor = String(major || "").trim();
  const safeId = String(docId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("deleteCandidateWithCurrentStats: invalid args");

  const candidateRef = doc(db, safeMajor, safeId);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(candidateRef);
    const payload = snap.exists() ? snap.data() : null;
    // Always delete doc; if it doesn't exist, nothing else to do.
    tx.delete(candidateRef);
    if (payload) {
      const dec = buildCandidateStatsIncrementsWithFactor(
        safeMajor,
        payload,
        -1,
        options
      );
      tx.set(
        currentRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(currentRef, dec);
    }
  });
}

function buildCandidateStatsNumbers(major, payload, options = {}) {
  const safeMajor = safeKey(options?.majorLabel || major);
  const numbers = {};

  const add = (path, value) => {
    if (!value || typeof value !== "number" || Number.isNaN(value)) return;
    numbers[path] = (numbers[path] || 0) + value;
  };

  add("totals.candidates", 1);
  add(`totals.byMajor.${safeMajor}`, 1);
  const leadRaw =
    payload?.lead ??
    payload?.tracking?.lead ??
    payload?.meta?.lead ??
    payload?.source?.lead;
  const leadKey = safeKey(leadRaw, "");
  if (leadKey) {
    add(`totals.byLead.${leadKey}`, 1);
    add(`totals.byMajorLead.${safeMajor}.${leadKey}`, 1);
  }

  const gender = normalizeGender(payload?.persoenlicheDaten?.geschlecht);
  add(`demographics.gender.${gender}`, 1);

  const age = toAge(payload?.persoenlicheDaten?.geburtsdatum);
  if (typeof age === "number") {
    const bucket = ageToBucketLabel(age);
    if (bucket) add(`demographics.ageBuckets.${safeKey(bucket)}`, 1);
    add("demographics.age.count", 1);
    add("demographics.age.sum", age);
  } else {
    add("demographics.age.unknown", 1);
  }

  const hasDl = Boolean(payload?.persoenlicheDaten?.fuehrerschein);
  add(`personal.drivingLicense.${hasDl ? "has" : "none"}`, 1);
  if (hasDl) {
    const typ = safeKey(
      payload?.persoenlicheDaten?.fuehrerscheinTyp,
      "UNKNOWN"
    );
    add(`personal.drivingLicenseTypes.${typ}`, 1);
  }

  const marital = normalizeMaritalStatus(
    payload?.persoenlicheDaten?.familienstand
  );
  add(`demographics.marital.${marital}`, 1);

  const noKids = Boolean(payload?.persoenlicheDaten?.keinKinder);
  const kidsRaw = String(payload?.persoenlicheDaten?.kinderAnzahl || "")
    .trim()
    .replace(/[^\d]/g, "");
  const kidsCount = kidsRaw ? Number(kidsRaw) : 0;
  if (noKids || kidsCount <= 0) {
    add("demographics.children.none", 1);
  } else {
    add("demographics.children.has", 1);
    add("demographics.children.total", kidsCount);
  }

  const years = computeExperienceYears(payload);
  const expBucket = experienceBucketLabel(years);
  add(`career.experienceBuckets.${safeKey(expBucket)}`, 1);
  add("career.experience.count", 1);
  add("career.experience.yearsSum", Math.round(years * 10) / 10);

  const edu = Array.isArray(payload?.ausbildung) ? payload.ausbildung : [];
  add("education.entriesTotal", edu.length);
  add(`education.candidates.${edu.length > 0 ? "has" : "none"}`, 1);

  const diplomas = extractDiplomas(payload);
  const certs = extractCertificates(payload);
  add("attachments.diplomas.filesTotal", diplomas.length);
  add(
    `attachments.diplomas.candidates.${diplomas.length > 0 ? "has" : "none"}`,
    1
  );
  const dipBucket =
    diplomas.length >= 4
      ? "4+"
      : diplomas.length >= 1
      ? String(diplomas.length)
      : "0";
  add(`attachments.diplomas.countBuckets.${safeKey(dipBucket)}`, 1);

  const noLangCert = hasNoLanguageCertificateFlag(payload);
  const hasLangCert = !noLangCert && certs.length > 0;
  add("attachments.languageCertificates.filesTotal", certs.length);
  add(
    `attachments.languageCertificates.candidates.${
      hasLangCert ? "has" : "none"
    }`,
    1
  );

  if (hasLangCert) {
    const detailed = extractCertificateDetails(payload);
    if (Array.isArray(detailed) && detailed.length > 0) {
      detailed.forEach((row) => {
        const url = String(row?.url || "").trim();
        const type = String(row?.type || "").trim();
        if (!url || !type) return;
        add(`attachments.languageCertificates.byType.${safeKey(type)}`, 1);
      });
    }
  }

  const sprachen = payload?.faehigkeiten?.sprachen || {};
  if (sprachen && typeof sprachen === "object") {
    Object.entries(sprachen).forEach(([langName, level]) => {
      const ln = safeKey(langName, "UNKNOWN");
      add(`skills.languages.counts.${ln}`, 1);
      const lv = normalizeLangLevel(level);
      add(`skills.languageLevels.${safeKey(lv)}`, 1);
      add("skills.languages.entriesTotal", 1);
    });
  }

  const soft = Array.isArray(payload?.faehigkeiten?.sozialkompetenzen)
    ? payload.faehigkeiten.sozialkompetenzen
    : [];
  const pc = Array.isArray(payload?.faehigkeiten?.pcKenntnisse)
    ? payload.faehigkeiten.pcKenntnisse
    : [];
  add("skills.soft.entriesTotal", soft.length);
  add("skills.pc.entriesTotal", pc.length);

  return numbers;
}

function diffCounters(oldNumbers, newNumbers) {
  const out = {};
  const keys = new Set([
    ...Object.keys(oldNumbers || {}),
    ...Object.keys(newNumbers || {}),
  ]);
  keys.forEach((k) => {
    const a = Number(oldNumbers?.[k] || 0);
    const b = Number(newNumbers?.[k] || 0);
    const d = b - a;
    if (d !== 0) out[k] = d;
  });
  return out;
}

function deltaToIncrements(delta) {
  const inc = {};
  Object.entries(delta || {}).forEach(([k, v]) => {
    const n = Number(v);
    if (!n || Number.isNaN(n)) return;
    inc[k] = increment(n);
  });
  return inc;
}

function mergeCandidatePayloadForStats(oldPayload, patch) {
  const oldP = oldPayload && typeof oldPayload === "object" ? oldPayload : {};
  const next = patch && typeof patch === "object" ? patch : {};
  // Shallow merge at the top-level, plus shallow merges for known nested maps.
  // This makes delta updates safe even if caller sends a partial patch.
  return {
    ...oldP,
    ...next,
    persoenlicheDaten: {
      ...(oldP?.persoenlicheDaten && typeof oldP.persoenlicheDaten === "object"
        ? oldP.persoenlicheDaten
        : {}),
      ...(next?.persoenlicheDaten && typeof next.persoenlicheDaten === "object"
        ? next.persoenlicheDaten
        : {}),
    },
    faehigkeiten: {
      ...(oldP?.faehigkeiten && typeof oldP.faehigkeiten === "object"
        ? oldP.faehigkeiten
        : {}),
      ...(next?.faehigkeiten && typeof next.faehigkeiten === "object"
        ? next.faehigkeiten
        : {}),
    },
    attachments: {
      ...(oldP?.attachments && typeof oldP.attachments === "object"
        ? oldP.attachments
        : {}),
      ...(next?.attachments && typeof next.attachments === "object"
        ? next.attachments
        : {}),
    },
    documents: {
      ...(oldP?.documents && typeof oldP.documents === "object"
        ? oldP.documents
        : {}),
      ...(next?.documents && typeof next.documents === "object"
        ? next.documents
        : {}),
    },
    tracking: {
      ...(oldP?.tracking && typeof oldP.tracking === "object" ? oldP.tracking : {}),
      ...(next?.tracking && typeof next.tracking === "object" ? next.tracking : {}),
    },
    meta: {
      ...(oldP?.meta && typeof oldP.meta === "object" ? oldP.meta : {}),
      ...(next?.meta && typeof next.meta === "object" ? next.meta : {}),
    },
    source: {
      ...(oldP?.source && typeof oldP.source === "object" ? oldP.source : {}),
      ...(next?.source && typeof next.source === "object" ? next.source : {}),
    },
    dokumente: {
      ...(oldP?.dokumente && typeof oldP.dokumente === "object"
        ? oldP.dokumente
        : {}),
      ...(next?.dokumente && typeof next.dokumente === "object"
        ? next.dokumente
        : {}),
    },
    status: {
      ...(oldP?.status && typeof oldP.status === "object" ? oldP.status : {}),
      ...(next?.status && typeof next.status === "object" ? next.status : {}),
    },
  };
}

export async function updateCandidateWithCurrentStats(
  major,
  docId,
  payload,
  options = {}
) {
  const safeMajor = String(major || "").trim();
  const safeId = String(docId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("updateCandidateWithCurrentStats: invalid args");

  const candidateRef = doc(db, safeMajor, safeId);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(candidateRef);
    const oldPayload = snap.exists() ? snap.data() : null;
    if (!oldPayload) {
      // If doc doesn't exist, fallback to set + increment as create in current only
      tx.set(candidateRef, payload, { merge: true });
      const inc = buildCandidateStatsIncrementsWithFactor(
        safeMajor,
        payload,
        1,
        options
      );
      tx.set(
        currentRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(currentRef, inc);
      return;
    }

    const oldNums = buildCandidateStatsNumbers(
      safeMajor,
      oldPayload,
      options
    );
    const mergedForStats = mergeCandidatePayloadForStats(oldPayload, payload);
    const newNums = buildCandidateStatsNumbers(safeMajor, mergedForStats, options);
    const delta = diffCounters(oldNums, newNums);
    const inc = deltaToIncrements(delta);
    inc["meta.updatedAt"] = Date.now();
    inc["meta.countersVersion"] = 1;

    tx.set(candidateRef, payload, { merge: true });
    if (Object.keys(inc).length > 0) {
      tx.set(
        currentRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(currentRef, inc);
    }
  });
}

// Update candidate doc AND adjust BOTH LIVE(current) and ALL‑TIME(global) stats based on delta(old,new).
// Important semantics:
// - candidate TOTAL does not change on edits (delta = 0)
// - ALL‑TIME must NOT be decremented on delete (delete uses deleteCandidateWithCurrentStats)
export async function updateCandidateWithDualStats(
  major,
  docId,
  payload,
  options = {}
) {
  const safeMajor = String(major || "").trim();
  const safeId = String(docId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("updateCandidateWithDualStats: invalid args");

  const candidateRef = doc(db, safeMajor, safeId);
  const allTimeRef = statsDocRef(GLOBAL_STATS_DOC_ID);
  const currentRef = statsDocRef(CURRENT_STATS_DOC_ID);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(candidateRef);
    const oldPayload = snap.exists() ? snap.data() : null;
    if (!oldPayload) {
      // If doc doesn't exist, treat as create and increment both stats docs.
      tx.set(candidateRef, payload, { merge: true });
      const incCreate = buildCandidateStatsIncrementsWithFactor(
        safeMajor,
        payload,
        1,
        options
      );
      tx.set(
        allTimeRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.set(
        currentRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(allTimeRef, incCreate);
      tx.update(currentRef, incCreate);
      return;
    }

    const oldNums = buildCandidateStatsNumbers(safeMajor, oldPayload, options);
    const mergedForStats = mergeCandidatePayloadForStats(oldPayload, payload);
    const newNums = buildCandidateStatsNumbers(safeMajor, mergedForStats, options);
    const delta = diffCounters(oldNums, newNums);
    const inc = deltaToIncrements(delta);
    inc["meta.updatedAt"] = Date.now();
    inc["meta.countersVersion"] = 1;

    tx.set(candidateRef, payload, { merge: true });
    if (Object.keys(inc).length > 0) {
      tx.set(
        allTimeRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.set(
        currentRef,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(allTimeRef, inc);
      tx.update(currentRef, inc);
    }
  });
}
function computeStatsSnapshotFromExistingData() {
  const stats = {
    totals: { candidates: 0, directions: 0, byMajor: {} },
    demographics: {
      gender: { male: 0, female: 0, unknown: 0 },
      ageBuckets: Object.fromEntries(AGE_BUCKETS.map((b) => [b.label, 0])),
      age: { count: 0, sum: 0, unknown: 0 },
      marital: { single: 0, married: 0, other: 0, unknown: 0 },
      children: { none: 0, has: 0, total: 0 },
    },
    personal: { drivingLicense: { has: 0, none: 0 }, drivingLicenseTypes: {} },
    career: {
      experienceBuckets: {
        "0-1 Jahr": 0,
        "1-3 Jahre": 0,
        "3-5 Jahre": 0,
        "5+ Jahre": 0,
      },
      experience: { count: 0, yearsSum: 0 },
    },
    education: { entriesTotal: 0, candidates: { has: 0, none: 0 } },
    attachments: {
      diplomas: {
        filesTotal: 0,
        candidates: { has: 0, none: 0 },
        countBuckets: { 0: 0, 1: 0, 2: 0, 3: 0, "4+": 0 },
      },
      languageCertificates: {
        filesTotal: 0,
        candidates: { has: 0, none: 0 },
        byType: {},
      },
    },
    skills: {
      languages: { counts: {}, entriesTotal: 0 },
      languageLevels: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, UNKNOWN: 0 },
      soft: { entriesTotal: 0 },
      pc: { entriesTotal: 0 },
    },
    meta: { rebuiltAt: Date.now(), countersVersion: 1 },
  };

  // Lead tracking (optional)
  stats.totals.byLead = {};
  stats.totals.byMajorLead = {};

  return { stats };
}

export async function rebuildStatsDocsFromExistingData(
  docIds,
  { toastProgress = true, overwriteGlobal = false } = {}
) {
  const list = Array.isArray(docIds) ? docIds.filter(Boolean) : [];
  if (list.length === 0)
    throw new Error("rebuildStatsDocsFromExistingData: no docIds");

  try {
    if (toastProgress) toast("Statistika qayta hisoblanmoqda...");

    // Directions: count meta docs
    const metaSnap = await getDocs(query(collection(db, "meta")));
    const majors = metaSnap.docs
      .map((d) => String(d.data()?.name || d.id || "").trim())
      .filter(Boolean);

    const { stats } = computeStatsSnapshotFromExistingData();
    stats.totals.directions = majors.length;

    // Candidates: scan each major collection
    for (const major of majors) {
      // eslint-disable-next-line no-await-in-loop
      const snap = await getDocs(collection(db, major));
      const docs = snap.docs.map((d) => d.data() || {});
      stats.totals.candidates += docs.length;
      stats.totals.byMajor[major] =
        (stats.totals.byMajor[major] || 0) + docs.length;
      stats.totals.byMajorLead[major] = stats.totals.byMajorLead[major] || {};

      docs.forEach((payload) => {
        // Lead
        const leadRaw =
          payload?.lead ??
          payload?.tracking?.lead ??
          payload?.meta?.lead ??
          payload?.source?.lead;
        const leadKey = safeKey(leadRaw, "");
        if (leadKey) {
          stats.totals.byLead[leadKey] = (stats.totals.byLead[leadKey] || 0) + 1;
          stats.totals.byMajorLead[major][leadKey] =
            (stats.totals.byMajorLead[major][leadKey] || 0) + 1;
        }

        // Gender
        const g = normalizeGender(payload?.persoenlicheDaten?.geschlecht);
        stats.demographics.gender[g] = (stats.demographics.gender[g] || 0) + 1;

        // Age
        const age = toAge(payload?.persoenlicheDaten?.geburtsdatum);
        if (typeof age === "number") {
          const bucket = ageToBucketLabel(age);
          if (bucket) {
            stats.demographics.ageBuckets[bucket] =
              (stats.demographics.ageBuckets[bucket] || 0) + 1;
          }
          stats.demographics.age.count += 1;
          stats.demographics.age.sum += age;
        } else {
          stats.demographics.age.unknown += 1;
        }

        // Driving license
        const hasDl = Boolean(payload?.persoenlicheDaten?.fuehrerschein);
        stats.personal.drivingLicense[hasDl ? "has" : "none"] += 1;
        if (hasDl) {
          const typ = safeKey(
            payload?.persoenlicheDaten?.fuehrerscheinTyp,
            "UNKNOWN"
          );
          stats.personal.drivingLicenseTypes[typ] =
            (stats.personal.drivingLicenseTypes[typ] || 0) + 1;
        }

        // Marital
        const marital = normalizeMaritalStatus(
          payload?.persoenlicheDaten?.familienstand
        );
        stats.demographics.marital[marital] =
          (stats.demographics.marital[marital] || 0) + 1;

        // Children
        const noKids = Boolean(payload?.persoenlicheDaten?.keinKinder);
        const kidsRaw = String(payload?.persoenlicheDaten?.kinderAnzahl || "")
          .trim()
          .replace(/[^\d]/g, "");
        const kidsCount = kidsRaw ? Number(kidsRaw) : 0;
        if (noKids || kidsCount <= 0) {
          stats.demographics.children.none += 1;
        } else {
          stats.demographics.children.has += 1;
          stats.demographics.children.total += kidsCount;
        }

        // Experience
        const years = computeExperienceYears(payload);
        const expBucket = experienceBucketLabel(years);
        stats.career.experienceBuckets[expBucket] =
          (stats.career.experienceBuckets[expBucket] || 0) + 1;
        stats.career.experience.count += 1;
        stats.career.experience.yearsSum += Math.round(years * 10) / 10;

        // Education
        const edu = Array.isArray(payload?.ausbildung)
          ? payload.ausbildung
          : [];
        stats.education.entriesTotal += edu.length;
        stats.education.candidates[edu.length > 0 ? "has" : "none"] += 1;

        // Attachments
        const diplomas = extractDiplomas(payload);
        const langCerts = extractCertificates(payload);

        stats.attachments.diplomas.filesTotal += diplomas.length;
        stats.attachments.diplomas.candidates[
          diplomas.length > 0 ? "has" : "none"
        ] += 1;
        const dipBucket =
          diplomas.length >= 4
            ? "4+"
            : diplomas.length >= 1
            ? String(diplomas.length)
            : "0";
        stats.attachments.diplomas.countBuckets[dipBucket] += 1;

        const noLangCert = hasNoLanguageCertificateFlag(payload);
        const hasLangCert = !noLangCert && langCerts.length > 0;
        stats.attachments.languageCertificates.filesTotal += langCerts.length;
        stats.attachments.languageCertificates.candidates[
          hasLangCert ? "has" : "none"
        ] += 1;
        if (hasLangCert) {
          const detailed = extractCertificateDetails(payload);
          if (Array.isArray(detailed) && detailed.length > 0) {
            detailed.forEach((row) => {
              const url = String(row?.url || "").trim();
              const type = String(row?.type || "").trim();
              if (!url || !type) return;
              const k = safeKey(type);
              stats.attachments.languageCertificates.byType[k] =
                (stats.attachments.languageCertificates.byType[k] || 0) + 1;
            });
          }
        }

        // Skills
        const sprachen = payload?.faehigkeiten?.sprachen || {};
        if (sprachen && typeof sprachen === "object") {
          Object.entries(sprachen).forEach(([langName, level]) => {
            const ln = safeKey(langName, "UNKNOWN");
            stats.skills.languages.counts[ln] =
              (stats.skills.languages.counts[ln] || 0) + 1;
            const lv = normalizeLangLevel(level);
            stats.skills.languageLevels[lv] =
              (stats.skills.languageLevels[lv] || 0) + 1;
            stats.skills.languages.entriesTotal += 1;
          });
        }

        const soft = Array.isArray(payload?.faehigkeiten?.sozialkompetenzen)
          ? payload.faehigkeiten.sozialkompetenzen
          : [];
        const pc = Array.isArray(payload?.faehigkeiten?.pcKenntnisse)
          ? payload.faehigkeiten.pcKenntnisse
          : [];
        stats.skills.soft.entriesTotal += soft.length;
        stats.skills.pc.entriesTotal += pc.length;
      });
    }

    // Write computed snapshot to all requested docs.
    // IMPORTANT: `stats/global` is ALL‑TIME and must not decrease when candidates are deleted.
    // Therefore by default we DO NOT overwrite global with the current snapshot.
    // Instead we only "ensure at least" (monotonic) unless caller explicitly opts in.
    await Promise.all(
      list.map(async (id) => {
        const safeId = String(id || "").trim();
        if (!safeId) return;
        if (safeId === GLOBAL_STATS_DOC_ID && !overwriteGlobal) {
          await ensureStatsDocAtLeast(GLOBAL_STATS_DOC_ID, stats);
          return;
        }
        await setDoc(statsDocRef(safeId), stats, { merge: false });
      })
    );
    if (toastProgress) toast.success("Statistik erfolgreich gespeichert.");
    return stats;
  } catch (err) {
    console.error("rebuildStatsDocsFromExistingData error:", err);
    if (toastProgress) toast.error("Fehler beim Neuberechnen der Statistik.");
    throw err;
  }
}

export async function rebuildGlobalStatsFromExistingData(opts) {
  // Default behavior for ALL‑TIME: do NOT overwrite with snapshot (prevents decreases on delete).
  return rebuildStatsDocsFromExistingData([GLOBAL_STATS_DOC_ID], opts);
}

export async function rebuildCurrentStatsFromExistingData(opts) {
  return rebuildStatsDocsFromExistingData([CURRENT_STATS_DOC_ID], opts);
}

export async function seedBothStatsFromExistingData(opts) {
  // Initial fill: both live(current) and all-time(global) start from existing DB snapshot.
  return rebuildStatsDocsFromExistingData(
    [CURRENT_STATS_DOC_ID, GLOBAL_STATS_DOC_ID],
    opts
  );
}

function flattenNumbers(obj, prefix = "", out = {}) {
  if (!obj || typeof obj !== "object") return out;
  Object.entries(obj).forEach(([k, v]) => {
    const key = String(k);
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof v === "number" && !Number.isNaN(v)) {
      out[path] = v;
      return;
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenNumbers(v, path, out);
    }
  });
  return out;
}

function getNumberAtPath(obj, path) {
  if (!obj || typeof obj !== "object") return 0;
  const parts = String(path || "").split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return 0;
    cur = cur[p];
  }
  const n = Number(cur);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Ensures a stats doc is NEVER below the provided floor snapshot.
 * It only ever increments fields that are smaller than floor values (monotonic).
 * Safe to run repeatedly; once caught up it becomes a no-op.
 */
export async function ensureStatsDocAtLeast(docId, floorStats) {
  const ref = statsDocRef(docId);
  const floorFlat = flattenNumbers(floorStats || {});
  const floorKeys = Object.keys(floorFlat);
  if (floorKeys.length === 0) return { updated: false };

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() ? snap.data() : {};
    const inc = {};
    let changed = false;

    floorKeys.forEach((path) => {
      const floorVal = Number(floorFlat[path] || 0);
      const curVal = getNumberAtPath(cur, path);
      if (curVal < floorVal) {
        inc[path] = increment(floorVal - curVal);
        changed = true;
      }
    });

    if (changed) {
      inc["meta.updatedAt"] = Date.now();
      inc["meta.countersVersion"] = 1;
      tx.set(
        ref,
        { meta: { countersVersion: 1, updatedAt: Date.now() } },
        { merge: true }
      );
      tx.update(ref, inc);
    }
    return { updated: changed };
  });
}
