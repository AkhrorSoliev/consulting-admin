const { HttpsError } = require("firebase-functions/v2/https");

/**
 * Supports Gen2 callable request object.
 * (request.auth.uid, request.auth.token)
 */
function requireAuth(request) {
  const auth = request?.auth;
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return { uid: auth.uid, token: auth.token || {} };
}

function requireSuperAdmin(request) {
  const { uid, token } = requireAuth(request);
  const role = token?.role || null;
  if (role !== "super_admin") {
    throw new HttpsError("permission-denied", "Super admin privileges required.");
  }
  return { uid, role };
}

module.exports = { requireAuth, requireSuperAdmin };


