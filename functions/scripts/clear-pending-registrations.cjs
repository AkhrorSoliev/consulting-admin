const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function clearPendingRegistrations() {
  try {
    console.log("Fetching all pending registrations...");
    const snapshot = await db.collection("pending_registrations").get();

    if (snapshot.empty) {
      console.log("No pending registrations found.");
      return;
    }

    console.log(`Found ${snapshot.size} pending registrations. Deleting...`);

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      console.log(`Deleting: ${doc.id} - ${JSON.stringify(doc.data())}`);
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("All pending registrations deleted successfully.");
  } catch (error) {
    console.error("Error clearing pending registrations:", error);
  } finally {
    process.exit(0);
  }
}

clearPendingRegistrations();
