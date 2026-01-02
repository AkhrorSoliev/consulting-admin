/**
 * Migration Script: Create metadata for all existing candidates
 *
 * This script creates candidate_metadata entries for all existing candidates
 * to enable the DataExchange feature without fallback searches.
 *
 * Usage: node scripts/create-candidate-metadata.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const CANDIDATE_COLLECTIONS = [
  "krankenpfleger",
  "altenpfleger",
  "pflegefachkraft",
  "kinderkrankenpfleger",
  "uy-quruvchisi-fachkraft-2026",
];

async function createMetadataForCollection(collectionName) {
  console.log(`\n📂 Processing collection: ${collectionName}`);

  try {
    const snapshot = await db.collection(collectionName).get();
    console.log(`   Found ${snapshot.size} candidates`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const candidateId = doc.id;

      try {
        // Check if metadata already exists
        const metadataRef = db
          .collection("candidate_metadata")
          .doc(candidateId);
        const metadataDoc = await metadataRef.get();

        if (metadataDoc.exists()) {
          skipped++;
          continue;
        }

        // Create metadata
        await metadataRef.set({
          collectionName: collectionName,
          updatedAt: Date.now(),
          createdViaScript: true,
        });

        created++;

        if (created % 10 === 0) {
          console.log(`   Progress: ${created} created, ${skipped} skipped`);
        }
      } catch (err) {
        errors++;
        console.error(`   ❌ Error processing ${candidateId}:`, err.message);
      }
    }

    console.log(
      `   ✅ Complete: ${created} created, ${skipped} skipped, ${errors} errors`
    );

    return { created, skipped, errors };
  } catch (err) {
    console.error(
      `   ❌ Error accessing collection ${collectionName}:`,
      err.message
    );
    return { created: 0, skipped: 0, errors: 1 };
  }
}

async function main() {
  console.log("🚀 Starting candidate metadata creation...\n");
  console.log("Collections to process:", CANDIDATE_COLLECTIONS.join(", "));

  const stats = {
    totalCreated: 0,
    totalSkipped: 0,
    totalErrors: 0,
  };

  for (const collectionName of CANDIDATE_COLLECTIONS) {
    const result = await createMetadataForCollection(collectionName);
    stats.totalCreated += result.created;
    stats.totalSkipped += result.skipped;
    stats.totalErrors += result.errors;
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Final Statistics:");
  console.log("=".repeat(60));
  console.log(`✅ Total created:  ${stats.totalCreated}`);
  console.log(`⏭️  Total skipped:  ${stats.totalSkipped}`);
  console.log(`❌ Total errors:   ${stats.totalErrors}`);
  console.log("=".repeat(60));

  console.log("\n✨ Migration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
