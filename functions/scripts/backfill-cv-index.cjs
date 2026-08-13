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
const path = require("path");

const serviceAccountPath = path.join(__dirname, "..", "..", "serviceAccountKey.json");
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error("❌ Error: serviceAccountKey.json not found");
  console.error("Please place your Firebase service account key in the project root");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const {
  isCandidateCollectionId,
  looksLikeCandidateDoc,
  buildCandidateIndex,
  indexDocRef,
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

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if (!looksLikeCandidateDoc(data)) {
      skipped++;
      continue;
    }
    sourceIds.add(doc.id);
    written++;
    if (isDryRun) continue;

    batch.set(indexDocRef(db, name, doc.id), buildCandidateIndex(data));
    pending++;
    if (pending >= batchSize) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (!isDryRun && pending > 0) await batch.commit();

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
