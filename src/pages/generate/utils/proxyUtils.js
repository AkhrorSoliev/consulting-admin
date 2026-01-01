export function normalizeMaybeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw;
}

export function getFunctionsBaseCandidates() {
  const out = [];
  const explicit = String(import.meta?.env?.VITE_FUNCTIONS_BASE || "").trim();
  if (explicit) out.push(explicit);

  const projectId = String(
    import.meta?.env?.VITE_FIREBASE_PROJECT_ID || ""
  ).trim();
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

export function buildProxyAssetUrlCandidates(rawUrl) {
  const raw = normalizeMaybeUrl(rawUrl);
  if (!raw) return [];

  let u;
  try {
    u = new URL(raw);
  } catch {
    return [];
  }
  const host = String(u.hostname || "").toLowerCase();
  const isJsonApi = host === "json-api.uz";
  if (!isJsonApi) return [];

  try {
    let isLocalhost = false;
    try {
      const lh = String(window?.location?.hostname || "").toLowerCase();
      isLocalhost =
        lh === "localhost" ||
        lh === "127.0.0.1" ||
        lh === "::1" ||
        /^192\.168\.\d+\.\d+$/.test(lh);
    } catch {
      // ignore
    }
    const isDev = Boolean(import.meta?.env?.DEV) || isLocalhost;
    if (isDev) {
      return [`/__pdf_proxy${u.pathname}${u.search || ""}`];
    }
  } catch {
    // ignore
  }

  const bases = getFunctionsBaseCandidates();
  return bases.map(
    (base) => `${String(base)}/proxyPdf?url=${encodeURIComponent(raw)}`
  );
}

export function buildProxyAssetUrl(rawUrl) {
  const candidates = buildProxyAssetUrlCandidates(rawUrl);
  return candidates[0] || normalizeMaybeUrl(rawUrl);
}
