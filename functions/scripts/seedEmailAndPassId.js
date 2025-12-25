/* eslint-env node */
/* global __dirname, require, process */

/**
 * Seed `email_and_passId` collection from `src/all_Emails.json`.
 *
 * Usage (from repo root):
 *   cd functions
 *   npm run seed:email_and_passid
 *
 * Notes:
 * - Requires Firebase Admin credentials (ADC). Easiest:
 *   - `firebase login`
 *   - `gcloud auth application-default login`  (if you use gcloud)
 *   - or set GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
 * - Uses docId = normalized email, so duplicates won't create extra docs.
 */

const path = require("path");
const { getDb } = require("../src/utils/admin");

const PROJECT_ID_FALLBACK = "consulting-bdb74";
const COLLECTION = "email_and_passId";
const CHUNK_SIZE = 450; // Firestore batch write limit is 500

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toPayload(item) {
  const email = normalizeEmail(item?.email);
  const major = item?.major ?? null;
  const passportIdRaw = item?.passportId;
  const passportId =
    passportIdRaw === undefined || passportIdRaw === null || passportIdRaw === ""
      ? null
      : String(passportIdRaw).trim();

  return {
    email,
    major,
    ...(passportId ? { passportId } : {}),
    updatedAt: Date.now(),
  };
}

async function main() {
  // Help Admin SDK find projectId in local execution if env isn't set.
  process.env.GCLOUD_PROJECT =
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    PROJECT_ID_FALLBACK;

  const jsonPath = path.join(__dirname, "..", "..", "src", "all_Emails.json");
  const items = require(jsonPath);

  if (!Array.isArray(items)) {
    throw new Error(`Expected JSON array at ${jsonPath}`);
  }

  const db = getDb();

  let totalWritten = 0;
  let skipped = 0;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const slice = items.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();
    let writesInBatch = 0;

    for (const raw of slice) {
      const email = normalizeEmail(raw?.email);
      if (!email) {
        skipped += 1;
        continue;
      }

      const ref = db.collection(COLLECTION).doc(email);
      batch.set(ref, toPayload(raw), { merge: true });
      writesInBatch += 1;
    }

    if (writesInBatch > 0) {
      await batch.commit();
      totalWritten += writesInBatch;
    }

    // Progress log
    // eslint-disable-next-line no-console
    console.log(
      `[seedEmailAndPassId] batch committed: ${writesInBatch} writes (progress ${Math.min(
        i + CHUNK_SIZE,
        items.length
      )}/${items.length})`
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seedEmailAndPassId] DONE. Written=${totalWritten}, skipped=${skipped}, collection=${COLLECTION}, project=${process.env.GCLOUD_PROJECT}`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seedEmailAndPassId] FAILED:", err);
  process.exitCode = 1;
});


