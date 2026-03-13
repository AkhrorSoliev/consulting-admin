/**
 * PDF proxy URL building utilities.
 *
 * Constructs URLs that route through Firebase Functions or Vite dev proxy
 * to avoid CORS issues when fetching PDFs from json-api.uz.
 */

import { normalizeMaybeUrl } from "./utils";

function getFunctionsBaseCandidates() {
  const explicit = String(import.meta?.env?.VITE_FUNCTIONS_BASE || "").trim();
  // IMPORTANT: keep backward-compatible behavior.
  // If VITE_FUNCTIONS_BASE is not configured, fall back to raw URLs (often CORS-enabled)
  // instead of guessing a Functions URL (region can differ and would break working previews).
  if (!explicit) return [];
  return [String(explicit).trim().replace(/\/+$/, "")];
}

export function buildProxyPdfUrl(rawPdfUrl) {
  const raw = normalizeMaybeUrl(rawPdfUrl);
  if (!raw) return "";

  // Prefer Firebase Functions base (works in production if configured).
  // Only proxy json-api.uz; the backend allowlist enforces this too.
  try {
    const u = new URL(raw);
    const host = String(u.hostname || "").toLowerCase();
    const isJsonApi = host === "json-api.uz";
    if (isJsonApi) {
      const bases = getFunctionsBaseCandidates();
      const functionsBase = bases[0] || "";
      if (functionsBase) {
        return `${functionsBase}/proxyPdf?url=${encodeURIComponent(raw)}`;
      }
    }
  } catch {
    // ignore and fall through
  }

  // Local dev fallback: Vite proxy (same-origin) for json-api.uz only.
  // NOTE: we also detect localhost via window.location because `import.meta.env.DEV`
  // may be false in some preview/build setups.
  try {
    const u = new URL(raw);
    const host = String(u.hostname || "").toLowerCase();
    const isJsonApi = host === "json-api.uz";

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
    if (isDev && isJsonApi) return `/__pdf_proxy${u.pathname}${u.search || ""}`;
  } catch {
    // ignore
  }

  // No proxy available
  return raw;
}
