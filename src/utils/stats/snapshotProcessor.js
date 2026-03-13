/**
 * Snapshot creation and per-payload processing for stats rebuild.
 */
import {
  AGE_BUCKETS,
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

export function computeStatsSnapshotFromExistingData() {
  const stats = {
    totals: { candidates: 0, directions: 0, byMajor: {}, byLead: {}, byMajorLead: {} },
    demographics: {
      gender: { male: 0, female: 0, unknown: 0 },
      ageBuckets: Object.fromEntries(AGE_BUCKETS.map((b) => [b.label, 0])),
      age: { count: 0, sum: 0, unknown: 0 },
      marital: { single: 0, married: 0, other: 0, unknown: 0 },
      children: { none: 0, has: 0, total: 0 },
    },
    personal: { drivingLicense: { has: 0, none: 0 }, drivingLicenseTypes: {} },
    career: {
      experienceBuckets: { "0-1 Jahr": 0, "1-3 Jahre": 0, "3-5 Jahre": 0, "5+ Jahre": 0 },
      experience: { count: 0, yearsSum: 0 },
    },
    education: { entriesTotal: 0, candidates: { has: 0, none: 0 } },
    attachments: {
      diplomas: {
        filesTotal: 0, candidates: { has: 0, none: 0 },
        countBuckets: { 0: 0, 1: 0, 2: 0, 3: 0, "4+": 0 },
      },
      languageCertificates: { filesTotal: 0, candidates: { has: 0, none: 0 }, byType: {} },
    },
    skills: {
      languages: { counts: {}, entriesTotal: 0 },
      languageLevels: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, UNKNOWN: 0 },
      soft: { entriesTotal: 0 },
      pc: { entriesTotal: 0 },
    },
    meta: { rebuiltAt: Date.now(), countersVersion: 1 },
  };
  return { stats };
}

export function processPayload(stats, payload) {
  const leadRaw =
    payload?.lead ?? payload?.tracking?.lead ?? payload?.meta?.lead ?? payload?.source?.lead;
  const leadKey = safeKey(leadRaw, "");
  if (leadKey) {
    stats.totals.byLead[leadKey] = (stats.totals.byLead[leadKey] || 0) + 1;
  }

  const g = normalizeGender(payload?.persoenlicheDaten?.geschlecht);
  stats.demographics.gender[g] = (stats.demographics.gender[g] || 0) + 1;

  const age = toAge(payload?.persoenlicheDaten?.geburtsdatum);
  if (typeof age === "number") {
    const bucket = ageToBucketLabel(age);
    if (bucket)
      stats.demographics.ageBuckets[bucket] = (stats.demographics.ageBuckets[bucket] || 0) + 1;
    stats.demographics.age.count += 1;
    stats.demographics.age.sum += age;
  } else {
    stats.demographics.age.unknown += 1;
  }

  const hasDl = Boolean(payload?.persoenlicheDaten?.fuehrerschein);
  stats.personal.drivingLicense[hasDl ? "has" : "none"] += 1;
  if (hasDl) {
    const typ = safeKey(payload?.persoenlicheDaten?.fuehrerscheinTyp, "UNKNOWN");
    stats.personal.drivingLicenseTypes[typ] =
      (stats.personal.drivingLicenseTypes[typ] || 0) + 1;
  }

  const marital = normalizeMaritalStatus(payload?.persoenlicheDaten?.familienstand);
  stats.demographics.marital[marital] = (stats.demographics.marital[marital] || 0) + 1;

  const noKids = Boolean(payload?.persoenlicheDaten?.keinKinder);
  const kidsRaw = String(payload?.persoenlicheDaten?.kinderAnzahl || "")
    .trim().replace(/[^\d]/g, "");
  const kidsCount = kidsRaw ? Number(kidsRaw) : 0;
  if (noKids || kidsCount <= 0) {
    stats.demographics.children.none += 1;
  } else {
    stats.demographics.children.has += 1;
    stats.demographics.children.total += kidsCount;
  }

  const years = computeExperienceYears(payload);
  const expBucket = experienceBucketLabel(years);
  stats.career.experienceBuckets[expBucket] =
    (stats.career.experienceBuckets[expBucket] || 0) + 1;
  stats.career.experience.count += 1;
  stats.career.experience.yearsSum += Math.round(years * 10) / 10;

  const edu = Array.isArray(payload?.ausbildung) ? payload.ausbildung : [];
  stats.education.entriesTotal += edu.length;
  stats.education.candidates[edu.length > 0 ? "has" : "none"] += 1;

  const diplomas = extractDiplomas(payload);
  const langCerts = extractCertificates(payload);
  stats.documents.diplomas.filesTotal += diplomas.length;
  stats.documents.diplomas.candidates[diplomas.length > 0 ? "has" : "none"] += 1;
  const dipBucket =
    diplomas.length >= 4 ? "4+" : diplomas.length >= 1 ? String(diplomas.length) : "0";
  stats.documents.diplomas.countBuckets[dipBucket] += 1;

  const noLangCert = hasNoLanguageCertificateFlag(payload);
  const hasLangCert = !noLangCert && langCerts.length > 0;
  stats.documents.languageCertificates.filesTotal += langCerts.length;
  stats.documents.languageCertificates.candidates[hasLangCert ? "has" : "none"] += 1;
  if (hasLangCert) {
    const detailed = extractCertificateDetails(payload);
    if (Array.isArray(detailed) && detailed.length > 0) {
      detailed.forEach((row) => {
        const url = String(row?.url || "").trim();
        const type = String(row?.type || "").trim();
        if (!url || !type) return;
        const k = safeKey(type);
        stats.documents.languageCertificates.byType[k] =
          (stats.documents.languageCertificates.byType[k] || 0) + 1;
      });
    }
  }

  const sprachen = payload?.faehigkeiten?.sprachen || {};
  if (sprachen && typeof sprachen === "object") {
    Object.entries(sprachen).forEach(([langName, level]) => {
      const ln = safeKey(langName, "UNKNOWN");
      stats.skills.languages.counts[ln] = (stats.skills.languages.counts[ln] || 0) + 1;
      const lv = normalizeLangLevel(level);
      stats.skills.languageLevels[lv] = (stats.skills.languageLevels[lv] || 0) + 1;
      stats.skills.languages.entriesTotal += 1;
    });
  }

  const soft = Array.isArray(payload?.faehigkeiten?.sozialkompetenzen)
    ? payload.faehigkeiten.sozialkompetenzen : [];
  const pc = Array.isArray(payload?.faehigkeiten?.pcKenntnisse)
    ? payload.faehigkeiten.pcKenntnisse : [];
  stats.skills.soft.entriesTotal += soft.length;
  stats.skills.pc.entriesTotal += pc.length;
}
