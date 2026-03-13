import {
  USERS_ALL_ENDPOINT,
  USERS_DELETED_ENDPOINT,
  USERS_ARCHIVED_ENDPOINT,
  omitKeys,
  safeJsonResponse,
} from "./constants";

// ---- Remote user management ----

export async function listRemoteUsers(kind = "all") {
  const k = String(kind || "")
    .trim()
    .toLowerCase();
  const endpoint =
    k === "deleted"
      ? USERS_DELETED_ENDPOINT
      : k === "archived"
        ? USERS_ARCHIVED_ENDPOINT
        : USERS_ALL_ENDPOINT;
  const res = await fetch(endpoint, { method: "GET" });
  if (!res.ok) throw new Error(`Remote list failed: ${res.status}`);
  const json = await safeJsonResponse(res);
  return Array.isArray(json?.data) ? json.data : [];
}

export async function getRemoteUserRecord(kind, recordId) {
  const safeId = String(recordId || "").trim();
  if (!safeId) return null;
  const list = await listRemoteUsers(kind);
  if (!Array.isArray(list) || list.length === 0) return null;

  const match = list.find((r) => {
    if (!r || typeof r !== "object") return false;
    const candidates = [r.id, r._id, r.uuid, r.key, r.docId, r.firebaseId]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    return candidates.includes(safeId);
  });
  return match || null;
}

export async function deleteRemoteUserRecord(kind, recordId) {
  const k = String(kind || "")
    .trim()
    .toLowerCase();
  const safeId = String(recordId || "").trim();
  if (!safeId) return { ok: false, reason: "missing-id" };
  const endpoint =
    k === "deleted"
      ? USERS_DELETED_ENDPOINT
      : k === "archived"
        ? USERS_ARCHIVED_ENDPOINT
        : USERS_ALL_ENDPOINT;
  const url = `${endpoint}/${encodeURIComponent(safeId)}`;
  const res = await fetch(url, { method: "DELETE" });
  if (res.ok) return safeJsonResponse(res);
  const byPropUrl = `${endpoint}/by-property?property=id&value=${encodeURIComponent(
    safeId,
  )}&all=false`;
  const res2 = await fetch(byPropUrl, { method: "DELETE" });
  if (res2.ok) return safeJsonResponse(res2);
  return { ok: false, status: res.status, status2: res2.status };
}

export async function checkUserRemoteByFirebaseId(firebaseId) {
  const safeId = String(firebaseId || "").trim();
  if (!safeId) return { exists: false };
  const url = `${USERS_ALL_ENDPOINT}?firebaseId=${encodeURIComponent(safeId)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Remote user check failed: ${res.status}`);
  const json = await safeJsonResponse(res);
  const list = Array.isArray(json?.data) ? json.data : [];
  const match =
    list.find((item) => String(item?.firebaseId || "").trim() === safeId) ||
    null;
  if (match) return { exists: true, data: match };
  return { exists: false };
}

export async function upsertUserRemoteAllUsers({
  firebaseId,
  major,
  payload,
} = {}) {
  const safeId = String(firebaseId || "").trim();
  if (!safeId) throw new Error("upsertUserRemoteAllUsers: firebaseId missing");
  const safeMajor = String(major || "").trim() || null;
  const body = {
    firebaseId: safeId,
    major: safeMajor,
    ...(payload && typeof payload === "object" ? payload : {}),
    syncedAt: Date.now(),
  };

  try {
    const { exists, data } = await checkUserRemoteByFirebaseId(safeId);
    if (exists && data && typeof data === "object") {
      const id =
        data.id ?? data._id ?? data.uuid ?? data.key ?? data.docId ?? null;
      if (id !== null && id !== undefined && String(id).trim() !== "") {
        const url = `${USERS_ALL_ENDPOINT}/${encodeURIComponent(String(id))}`;
        const put = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (put.ok) return safeJsonResponse(put);

        const patch = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (patch.ok) return safeJsonResponse(patch);
      }
    }
  } catch (e) {
    // ignore and fallback to POST
  }

  const res = await fetch(USERS_ALL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Remote user create failed: ${res.status}`);
  }
  return safeJsonResponse(res);
}

export async function addUserRemoteDeleted({ major, payload, deletedBy } = {}) {
  const safeMajor = String(major || "").trim() || null;
  const safeBy = String(deletedBy || "").trim() || null;
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const withoutFirebaseId = omitKeys(safePayload, ["firebaseId"]);
  const res = await fetch(USERS_DELETED_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      major: safeMajor,
      deletedAt: Date.now(),
      deletedBy: safeBy,
      ...withoutFirebaseId,
    }),
  });
  if (!res.ok)
    throw new Error(`Remote deleted_users POST failed: ${res.status}`);
  return safeJsonResponse(res);
}

export async function addUserRemoteArchived({
  firebaseId,
  major,
  payload,
  archivedBy,
} = {}) {
  const safeMajor = String(major || "").trim() || null;
  const safeBy = String(archivedBy || "").trim() || null;
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const safeId = String(firebaseId || "").trim() || null;
  const res = await fetch(USERS_ARCHIVED_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      major: safeMajor,
      ...(safeId ? { firebaseId: safeId } : {}),
      archivedAt: Date.now(),
      archivedBy: safeBy,
      ...safePayload,
    }),
  });
  if (!res.ok)
    throw new Error(`Remote archived_users POST failed: ${res.status}`);
  return safeJsonResponse(res);
}
