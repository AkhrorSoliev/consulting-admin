const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp(); // Admin SDK bypasses security rules
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

const REMOTE_API_BASE = "https://json-api.uz/api/project/consultinguz";
const REMOTE_ALL_USERS = `${REMOTE_API_BASE}/all_users`;
const EMAIL_AND_PASSID_COLLECTION = "email_and_passId";

exports.health = onRequest((req, res) => {
  logger.info("Health check called");
  res.json({
    ok: true,
    service: "consulting-admin-functions",
    time: new Date().toISOString(),
  });
});

// ---- Helper ----
function setCors(req, res) {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://admin.consultinguz.de",
  ]);
  const origin = req.get("Origin") || "";
  if (allowedOrigins.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Range");
  res.set(
    "Access-Control-Expose-Headers",
    "Content-Type, Content-Length, Content-Range, Accept-Ranges"
  );
}

function isAllowedPdfProxyUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return false;
  let u;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  const host = String(u.hostname || "").toLowerCase();
  if (host !== "json-api.uz") return false;
  const path = String(u.pathname || "");
  const lower = path.toLowerCase();

  // Allow only known file storage paths (avoid becoming an open proxy).
  // Real file URLs we see in this project include:
  // - /mt/... or /mnt/... (direct storage)
  // - /uploads/... (legacy storage)
  // - /api/project/consultinguz/... (project-scoped file URLs)
  //
  // IMPORTANT: We must NOT allow proxying arbitrary json-api.uz API endpoints
  // like /api/project/consultinguz/all_users, /all_Emails, etc.
  if (/^\/(mt|mnt)\//i.test(path)) return true;
  if (/^\/uploads\//i.test(path)) return true;

  if (/^\/api\/project\/consultinguz\//i.test(path)) {
    const blockedPrefixes = [
      "/api/project/consultinguz/upload/delete",
      "/api/project/consultinguz/upload",
      "/api/project/consultinguz/all_users",
      "/api/project/consultinguz/deleted_users",
      "/api/project/consultinguz/archived_users",
      "/api/project/consultinguz/all_emails",
      "/api/project/consultinguz/all_passports",
    ];
    if (blockedPrefixes.some((p) => lower.startsWith(p))) return false;

    // Accept only paths that look like a stored file reference.
    const looksFileLike =
      lower.includes("/mt/") ||
      lower.includes("/mnt/") ||
      lower.includes("/uploads/") ||
      lower.includes("/file-");
    return looksFileLike;
  }

  return false;
}

// GET /proxyPdf?url=https://json-api.uz/mnt/file-....pdf
// Purpose: bypass CORS so the frontend can render external PDFs (pdf.js) as images.
exports.proxyPdf = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const url = String(req.query?.url || "").trim();
    if (!isAllowedPdfProxyUrl(url)) {
      return res.status(400).json({ ok: false, error: "invalid-url" });
    }

    const upstream = await fetch(url, { method: "GET" });
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ ok: false, error: "upstream-failed", status: upstream.status });
    }

    const ct =
      upstream.headers.get("content-type") || "application/pdf; charset=binary";
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=300"); // 5 min

    const ab = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(ab));
  } catch (e) {
    logger.error("proxyPdf error", e);
    setCors(req, res);
    return res
      .status(500)
      .json({ ok: false, error: "internal", details: String(e?.message || e) });
  }
});

function findLead(meta, leadParam) {
  const list = Array.isArray(meta?.leadLinks) ? meta.leadLinks : [];
  return list.find((l) => {
    const n = String(l?.name || "").trim();
    const id = String(l?.id || l?.key || "").trim();
    return n === leadParam || id === leadParam;
  });
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function upsertRemoteAllUsers({ firebaseId, major, payload }) {
  const safeId = String(firebaseId || "").trim();
  const safeMajor = String(major || "").trim() || null;
  if (!safeId) throw new Error("upsertRemoteAllUsers: firebaseId missing");
  const body = {
    firebaseId: safeId,
    major: safeMajor,
    ...(payload && typeof payload === "object" ? payload : {}),
    syncedAt: Date.now(),
  };

  // Try update-by-id if record exists (json-api.uz pattern).
  try {
    const check = await fetch(
      `${REMOTE_ALL_USERS}?firebaseId=${encodeURIComponent(safeId)}`,
      { method: "GET" }
    );
    if (check.ok) {
      const json = await safeJson(check);
      const list = Array.isArray(json?.data) ? json.data : [];
      const match =
        list.find((item) => String(item?.firebaseId || "").trim() === safeId) ||
        null;
      if (match && typeof match === "object") {
        const id =
          match.id ??
          match._id ??
          match.uuid ??
          match.key ??
          match.docId ??
          null;
        if (id !== null && id !== undefined && String(id).trim() !== "") {
          const url = `${REMOTE_ALL_USERS}/${encodeURIComponent(String(id))}`;
          const put = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (put.ok) return safeJson(put);
          const patch = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (patch.ok) return safeJson(patch);
        }
      }
    }
  } catch (e) {
    logger.warn("upsertRemoteAllUsers: check/update failed", e);
  }

  const created = await fetch(REMOTE_ALL_USERS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!created.ok) {
    throw new Error(`remote all_users POST failed: ${created.status}`);
  }
  return safeJson(created);
}

function normalizeEmailForRegistry(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePassportIdForRegistry(passportId) {
  const raw = String(passportId || "").trim();
  if (!raw) return "";
  return raw.toUpperCase().replace(/\s+/g, " ").trim();
}

async function checkEmailRegistry(email) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { exists: false };
  const snap = await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .doc(safeEmail)
    .get();
  if (!snap.exists) return { exists: false };
  return { exists: true, data: { id: snap.id, ...snap.data() } };
}

async function checkPassportRegistry(passportId) {
  const safePassport = normalizePassportIdForRegistry(passportId);
  if (!safePassport) return { exists: false };
  const q = await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .where("passportId", "==", safePassport)
    .limit(1)
    .get();
  if (q.empty) return { exists: false };
  const d = q.docs[0];
  return { exists: true, data: { id: d.id, ...d.data() } };
}

async function upsertEmailPassportRegistry({ email, passportId, major }) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return;
  const safePassport = normalizePassportIdForRegistry(passportId);
  const payload = {
    email: safeEmail,
    major: String(major || "").trim() || null,
    updatedAt: Date.now(),
    ...(safePassport ? { passportId: safePassport } : {}),
  };
  await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .doc(safeEmail)
    .set(payload, { merge: true });
}

// ---- Firestore trigger: keep `email_and_passId` in sync for ANY candidate save ----
// This covers:
// - public Create flow (submitCandidate)
// - admin UI direct Firestore writes (create/update)
// We intentionally ignore known non-candidate collections.
const IGNORED_COLLECTIONS_FOR_REGISTRY = new Set([
  EMAIL_AND_PASSID_COLLECTION,
  "meta",
  "stats",
  "deleted_users",
  // Remote mirror collections (not candidates)
  "all_users",
  "archived_users",
  "deleted_users_remote",
]);

function extractEmailFromAnyCandidateDoc(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const email =
    p?.persoenlicheDaten?.email ??
    p?.personalInfo?.email ??
    p?.personalData?.email ??
    p?.email ??
    "";
  return String(email || "").trim();
}

function extractPassportIdFromAnyCandidateDoc(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const passport =
    p?.passportId ??
    p?.passportID ??
    p?.passportNumber ??
    p?.reisepassNummer ??
    p?.persoenlicheDaten?.reisepassNummer ??
    p?.persoenlicheDaten?.passportId ??
    p?.persoenlicheDaten?.passportID ??
    p?.persoenlicheDaten?.passportNumber ??
    p?.personalInfo?.passportNumber ??
    p?.personalInfo?.reisepassNummer ??
    p?.personalData?.passportNumber ??
    p?.personalData?.reisepassNummer ??
    "";
  return String(passport || "").trim();
}

exports.syncEmailAndPassIdRegistry = onDocumentWritten(
  "{collectionId}/{docId}",
  async (event) => {
    try {
      const collectionId = String(event?.params?.collectionId || "").trim();
      const docId = String(event?.params?.docId || "").trim();
      if (!collectionId || !docId) return;
      if (IGNORED_COLLECTIONS_FOR_REGISTRY.has(collectionId)) return;

      const afterExists = Boolean(event?.data?.after?.exists);
      if (!afterExists) return; // ignore deletes

      const afterData = event.data.after.data() || {};
      const emailRaw = extractEmailFromAnyCandidateDoc(afterData);
      const passportRaw = extractPassportIdFromAnyCandidateDoc(afterData);

      const safeEmail = normalizeEmailForRegistry(emailRaw);
      if (!safeEmail) return;
      const safePassport = normalizePassportIdForRegistry(passportRaw);

      const registryRef = db
        .collection(EMAIL_AND_PASSID_COLLECTION)
        .doc(safeEmail);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(registryRef);
        const base = {
          email: safeEmail,
          major: String(collectionId || "").trim() || null,
          sourceMajor: String(collectionId || "").trim() || null,
          sourceDocId: String(docId || "").trim() || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...(safePassport ? { passportId: safePassport } : {}),
        };
        if (!snap.exists) {
          tx.set(registryRef, {
            ...base,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return;
        }
        // Merge updates; do not remove existing passportId if the new doc doesn't have it.
        tx.set(registryRef, base, { merge: true });
      });
    } catch (e) {
      logger.error("syncEmailAndPassIdRegistry failed", e);
      // Never block candidate writes; this is a background sync.
    }
  }
);

// POST /submitCandidate
// Body: { major: string, payload: object, recaptchaToken?: string }
exports.submitCandidate = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const { major, payload } = req.body || {};
    const safeMajor = String(major || "").trim();
    if (!safeMajor || !payload) {
      return res
        .status(400)
        .json({ ok: false, error: "missing-major-or-payload" });
    }

    // 1) Meta topish (doc id yoki collectionName bo‘yicha)
    let metaSnap = await db.collection("meta").doc(safeMajor).get();
    if (!metaSnap.exists) {
      const q = await db
        .collection("meta")
        .where("collectionName", "==", safeMajor)
        .limit(1)
        .get();
      if (!q.empty) metaSnap = q.docs[0];
    }
    if (!metaSnap.exists) {
      return res.status(404).json({ ok: false, error: "meta-not-found" });
    }
    const meta = metaSnap.data();

    // 2) Link aktyorligini tekshirish
    if (meta.linkActive === false) {
      return res.status(403).json({ ok: false, error: "link-inactive" });
    }

    // 3) Lead tekshiruvi (agar lead parametr bor bo‘lsa)
    const leadParam = String(payload?.lead || "").trim();
    if (leadParam) {
      const leadsGloballyActive = meta.leadLinksActive !== false;
      const match = findLead(meta, leadParam);
      const leadActive = match ? match?.active !== false : false;
      if (!leadsGloballyActive) {
        return res
          .status(403)
          .json({ ok: false, error: "lead-links-inactive" });
      }
      if (!match) {
        return res.status(403).json({ ok: false, error: "lead-not-found" });
      }
      if (!leadActive) {
        return res.status(403).json({ ok: false, error: "lead-inactive" });
      }
    }

    // 4) Kandidatni yozish (Admin SDK — rules cheklanmaydi)
    const targetCol =
      meta.collectionName || meta.slug || meta.name || safeMajor || "unknown";

    // 4.1) Duplicate checks against Firestore registry (server-side enforcement)
    const emailFromPayload =
      payload?.persoenlicheDaten?.email ??
      payload?.personalInfo?.email ??
      payload?.email ??
      "";
    const passportFromPayload =
      payload?.passportId ??
      payload?.passportID ??
      payload?.passportNumber ??
      payload?.reisepassNummer ??
      payload?.persoenlicheDaten?.reisepassNummer ??
      payload?.personalInfo?.passportNumber ??
      "";

    const safeEmail = normalizeEmailForRegistry(emailFromPayload);
    const safePassport = normalizePassportIdForRegistry(passportFromPayload);

    // Email must be present for the registry (and to reliably prevent duplicates).
    if (!safeEmail) {
      return res.status(400).json({ ok: false, error: "missing-email" });
    }

    // 4.2) Write candidate + registry atomically to guarantee `email_and_passId` is saved.
    // This also protects against race conditions between "duplicate check" and "write".
    const candidateRef = db.collection(targetCol).doc();
    const registryRef = db
      .collection(EMAIL_AND_PASSID_COLLECTION)
      .doc(safeEmail);
    try {
      await db.runTransaction(async (tx) => {
        // (a) Email duplicate check
        const emailSnap = await tx.get(registryRef);
        if (emailSnap.exists) {
          const d = emailSnap.data() || {};
          const err = new Error("email-exists");
          err.status = 409;
          err.code = "email-exists";
          err.existing = {
            email: d.email || safeEmail,
            major: d.major || null,
          };
          throw err;
        }

        // (b) Passport duplicate check (best-effort if provided)
        if (safePassport) {
          const q = db
            .collection(EMAIL_AND_PASSID_COLLECTION)
            .where("passportId", "==", safePassport)
            .limit(1);
          const qSnap = await tx.get(q);
          if (!qSnap.empty) {
            const d = qSnap.docs[0];
            const data = d.data() || {};
            const err = new Error("passport-exists");
            err.status = 409;
            err.code = "passport-exists";
            err.existing = {
              email: data.email || d.id || null,
              major: data.major || null,
              passportId: data.passportId || safePassport,
            };
            throw err;
          }
        }

        // (c) Create candidate doc
        tx.set(candidateRef, {
          ...payload,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // (d) Create registry entry (same email => deterministic doc id)
        tx.set(registryRef, {
          email: safeEmail,
          major: String(targetCol || "").trim() || null,
          ...(safePassport ? { passportId: safePassport } : {}),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (e) {
      const status = Number(e?.status) || 0;
      const code = String(e?.code || "");
      if (status === 409 && code === "email-exists") {
        return res.status(409).json({
          ok: false,
          error: "email-exists",
          existing: e.existing || { email: safeEmail, major: null },
        });
      }
      if (status === 409 && code === "passport-exists") {
        return res.status(409).json({
          ok: false,
          error: "passport-exists",
          existing: e.existing || {
            email: null,
            major: null,
            passportId: safePassport,
          },
        });
      }
      throw e;
    }

    // 5) Sync to remote user registry (best-effort; should not fail a successful submit)
    try {
      const snap = await candidateRef.get();
      const data = snap.exists ? snap.data() : payload;
      await upsertRemoteAllUsers({
        firebaseId: candidateRef.id,
        major: targetCol,
        payload: data,
      });
    } catch (e) {
      logger.error("remote all_users sync failed", e);
      // do not block submit
    }

    return res.json({ ok: true, id: candidateRef.id });
  } catch (err) {
    logger.error("submitCandidate error", err);
    setCors(req, res);
    return res
      .status(500)
      .json({ ok: false, error: "internal", details: err.message });
  }
});

// ---- Callable (super_admin only) user management ----
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
  const email = normalizeEmail(request?.data?.email);
  const password = String(request?.data?.password || "");
  if (!email) throw new HttpsError("invalid-argument", "email is required");
  if (password.trim().length < 6)
    throw new HttpsError(
      "invalid-argument",
      "password must be at least 6 chars"
    );

  const user = await admin
    .auth()
    .createUser({ email, password, disabled: false });
  // Default role for newly created users.
  await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
  return { uid: user.uid, email: user.email || email };
});

exports.deleteUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const uid = String(request?.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  await admin.auth().deleteUser(uid);
  return { ok: true, uid };
});

exports.disableUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const uid = String(request?.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  await admin.auth().updateUser(uid, { disabled: true });
  return { ok: true, uid, disabled: true };
});

exports.enableUser = onCall(async (request) => {
  assertSuperAdmin(request);
  const uid = String(request?.data?.uid || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  await admin.auth().updateUser(uid, { disabled: false });
  return { ok: true, uid, disabled: false };
});

exports.setUserPassword = onCall(async (request) => {
  assertSuperAdmin(request);
  const uid = String(request?.data?.uid || "").trim();
  const password = String(request?.data?.password || "");
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  if (password.trim().length < 6)
    throw new HttpsError(
      "invalid-argument",
      "password must be at least 6 chars"
    );
  await admin.auth().updateUser(uid, { password });
  return { ok: true, uid };
});

exports.setUserRole = onCall(async (request) => {
  assertSuperAdmin(request);
  const uid = String(request?.data?.uid || "").trim();
  const role = String(request?.data?.role || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "uid is required");
  const allowed = new Set(["user", "admin", "limited_admin"]);
  if (!allowed.has(role)) {
    throw new HttpsError(
      "invalid-argument",
      "role must be one of: user, admin, limited_admin"
    );
  }
  await admin.auth().setCustomUserClaims(uid, { role });
  return { ok: true, uid, role };
});
