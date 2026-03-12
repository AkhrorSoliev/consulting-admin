const EMAIL_API_BASE = "https://json-api.uz/api/project/consultinguz";
const UPLOAD_DELETE_ENDPOINT = `${EMAIL_API_BASE}/upload/delete`;
const USERS_ALL_ENDPOINT = `${EMAIL_API_BASE}/all_users`;
const USERS_DELETED_ENDPOINT = `${EMAIL_API_BASE}/deleted_users`;
const USERS_ARCHIVED_ENDPOINT = `${EMAIL_API_BASE}/archived_users`;
const ALL_EMAILS_ENDPOINT_PRIMARY = `${EMAIL_API_BASE}/all_Emails`;
const ALL_EMAILS_ENDPOINT_FALLBACK = `${EMAIL_API_BASE}/all_emails`;

function omitKeys(obj, keys) {
  const source = obj && typeof obj === "object" ? obj : {};
  const set = new Set(Array.isArray(keys) ? keys : []);
  const out = {};
  Object.keys(source).forEach((k) => {
    if (!set.has(k)) out[k] = source[k];
  });
  return out;
}

async function safeJsonResponse(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

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

// ---- Email/Passport validation (remote API) ----

export async function checkEmailRemote(email) {
  const safeEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!safeEmail) return { exists: false };

  const tryGet = async (base) => {
    const url = `${base}?email=${encodeURIComponent(safeEmail)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    const match =
      list.find(
        (item) =>
          String(item?.email || "")
            .trim()
            .toLowerCase() === safeEmail,
      ) || null;
    return { ok: true, status: 200, data: match };
  };

  const a = await tryGet(ALL_EMAILS_ENDPOINT_PRIMARY);
  if (a.ok) return a.data ? { exists: true, data: a.data } : { exists: false };
  const b = await tryGet(ALL_EMAILS_ENDPOINT_FALLBACK);
  if (b.ok) return b.data ? { exists: true, data: b.data } : { exists: false };
  throw new Error(
    `E-Mail Prüfung fehlgeschlagen: ${a.status || b.status || "unknown"}`,
  );
}

export async function checkPassportRemote(passportNumber) {
  const safePassport = String(passportNumber || "")
    .trim()
    .toUpperCase();
  if (!safePassport) return { exists: false };

  const res = await fetch(`${EMAIL_API_BASE}/all_Emails`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Passnummer Prüfung fehlgeschlagen: ${res.status}`);
  }
  const json = await res.json().catch(() => ({}));
  const list = Array.isArray(json?.data) ? json.data : [];
  const match =
    list.find((item) => {
      const p =
        item?.passportId ??
        item?.passport ??
        item?.passportNumber ??
        item?.reisepass ??
        item?.reisepassNummer ??
        "";
      return (
        String(p || "")
          .trim()
          .toUpperCase() === safePassport
      );
    }) || null;
  if (match) return { exists: true, data: match };
  return { exists: false };
}

// ---- Email/Passport registration (remote API) ----

export async function registerEmailRemote(email, major, passportNumber) {
  const safeEmail = String(email || "").trim();
  if (!safeEmail) return;

  const safePassportId = String(passportNumber || "")
    .trim()
    .toUpperCase();

  const res = await fetch(ALL_EMAILS_ENDPOINT_PRIMARY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: safeEmail,
      major: String(major || "").trim() || null,
      ...(safePassportId ? { passportId: safePassportId } : {}),
    }),
  });
  if (!res.ok) {
    if (res.status === 404) {
      const res2 = await fetch(ALL_EMAILS_ENDPOINT_FALLBACK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: safeEmail,
          major: String(major || "").trim() || null,
          ...(safePassportId ? { passportId: safePassportId } : {}),
        }),
      });
      if (!res2.ok)
        throw new Error(`E-Mail Registrierung fehlgeschlagen: ${res2.status}`);
      return res2.json().catch(() => ({}));
    }
    throw new Error(`E-Mail Registrierung fehlgeschlagen: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export async function registerPassportRemote(passportNumber, major) {
  const safePassport = String(passportNumber || "")
    .trim()
    .toUpperCase();
  if (!safePassport) return;

  const res = await fetch(`${EMAIL_API_BASE}/all_Passports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      passport: safePassport,
      major: String(major || "").trim() || null,
    }),
  });
  if (res.status === 404) {
    return { ok: false, unavailable: true, status: 404 };
  }
  if (!res.ok)
    throw new Error(`Passnummer Registrierung fehlgeschlagen: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function deleteEmailRemote(email) {
  const safeEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!safeEmail) return;

  const tryDeleteById = async (baseEndpoint) => {
    const getRes = await fetch(
      `${baseEndpoint}?email=${encodeURIComponent(safeEmail)}`,
      { method: "GET" },
    );
    if (!getRes.ok) return { ok: false, status: getRes.status };
    const json = await getRes.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    const match =
      list.find(
        (item) =>
          String(item?.email || "")
            .trim()
            .toLowerCase() === safeEmail,
      ) || null;
    if (!match) return { ok: true, deleted: false, reason: "not-found" };

    const id =
      match.id ?? match._id ?? match.uuid ?? match.key ?? match.docId ?? null;
    if (id !== null && id !== undefined && String(id).trim() !== "") {
      const delRes = await fetch(
        `${baseEndpoint}/${encodeURIComponent(String(id))}`,
        { method: "DELETE" },
      );
      if (delRes.ok) return { ok: true, deleted: true, via: "id" };
      return { ok: false, status: delRes.status };
    }

    const byPropUrl = `${baseEndpoint}/by-property?property=email&value=${encodeURIComponent(
      safeEmail,
    )}&all=false`;
    const del2 = await fetch(byPropUrl, { method: "DELETE" });
    if (del2.ok) return { ok: true, deleted: true, via: "by-property" };
    return { ok: false, status: del2.status };
  };

  const a = await tryDeleteById(ALL_EMAILS_ENDPOINT_PRIMARY);
  if (a.ok) return a;
  const b = await tryDeleteById(ALL_EMAILS_ENDPOINT_FALLBACK);
  if (b.ok) return b;
  throw new Error(`E-Mail Löschung fehlgeschlagen: ${a.status || b.status}`);
}

export async function updateEmailRemote(oldEmail, newEmail, major) {
  const oldSafe = String(oldEmail || "")
    .trim()
    .toLowerCase();
  const nextSafe = String(newEmail || "")
    .trim()
    .toLowerCase();
  if (!oldSafe || !nextSafe) return;
  if (oldSafe === nextSafe) return;

  try {
    const { exists, data } = await checkEmailRemote(oldSafe);
    if (exists && data && typeof data === "object") {
      const id =
        data.id ?? data._id ?? data.uuid ?? data.key ?? data.docId ?? null;
      if (id !== null && id !== undefined && String(id).trim() !== "") {
        const res = await fetch(
          `${EMAIL_API_BASE}/all_Emails/${encodeURIComponent(String(id))}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: String(newEmail || "").trim(),
              major: String(major || "").trim() || null,
            }),
          },
        );
        if (res.ok) return res.json().catch(() => ({}));
      }
    }
  } catch {
    // ignore and fallback
  }

  try {
    await deleteEmailRemote(oldSafe);
  } catch {
    // ignore delete failure
  }
  return registerEmailRemote(String(newEmail || "").trim(), major);
}

// ---- External upload delete helpers ----

export async function deleteUploadedFileRemote(fileUrl) {
  const safeUrl = String(fileUrl || "").trim();
  if (!safeUrl) return;

  const res = await fetch(UPLOAD_DELETE_ENDPOINT, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: safeUrl }),
  });

  if (!res.ok) {
    const err = new Error(`Upload delete failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json().catch(() => ({}));
}

export async function deleteUploadedFilesRemote(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const unique = Array.from(
    new Set(
      list
        .map((u) => String(u || "").trim())
        .filter((u) => /^https?:\/\//.test(u)),
    ),
  );
  if (unique.length === 0) return [];
  return Promise.all(unique.map((u) => deleteUploadedFileRemote(u)));
}

// ---- Consulting upload URL extraction & cleanup ----

function collectHttpUrlsDeep(value, out) {
  const acc = out || new Set();
  if (!value) return acc;
  if (typeof value === "string") {
    const s = value.trim();
    if (/^https?:\/\//.test(s)) acc.add(s);
    return acc;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectHttpUrlsDeep(v, acc));
    return acc;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((v) => collectHttpUrlsDeep(v, acc));
  }
  return acc;
}

export function extractConsultingUploadUrlsFromSnapshot(snapshot) {
  const urls = Array.from(collectHttpUrlsDeep(snapshot, new Set()));
  return urls.filter((u) => {
    const s = String(u || "").trim();
    const lower = s.toLowerCase();
    if (!/^https?:\/\//.test(s)) return false;

    if (lower.includes("firebasestorage.googleapis.com")) return true;

    if (!lower.includes("json-api.uz")) return false;

    let url;
    try {
      url = new URL(s);
    } catch {
      return false;
    }
    const host = String(url.hostname || "").toLowerCase();
    if (!host.endsWith("json-api.uz")) return false;
    const path = String(url.pathname || "").toLowerCase();

    const blocked = [
      "/upload/delete",
      "/all_users",
      "/deleted_users",
      "/archived_users",
      "/all_emails",
      "/all_passports",
    ];
    if (blocked.some((p) => path.includes(p))) return false;

    if (path.endsWith("/upload")) return false;

    const looksLikeProjectScoped =
      path.includes("/api/project/consultinguz/") ||
      lower.includes("consultinguz");
    const looksLikeStorageFile =
      path.startsWith("/mt/") ||
      path.startsWith("/mnt/") ||
      path.includes("/uploads/") ||
      path.includes("/file-");

    return looksLikeProjectScoped || looksLikeStorageFile;
  });
}

export async function deleteConsultingUploadUrlsBestEffort(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const unique = Array.from(
    new Set(list.map((u) => String(u || "").trim()).filter(Boolean)),
  );
  if (unique.length === 0) return { ok: true, deleted: 0, failed: 0 };

  const results = await Promise.allSettled(
    unique.map((u) => deleteUploadedFileRemote(u)),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  return { ok: failed === 0, deleted: unique.length - failed, failed };
}

export async function deleteConsultingUploadUrlsStrict(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const unique = Array.from(
    new Set(list.map((u) => String(u || "").trim()).filter(Boolean)),
  );
  if (unique.length === 0) {
    return { ok: true, deleted: 0 };
  }

  await Promise.all(
    unique.map((u) =>
      deleteUploadedFileRemote(u).catch((e) => {
        const err =
          e instanceof Error
            ? e
            : new Error(String(e || "Upload delete failed"));
        err.url = u;
        throw err;
      }),
    ),
  );
  return { ok: true, deleted: unique.length };
}
