const { getAdmin } = require("./admin");

async function verifyFirebaseIdToken(req) {
  const raw = String(req.get("Authorization") || "").trim();
  if (!raw || !raw.toLowerCase().startsWith("bearer ")) {
    const e = new Error("missing-authorization");
    e.code = "missing-authorization";
    e.status = 401;
    throw e;
  }
  const token = raw.slice("bearer ".length).trim();
  if (!token) {
    const e = new Error("missing-token");
    e.code = "missing-token";
    e.status = 401;
    throw e;
  }
  try {
    return await getAdmin().auth().verifyIdToken(token);
  } catch (err) {
    const e = new Error("invalid-token");
    e.code = "invalid-token";
    e.status = 401;
    e.details = String(err?.message || err);
    throw e;
  }
}

function assertAdminLikeClaims(decodedToken) {
  const role = String(decodedToken?.role || decodedToken?.claims?.role || "");
  if (role !== "admin" && role !== "super_admin") {
    const e = new Error("permission-denied");
    e.code = "permission-denied";
    e.status = 403;
    throw e;
  }
  return { role };
}

function assertSuperAdminClaims(decodedToken) {
  const role = String(decodedToken?.role || decodedToken?.claims?.role || "");
  if (role !== "super_admin") {
    const e = new Error("permission-denied");
    e.code = "permission-denied";
    e.status = 403;
    throw e;
  }
  return { role };
}

module.exports = {
  verifyFirebaseIdToken,
  assertAdminLikeClaims,
  assertSuperAdminClaims,
};
