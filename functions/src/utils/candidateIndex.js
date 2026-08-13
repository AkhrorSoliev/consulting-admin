/**
 * Candidate list index.
 *
 * The CollectionCv table needs ~30 flat fields, but a candidate document carries the
 * whole CV (persoenlicheDaten, berufserfahrung, faehigkeiten, documents, commentar HTML,
 * stageMeta, …) — roughly 10-30 KB each. Subscribing to a 500+ document collection meant
 * downloading megabytes to render a table.
 *
 * This module derives a ~400 byte projection stored at
 *   cv_index/{collectionId}/items/{docId}
 * which the list view subscribes to instead.
 *
 * Only values that are expensive to derive on the client (HTML scanning, deep traversal)
 * are precomputed here. Values that would go stale (age) or that are pure lookups
 * (status label/tone) stay on the client so a constant change never needs a backfill.
 */

const CV_INDEX_ROOT = "cv_index";
const CV_INDEX_ITEMS = "items";

// Top-level collections that are never candidate collections.
const NON_CANDIDATE_COLLECTIONS = new Set([
  CV_INDEX_ROOT,
  "meta",
  "stats",
  "users",
  "settings",
  "candidate_metadata",
  "email_and_passid",
  "all_users",
  "archived_users",
  "deleted_users",
  "deleted_users_remote",
  "pending_registrations",
]);

const LANG_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STAGE_KEYS = ["stage_1", "stage_2", "stage_2_result", "stage_3", "stage_4"];

/** Candidate collections are created dynamically, so identify them by shape. */
function isCandidateCollectionId(collectionId) {
  const id = String(collectionId || "").trim();
  if (!id) return false;
  return !NON_CANDIDATE_COLLECTIONS.has(id);
}

/** A candidate document always carries the personal-data block. */
function looksLikeCandidateDoc(data) {
  return Boolean(data && typeof data === "object" && data.persoenlicheDaten);
}

function hasRichTextContent(value) {
  return Boolean(
    String(value || "")
      .replace(/<[^>]*>/g, "")
      .trim(),
  );
}

function normalizeRating(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const clamped = Math.min(5, Math.max(0.5, numeric));
  return Math.round(clamped * 2) / 2;
}

function str(value) {
  return String(value ?? "").trim();
}

/** Firestore rejects `undefined`; every field below resolves to a concrete value. */
function buildCandidateIndex(data) {
  const d = data && typeof data === "object" ? data : {};
  const pd = d.persoenlicheDaten || {};
  const documents = d.documents || {};
  const emailMeta = d.emailMeta || {};
  const commentMeta = d.commentarMeta || {};
  const status = d.status && typeof d.status === "object" ? d.status : {};
  const stageMeta = d.stageMeta && typeof d.stageMeta === "object" ? d.stageMeta : {};

  const certificates = Array.isArray(documents.certificates) ? documents.certificates : [];

  const langLevels = Object.values(d.faehigkeiten?.sprachen || {})
    .map((lv) => str(lv).toUpperCase())
    .filter((lv) => LANG_LEVELS.includes(lv));

  const stageDecisions = {};
  for (const key of STAGE_KEYS) {
    const raw = stageMeta?.[key]?.decision;
    if (raw === "accepted" || raw === "rejected") stageDecisions[key] = raw;
  }

  const emailCountRaw = emailMeta.count;
  const emailSentCount = Number(emailCountRaw) || 0;

  return {
    createdAt: d.createdAt ?? 0,
    name: [str(pd.name), str(pd.nachname)].filter(Boolean).join(" "),
    // Stored raw: age is derived on the client so it never goes stale in the index.
    geburtsdatum: str(pd.geburtsdatum),
    photo: str(pd.foto),
    phone: str(pd.telefon),
    email: str(pd.email),
    maritalStatus: str(pd.familienstand),

    hasCertificate: certificates.length > 0,
    hasExperience: Array.isArray(d.berufserfahrung) && d.berufserfahrung.length > 0,
    hasDrivingLicense: Boolean(pd.fuehrerschein),
    langLevels,

    statusValue: typeof d.status === "string" ? d.status : str(status.value),
    statusUpdatedAt: status.updatedAt ?? null,
    statusUpdatedBy: str(status.updatedBy),
    statusUpdatedByUid: str(status.updatedByUid),
    stageDecisions,

    emailSentCount,
    emailLastSentAt: emailMeta.lastSentAt ?? null,
    emailLastSentBy: str(emailMeta.lastSentBy),
    emailLastSentByName: str(emailMeta.lastSentByName),
    emailLastSentByPhoto: str(emailMeta.lastSentByPhoto),
    emailLastSentByUid: str(emailMeta.lastSentByUid),

    hasComment: hasRichTextContent(d.commentar),
    commentUpdatedAt: commentMeta.updatedAt ?? null,
    commentUpdatedBy: str(commentMeta.updatedBy),
    commentUpdatedByName: str(commentMeta.updatedByName),
    commentUpdatedByPhoto: str(commentMeta.updatedByPhoto),
    commentUpdatedByUid: str(commentMeta.updatedByUid),

    telegramId: d.telegramId ?? null,
    lead: d.lead ?? null,
    reaction: d.reaction ?? null,
    rating: normalizeRating(d.rating),
    documentReady: Boolean(d.documentReady),
    isDocumentSend: Boolean(d.isDocumentSend),
  };
}

/** cv_index/{collectionId} — marker written by the backfill script. */
function indexMetaRef(db, collectionId) {
  return db.collection(CV_INDEX_ROOT).doc(collectionId);
}

/** cv_index/{collectionId}/items/{docId} */
function indexDocRef(db, collectionId, docId) {
  return indexMetaRef(db, collectionId).collection(CV_INDEX_ITEMS).doc(docId);
}

module.exports = {
  CV_INDEX_ROOT,
  CV_INDEX_ITEMS,
  NON_CANDIDATE_COLLECTIONS,
  isCandidateCollectionId,
  looksLikeCandidateDoc,
  buildCandidateIndex,
  indexMetaRef,
  indexDocRef,
};
