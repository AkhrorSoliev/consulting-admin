// User-specific major visibility restrictions
// Format: { [userId]: [majorId1, majorId2, ...] }
export const HIDDEN_MAJORS_BY_USER = {
  HRE9Dtf8g3WXXGB3a9nctZ9dz3b2: ["92790303-f374-44ff-9382-5e6ba2a06eec"],
  R5edmWfoBoOcQGZVAb2giFDCqJk1: ["92790303-f374-44ff-9382-5e6ba2a06eec"],
};

export const getMajorCollectionName = (major) => {
  return String(
    major?.collectionName || major?.slug || major?.name || "",
  ).trim();
};

export const resolveMajorKey = (major) => {
  if (!major) return "";
  if (typeof major === "string") return major;
  return String(
    major.id ||
      major.uuid ||
      major.linkId ||
      major.collectionName ||
      major.slug ||
      major.name ||
      "",
  ).trim();
};

export const resolveMajorCount = (major, serverCounts) => {
  const col = getMajorCollectionName(major);
  if (!col) return null;
  const val = serverCounts?.[col];
  if (val === undefined || val === null) return null;
  return Number(val) || 0;
};
