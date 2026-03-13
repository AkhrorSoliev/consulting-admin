import { UPLOAD_DELETE_ENDPOINT } from "./constants";

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
