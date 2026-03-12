export function toInputDateString(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // yyyy-mm-ddThh:mm (datetime-local)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    // dd.mm.yyyy -> yyyy-mm-dd
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  }
  if (typeof value === "number") {
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }
  return "";
}

export function resolveLinkType(rawType, link) {
  const normalizedType = String(rawType || "").toLowerCase();
  if (normalizedType === "telegram") return "telegram";
  const rawLink = String(link || "").toLowerCase();
  if (rawLink.includes("t.me/") || rawLink.includes("telegram"))
    return "telegram";
  return "zoom";
}

// Create-link origin (manual switch):
// Local test:
// const CREATE_LINK_ORIGIN = "http://localhost:5173";
// Production:
const CREATE_LINK_ORIGIN = "https://admin.consultinguz.de";

export function buildCreateLink(major, lead) {
  const linkId =
    major?.linkId || major?.uuid || major?.id || major?.collectionName || major;
  if (!linkId) return "";
  const origin = CREATE_LINK_ORIGIN;
  try {
    const url = new URL(`${origin}/create`);
    url.searchParams.set("major", String(linkId));
    const leadStr = String(lead || "").trim();
    if (leadStr) url.searchParams.set("lead", leadStr);
    return url.toString();
  } catch {
    const base = `${origin}/create?major=${encodeURIComponent(String(linkId))}`;
    const leadStr = String(lead || "").trim();
    return leadStr ? `${base}&lead=${encodeURIComponent(leadStr)}` : base;
  }
}

export function generateLocalId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeLeadLinkRow(raw, idx) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const name = String(obj?.name || "").trim();
  if (!name) return null;
  const id = String(obj?.id || obj?.key || "").trim() || `row_${idx}`;
  const active = obj?.active !== false;
  return { id, name, active };
}
