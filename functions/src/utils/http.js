const crypto = require("crypto");

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

function setCors(req, res) {
  const origin = req.get("Origin") || "";
  const isProd = origin === "https://admin.consultinguz.de";
  const isLocalhost =
    /^http:\/\/localhost:\d+$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin);
  if (isProd || isLocalhost) res.set("Access-Control-Allow-Origin", origin);

  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

function getClientIp(req) {
  const raw = String(req?.ip || "").trim();
  if (raw) return raw;
  const xf = String(req?.get?.("x-forwarded-for") || "").trim();
  if (!xf) return "unknown";
  return xf.split(",")[0].trim() || "unknown";
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
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

  if (
    host === "firebasestorage.googleapis.com" ||
    host.endsWith(".firebasestorage.app")
  ) {
    return true;
  }

  if (host !== "json-api.uz") return false;
  const path = String(u.pathname || "");
  const lower = path.toLowerCase();

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

    const looksFileLike =
      lower.includes("/mt/") ||
      lower.includes("/mnt/") ||
      lower.includes("/uploads/") ||
      lower.includes("/file-");
    return looksFileLike;
  }

  return false;
}

module.exports = {
  fetchWithTimeout,
  setCors,
  verifyRecaptchaV2,
  base64UrlEncode,
  base64UrlDecodeToString,
  getClientIp,
  safeJson,
  isAllowedPdfProxyUrl,
};
