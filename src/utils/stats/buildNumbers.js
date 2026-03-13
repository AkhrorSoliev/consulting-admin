/**
 * Plain-number stats builders and delta/merge utilities.
 * Used for computing diffs when updating existing candidates.
 */
import { increment } from "firebase/firestore";
import {
  safeKey,
  toAge,
  ageToBucketLabel,
  computeExperienceYears,
  experienceBucketLabel,
  normalizeGender,
  normalizeMaritalStatus,
  normalizeLangLevel,
  extractDiplomas,
  extractCertificates,
  extractCertificateDetails,
  hasNoLanguageCertificateFlag,
} from "./helpers";

export function buildCandidateStatsNumbers(major, payload, options = {}) {
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
  add("documents.diplomas.filesTotal", diplomas.length);
  add(
    `documents.diplomas.candidates.${diplomas.length > 0 ? "has" : "none"}`,
    1
  );
  const dipBucket =
    diplomas.length >= 4
      ? "4+"
      : diplomas.length >= 1
      ? String(diplomas.length)
      : "0";
  add(`documents.diplomas.countBuckets.${safeKey(dipBucket)}`, 1);

  const noLangCert = hasNoLanguageCertificateFlag(payload);
  const hasLangCert = !noLangCert && certs.length > 0;
  add("documents.languageCertificates.filesTotal", certs.length);
  add(
    `documents.languageCertificates.candidates.${hasLangCert ? "has" : "none"}`,
    1
  );

  if (hasLangCert) {
    const detailed = extractCertificateDetails(payload);
    if (Array.isArray(detailed) && detailed.length > 0) {
      detailed.forEach((row) => {
        const url = String(row?.url || "").trim();
        const type = String(row?.type || "").trim();
        if (!url || !type) return;
        add(`documents.languageCertificates.byType.${safeKey(type)}`, 1);
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

export function diffCounters(oldNumbers, newNumbers) {
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

export function deltaToIncrements(delta) {
  const inc = {};
  Object.entries(delta || {}).forEach(([k, v]) => {
    const n = Number(v);
    if (!n || Number.isNaN(n)) return;
    inc[k] = increment(n);
  });
  return inc;
}

export function mergeCandidatePayloadForStats(oldPayload, patch) {
  const oldP = oldPayload && typeof oldPayload === "object" ? oldPayload : {};
  const next = patch && typeof patch === "object" ? patch : {};
  const merge = (key) => ({
    ...(oldP?.[key] && typeof oldP[key] === "object" ? oldP[key] : {}),
    ...(next?.[key] && typeof next[key] === "object" ? next[key] : {}),
  });
  return {
    ...oldP,
    ...next,
    persoenlicheDaten: merge("persoenlicheDaten"),
    faehigkeiten: merge("faehigkeiten"),
    attachments: merge("attachments"),
    documents: merge("documents"),
    tracking: merge("tracking"),
    meta: merge("meta"),
    source: merge("source"),
    dokumente: merge("dokumente"),
    status: merge("status"),
  };
}
