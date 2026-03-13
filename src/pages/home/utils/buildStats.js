import {
  toAge,
  ageBucket,
  normalizeGender,
  normalizeMarital,
  normalizeLevel,
  expBucket,
  extractDiplomas,
  extractCerts,
  extractCertDetails,
  noLangCertFlag,
  safeKey,
} from "./statsHelpers";

function createEmptyStats(directionCount) {
  return {
    totals: {
      candidates: 0,
      directions: directionCount,
      byMajor: {},
      byLead: {},
      byMajorLead: {},
    },
    demographics: {
      gender: { male: 0, female: 0, unknown: 0 },
      ageBuckets: {
        "18-24": 0,
        "25-34": 0,
        "35-44": 0,
        "45-54": 0,
        "55+": 0,
      },
      age: { count: 0, sum: 0, unknown: 0 },
      marital: { single: 0, married: 0, other: 0, unknown: 0 },
    },
    career: {
      experienceBuckets: {
        "0-1 Jahr": 0,
        "1-3 Jahre": 0,
        "3-5 Jahre": 0,
        "5+ Jahre": 0,
      },
    },
    attachments: {
      diplomas: { candidates: { has: 0, none: 0 } },
      languageCertificates: {
        candidates: { has: 0, none: 0 },
        byType: {},
      },
    },
    skills: {
      languages: { counts: {} },
      languageLevels: {
        A1: 0,
        A2: 0,
        B1: 0,
        B2: 0,
        C1: 0,
        C2: 0,
        UNKNOWN: 0,
      },
    },
    regions: {
      byRegion: {},
      byRegionCert: {},
    },
  };
}

function processDoc(stats, d, majorName) {
  const leadRaw =
    d?.lead ?? d?.tracking?.lead ?? d?.meta?.lead ?? d?.source?.lead;
  const leadName = String(leadRaw || "").trim();
  if (leadName) {
    const lk = safeKey(leadName);
    if (lk) {
      stats.totals.byLead[lk] = (stats.totals.byLead[lk] || 0) + 1;
      if (majorName) {
        stats.totals.byMajorLead[majorName] =
          stats.totals.byMajorLead[majorName] || {};
        stats.totals.byMajorLead[majorName][lk] =
          (stats.totals.byMajorLead[majorName][lk] || 0) + 1;
      }
    }
  }

  const gender = normalizeGender(d?.persoenlicheDaten?.geschlecht);
  stats.demographics.gender[gender] += 1;

  const age = toAge(d?.persoenlicheDaten?.geburtsdatum);
  if (typeof age === "number") {
    const b = ageBucket(age);
    if (b) stats.demographics.ageBuckets[b] += 1;
    stats.demographics.age.count += 1;
    stats.demographics.age.sum += age;
  } else {
    stats.demographics.age.unknown += 1;
  }

  const m = normalizeMarital(d?.persoenlicheDaten?.familienstand);
  stats.demographics.marital[m] += 1;

  const eb = expBucket(d);
  stats.career.experienceBuckets[eb] += 1;

  const diplomas = extractDiplomas(d);
  if (diplomas.length > 0) stats.attachments.diplomas.candidates.has += 1;
  else stats.attachments.diplomas.candidates.none += 1;

  const certs = extractCerts(d);
  const hasCert = !noLangCertFlag(d) && certs.length > 0;
  if (hasCert)
    stats.attachments.languageCertificates.candidates.has += 1;
  else stats.attachments.languageCertificates.candidates.none += 1;

  if (hasCert) {
    const detailed = extractCertDetails(d);
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

  const sprachen = d?.faehigkeiten?.sprachen || {};
  if (sprachen && typeof sprachen === "object") {
    Object.entries(sprachen).forEach(([langName, level]) => {
      const ln = safeKey(langName);
      if (ln) {
        stats.skills.languages.counts[ln] =
          (stats.skills.languages.counts[ln] || 0) + 1;
      }
      const lv = normalizeLevel(level);
      stats.skills.languageLevels[lv] += 1;
    });
  }

  const regionRaw = d?.persoenlicheDaten?.geburtsort || "";
  const regionName = String(regionRaw).trim();
  if (regionName) {
    const rk = safeKey(regionName);
    if (rk) {
      if (!stats.regions.byRegion[rk]) stats.regions.byRegion[rk] = 0;
      stats.regions.byRegion[rk] += 1;

      if (!stats.regions.byRegionCert[rk]) {
        stats.regions.byRegionCert[rk] = { hasCert: 0, noCert: 0 };
      }
      if (hasCert) stats.regions.byRegionCert[rk].hasCert += 1;
      else stats.regions.byRegionCert[rk].noCert += 1;
    }
  }
}

export function buildStatsFromDocsByCollection(docsByCollection, names) {
  const stats = createEmptyStats(names.length);

  names.forEach((name) => {
    const safeName = String(name || "").trim();
    const docs = Array.isArray(docsByCollection?.[safeName])
      ? docsByCollection[safeName]
      : [];
    stats.totals.byMajor[safeName] = docs.length;
    stats.totals.candidates += docs.length;
    stats.totals.byMajorLead[safeName] =
      stats.totals.byMajorLead[safeName] || {};
    docs.forEach((d) => processDoc(stats, d, safeName));
  });

  const archivedDocs = Array.isArray(
    docsByCollection?.["__archived_users__"]
  )
    ? docsByCollection["__archived_users__"]
    : [];
  archivedDocs.forEach((d) => processDoc(stats, d, null));

  const deletedDocs = Array.isArray(
    docsByCollection?.["__deleted_users__"]
  )
    ? docsByCollection["__deleted_users__"]
    : [];
  deletedDocs.forEach((d) => processDoc(stats, d, null));

  return stats;
}
