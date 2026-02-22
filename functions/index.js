const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {
  createOneTimeChatInviteLink,
  getTelegramChatsFromUpdates,
  removeChatMember,
  getChatMembers,
  removeUserFromAllGroups,
} = require("./src/services/telegram");
const { Telegraf } = require("telegraf");
// Bot initialization removed - registration functionality disabled

admin.initializeApp(); // Admin SDK bypasses security rules
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10, cpu: 0.5 });

// ---- Secrets ----
// Store via: firebase functions:secrets:set TELEGRAM_BOT_TOKEN
// Never hardcode bot tokens in code or frontend.
const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
// Store via: firebase functions:secrets:set RECAPTCHA_SECRET_KEY
// Used to protect public endpoints (Create form) from abuse.
const RECAPTCHA_SECRET_KEY = defineSecret("RECAPTCHA_SECRET_KEY");
// Store via: firebase functions:secrets:set OPENAI_API_KEY
// Used for AI text correction features.
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const REMOTE_API_BASE = "https://json-api.uz/api/project/consultinguz";
const REMOTE_ALL_USERS = `${REMOTE_API_BASE}/all_users`;
const BREVO_EMAIL_URL =
  "https://consultinguz-email-system-production.up.railway.app";
const EMAIL_AND_PASSID_COLLECTION = "email_and_passId";

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  const upstreamSignal = options?.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      ac.abort();
    } else {
      try {
        upstreamSignal.addEventListener("abort", () => ac.abort(), {
          once: true,
        });
      } catch {
        // ignore
      }
    }
  }
  try {
    return await fetch(url, { ...options, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

exports.health = onRequest((req, res) => {
  logger.info("Health check called");
  res.json({
    ok: true,
    service: "consulting-admin-functions",
    time: new Date().toISOString(),
  });
});

// Download proxy to bypass CORS and force download with correct filename
const { downloadProxy } = require("./src/downloadProxy");
exports.downloadProxy = downloadProxy;

// ---- Helper ----
function setCors(req, res) {
  const origin = req.get("Origin") || "";
  // Allow production origin + any localhost/127.0.0.1 port for local development.
  // This prevents CORS failures when Vite picks a different port (5174, etc.).
  const isProd = origin === "https://admin.consultinguz.de";
  const isLocalhost =
    /^http:\/\/localhost:\d+$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin);
  if (isProd || isLocalhost) res.set("Access-Control-Allow-Origin", origin);

  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  // Authorization header is required for protected endpoints like /generateInvite.
  res.set("Access-Control-Allow-Headers", "Content-Type, Range, Authorization");
  res.set(
    "Access-Control-Expose-Headers",
    "Content-Type, Content-Length, Content-Range, Accept-Ranges",
  );
}

async function verifyRecaptchaV2({ token, secret }) {
  const t = String(token || "").trim();
  if (!t) return { ok: false, reason: "missing-token" };
  const s = String(secret || "").trim();
  if (!s) return { ok: false, reason: "missing-secret" };

  const params = new URLSearchParams();
  params.set("secret", s);
  params.set("response", t);
  // NOTE: We intentionally do NOT send the optional `remoteip` parameter.
  // In serverless/proxied environments (CDN, Firebase, etc.) it can be unreliable
  // and cause false negatives (e.g. invalid/unknown/mismatched IP).

  const resp = await fetchWithTimeout(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
    8000,
  );
  if (!resp.ok) return { ok: false, reason: "upstream-failed" };
  const json = await resp.json().catch(() => ({}));
  if (!json?.success) return { ok: false, reason: "invalid", details: json };
  return { ok: true, details: json };
}

function base64UrlEncode(input) {
  const b = Buffer.isBuffer(input)
    ? input
    : Buffer.from(String(input || ""), "utf8");
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecodeToString(b64url) {
  const s = String(b64url || "").trim();
  if (!s) return "";
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function safeTimingEqual(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

function signCheckRegistrySession({ secret, ttlMs = 10 * 60 * 1000 } = {}) {
  const s = String(secret || "").trim();
  if (!s) return "";
  const now = Date.now();
  const payload = {
    v: 1,
    iat: now,
    exp: now + Math.max(30_000, Number(ttlMs) || 0),
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = base64UrlEncode(
    crypto.createHmac("sha256", s).update(body).digest(),
  );
  return `${body}.${sig}`;
}

function verifyCheckRegistrySession({ token, secret }) {
  const t = String(token || "").trim();
  const s = String(secret || "").trim();
  if (!t || !s) return { ok: false, reason: "missing" };
  const parts = t.split(".");
  if (parts.length !== 2) return { ok: false, reason: "invalid-format" };
  const [body, sig] = parts;
  if (!body || !sig) return { ok: false, reason: "invalid-format" };
  const expected = base64UrlEncode(
    crypto.createHmac("sha256", s).update(body).digest(),
  );
  if (!safeTimingEqual(sig, expected)) return { ok: false, reason: "bad-sig" };
  const jsonText = base64UrlDecodeToString(body);
  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch {
    return { ok: false, reason: "bad-json" };
  }
  const exp = Number(payload?.exp || 0);
  if (!exp || Date.now() > exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

// Best-effort in-memory rate limiting (per instance).
const CHECK_REGISTRY_RATE_WINDOW_MS = 60_000;
const CHECK_REGISTRY_RATE_MAX = 30;
const checkRegistryRateBuckets = new Map();

function getClientIp(req) {
  // Firebase Functions provides req.ip; keep a fallback for safety.
  const raw = String(req?.ip || "").trim();
  if (raw) return raw;
  const xf = String(req?.get?.("x-forwarded-for") || "").trim();
  if (!xf) return "unknown";
  return xf.split(",")[0].trim() || "unknown";
}

function enforceCheckRegistryRateLimit(req, res) {
  const key = getClientIp(req);
  const now = Date.now();
  const cur = checkRegistryRateBuckets.get(key);
  if (!cur || now - cur.start > CHECK_REGISTRY_RATE_WINDOW_MS) {
    checkRegistryRateBuckets.set(key, { start: now, count: 1 });
    return { ok: true };
  }
  if (cur.count >= CHECK_REGISTRY_RATE_MAX) {
    const retryMs = CHECK_REGISTRY_RATE_WINDOW_MS - (now - cur.start);
    const retrySec = Math.max(1, Math.ceil(retryMs / 1000));
    res.set("Retry-After", String(retrySec));
    return { ok: false, retryAfterSec: retrySec };
  }
  cur.count += 1;
  return { ok: true };
}

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
    return await admin.auth().verifyIdToken(token);
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
  // The project uses custom claims { role } on Firebase Auth user.
  // Allow admin and super_admin to generate invites.
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

  // Allow Firebase Storage URLs (for passport/document PDFs)
  if (
    host === "firebasestorage.googleapis.com" ||
    host.endsWith(".firebasestorage.app")
  ) {
    return true;
  }

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

// POST /checkRegistry
// Body: { email?: string, passportId?: string, telegramId?: string }
// Returns: { ok: true, email?: { exists: boolean, major?: string|null }, passport?: { exists: boolean, major?: string|null }, telegram?: { exists: boolean, major?: string|null } }
//
// Security:
// - CORS allowlist (same as other public endpoints)
// - Rate limiting (best-effort per instance) - main protection for this read-only endpoint
// - Returns minimal data (no PII, only optional major)
// Note: No reCAPTCHA here for speed - main abuse protection is rate limit + submit has reCAPTCHA
exports.checkRegistry = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    res.set("Cache-Control", "no-store");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const rl = enforceCheckRegistryRateLimit(req, res);
    if (!rl.ok) {
      return res.status(429).json({ ok: false, error: "rate-limited" });
    }

    const emailRaw = String(req.body?.email || "").trim();
    const passportRaw = String(req.body?.passportId || "").trim();
    const telegramIdRaw = String(req.body?.telegramId || "").trim();
    if (!emailRaw && !passportRaw && !telegramIdRaw) {
      return res
        .status(400)
        .json({ ok: false, error: "missing-email-passportId-or-telegramId" });
    }

    const out = { ok: true };

    if (emailRaw) {
      const safeEmail = normalizeEmailForRegistry(emailRaw);
      const r = await checkEmailRegistry(safeEmail);
      out.email = {
        exists: Boolean(r.exists),
        ...(r.exists ? { major: String(r?.data?.major || null) || null } : {}),
      };
    }

    if (passportRaw) {
      const safePassport = normalizePassportIdForRegistry(passportRaw);
      const r = await checkPassportRegistry(safePassport);
      out.passport = {
        exists: Boolean(r.exists),
        ...(r.exists ? { major: String(r?.data?.major || null) || null } : {}),
      };
    }

    if (telegramIdRaw) {
      const safeTelegramId = telegramIdRaw;
      const r = await checkTelegramIdRegistry(safeTelegramId);
      out.telegram = {
        exists: Boolean(r.exists),
        ...(r.exists ? { major: String(r?.data?.major || null) || null } : {}),
      };
    }

    return res.json(out);
  } catch (e) {
    logger.error("checkRegistry error", e);
    setCors(req, res);
    return res
      .status(500)
      .json({ ok: false, error: "internal", details: String(e?.message || e) });
  }
});

// POST /generateInvite
// Body: { groupId: string }
// Returns: { ok: true, invite_link: string }
//
// Security:
// - Requires Firebase Auth ID token (Authorization: Bearer <token>)
// - Requires role=admin or role=super_admin
// - Frontend never sees chat_id or bot token
exports.generateInvite = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      // Auth (admin-only)
      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const groupId = String(req.body?.groupId || "").trim();
      if (!groupId) {
        return res.status(400).json({ ok: false, error: "missing-groupId" });
      }

      const snap = await db.collection("telegram_groups").doc(groupId).get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "group-not-found" });
      }
      const data = snap.data() || {};
      if (data.active === false) {
        return res.status(403).json({ ok: false, error: "group-inactive" });
      }
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "group-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      // No time limit; only 1 join.
      const { invite_link } = await createOneTimeChatInviteLink({
        botToken,
        chatId,
        expireSeconds: null,
        memberLimit: 1,
      });

      // Counter: track how many invite links were generated/sent for this group.
      // Stored on the group doc so /settings/telegram-groups can show per-group stats.
      try {
        await db
          .collection("telegram_groups")
          .doc(groupId)
          .set(
            {
              // Legacy field name kept for backwards compatibility (historically "sent").
              linksSentCount: admin.firestore.FieldValue.increment(1),
              linksSentLastAt: admin.firestore.FieldValue.serverTimestamp(),
              // New, clearer field names:
              linksGeneratedCount: admin.firestore.FieldValue.increment(1),
              linksGeneratedLastAt:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (e) {
        // Don't fail the invite generation if stats update fails.
        logger.warn("generateInvite stats update failed", {
          groupId,
          err: String(e?.message || e),
        });
      }

      return res.status(200).json({
        ok: true,
        invite_link,
      });
    } catch (err) {
      logger.error("generateInvite error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      // Include Telegram API error details for debugging
      let details;
      if (err?.details && typeof err.details === "object") {
        // Telegram API errors have details.telegram with error_code and description
        const tg = err.details.telegram;
        if (tg?.description) {
          details = `${tg.description} (error_code: ${tg.error_code || "unknown"})`;
        } else {
          details = JSON.stringify(err.details);
        }
      } else {
        details = String(err?.message || err);
      }
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// POST /generateChannelInvite
// Body: { channelId: string }
// Returns: { ok: true, invite_link: string }
//
// Security:
// - Requires Firebase Auth ID token (Authorization: Bearer <token>)
// - Requires role=admin or role=super_admin
// - Frontend never sees chat_id or bot token
exports.generateChannelInvite = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      // Auth (admin-only)
      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const channelId = String(req.body?.channelId || "").trim();
      if (!channelId) {
        return res.status(400).json({ ok: false, error: "missing-channelId" });
      }

      const snap = await db
        .collection("telegram_channels")
        .doc(channelId)
        .get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "channel-not-found" });
      }
      const data = snap.data() || {};
      if (data.active === false) {
        return res.status(403).json({ ok: false, error: "channel-inactive" });
      }
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "channel-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      // No time limit; only 1 join.
      const { invite_link } = await createOneTimeChatInviteLink({
        botToken,
        chatId,
        expireSeconds: null,
        memberLimit: 1,
      });

      // Counter: track how many invite links were generated for this channel.
      try {
        await db
          .collection("telegram_channels")
          .doc(channelId)
          .set(
            {
              linksSentCount: admin.firestore.FieldValue.increment(1),
              linksSentLastAt: admin.firestore.FieldValue.serverTimestamp(),
              linksGeneratedCount: admin.firestore.FieldValue.increment(1),
              linksGeneratedLastAt:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (e) {
        logger.warn("generateChannelInvite stats update failed", {
          channelId,
          err: String(e?.message || e),
        });
      }

      return res.status(200).json({
        ok: true,
        invite_link,
      });
    } catch (err) {
      logger.error("generateChannelInvite error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      let details;
      if (err?.details && typeof err.details === "object") {
        const tg = err.details.telegram;
        if (tg?.description) {
          details = `${tg.description} (error_code: ${tg.error_code || "unknown"})`;
        } else {
          details = JSON.stringify(err.details);
        }
      } else {
        details = String(err?.message || err);
      }
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// POST /trackInviteSent
// Body: { groupId: string, count?: number }
//
// Purpose:
// - Count how many invite links were actually dispatched (e.g. email sent) per group.
// - This is separate from /generateInvite which tracks generated links.
//
// Security:
// - Requires Firebase Auth ID token
// - Requires role=admin or role=super_admin
exports.trackInviteSent = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const decoded = await verifyFirebaseIdToken(req);
    assertAdminLikeClaims(decoded);

    const groupId = String(req.body?.groupId || "").trim();
    if (!groupId) {
      return res.status(400).json({ ok: false, error: "missing-groupId" });
    }

    const countRaw = Number(req.body?.count);
    const count = Number.isFinite(countRaw) ? Math.floor(countRaw) : 1;
    if (count <= 0 || count > 1000) {
      return res.status(400).json({ ok: false, error: "invalid-count" });
    }

    const ref = db.collection("telegram_groups").doc(groupId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "group-not-found" });
    }

    await ref.set(
      {
        linksDispatchedCount: admin.firestore.FieldValue.increment(count),
        linksDispatchedLastAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error("trackInviteSent error", err);
    setCors(req, res);
    const status = Number(err?.status) || 500;
    const code = String(err?.code || "internal");
    const details =
      status >= 500
        ? String(err?.message || err)
        : String(err?.details || err?.message || "");
    return res
      .status(status)
      .json({ ok: false, error: code, details: details || undefined });
  }
});

// GET /telegramGroupsFromUpdates
// Returns recent groups/channels that appear in bot updates.
// Auth: admin or super_admin
exports.telegramGroupsFromUpdates = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN], timeoutSeconds: 60 },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        logger.error("Bot token is missing or empty");
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const limitRaw = Number(req.query?.limit);
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
        : 100;

      logger.info("Fetching Telegram groups from updates", {
        limit,
        tokenLength: botToken.length,
        tokenPrefix: botToken.substring(0, 10) + "...",
      });

      // Direct test of Telegram API
      const testUrl = `https://api.telegram.org/bot${botToken}/getMe`;
      try {
        const testRes = await fetch(testUrl);
        const testJson = await testRes.json();
        logger.info("Telegram bot getMe test", {
          ok: testJson.ok,
          botUsername: testJson?.result?.username,
        });
      } catch (testErr) {
        logger.error("Telegram bot getMe test failed", {
          error: String(testErr),
        });
      }

      const chats = await getTelegramChatsFromUpdates({ botToken, limit });
      logger.info("Successfully fetched Telegram groups", {
        count: chats.length,
      });
      return res.status(200).json({ ok: true, chats });
    } catch (err) {
      logger.error("telegramGroupsFromUpdates error", {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        stack: err?.stack,
      });
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      const details = err?.details || {};
      return res.status(status).json({
        ok: false,
        error: code,
        message: String(err?.message || "Unknown error"),
        details: typeof details === "object" ? details : String(details),
      });
    }
  },
);

// POST /removeTelegramGroupMember
// Body: { groupId: string, userId: string }
// Remove a user from a Telegram group
// Auth: admin or super_admin
exports.removeTelegramGroupMember = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const groupId = String(req.body?.groupId || "").trim();
      const userId = String(req.body?.userId || "").trim();

      if (!groupId) {
        return res.status(400).json({ ok: false, error: "missing-groupId" });
      }
      if (!userId) {
        return res.status(400).json({ ok: false, error: "missing-userId" });
      }

      const snap = await db.collection("telegram_groups").doc(groupId).get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "group-not-found" });
      }
      const data = snap.data() || {};
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "group-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      await removeChatMember({ botToken, chatId, userId });

      return res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("removeTelegramGroupMember error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      const details =
        status >= 500
          ? String(err?.message || err)
          : String(err?.details || err?.message || "");
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// GET /getTelegramGroupMembers?groupId=xxx
// Get members of a Telegram group
// Auth: admin or super_admin
exports.getTelegramGroupMembers = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const groupId = String(req.query?.groupId || "").trim();
      if (!groupId) {
        return res.status(400).json({ ok: false, error: "missing-groupId" });
      }

      const snap = await db.collection("telegram_groups").doc(groupId).get();
      if (!snap.exists) {
        return res.status(404).json({ ok: false, error: "group-not-found" });
      }
      const data = snap.data() || {};
      const chatId = String(data.chat_id || "").trim();
      if (!chatId) {
        return res
          .status(500)
          .json({ ok: false, error: "group-missing-chat_id" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const members = await getChatMembers({ botToken, chatId });

      return res.status(200).json({ ok: true, members });
    } catch (err) {
      logger.error("getTelegramGroupMembers error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      return res.status(status).json({
        ok: false,
        error: code,
        details:
          status >= 500
            ? String(err?.message || err)
            : String(err?.details || ""),
      });
    }
  },
);

// POST /removeUserFromTelegramGroups
// Body: { telegramId: string }
// Remove a user from all Telegram groups where bot is admin
// Auth: admin or super_admin
// Use case: When candidate is rejected, remove them from all groups
exports.removeUserFromTelegramGroups = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const telegramId = String(req.body?.telegramId || "").trim();
      if (!telegramId) {
        return res.status(400).json({ ok: false, error: "missing-telegramId" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      // Log who is calling this function
      const callerEmail = decoded?.email || decoded?.uid || "unknown";
      const callerIp = req.headers["x-forwarded-for"] || req.ip || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      logger.info("Removing user from all Telegram groups", {
        telegramId,
        callerEmail,
        callerIp,
        userAgent,
      });

      const result = await removeUserFromAllGroups({
        botToken,
        userId: telegramId,
        db,
      });

      logger.info("User removal result", {
        telegramId,
        total: result.total,
        removed: result.removed,
        failed: result.failed,
        results: result.results,
      });

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (err) {
      logger.error("removeUserFromTelegramGroups error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      return res.status(status).json({
        ok: false,
        error: code,
        details:
          status >= 500
            ? String(err?.message || err)
            : String(err?.details || ""),
      });
    }
  },
);

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

  const TIMEOUT_MS = 8000;
  const fetchWithTimeout = (url, options) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("fetch-timeout")), TIMEOUT_MS),
      ),
    ]);
  };

  // Try update-by-id if record exists (json-api.uz pattern).
  try {
    const check = await fetchWithTimeout(
      `${REMOTE_ALL_USERS}?firebaseId=${encodeURIComponent(safeId)}`,
      { method: "GET" },
      4000,
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
          const put = await fetchWithTimeout(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (put.ok) return safeJson(put);
          const patch = await fetchWithTimeout(url, {
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

  const created = await fetchWithTimeout(REMOTE_ALL_USERS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!created.ok) {
    throw new Error(`remote all_users POST failed: ${created.status}`);
  }
  return safeJson(created);
}

function buildCandidateSubmitConfirmationMessage(metaName) {
  const n = String(metaName || "").trim() || "-";
  return (
    "🎉 Tabriklaymiz!\n\n" +
    "✅ Sizning ma'lumotlaringiz qabul qilindi.\n" +
    `📌 Ro'yxatdan o'tgan yo'nalishingiz: ${n}\n\n` +
    "📋 Hujjatlaringiz ko'rib chiqilmoqda...\n" +
    "📞 Tez orada siz bilan aloqaga chiqamiz.\n\n" +
    "ℹ️ Eslatma:\n" +
    "1) Ushbu yo'nalish bo‘yicha barcha bosqichlar yakunlanmaguncha boshqa yo‘nalishga topshira olmaysiz.\n" +
    "   Barcha bosqichlar yakunlangandan so‘ng esa boshqa yo‘nalishga topshirishingiz mumkin bo‘ladi.\n" +
    "2) Jarayon davomida bir vaqtning o‘zida bir nechta ariza (bir nechta yo‘nalish) topshirish mumkin emas.\n\n" +
    "Ushbu bot va @consulting_uzb kanalida qolishingizni so'raymiz."
  );
}

async function sendTelegramMessage({ botToken, chatId, text }) {
  const token = String(botToken || "").trim();
  const cid = String(chatId || "").trim();
  const t = String(text || "").trim();
  if (!token || !cid || !t) {
    const e = new Error("telegram-send-invalid-args");
    e.code = "telegram-send-invalid-args";
    throw e;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: cid, text: t }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await safeJson(res);
  if (!res.ok || json?.ok !== true) {
    const e = new Error("telegram-send-failed");
    e.code = "telegram-send-failed";
    e.status = 502;
    e.details = { httpStatus: res.status, telegram: json };
    throw e;
  }
  return { ok: true };
}

async function sendCandidateEmail({ to, subject, text }) {
  const mailTo = String(to || "").trim();
  const mailSubject = String(subject || "").trim();
  const mailText = String(text || "").trim();

  if (!mailTo) {
    const e = new Error("email-to-missing");
    e.code = "email-to-missing";
    e.status = 400;
    throw e;
  }
  if (!mailSubject || !mailText) {
    const e = new Error("email-content-missing");
    e.code = "email-content-missing";
    e.status = 500;
    throw e;
  }

  const response = await fetch(BREVO_EMAIL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: mailTo,
      subject: mailSubject,
      message: mailText,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const e = new Error(
      `Brevo email sending failed (${response.status}): ${text || "no detail"}`,
    );
    e.code = "brevo-send-failed";
    e.status = response.status;
    throw e;
  }

  return { ok: true };
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

async function checkTelegramIdRegistry(telegramId) {
  const safeTelegramId = String(telegramId || "").trim();
  if (!safeTelegramId) return { exists: false };
  const q = await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .where("telegramId", "==", safeTelegramId)
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

function extractTelegramIdFromAnyCandidateDoc(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const telegramId =
    p?.telegramId ??
    p?.telegram_id ??
    p?.tgId ??
    p?.persoenlicheDaten?.telegramId ??
    p?.personalInfo?.telegramId ??
    "";
  return String(telegramId || "").trim();
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
      const beforeExists = Boolean(event?.data?.before?.exists);

      // Handle DELETE: remove from email_and_passId to allow re-registration
      if (beforeExists && !afterExists) {
        const beforeData = event.data.before.data() || {};
        const emailRaw = extractEmailFromAnyCandidateDoc(beforeData);
        const safeEmail = normalizeEmailForRegistry(emailRaw);

        if (safeEmail) {
          const registryRef = db
            .collection(EMAIL_AND_PASSID_COLLECTION)
            .doc(safeEmail);

          await db.runTransaction(async (tx) => {
            const snap = await tx.get(registryRef);
            if (!snap.exists) return;

            const data = snap.data() || {};
            // Only delete if this registry entry belongs to the deleted candidate
            if (
              data.sourceMajor === collectionId &&
              data.sourceDocId === docId
            ) {
              tx.delete(registryRef);
              logger.info(
                "Deleted email_and_passId entry for deleted candidate",
                {
                  email: safeEmail,
                  major: collectionId,
                  docId: docId,
                },
              );
            }
          });
        }

        return;
      }

      // Handle CREATE/UPDATE: sync to email_and_passId
      if (!afterExists) return;

      const afterData = event.data.after.data() || {};
      const emailRaw = extractEmailFromAnyCandidateDoc(afterData);
      const passportRaw = extractPassportIdFromAnyCandidateDoc(afterData);
      const telegramIdRaw = extractTelegramIdFromAnyCandidateDoc(afterData);

      const safeEmail = normalizeEmailForRegistry(emailRaw);
      if (!safeEmail) return;
      const safePassport = normalizePassportIdForRegistry(passportRaw);
      const safeTelegramId = telegramIdRaw || null;

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
          ...(safeTelegramId ? { telegramId: safeTelegramId } : {}),
        };
        if (!snap.exists) {
          tx.set(registryRef, {
            ...base,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return;
        }
        tx.set(registryRef, base, { merge: true });
      });
    } catch (e) {
      logger.error("syncEmailAndPassIdRegistry failed", e);
      // Never block candidate writes; this is a background sync.
    }
  },
);

// POST /submitCandidate
// Body: { major: string, payload: object, recaptchaToken?: string }
exports.submitCandidate = onRequest(
  {
    secrets: [RECAPTCHA_SECRET_KEY, TELEGRAM_BOT_TOKEN],
    timeoutSeconds: 120,
  },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const { major, payload } = req.body || {};
      const recaptchaToken = String(req.body?.recaptchaToken || "").trim();
      const safeMajor = String(major || "").trim();
      if (!safeMajor || !payload) {
        return res
          .status(400)
          .json({ ok: false, error: "missing-major-or-payload" });
      }

      // Public endpoint protection: verify reCAPTCHA server-side.
      if (!recaptchaToken) {
        return res
          .status(400)
          .json({ ok: false, error: "missing-recaptchaToken" });
      }
      // Debug (safe): helps diagnose "invalid-input-response" by confirming token is present and well-formed.
      // We only log length + origin, never the token itself.
      const origin = String(req.get("Origin") || "").trim();
      logger.info("submitCandidate reCAPTCHA token received", {
        origin: origin || "unknown",
        tokenLen: recaptchaToken.length,
      });
      const secret = String(RECAPTCHA_SECRET_KEY.value() || "").trim();
      if (!secret) {
        return res
          .status(500)
          .json({ ok: false, error: "recaptcha-not-configured" });
      }
      const verify = await verifyRecaptchaV2({ token: recaptchaToken, secret });
      if (!verify.ok) {
        const out = {
          ok: false,
          error: "recaptcha-failed",
          reason: verify.reason,
        };
        const codes = Array.isArray(verify?.details?.["error-codes"])
          ? verify.details["error-codes"]
          : null;
        if (codes && codes.length) out.codes = codes;
        logger.warn("submitCandidate reCAPTCHA verify failed", {
          reason: verify.reason,
          codes: codes || undefined,
          origin: origin || "unknown",
          tokenLen: recaptchaToken.length,
        });
        return res.status(403).json(out);
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

      const metaName =
        String(meta?.title || "").trim() ||
        String(meta?.name || "").trim() ||
        String(meta?.collectionName || "").trim() ||
        String(targetCol || "").trim() ||
        String(safeMajor || "").trim() ||
        "unknown";

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
      const telegramIdFromPayload =
        payload?.telegramId ?? payload?.telegram_id ?? payload?.tgId ?? "";

      const safeEmail = normalizeEmailForRegistry(emailFromPayload);
      const safePassport = normalizePassportIdForRegistry(passportFromPayload);
      const safeTelegramId = String(telegramIdFromPayload || "").trim() || null;

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

          // (c) Telegram ID duplicate check (best-effort if provided)
          if (safeTelegramId) {
            const q = db
              .collection(EMAIL_AND_PASSID_COLLECTION)
              .where("telegramId", "==", safeTelegramId)
              .limit(1);
            const qSnap = await tx.get(q);
            if (!qSnap.empty) {
              const d = qSnap.docs[0];
              const data = d.data() || {};
              const err = new Error("telegram-exists");
              err.status = 409;
              err.code = "telegram-exists";
              err.existing = {
                email: data.email || d.id || null,
                major: data.major || null,
                telegramId: data.telegramId || safeTelegramId,
              };
              throw err;
            }
          }

          // (d) Create candidate doc
          tx.set(candidateRef, {
            ...payload,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // (e) Create registry entry (same email => deterministic doc id)
          tx.set(registryRef, {
            email: safeEmail,
            major: String(targetCol || "").trim() || null,
            sourceMajor: String(targetCol || "").trim() || null,
            sourceDocId: String(candidateRef.id || "").trim() || null,
            ...(safePassport ? { passportId: safePassport } : {}),
            ...(safeTelegramId ? { telegramId: safeTelegramId } : {}),
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
        if (status === 409 && code === "telegram-exists") {
          return res.status(409).json({
            ok: false,
            error: "telegram-exists",
            existing: e.existing || {
              email: null,
              major: null,
              telegramId: safeTelegramId,
            },
          });
        }
        throw e;
      }

      // 5) Sync to remote user registry (best-effort; should not fail a successful submit)
      const confirmationText =
        buildCandidateSubmitConfirmationMessage(metaName);
      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();

      const notificationTasks = [];
      if (safeTelegramId && botToken) {
        notificationTasks.push(
          sendTelegramMessage({
            botToken,
            chatId: safeTelegramId,
            text: confirmationText,
          }),
        );
      }
      // Send email via Brevo Railway service
      if (safeEmail) {
        notificationTasks.push(
          sendCandidateEmail({
            to: safeEmail,
            subject: "✅ Arizangiz qabul qilindi",
            text: confirmationText,
          }),
        );
      }

      if (notificationTasks.length) {
        const settled = await Promise.allSettled(notificationTasks);
        const failed = settled
          .map((r, idx) => ({ r, idx }))
          .filter((x) => x.r.status === "rejected")
          .map((x) => String(x.r.reason?.message || x.r.reason || ""));
        if (failed.length) {
          logger.warn("submitCandidate notifications failed", {
            id: candidateRef.id,
            major: targetCol,
            failed,
          });
        }
      }

      return res.json({ ok: true, id: candidateRef.id });
    } catch (err) {
      logger.error("submitCandidate error", err);
      setCors(req, res);
      return res
        .status(500)
        .json({ ok: false, error: "internal", details: err.message });
    }
  },
);

exports.syncRemoteAllUsers = onDocumentWritten(
  "{collectionId}/{docId}",
  async (event) => {
    try {
      const collectionId = String(event?.params?.collectionId || "").trim();
      const docId = String(event?.params?.docId || "").trim();
      if (!collectionId || !docId) return;
      if (IGNORED_COLLECTIONS_FOR_REGISTRY.has(collectionId)) return;

      const afterExists = Boolean(event?.data?.after?.exists);
      if (!afterExists) return;

      const afterData = event.data.after.data() || {};
      const emailRaw = extractEmailFromAnyCandidateDoc(afterData);
      const safeEmail = normalizeEmailForRegistry(emailRaw);
      if (!safeEmail) return;

      await upsertRemoteAllUsers({
        firebaseId: docId,
        major: collectionId,
        payload: afterData,
      });
    } catch (e) {
      logger.error("syncRemoteAllUsers failed", e);
      // Never block Firestore writes; this is a background sync.
    }
  },
);

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
      "password must be at least 6 chars",
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
      "password must be at least 6 chars",
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
      "role must be one of: user, admin, limited_admin",
    );
  }
  await admin.auth().setCustomUserClaims(uid, { role });
  return { ok: true, uid, role };
});

// ---- Telegram Bot Integration ----

const initBot = require("./src/bot/index");

// Bot webhook endpoint
exports.telegramBotWebhook = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      // Initialize bot for each request to ensure latest code is used
      const bot = initBot(db, botToken);
      if (!bot) {
        return res.status(500).json({ ok: false, error: "bot-init-failed" });
      }

      // Handle webhook update - bot.handleUpdate automatically sends response
      await bot.handleUpdate(req.body, res);
    } catch (err) {
      logger.error("telegramBotWebhook error", err);
      if (!res.headersSent) {
        return res.status(500).json({
          ok: false,
          error: "internal",
          details: String(err?.message || err),
        });
      }
    }
  },
);

// Admin: Send one-time invite link to a specific candidate
exports.sendInviteToCandidate = onCall(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (request) => {
    // 1. Auth check
    const role = String(request.auth?.token?.role || "");
    if (role !== "admin" && role !== "super_admin") {
      throw new HttpsError("permission-denied", "Admins only.");
    }

    const { candidateId, collectionName, groupId } = request.data || {};
    if (!candidateId || !collectionName || !groupId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing candidateId, collectionName, or groupId",
      );
    }

    // 2. Fetch candidate to get available Telegram Chat ID
    // (We look for telegramChatId field which our bot saved)
    const docSnap = await db.collection(collectionName).doc(candidateId).get();
    if (!docSnap.exists) {
      throw new HttpsError("not-found", "Candidate not found");
    }
    const data = docSnap.data();
    const telegramChatId = data.telegramChatId;

    if (!telegramChatId) {
      throw new HttpsError(
        "failed-precondition",
        "Bu kandidat Telegram orqali ro‘yxatdan o‘tmagan (Chat ID yo‘q).",
      );
    }

    // 3. Generate Link
    const token = TELEGRAM_BOT_TOKEN.value();
    const bot = new Telegraf(token);

    // Get Group Chat ID
    const groupSnap = await db.collection("telegram_groups").doc(groupId).get();
    if (!groupSnap.exists) {
      throw new HttpsError("not-found", "Telegram group not found in DB");
    }
    const groupChatId = groupSnap.data().chat_id;
    if (!groupChatId) {
      throw new HttpsError("failed-precondition", "Group has no chat_id");
    }

    let inviteLink;
    try {
      const result = await createOneTimeChatInviteLink({
        botToken: token,
        chatId: groupChatId,
        memberLimit: 1,
      });
      inviteLink = result.invite_link;
    } catch (e) {
      logger.error("Invite generation failed:", e);
      throw new HttpsError(
        "internal",
        "invite-generation-failed: " + e.message,
      );
    }

    // 4. Send Link to User
    try {
      await bot.telegram.sendMessage(
        telegramChatId,
        `🎉 Sizning arizangiz qabul qilindi!\n\nQuyidagi link orqali guruhga qo‘shilishingiz mumkin (Link faqat 1 marta ishlaydi):\n${inviteLink}`,
      );
    } catch (e) {
      logger.error("Sending message to user failed:", e);
      throw new HttpsError(
        "unavailable",
        "Link yaratildi, lekin foydalanuvchiga yuborishda xatolik: " +
          e.message,
        { inviteLink },
      );
    }

    return { ok: true, sent: true };
  },
);

// Admin: Kick (Ban/Unban) a candidate from a group
exports.kickCandidate = onCall(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (request) => {
    // 1. Auth check
    const role = String(request.auth?.token?.role || "");
    if (role !== "admin" && role !== "super_admin") {
      throw new HttpsError("permission-denied", "Admins only.");
    }

    const { candidateId, collectionName, groupId } = request.data || {};

    // 2. Fetch IDs
    const docSnap = await db.collection(collectionName).doc(candidateId).get();
    if (!docSnap.exists)
      throw new HttpsError("not-found", "Candidate not found");
    const telegramChatId = docSnap.data().telegramChatId;
    if (!telegramChatId)
      throw new HttpsError("failed-precondition", "No Telegram Chat ID");

    const groupSnap = await db.collection("telegram_groups").doc(groupId).get();
    if (!groupSnap.exists) throw new HttpsError("not-found", "Group not found");
    const groupChatId = groupSnap.data().chat_id;

    // 3. Kick
    const token = TELEGRAM_BOT_TOKEN.value();
    const bot = new Telegraf(token);

    try {
      // banChatMember kicks the user.
      await bot.telegram.banChatMember(groupChatId, telegramChatId);
      // Optional: unban immediately to allow re-joining later if needed?
      // Usually "kick" implies ban + unban.
      await bot.telegram.unbanChatMember(groupChatId, telegramChatId);
    } catch (e) {
      logger.error("Kick failed:", e);
      throw new HttpsError("internal", "Kick failed: " + e.message);
    }

    return { ok: true, kicked: true };
  },
);

// POST /sendTelegramMessage
// Body: { telegramId: string, message: string, parseMode?: string }
// Send a message to a specific user via Telegram bot
exports.sendTelegramMessage = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      // Auth (admin-only)
      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const telegramId = String(req.body?.telegramId || "").trim();
      const message = String(req.body?.message || "").trim();
      const parseMode = String(req.body?.parseMode || "HTML").trim();
      const keyboard = req.body?.keyboard || null;

      if (!telegramId) {
        return res.status(400).json({ ok: false, error: "missing-telegramId" });
      }
      if (!message) {
        return res.status(400).json({ ok: false, error: "missing-message" });
      }

      const botToken = String(TELEGRAM_BOT_TOKEN.value() || "").trim();
      if (!botToken) {
        return res.status(500).json({ ok: false, error: "bot-token-missing" });
      }

      const bot = new Telegraf(botToken);

      try {
        const options = {
          parse_mode: parseMode,
        };

        // Add inline keyboard if provided
        if (keyboard && Array.isArray(keyboard) && keyboard.length > 0) {
          options.reply_markup = {
            inline_keyboard: keyboard,
          };
        }

        await bot.telegram.sendMessage(telegramId, message, options);
        return res.status(200).json({ ok: true, sent: true });
      } catch (sendError) {
        logger.error("Failed to send Telegram message", {
          telegramId,
          error: String(sendError?.message || sendError),
        });
        return res.status(500).json({
          ok: false,
          error: "send-failed",
          details: String(sendError?.message || sendError),
        });
      }
    } catch (err) {
      logger.error("sendTelegramMessage error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      const details =
        status >= 500
          ? String(err?.message || err)
          : String(err?.details || err?.message || "");
      return res
        .status(status)
        .json({ ok: false, error: code, details: details || undefined });
    }
  },
);

// DEBUG: Check Majors
exports.debugMajors = onRequest(async (req, res) => {
  try {
    const snap = await db
      .collection("meta")
      .where("linkActive", "==", true)
      .get();
    const majors = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    res.json({ count: majors.length, majors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Count state_1 candidates in each direction
exports.countState1Candidates = onRequest(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    // Get all directions from meta collection
    const metaSnap = await db.collection("meta").get();

    if (metaSnap.empty) {
      return res.json({ ok: false, error: "No directions found in meta" });
    }

    const results = [];
    let totalState1 = 0;

    for (const metaDoc of metaSnap.docs) {
      const metaData = metaDoc.data();
      const collectionName =
        metaData.collectionName || metaData.slug || metaDoc.id;
      const title = metaData.title || collectionName;
      const isDeleted = metaData.isDeleted === true;

      if (!collectionName) continue;

      try {
        // Count candidates with stepValue = "stage_1"
        const state1Snap = await db
          .collection(collectionName)
          .where("stepValue", "==", "stage_1")
          .get();

        const state1Count = state1Snap.size;

        // Also get total count
        const totalSnap = await db.collection(collectionName).get();
        const totalCount = totalSnap.size;

        results.push({
          collectionName,
          title,
          isDeleted,
          state1Count,
          totalCount,
        });

        totalState1 += state1Count;

        logger.info(
          `${collectionName}: state_1=${state1Count}, total=${totalCount}`,
        );
      } catch (err) {
        results.push({
          collectionName,
          title,
          isDeleted,
          error: err.message,
        });
      }
    }

    // Sort by state_1 count descending
    results.sort((a, b) => (b.state1Count || 0) - (a.state1Count || 0));

    return res.json({
      ok: true,
      totalDirections: metaSnap.size,
      totalState1Candidates: totalState1,
      results,
    });
  } catch (err) {
    logger.error("Error counting state_1 candidates", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /openaiProxy
// Body: { messages: array, model?: string, temperature?: number, max_tokens?: number }
// Proxy for OpenAI API to bypass CORS restrictions
// Auth: admin or super_admin
exports.openaiProxy = onRequest(
  { secrets: [OPENAI_API_KEY], timeoutSeconds: 60 },
  async (req, res) => {
    try {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "method-not-allowed" });
      }

      // Auth (admin-only)
      const decoded = await verifyFirebaseIdToken(req);
      assertAdminLikeClaims(decoded);

      const apiKey = String(OPENAI_API_KEY.value() || "").trim();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: "openai-key-missing" });
      }

      const { messages, model, temperature, max_tokens } = req.body || {};

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ ok: false, error: "missing-messages" });
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages,
            temperature: temperature ?? 0.3,
            max_tokens: max_tokens ?? 2000,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("OpenAI API error", {
          status: response.status,
          errorData,
        });
        return res.status(response.status).json({
          ok: false,
          error: "openai-api-error",
          details: errorData.error?.message || response.statusText,
        });
      }

      const data = await response.json();
      return res.status(200).json({ ok: true, data });
    } catch (err) {
      logger.error("openaiProxy error", err);
      setCors(req, res);
      const status = Number(err?.status) || 500;
      const code = String(err?.code || "internal");
      return res.status(status).json({
        ok: false,
        error: code,
        details: String(err?.message || err),
      });
    }
  },
);
