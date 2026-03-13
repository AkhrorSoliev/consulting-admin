export function formatGermanAddress(parts) {
  const street = String(parts?.street || "").trim();
  const houseNumber = String(parts?.houseNumber || "").trim();
  const postalCode = String(parts?.postalCode || "").trim();
  const city = String(parts?.city || "").trim();
  const country = String(parts?.country || "").trim();

  const streetLine = [street, houseNumber].filter(Boolean).join(" ").trim();
  const cityLine = [postalCode, city].filter(Boolean).join(" ").trim();

  return [streetLine, cityLine, country].filter(Boolean).join(", ").trim();
}

export function uniqueKey(file) {
  if (file && typeof file === "object" && typeof file.url === "string") {
    const u = String(file.url || "").trim();
    if (u) return u;
  }
  return `${file?.name || ""}__${file?.size || 0}__${
    file?.lastModified || 0
  }`;
}

export function mergeFiles(existing, incoming) {
  const map = new Map();
  (existing || []).forEach((f) => map.set(uniqueKey(f), f));
  (incoming || []).forEach((f) => {
    if (f instanceof File) map.set(uniqueKey(f), f);
  });
  return Array.from(map.values());
}

export function mergeLangCertItems(existing, incomingFiles) {
  const map = new Map();
  (existing || []).forEach((item) => {
    const file = item?.file || item;
    const key = uniqueKey(file);
    map.set(key, { file, type: item?.type || "" });
  });
  (incomingFiles || []).forEach((f) => {
    if (!(f instanceof File)) return;
    const key = uniqueKey(f);
    if (!map.has(key)) {
      map.set(key, { file: f, type: "" });
    }
  });
  return Array.from(map.values());
}

export function removeLangCertAt(items, idx) {
  return (items || []).filter((_, i) => i !== idx);
}

export function removeFileAt(files, idx) {
  return (files || []).filter((_, i) => i !== idx);
}

export function hasNonEmptyValue(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => {
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "number") return true;
    if (typeof v === "boolean") return v;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return hasNonEmptyValue(v);
    return false;
  });
}
