import { auth } from "../firebase/config";

function getFunctionsBaseCandidates() {
  // In Vite, env vars are available via `import.meta.env` (no optional chaining needed).
  // Using direct access also makes it easier for Vite to statically replace values in production builds.
  const env = import.meta.env || {};
  const explicit = String(env.VITE_FUNCTIONS_BASE || "").trim();
  // If explicitly configured, trust it (avoid trying other regions and triggering CORS noise).
  if (explicit) {
    return [String(explicit).trim().replace(/\/+$/, "")];
  }

  const out = [];

  // Fallback: derive base from a full function URL if available (already used elsewhere in the app).
  // Example: VITE_SUBMIT_CANDIDATE_URL=https://us-central1-<project>.cloudfunctions.net/submitCandidate
  const submitUrlRaw = String(env.VITE_SUBMIT_CANDIDATE_URL || "").trim();
  if (submitUrlRaw) {
    try {
      const u = new URL(submitUrlRaw);
      const base = `${u.protocol}//${u.host}`;
      // If it's a standard cloudfunctions.net URL, the region+project are in the host.
      // We still need to include the origin + optional path prefix (some deployments add none).
      // Firebase HTTP functions base is just the origin (no extra path).
      if (base) out.push(base);
    } catch {
      // ignore
    }
  }

  const projectId = String(env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (projectId) {
    out.push(`https://us-central1-${projectId}.cloudfunctions.net`);
    out.push(`https://europe-west3-${projectId}.cloudfunctions.net`);
  }

  const normalized = out
    .map((b) =>
      String(b || "")
        .trim()
        .replace(/\/+$/, "")
    )
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function getFunctionsCandidatesOrThrow() {
  const bases = getFunctionsBaseCandidates();
  if (bases.length > 0) return bases;

  // Help debug env issues in dev.
  try {
    const env = import.meta.env || {};
    if (env.DEV) {
      // Environment variables not configured
    }
  } catch {
    // ignore
  }

  throw new Error("Functions base topilmadi. VITE_FUNCTIONS_BASE ni sozlang.");
}

async function fetchJsonWithBaseFallback(buildUrl, init) {
  const bases = getFunctionsCandidatesOrThrow();
  const errors = [];

  for (const base of bases) {
    const url = buildUrl(base);
    try {
      const res = await fetch(url, init);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok !== true) {
        const err = new Error(String(json?.error || `HTTP ${res.status}`));
        err.details = json;
        err.httpStatus = res.status;
        errors.push({ base, url, err: String(err?.message || err) });
        continue;
      }
      return { base, url, json };
    } catch (e) {
      // This often happens on CORS-blocked or wrong-region URLs ("TypeError: Failed to fetch").
      errors.push({ base, url, err: String(e?.message || e) });
      continue;
    }
  }

  const out = new Error("Functions endpoint’ga ulanish bo‘lmadi.");
  out.details = errors;
  throw out;
}

export async function generateTelegramInviteLink({ groupId }) {
  const safeGroupId = String(groupId || "").trim();
  if (!safeGroupId) throw new Error("groupId required");

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const { json } = await fetchJsonWithBaseFallback(
    (base) => `${String(base).replace(/\/+$/, "")}/generateInvite`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ groupId: safeGroupId }),
    }
  );

  return {
    invite_link: String(json.invite_link || ""),
    expire_date: Number(json.expire_date) || null,
  };
}

export async function fetchTelegramGroupsFromUpdates({ limit = 100 } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();

  const { json } = await fetchJsonWithBaseFallback(
    (base) =>
      `${String(base).replace(
        /\/+$/,
        ""
      )}/telegramGroupsFromUpdates?limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const chats = Array.isArray(json?.chats) ? json.chats : [];
  return chats.map((c) => ({
    chat_id: String(c?.chat_id || "").trim(),
    name: String(c?.name || "").trim(),
    type: String(c?.type || "").trim(),
  }));
}

export async function trackTelegramInviteSent({ groupId, count = 1 }) {
  const safeGroupId = String(groupId || "").trim();
  if (!safeGroupId) throw new Error("groupId required");
  const nRaw = Number(count);
  const n = Number.isFinite(nRaw) ? Math.floor(nRaw) : 1;
  if (n <= 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();

  await fetchJsonWithBaseFallback(
    (base) => `${String(base).replace(/\/+$/, "")}/trackInviteSent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ groupId: safeGroupId, count: n }),
    }
  );
  return true;
}
