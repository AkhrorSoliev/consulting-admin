const admin = require("firebase-admin");

// Ensure Admin SDK is initialized exactly once, even if modules are imported independently.
function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
}

function getDb() {
  return getAdmin().firestore();
}

module.exports = { getAdmin, getDb };










