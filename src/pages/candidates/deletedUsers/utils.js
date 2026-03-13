export function pickFirstNonEmptyString(values) {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

export function extractEmailFromSnapshot(record) {
  const r = record && typeof record === "object" ? record : {};
  return pickFirstNonEmptyString([
    r?.persoenlicheDaten?.email,
    r?.personalInfo?.email,
    r?.personalData?.email,
    r?.email,
  ]);
}

export function extractPassportIdFromSnapshot(record) {
  const r = record && typeof record === "object" ? record : {};
  return pickFirstNonEmptyString([
    r?.passportId,
    r?.passportID,
    r?.passportNumber,
    r?.reisepassNummer,
    r?.persoenlicheDaten?.reisepassNummer,
    r?.persoenlicheDaten?.passportId,
    r?.persoenlicheDaten?.passportID,
    r?.persoenlicheDaten?.passportNumber,
    r?.personalInfo?.passportNumber,
    r?.personalInfo?.reisepassNummer,
    r?.personalData?.passportNumber,
    r?.personalData?.reisepassNummer,
  ]);
}

export function stripDeletedUserMetaForRestore(record) {
  const r = record && typeof record === "object" ? record : {};
  const omit = new Set([
    "id",
    "sourceMajor",
    "sourceDocId",
    "sourceMajorTitle",
    "deletedAt",
    "deletedBy",
    "email",
  ]);
  const out = {};
  Object.keys(r).forEach((k) => {
    if (!omit.has(k)) out[k] = r[k];
  });
  return out;
}
