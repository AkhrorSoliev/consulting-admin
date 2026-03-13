export function generateUuid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback: simple random string
  return "xxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeMajorMeta(docSnap) {
  const data =
    typeof docSnap?.data === "function" ? docSnap.data() : docSnap?.data || {};
  const id = docSnap?.id || "";
  const collectionName =
    data.collectionName || data.slug || data.name || id || "";
  const uuid = data.uuid || data.id || id || "";
  const title =
    data.title || data.label || data.fullName || data.name || collectionName;
  const slug = data.slug || data.name || collectionName;
  return {
    ...data,
    id,
    uuid,
    linkId: uuid || id,
    collectionName,
    slug,
    name: data.name || slug,
    title,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    raw: data,
  };
}
