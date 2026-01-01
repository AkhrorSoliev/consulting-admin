/**
 * Migration Script: Remove Duplicate Document Fields
 *
 * This script removes duplicate document storage fields from existing candidates:
 * - Removes: attachments, dokumente, languageCertificatesDetailed (root level)
 * - Keeps: documents (canonical source)
 * - Consolidates certificatesDetailed into documents.certificatesDetailed
 *
 * Usage:
 *   node scripts/migrate-remove-duplicate-documents.js [--dry-run] [--collection=COLLECTION_NAME]
 *
 * Options:
 *   --dry-run              Show what would be changed without making changes
 *   --collection=NAME      Only process specific collection (default: all)
 *   --batch-size=N         Process N documents at a time (default: 50)
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(
  __dirname,
  "..",
  "..",
  "serviceAccountKey.json"
);
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.error("❌ Error: serviceAccountKey.json not found");
  console.error(
    "Please place your Firebase service account key in the project root"
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const collectionArg = args.find((arg) => arg.startsWith("--collection="));
const targetCollection = collectionArg ? collectionArg.split("=")[1] : null;
const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split("=")[1]) : 50;

// Known candidate collections (add more if needed)
const CANDIDATE_COLLECTIONS = [
  "pflegefachkraft",
  "krankenpfleger",
  "altenpfleger",
  "kinderkrankenpfleger",
  "gesundheits_und_krankenpfleger",
  "operationstechnischer_assistent",
  "medizinischer_fachangestellter",
  "zahnarzthelfer",
  "physiotherapeut",
  "ergotherapeut",
  "logopäde",
  "rettungssanitäter",
  "notfallsanitäter",
  "hebamme",
  "medizinisch_technischer_assistent",
  "pharmazeutisch_technischer_assistent",
];

console.log("\n🔧 Migration: Remove Duplicate Document Fields\n");
console.log(`Mode: ${isDryRun ? "🔍 DRY RUN (no changes)" : "✏️  WRITE MODE"}`);
console.log(`Batch Size: ${batchSize}`);
if (targetCollection) {
  console.log(`Target: ${targetCollection} only`);
} else {
  console.log(`Target: All candidate collections`);
}
console.log("");

/**
 * Consolidate documents from multiple sources into single documents object
 */
function consolidateDocuments(data) {
  const attachments = data.attachments || {};
  const documents = data.documents || {};
  const dokumente = data.dokumente || {};
  const rootLangCerts = data.languageCertificatesDetailed || [];

  // Build consolidated documents object
  const consolidated = {
    diplomas:
      documents.diplomas || attachments.diplomas || dokumente.diplome || [],
    certificates:
      documents.certificates ||
      attachments.languageCertificates ||
      dokumente.zertifikate ||
      [],
    certificatesDetailed:
      documents.certificatesDetailed ||
      attachments.languageCertificatesDetailed ||
      rootLangCerts ||
      [],
    passport:
      documents.passport || attachments.passport || dokumente.reisepass || [],
    noLanguageCertificate:
      documents.noLanguageCertificate ??
      attachments.noLanguageCertificate ??
      false,
  };

  return consolidated;
}

/**
 * Check if document needs migration
 */
function needsMigration(data) {
  return !!(
    data.attachments ||
    data.dokumente ||
    data.languageCertificatesDetailed
  );
}

/**
 * Migrate a single document
 */
async function migrateDocument(collectionName, docId, data, dryRun = false) {
  if (!needsMigration(data)) {
    return { skipped: true, reason: "no-duplicates" };
  }

  const consolidated = consolidateDocuments(data);

  const changes = {
    documents: consolidated,
  };

  // Fields to delete
  const fieldsToDelete = [];
  if (data.attachments) fieldsToDelete.push("attachments");
  if (data.dokumente) fieldsToDelete.push("dokumente");
  if (data.languageCertificatesDetailed)
    fieldsToDelete.push("languageCertificatesDetailed");

  if (dryRun) {
    return {
      migrated: true,
      dryRun: true,
      changes,
      fieldsToDelete,
    };
  }

  // Perform the update
  const docRef = db.collection(collectionName).doc(docId);
  const updateData = { ...changes };

  // Add delete operations for duplicate fields
  fieldsToDelete.forEach((field) => {
    updateData[field] = admin.firestore.FieldValue.delete();
  });

  await docRef.update(updateData);

  return {
    migrated: true,
    dryRun: false,
    changes,
    fieldsToDelete,
  };
}

/**
 * Process a single collection
 */
async function processCollection(collectionName) {
  console.log(`\n📁 Processing collection: ${collectionName}`);

  try {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`   ⚠️  Collection is empty`);
      return { total: 0, migrated: 0, skipped: 0, errors: 0 };
    }

    const total = snapshot.size;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`   Found ${total} documents`);

    // Process in batches
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, Math.min(i + batchSize, docs.length));

      await Promise.all(
        batch.map(async (doc) => {
          try {
            const result = await migrateDocument(
              collectionName,
              doc.id,
              doc.data(),
              isDryRun
            );

            if (result.skipped) {
              skipped++;
            } else if (result.migrated) {
              migrated++;
              if (isDryRun) {
                console.log(`   🔍 [DRY RUN] Would migrate: ${doc.id}`);
                console.log(
                  `      - Remove: ${result.fieldsToDelete.join(", ")}`
                );
                console.log(`      - Update: documents`);
              } else {
                console.log(`   ✅ Migrated: ${doc.id}`);
              }
            }
          } catch (err) {
            errors++;
            console.error(`   ❌ Error migrating ${doc.id}:`, err.message);
          }
        })
      );

      // Progress indicator
      const processed = Math.min(i + batchSize, docs.length);
      console.log(`   Progress: ${processed}/${total}`);
    }

    console.log(`\n   Summary for ${collectionName}:`);
    console.log(`   - Total: ${total}`);
    console.log(`   - Migrated: ${migrated}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Errors: ${errors}`);

    return { total, migrated, skipped, errors };
  } catch (err) {
    console.error(
      `   ❌ Error processing collection ${collectionName}:`,
      err.message
    );
    return { total: 0, migrated: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  const startTime = Date.now();

  const collections = targetCollection
    ? [targetCollection]
    : CANDIDATE_COLLECTIONS;

  const results = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const collectionName of collections) {
    const result = await processCollection(collectionName);
    results.total += result.total;
    results.migrated += result.migrated;
    results.skipped += result.skipped;
    results.errors += result.errors;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total documents: ${results.total}`);
  console.log(`Migrated: ${results.migrated}`);
  console.log(`Skipped (no duplicates): ${results.skipped}`);
  console.log(`Errors: ${results.errors}`);
  console.log(`Duration: ${duration}s`);
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("\n💡 This was a DRY RUN. No changes were made.");
    console.log("   Run without --dry-run to apply changes.");
  } else {
    console.log("\n✅ Migration completed!");
  }

  console.log("");
}

// Run migration
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  });
