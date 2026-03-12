const crypto = require("crypto");
const { base64UrlEncode, base64UrlDecodeToString, getClientIp } = require("./http");

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

module.exports = {
  safeTimingEqual,
  signCheckRegistrySession,
  verifyCheckRegistrySession,
  enforceCheckRegistryRateLimit,
};
