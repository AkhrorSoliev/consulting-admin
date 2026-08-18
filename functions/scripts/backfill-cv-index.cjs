/**
 * Backfill Script: cv_index candidate list projection
 *
 * Builds cv_index/{collection}/items/{docId} for every existing candidate so the
 * CollectionCv table can read the small projection instead of full CV documents.
 * The `syncCandidateListIndex` Cloud Function keeps it current from then on.
 *
 * Collections are discovered from the `meta` collection, so newly created
 * Berufsfelder are picked up without editing this file.
 *
 * Credentials, in order of preference:
 *   1. serviceAccountKey.json in the project root
 *   2. GOOGLE_APPLICATION_CREDENTIALS pointing at a key file
 *   3. Application Default Credentials (`gcloud auth application-default login`),
 *      in which case FIREBASE_PROJECT_ID must name the target project
 *
 * Usage:
 *   node scripts/backfill-cv-index.cjs [--dry-run] [--collection=NAME] [--batch-size=N] [--prune]
 *
 * Options:
 *   --dry-run          Report what would be written without writing
 *   --collection=NAME  Only process this collection (default: all from `meta`)
 *   --batch-size=N     Documents per commit (default: 400, Firestore limit is 500)
 *   --prune            Also delete index entries whose source document is gone
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..", "..");

/** Read the target project from .firebaserc so ADC never writes to the wrong project. */
function defaultProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  try {
    const rc = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".firebaserc"), "utf8"));
    return rc?.projects?.default || "";
  } catch {
    return "";
  }
}

function initAdmin() {
  const keyPath = path.join(REPO_ROOT, "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return serviceAccount.project_id;
  }

  const projectId = defaultProjectId();
  if (!projectId) {
    console.error("❌ Error: no credentials and no project id.");
    console.error("   Place serviceAccountKey.json in the project root, or run");
    console.error("   `gcloud auth application-default login` and set FIREBASE_PROJECT_ID.");
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    return projectId;
  } catch (err) {
    console.error(`❌ Error: could not load credentials — ${err?.message || err}`);
    console.error("   Place serviceAccountKey.json in the project root, or run");
    console.error("   `gcloud auth application-default login`.");
    process.exit(1);
  }
}

const activeProjectId = admin.apps.length ? null : initAdmin();

const db = admin.firestore();

const {
  isCandidateCollectionId,
  looksLikeCandidateDoc,
  buildCandidateIndex,
  indexDocRef,
  indexMetaRef,
  CV_INDEX_ROOT,
  CV_INDEX_ITEMS,
} = require("../src/utils/candidateIndex");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldPrune = args.includes("--prune");
const collectionArg = args.find((a) => a.startsWith("--collection="));
const targetCollection = collectionArg ? collectionArg.split("=")[1] : null;
const batchSizeArg = args.find((a) => a.startsWith("--batch-size="));
const batchSize = batchSizeArg ? Number(batchSizeArg.split("=")[1]) || 400 : 400;

// Firestore rejects requests above ~11.5 MB; stay well under it.
const MAX_BATCH_BYTES = 8 * 1024 * 1024;

/** Read candidate collection names from `meta`. */
async function discoverCollections() {
  if (targetCollection) return [targetCollection];

  const snap = await db.collection("meta").get();
  const names = new Set();
  snap.docs.forEach((doc) => {
    const d = doc.data() || {};
    const name = String(d.collectionName || d.slug || d.name || "").trim();
    if (name && isCandidateCollectionId(name)) names.add(name);
  });
  return Array.from(names).sort();
}

async function backfillCollection(name) {
  const snap = await db.collection(name).get();
  const sourceIds = new Set();
  let written = 0;
  let skipped = 0;

  let batch = db.batch();
  let pending = 0;
  let pendingBytes = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if (!looksLikeCandidateDoc(data)) {
      skipped++;
      continue;
    }
    sourceIds.add(doc.id);
    written++;
    if (isDryRun) continue;

    const projection = buildCandidateIndex(data);
    const bytes = JSON.stringify(projection).length;

    // Commit early when the batch approaches the request payload limit; a document
    // count alone is not enough if any field turns out to be unexpectedly large.
    if (pending > 0 && pendingBytes + bytes > MAX_BATCH_BYTES) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
      pendingBytes = 0;
    }

    batch.set(indexDocRef(db, name, doc.id), projection);
    pending++;
    pendingBytes += bytes;
    if (pending >= batchSize) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
      pendingBytes = 0;
    }
  }

  if (!isDryRun && pending > 0) await batch.commit();

  // Marker the client checks before trusting the projection. Without it, a single
  // candidate edit would populate one index entry and the list would show only that
  // one row instead of falling back to the source collection.
  if (!isDryRun) {
    await indexMetaRef(db, name).set(
      {
        backfilledAt: Date.now(),
        count: written,
      },
      { merge: true },
    );
  }

  let pruned = 0;
  if (shouldPrune) {
    const indexSnap = await db
      .collection(CV_INDEX_ROOT)
      .doc(name)
      .collection(CV_INDEX_ITEMS)
      .get();
    const stale = indexSnap.docs.filter((d) => !sourceIds.has(d.id));
    pruned = stale.length;

    if (!isDryRun && stale.length > 0) {
      let pruneBatch = db.batch();
      let count = 0;
      for (const d of stale) {
        pruneBatch.delete(d.ref);
        count++;
        if (count >= batchSize) {
          await pruneBatch.commit();
          pruneBatch = db.batch();
          count = 0;
        }
      }
      if (count > 0) await pruneBatch.commit();
    }
  }

  return { total: snap.size, written, skipped, pruned };
}

async function main() {
  console.log("\n🔧 Backfill: cv_index candidate projection\n");
  console.log(`Project: ${activeProjectId || "(pre-initialized app)"}`);
  console.log(`Mode: ${isDryRun ? "🔍 DRY RUN (no writes)" : "✏️  WRITE MODE"}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Prune stale: ${shouldPrune ? "yes" : "no"}`);

  const collections = await discoverCollections();
  if (collections.length === 0) {
    console.log("\n⚠️  No candidate collections found in `meta`.");
    return;
  }
  console.log(`Collections: ${collections.length}\n`);

  const totals = { total: 0, written: 0, skipped: 0, pruned: 0 };

  for (const name of collections) {
    try {
      const r = await backfillCollection(name);
      totals.total += r.total;
      totals.written += r.written;
      totals.skipped += r.skipped;
      totals.pruned += r.pruned;
      console.log(
        `  ✅ ${name}: ${r.written} indexed` +
          (r.skipped ? `, ${r.skipped} skipped (not a candidate doc)` : "") +
          (r.pruned ? `, ${r.pruned} pruned` : ""),
      );
    } catch (err) {
      console.error(`  ❌ ${name}: ${err?.message || err}`);
    }
  }

  console.log(
    `\n📊 Done — ${totals.written} indexed, ${totals.skipped} skipped, ${totals.pruned} pruned ` +
      `across ${collections.length} collection(s).\n`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Backfill failed:", err);
    process.exit(1);
  });
