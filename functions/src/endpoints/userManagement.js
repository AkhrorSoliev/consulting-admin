const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAdmin } = require("../utils/admin");

function assertSuperAdmin(request) {
  if (!request?.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  const role = String(request.auth?.token?.role || "");
  if (role !== "super_admin") {
    throw new HttpsError("permission-denied", "Super admin only.");
  }
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

exports.listUsers = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const pageSizeRaw = Number(request?.data?.pageSize);
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.max(1, Math.min(100, Math.floor(pageSizeRaw)))
    : 100;

  const res = await admin.auth().listUsers(pageSize);
  const users = (res?.users || []).map((u) => {
    const role = String(u?.customClaims?.role || "user");
    const createdAt = String(u?.metadata?.creationTime || "");
    const createdAtTs = Date.parse(createdAt);
    return {
      uid: u.uid,
      email: u.email || "",
      disabled: Boolean(u.disabled),
      role,
      createdAt,
      createdAtTs: Number.isFinite(createdAtTs) ? createdAtTs : null,
    };
  });
  return { users };
});

exports.createUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const email = normalizeEmail(request?.data?.email);
  const password = String(request?.data?.password || "");
  if (!email) throw new HttpsError("invalid-argument", "email is required");
  if (password.trim().length < 6)
    throw new HttpsError(
      "invalid-argument",
      "password must be at least 6 chars",
    );

  const user = await admin
    .auth()
    .createUser({ email, password, disabled: false });
  await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
  return { uid: user.uid, email: user.email || email };
});

exports.deleteUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const uid = String(request?.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  await admin.auth().deleteUser(uid);
  return { ok: true, uid };
});

exports.disableUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const uid = String(request?.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  await admin.auth().updateUser(uid, { disabled: true });
  return { ok: true, uid, disabled: true };
});

exports.enableUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const uid = String(request?.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  await admin.auth().updateUser(uid, { disabled: false });
  return { ok: true, uid, disabled: false };
});

exports.setUserPassword = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const uid = String(request?.data?.uid || "").trim();
  const password = String(request?.data?.password || "");
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  if (password.trim().length < 6)
    throw new HttpsError(
      "invalid-argument",
      "password must be at least 6 chars",
    );
  await admin.auth().updateUser(uid, { password });
  return { ok: true, uid };
});

exports.setUserRole = onCall(async (request) => {
  assertSuperAdmin(request);
  const admin = getAdmin();
  const uid = String(request?.data?.uid || "").trim();
  const role = String(request?.data?.role || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  const allowed = new Set(["user", "admin", "limited_admin"]);
  if (!allowed.has(role)) {
    throw new HttpsError(
      "invalid-argument",
      "role must be one of: user, admin, limited_admin",
    );
  }
  await admin.auth().setCustomUserClaims(uid, { role });
  return { ok: true, uid, role };
});
