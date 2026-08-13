const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { getDb } = require("../utils/admin");
const {
  isCandidateCollectionId,
  looksLikeCandidateDoc,
  buildCandidateIndex,
  indexDocRef,
} = require("../utils/candidateIndex");

/**
 * Mirrors every candidate write into cv_index/{collectionId}/items/{docId}.
 *
 * Candidate collections are created per Berufsfeld at runtime, so the trigger matches
 * every top-level collection and filters by name and document shape — the same pattern
 * `syncEmailAndPassIdRegistry` already uses.
 */
exports.syncCandidateListIndex = onDocumentWritten(
  "{collectionId}/{docId}",
  async (event) => {
    const collectionId = String(event?.params?.collectionId || "").trim();
    const docId = String(event?.params?.docId || "").trim();
    if (!collectionId || !docId) return;
    if (!isCandidateCollectionId(collectionId)) return;

    const before = event?.data?.before;
    const after = event?.data?.after;
    const beforeData = before?.exists ? before.data() || {} : null;
    const afterData = after?.exists ? after.data() || {} : null;

    // Ignore documents in non-candidate collections that slipped past the name filter.
    if (!looksLikeCandidateDoc(afterData) && !looksLikeCandidateDoc(beforeData)) return;

    const db = getDb();
    const ref = indexDocRef(db, collectionId, docId);

    try {
      if (!afterData) {
        await ref.delete();
        return;
      }

      const next = buildCandidateIndex(afterData);

      // Most candidate writes (documents, autosave of CV fields) touch nothing the list
      // shows. Skipping those writes keeps costs down and avoids needless snapshots.
      if (beforeData) {
        const prev = buildCandidateIndex(beforeData);
        if (JSON.stringify(prev) === JSON.stringify(next)) return;
      }

      await ref.set(next);
    } catch (err) {
      logger.error("syncCandidateListIndex failed", {
        collectionId,
        docId,
        error: err?.message || String(err),
      });
    }
  },
);
