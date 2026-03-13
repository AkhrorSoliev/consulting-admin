/**
 * Functions that build Firestore increment() maps from candidate payloads.
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

  inc["documents.diplomas.filesTotal"] = increment(diplomas.length * f);
  inc[`documents.diplomas.candidates.${diplomas.length > 0 ? "has" : "none"}`] =
    increment(1 * f);
  const dipBucket =
    diplomas.length >= 4
      ? "4+"
      : diplomas.length >= 1
      ? String(diplomas.length)
      : "0";
  inc[`documents.diplomas.countBuckets.${safeKey(dipBucket)}`] = increment(
    1 * f
  );

  const noLangCert = hasNoLanguageCertificateFlag(payload);
  const hasLangCert = !noLangCert && langCerts.length > 0;
  inc["documents.languageCertificates.filesTotal"] = increment(
    langCerts.length * f
  );
  inc[
    `documents.languageCertificates.candidates.${hasLangCert ? "has" : "none"}`
  ] = increment(1 * f);

  // Language certificate types
  if (hasLangCert) {
    const detailed = extractCertificateDetails(payload);
    if (Array.isArray(detailed) && detailed.length > 0) {
      detailed.forEach((row) => {
        const url = String(row?.url || "").trim();
        const type = String(row?.type || "").trim();
        if (!url || !type) return;
        inc[`documents.languageCertificates.byType.${safeKey(type)}`] =
          increment(1 * f);
      });
    }
  }

  // Skills
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
