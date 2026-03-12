const admin = require("firebase-admin");

// Admin SDK is initialized in index.js — these helpers provide access
// to the shared admin and db instances from extracted modules.
function getAdmin() {
  return admin;
}

function getDb() {
  return admin.firestore();
}

module.exports = { getAdmin, getDb };
