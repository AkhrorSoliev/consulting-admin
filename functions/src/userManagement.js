const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAdmin, getDb } = require("./utils/admin");
const { requireSuperAdmin } = require("./utils/auth");

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://admin.consultinguz.de",
];

const ASSIGNABLE_ROLES = new Set(["admin", "limited_admin", "user"]);

function asNonEmptyString(value, fieldName) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} must be a string.`);
  }
  const v = value.trim();
  if (!v) {
    throw new HttpsError("invalid-argument", `${fieldName} is required.`);
  }
  return v;
}

function asOptionalString(value, fieldName) {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} must be a string.`);
  }
  const v = value.trim();
  return v ? v : null;
}

function assertRole(role) {
  const r = asNonEmptyString(role, "role").toLowerCase();
  if (!ASSIGNABLE_ROLES.has(r)) {
    throw new HttpsError(
      "invalid-argument",
      "role must be one of: admin, limited_admin, user."
    );
  }
  return r;
}

function assertEmail(email) {
  // Minimal email validation: avoid heavy deps while preventing obvious garbage.
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    throw new HttpsError("invalid-argument", "email must be a valid email address.");
  }
  return email.toLowerCase();
}

function assertPassword(password) {
  // Firebase Auth requires >= 6 chars for email/password.
  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "password must be at least 6 characters.");
  }
  return password;
}

async function resolveUid({ uid, email }) {
  const admin = getAdmin();
  if (uid) return uid;
  const userRecord = await admin.auth().getUserByEmail(email);
  return userRecord.uid;
}

exports.createUser = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const email = assertEmail(asNonEmptyString(data.email, "email"));
  const password = assertPassword(asNonEmptyString(data.password, "password"));

  const admin = getAdmin();
  const db = getDb();

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      disabled: false,
    });
  } catch (err) {
    // Common cases: email already exists, invalid email, weak password.
    throw new HttpsError("already-exists", err?.message || "Failed to create user.");
  }

  await db.collection("users").doc(userRecord.uid).set({
    email,
    role: "user",
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, uid: userRecord.uid, email: userRecord.email };
});

exports.disableUser = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const uid = asOptionalString(data.uid, "uid");
  const emailRaw = asOptionalString(data.email, "email");
  const email = emailRaw ? assertEmail(emailRaw) : null;

  if (!uid && !email) {
    throw new HttpsError("invalid-argument", "Provide uid or email.");
  }

  const admin = getAdmin();
  const db = getDb();
  const targetUid = await resolveUid({ uid, email });

  await admin.auth().updateUser(targetUid, { disabled: true });
  await admin.auth().revokeRefreshTokens(targetUid);

  await db.collection("users").doc(targetUid).set(
    {
      status: "disabled",
    },
    { merge: true }
  );

  return { ok: true, uid: targetUid };
});

exports.enableUser = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const uid = asOptionalString(data.uid, "uid");
  const emailRaw = asOptionalString(data.email, "email");
  const email = emailRaw ? assertEmail(emailRaw) : null;

  if (!uid && !email) {
    throw new HttpsError("invalid-argument", "Provide uid or email.");
  }

  const admin = getAdmin();
  const db = getDb();
  const targetUid = await resolveUid({ uid, email });

  await admin.auth().updateUser(targetUid, { disabled: false });

  await db.collection("users").doc(targetUid).set(
    {
      status: "active",
    },
    { merge: true }
  );

  return { ok: true, uid: targetUid };
});

exports.deleteUser = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const uid = asOptionalString(data.uid, "uid");
  const emailRaw = asOptionalString(data.email, "email");
  const email = emailRaw ? assertEmail(emailRaw) : null;

  if (!uid && !email) {
    throw new HttpsError("invalid-argument", "Provide uid or email.");
  }

  const admin = getAdmin();
  const db = getDb();
  const targetUid = await resolveUid({ uid, email });

  // Best-effort delete from both systems; if either fails we surface the error.
  await admin.auth().deleteUser(targetUid);
  await db.collection("users").doc(targetUid).delete();

  return { ok: true, uid: targetUid };
});

exports.listUsers = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const pageSizeRaw = data.pageSize;
  const pageToken = asOptionalString(data.pageToken, "pageToken");

  let pageSize = 50;
  if (pageSizeRaw != null) {
    if (typeof pageSizeRaw !== "number" || !Number.isFinite(pageSizeRaw)) {
      throw new HttpsError("invalid-argument", "pageSize must be a number.");
    }
    pageSize = Math.max(1, Math.min(100, Math.floor(pageSizeRaw)));
  }

  const admin = getAdmin();
  const db = getDb();
  const result = await admin.auth().listUsers(pageSize, pageToken || undefined);

  const userDocs = await db.getAll(
    ...result.users.map((u) => db.collection("users").doc(u.uid))
  );
  const roleByUid = {};
  userDocs.forEach((docSnap, idx) => {
    if (docSnap?.exists) {
      const docRole = docSnap.get("role");
      if (typeof docRole === "string") {
        roleByUid[result.users[idx].uid] = docRole;
      }
    }
  });

  return {
    ok: true,
    users: result.users.map((u) => ({
      uid: u.uid,
      email: u.email || null,
      disabled: !!u.disabled,
      role:
        typeof u.customClaims?.role === "string"
          ? u.customClaims.role
          : roleByUid[u.uid] || "user",
      createdAt: u.metadata?.creationTime || null,
      createdAtTs: u.metadata?.creationTime
        ? Date.parse(u.metadata.creationTime)
        : null,
    })),
    nextPageToken: null, // front-end shows all in one fetch; ignore pagination
  };
});

exports.setUserPassword = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const uid = asOptionalString(data.uid, "uid");
  const emailRaw = asOptionalString(data.email, "email");
  const email = emailRaw ? assertEmail(emailRaw) : null;
  const password = assertPassword(asNonEmptyString(data.password, "password"));

  if (!uid && !email) {
    throw new HttpsError("invalid-argument", "Provide uid or email.");
  }

  const admin = getAdmin();
  const targetUid = await resolveUid({ uid, email });

  await admin.auth().updateUser(targetUid, { password });
  // Force re-login on next request for security (old sessions will expire).
  await admin.auth().revokeRefreshTokens(targetUid);

  return { ok: true, uid: targetUid };
});

exports.setUserRole = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  requireSuperAdmin(request);

  const data = request?.data || {};
  const uid = asOptionalString(data.uid, "uid");
  const emailRaw = asOptionalString(data.email, "email");
  const email = emailRaw ? assertEmail(emailRaw) : null;
  const role = assertRole(data.role);

  if (!uid && !email) {
    throw new HttpsError("invalid-argument", "Provide uid or email.");
  }

  const admin = getAdmin();
  const db = getDb();
  const targetUid = await resolveUid({ uid, email });
  const userRecord = await admin.auth().getUser(targetUid);
  const currentClaims = userRecord.customClaims || {};
  const nextClaims = { ...currentClaims, role };

  await admin.auth().setCustomUserClaims(targetUid, nextClaims);
  await admin.auth().revokeRefreshTokens(targetUid);

  await db.collection("users").doc(targetUid).set({ role }, { merge: true });

  return { ok: true, uid: targetUid, role };
});


