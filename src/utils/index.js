import toast from "react-hot-toast";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { incrementDirectionsTotal } from "./stats";

function generateUuid() {
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

function normalizeMajorMeta(docSnap) {
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

export async function createCollection(name, createdBy) {
  try {
    // Normalize name defensively here as well; we only add meta now
    const rawTitle = String(name || "").trim();
    const normalizedName = rawTitle.trim().toLowerCase().replace(/\s+/g, "-");

    if (!normalizedName) {
      toast.error("Der Name des Berufsfelds darf nicht leer sein.");
      return { created: false, reason: "empty" };
    }

    // Check existence in meta collection by collectionName/slug (avoid duplicates)
    const dupSnap = await getDocs(
      query(
        collection(db, "meta"),
        where("collectionName", "==", normalizedName),
        limit(1)
      )
    );
    if (!dupSnap.empty) {
      toast.error(`„${normalizedName}“ ist bereits vorhanden.`);
      return { created: false, reason: "exists" };
    }

    const uuid = generateUuid();
    // Doc id uses uuid to decouple URL from collection name
    const metaDocRef = doc(db, "meta", uuid);

    // Only add a meta document; do NOT create the actual collection here
    const createdBySafe = String(createdBy || "").trim() || "tizim";
    await setDoc(metaDocRef, {
      uuid,
      name: normalizedName,
      slug: normalizedName,
      collectionName: normalizedName,
      title: rawTitle || normalizedName,
      // Controls whether the public /create?major=... link should be accessible.
      // Default to active for backward compatibility.
      linkActive: true,
      createdAt: Date.now(),
      createdBy: createdBySafe,
    });

    // Cumulative stats: do not decrement on delete; only count creations.
    try {
      await incrementDirectionsTotal();
    } catch (err) {
      console.error("incrementDirectionsTotal failed:", err);
      // non-blocking: major creation should still succeed
    }

    toast.success(
      `„${rawTitle || normalizedName}“ wurde zur Meta-Liste hinzugefügt!`
    );
    return {
      created: true,
      name: normalizedName,
      uuid,
      collectionName: normalizedName,
      title: rawTitle || normalizedName,
    };
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
    console.error("createCollection error:", error);
    return { created: false, reason: "error", error };
  }
}

export async function getMetaByName(name) {
  const safe = String(name || "").trim();
  if (!safe) return null;

  // 1) Try direct doc id match (uuid or legacy slug)
  const directRef = doc(db, "meta", safe);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    return normalizeMajorMeta(directSnap);
  }

  // 2) Try lookup by uuid field
  const byUuidSnap = await getDocs(
    query(collection(db, "meta"), where("uuid", "==", safe), limit(1))
  );
  if (!byUuidSnap.empty) {
    return normalizeMajorMeta(byUuidSnap.docs[0]);
  }

  // 3) Try lookup by slug/name field (legacy)
  const byNameSnap = await getDocs(
    query(collection(db, "meta"), where("collectionName", "==", safe), limit(1))
  );
  if (!byNameSnap.empty) {
    return normalizeMajorMeta(byNameSnap.docs[0]);
  }

  return null;
}

// Live subscribe to a single meta document by either:
// - doc id (uuid/linkId)
// - uuid field
// - collectionName field (legacy)
//
// Callback receives normalized meta object or null when not found.
export function subscribeToMetaByName(name, callback, onError) {
  const safe = String(name || "").trim();
  const cb = typeof callback === "function" ? callback : () => {};
  const errCb =
    typeof onError === "function"
      ? onError
      : (e) => console.error("subscribeToMetaByName error:", e);

  if (!safe) {
    try {
      cb(null);
    } catch {
      // ignore
    }
    return () => {};
  }

  let cancelled = false;
  let unsub = null;
  let triedResolve = false;

  function cleanup() {
    cancelled = true;
    try {
      unsub?.();
    } catch {
      // ignore
    }
    unsub = null;
  }

  function subscribeDocId(docId) {
    const id = String(docId || "").trim();
    if (!id) return;
    const ref = doc(db, "meta", id);
    unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          cb(null);
          return;
        }
        cb(normalizeMajorMeta(snap));
      },
      (e) => {
        if (cancelled) return;
        errCb(e);
      }
    );
  }

  // First: try subscribing as direct doc id (fast path).
  // If it doesn't exist, resolve once via queries and resubscribe to the real doc id.
  // This avoids requiring a page refresh when meta fields are edited in Settings.
  const directRef = doc(db, "meta", safe);
  unsub = onSnapshot(
    directRef,
    (snap) => {
      if (cancelled) return;
      if (snap.exists()) {
        cb(normalizeMajorMeta(snap));
        return;
      }

      if (triedResolve) {
        cb(null);
        return;
      }
      triedResolve = true;

      (async () => {
        try {
          const resolved = await getMetaByName(safe);
          if (cancelled) return;
          const targetId = String(resolved?.id || "").trim();
          if (targetId && targetId !== safe) {
            // Switch subscription to the resolved doc id.
            try {
              unsub?.();
            } catch {
              // ignore
            }
            unsub = null;
            subscribeDocId(targetId);
          } else {
            cb(null);
          }
        } catch (e) {
          if (!cancelled) errCb(e);
        }
      })();
    },
    (e) => {
      if (!cancelled) errCb(e);
    }
  );

  return cleanup;
}

export async function updateMetaByName(name, data) {
  const safe = String(name || "").trim();
  if (!safe) throw new Error("updateMetaByName: name is empty");
  const resolved = await getMetaByName(safe);
  const targetId = resolved?.id || safe;
  const metaDocRef = doc(db, "meta", targetId);
  await updateDoc(metaDocRef, data);
  return { id: targetId };
}

export function subscribeToCollections(callback) {
  try {
    // Listen to documents inside "meta" collection and map to names
    const metaColRef = collection(db, "meta");
    const q = query(metaColRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => normalizeMajorMeta(d))
        .filter(
          (n) =>
            typeof n.collectionName === "string" &&
            n.collectionName.trim().length > 0
        );
      callback(list);
    });

    return unsubscribe;
  } catch (error) {
    console.error("subscribeToCollections error:", error);
  }
}

export async function deleteCollectionByName(name) {
  try {
    const meta = await getMetaByName(name);
    const colName = meta?.collectionName || name;
    const metaId = meta?.id || name;
    const colRef = collection(db, colName);
    const docsSnapshot = await getDocs(colRef);

    const deletePromises = docsSnapshot.docs.map((d) =>
      deleteDoc(doc(db, colName, d.id))
    );
    await Promise.all(deletePromises);

    // Remove meta document entry
    const metaDocRef = doc(db, "meta", metaId);
    await deleteDoc(metaDocRef);

    toast.success(`Sammlung „${colName}“ wurde gelöscht!`);
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
    console.error("deleteCollectionByName error:", error);
  }
}

// Convert an image File to a high-quality Base64 data URL.
// Options:
// - maxWidth/maxHeight: downscale large images while preserving aspect ratio
// - quality: JPEG quality (0.0 - 1.0)
// - mimeType: output type ("image/jpeg" or "image/png")
export async function imageFileToBase64(
  file,
  {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.9,
    mimeType = "image/jpeg",
  } = {}
) {
  if (!(file instanceof File)) {
    throw new Error("imageFileToBase64: file must be a File");
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Create image and draw to canvas for optional resize/compress
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  let targetWidth = img.width;
  let targetHeight = img.height;

  // Preserve aspect ratio while fitting within bounds
  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const widthRatio = maxWidth / targetWidth;
    const heightRatio = maxHeight / targetHeight;
    const scale = Math.min(widthRatio, heightRatio);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  // Use high quality scaling where supported
  if (ctx.imageSmoothingEnabled !== undefined) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const result = canvas.toDataURL(mimeType, quality);
  return result;
}

// Convert "dd.mm.yyyy" -> "yyyy-mm-dd" for <input type="date">
export function toInputDate(ddmmyyyy) {
  if (!ddmmyyyy || typeof ddmmyyyy !== "string") return "";
  const m = ddmmyyyy.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

// Convert "yyyy-mm-dd" -> "dd.mm.yyyy" for display/storage
export function fromInputDate(yyyymmdd) {
  if (!yyyymmdd || typeof yyyymmdd !== "string") return "";
  const m = yyyymmdd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return yyyymmdd;
  const [, yyyy, mm, dd] = m;
  return `${dd}.${mm}.${yyyy}`;
}

// Convert "dd.mm.yyyy" or "mm.yyyy" -> "yyyy-mm" for <input type="month">
export function toInputMonth(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  // Try dd.mm.yyyy
  let m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, , mm, yyyy] = m;
    return `${yyyy}-${mm}`;
  }
  // Try mm.yyyy
  m = dateStr.match(/^(\d{2})\.(\d{4})$/);
  if (m) {
    const [, mm, yyyy] = m;
    return `${yyyy}-${mm}`;
  }
  return "";
}

// Convert "yyyy-mm" -> "mm.yyyy" for display/storage
export function fromInputMonth(yyyymm) {
  if (!yyyymm || typeof yyyymm !== "string") return "";
  const m = yyyymm.match(/^(\d{4})-(\d{2})$/);
  if (!m) return yyyymm;
  const [, yyyy, mm] = m;
  return `${mm}.${yyyy}`;
}

function monthYearToSortKey(dateStr) {
  const raw = String(dateStr || "").trim();
  if (!raw) return null;
  if (raw.toLowerCase() === "bis heute") return Number.POSITIVE_INFINITY;

  // dd.mm.yyyy
  let m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, , mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
    return null;
  }

  // mm.yyyy
  m = raw.match(/^(\d{2})\.(\d{4})$/);
  if (m) {
    const [, mm, yyyy] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
    return null;
  }

  // yyyy-mm (sometimes comes from inputs)
  m = raw.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const [, yyyy, mm] = m;
    const month = Number(mm);
    const year = Number(yyyy);
    if (month >= 1 && month <= 12) return year * 12 + (month - 1);
    return null;
  }

  return null;
}

function timelineItemSortKey(item) {
  const endKey = monthYearToSortKey(item?.endDate);
  if (endKey !== null) return endKey;
  const startKey = monthYearToSortKey(item?.startDate);
  if (startKey !== null) return startKey;
  return Number.NEGATIVE_INFINITY;
}

// Sort timeline arrays (experience/education) so the most recent entry is first.
// Uses endDate first (supports "bis heute"), falls back to startDate, and keeps a stable order for ties.
export function sortTimelineItemsDesc(items) {
  if (!Array.isArray(items) || items.length <= 1)
    return Array.isArray(items) ? items : [];
  return items
    .map((item, idx) => ({
      item,
      idx,
      key: timelineItemSortKey(item),
      startKey: monthYearToSortKey(item?.startDate) ?? Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (b.key !== a.key) return b.key - a.key;
      if (b.startKey !== a.startKey) return b.startKey - a.startKey;
      return a.idx - b.idx;
    })
    .map((x) => x.item);
}

// Generate soft/pc skills based on provided CV context
export function generateSkills(cv, kind) {
  const lowerIncludes = (text, sub) =>
    String(text || "")
      .toLowerCase()
      .includes(String(sub || "").toLowerCase());

  const existingSoft = cv?.skills?.softSkills || [];
  const existingPc = cv?.skills?.pcSkills || [];

  const softPoolBase = [
    "Teamarbeit",
    "Kommunikationsfähigkeit",
    "Problemlösungsfähigkeit",
    "Zeitmanagement",
    "Selbstorganisation",
    "Verantwortungsbewusstsein",
    "Flexibilität",
    "Konfliktlösung",
    "Stressresistenz",
    "Kundenorientierung",
  ];

  const pcPoolBase = [
    "Microsoft Word",
    "Microsoft Excel",
    "Microsoft PowerPoint",
    "Google Docs",
    "Google Sheets",
    "Google Slides",
    "Microsoft Outlook",
    "Windows",
    "Internetrecherche",
    "Canva",
  ];

  const contextSoft = [];
  const contextPc = [];

  (cv?.experience || []).forEach((exp) => {
    if (lowerIncludes(exp.position, "admin")) {
      contextSoft.push("Organisationstalent");
      contextPc.push("Microsoft Excel");
    }
    if (
      lowerIncludes(exp.position, "teacher") ||
      lowerIncludes(exp.position, "o‘qit")
    ) {
      contextSoft.push("Präsentationsfähigkeit");
      contextPc.push("PowerPoint");
    }
    if (Array.isArray(exp.responsibilities)) {
      const joined = exp.responsibilities.join(" ").toLowerCase();
      if (joined.includes("mijoz") || joined.includes("kunde")) {
        contextSoft.push("Kundenkommunikation");
      }
      if (
        joined.includes("hisob") ||
        joined.includes("report") ||
        joined.includes("bericht")
      ) {
        contextPc.push("Google Sheets");
        contextPc.push("Excel (Pivot, Diagramme)");
      }
    }
  });

  (cv?.education || []).forEach((edu) => {
    if (
      lowerIncludes(edu.degree, "iqtisod") ||
      lowerIncludes(edu.degree, "wirtschaft")
    ) {
      contextPc.push("Excel (Formeln, Diagramme)");
      contextSoft.push("Analytisches Denken");
    }
    if (
      lowerIncludes(edu.institution, "universität") ||
      lowerIncludes(edu.institution, "universitet")
    ) {
      contextSoft.push("Selbstständiges Lernen");
    }
  });

  const pickNew = (pool, existing, limit = 4) => {
    const unique = [];
    const have = new Set(existing.map((s) => String(s).toLowerCase()));
    pool.forEach((item) => {
      const key = String(item).toLowerCase();
      if (
        !have.has(key) &&
        !unique.map((u) => String(u).toLowerCase()).includes(key)
      ) {
        unique.push(item);
      }
    });
    return unique.slice(0, limit);
  };

  if (kind === "soft") {
    const pool = [...contextSoft, ...softPoolBase];
    return pickNew(pool, existingSoft, 4);
  } else {
    const pool = [...contextPc, ...pcPoolBase];
    return pickNew(pool, existingPc, 4);
  }
}

// Upload a single File to consultinguz external storage and return a URL string
export async function uploadFileToConsulting(file) {
  if (!(file instanceof File)) {
    throw new Error("uploadFileToConsulting: file must be a File");
  }
  const formData = new FormData();
  // common backends accept "file" for single upload
  formData.append("file", file, file.name);
  const response = await fetch(
    "https://json-api.uz/api/project/consultinguz/upload",
    {
      method: "POST",
      body: formData,
    }
  );
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  const contentType = String(
    response.headers.get("content-type") || ""
  ).toLowerCase();
  const rawText = await response.text();
  let parsed;
  if (contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = undefined;
    }
  } else {
    // Some backends return a plain URL string as text/plain
    parsed = rawText;
  }

  // Normalize URL extraction
  let urlCandidate = null;
  if (typeof parsed === "string") {
    urlCandidate = parsed;
  } else if (parsed && typeof parsed === "object") {
    if (typeof parsed.url === "string") urlCandidate = parsed.url;
    else if (typeof parsed.link === "string") urlCandidate = parsed.link;
    else if (parsed.data) {
      if (typeof parsed.data === "string") urlCandidate = parsed.data;
      else if (typeof parsed.data?.url === "string")
        urlCandidate = parsed.data.url;
      else if (typeof parsed.data?.link === "string")
        urlCandidate = parsed.data.link;
    } else if (Array.isArray(parsed)) {
      const firstUrl = parsed.find(
        (v) => typeof v === "string" && /^https?:\/\//.test(v)
      );
      if (firstUrl) urlCandidate = firstUrl;
    }
  }

  if (!urlCandidate || !/^https?:\/\//.test(String(urlCandidate))) {
    throw new Error("Upload succeeded but response did not contain a URL.");
  }
  return String(urlCandidate);
}

// Upload multiple files and return an array of URL strings (preserves order)
export async function uploadFilesToConsulting(files) {
  if (!files) return [];
  const arr = Array.from(files).filter((f) => f instanceof File);
  if (arr.length === 0) return [];
  const results = [];
  for (const f of arr) {
    // sequential to avoid overloading remote API; can be parallel if needed
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadFileToConsulting(f);
    results.push(url);
  }
  return results;
}

// Firestore document helpers
// Add a document to a collection. If id is provided, it will be used, otherwise a random id is generated.
export async function addDocument(collectionName, data, id) {
  const colRef = collection(db, collectionName);
  const docRef = id ? doc(db, collectionName, id) : doc(colRef);
  await setDoc(docRef, data);
  return { id: docRef.id };
}

// Update a document by id with partial data
export async function updateDocument(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
  return { id };
}

// Delete a document by id
export async function deleteDocumentById(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return { id };
}

// Read a document by id (returns plain data or null)
export async function getDocumentDataById(collectionName, id) {
  const safeCol = String(collectionName || "").trim();
  const safeId = String(id || "").trim();
  if (!safeCol || !safeId) return null;
  const docRef = doc(db, safeCol, safeId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

// ---- External email API helpers ----
const EMAIL_API_BASE = "https://json-api.uz/api/project/consultinguz";
const UPLOAD_DELETE_ENDPOINT = `${EMAIL_API_BASE}/upload/delete`;
const USERS_ALL_ENDPOINT = `${EMAIL_API_BASE}/all_users`;
const USERS_DELETED_ENDPOINT = `${EMAIL_API_BASE}/deleted_users`;
const USERS_ARCHIVED_ENDPOINT = `${EMAIL_API_BASE}/archived_users`;
// json-api collections in this project historically used inconsistent casing.
// Prefer `all_Emails`, but keep a lowercase fallback to avoid 404s.
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
  // Prefer DELETE /collection/:id if supported
  const url = `${endpoint}/${encodeURIComponent(safeId)}`;
  const res = await fetch(url, { method: "DELETE" });
  if (res.ok) return safeJsonResponse(res);
  // Fallback: some json-api collections support by-property deletes
  const byPropUrl = `${endpoint}/by-property?property=id&value=${encodeURIComponent(
    safeId
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

  // Strategy (mirrors updateEmailRemote):
  // 1) GET /all_users?firebaseId=...
  // 2) If record has id, PUT /all_users/:id (full replace), fallback PATCH
  // 3) Else POST /all_users
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

        // if both failed, fall through to POST as last resort
      }
    }
  } catch (e) {
    // ignore and fallback to POST
    console.warn("upsertUserRemoteAllUsers: check/update failed:", e);
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
  // User asked: firebaseId not required for deleted (we remove from Firebase).
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
            .toLowerCase() === safeEmail
      ) || null;
    return { ok: true, status: 200, data: match };
  };

  // Prefer primary endpoint; fall back to lowercase if server is case-sensitive.
  const a = await tryGet(ALL_EMAILS_ENDPOINT_PRIMARY);
  if (a.ok) return a.data ? { exists: true, data: a.data } : { exists: false };
  const b = await tryGet(ALL_EMAILS_ENDPOINT_FALLBACK);
  if (b.ok) return b.data ? { exists: true, data: b.data } : { exists: false };
  throw new Error(
    `E-Mail Prüfung fehlgeschlagen: ${a.status || b.status || "unknown"}`
  );
}

export async function checkPassportRemote(passportNumber) {
  const safePassport = String(passportNumber || "")
    .trim()
    .toUpperCase();
  if (!safePassport) return { exists: false };

  // Passport registry is stored inside all_Emails as `passportId`.
  // json-api.uz supports GET /all_Emails (list) and GET /all_Emails?email=..., but not by-property.
  // So we list and filter client-side (best-effort; might be heavier but works with current API).
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

// ---- Firestore email/passport registry helpers ----
const EMAIL_AND_PASSID_COLLECTION = "email_and_passId";

function normalizeEmailForRegistry(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePassportIdForRegistry(passportId) {
  const raw = String(passportId || "").trim();
  if (!raw) return "";
  // Keep it compatible with existing stored values (import script uses .trim()).
  // We normalize casing and whitespace to maximize match rate.
  return raw.toUpperCase().replace(/\s+/g, " ").trim();
}

export async function checkEmailFirestore(email) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { exists: false };
  const ref = doc(db, EMAIL_AND_PASSID_COLLECTION, safeEmail);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { exists: false };
  return { exists: true, data: { id: snap.id, ...snap.data() } };
}

export async function checkPassportFirestore(passportId) {
  const safePassport = normalizePassportIdForRegistry(passportId);
  if (!safePassport) return { exists: false };
  const q = query(
    collection(db, EMAIL_AND_PASSID_COLLECTION),
    where("passportId", "==", safePassport),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return { exists: false };
  const d = snaps.docs[0];
  return { exists: true, data: { id: d.id, ...d.data() } };
}

function buildDeletedUserDocId({ major, sourceDocId }) {
  // Firestore doc ids must not contain "/". `encodeURIComponent` ensures that.
  return `${encodeURIComponent(
    String(major || "").trim()
  )}__${encodeURIComponent(String(sourceDocId || "").trim())}`;
}

function buildArchivedUserDocId({ major, sourceDocId }) {
  // Same deterministic strategy as deleted_users.
  return `${encodeURIComponent(
    String(major || "").trim()
  )}__${encodeURIComponent(String(sourceDocId || "").trim())}`;
}

function extractEmailFromCandidatePayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const email =
    p?.persoenlicheDaten?.email ??
    p?.personalInfo?.email ??
    p?.personalData?.email ??
    p?.email ??
    "";
  return String(email || "").trim();
}

export async function deleteEmailAndPassIdByEmail(email) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { ok: false, reason: "missing-email" };
  await deleteDoc(doc(db, EMAIL_AND_PASSID_COLLECTION, safeEmail));
  return { ok: true, email: safeEmail };
}

export async function upsertEmailAndPassIdFirestore({
  email,
  major,
  passportId,
} = {}) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { ok: false, reason: "missing-email" };
  const safeMajor = String(major || "").trim() || null;
  const safePassport = normalizePassportIdForRegistry(passportId);
  await setDoc(
    doc(db, EMAIL_AND_PASSID_COLLECTION, safeEmail),
    {
      email: safeEmail,
      major: safeMajor,
      ...(safePassport ? { passportId: safePassport } : {}),
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  return { ok: true, email: safeEmail };
}

export async function saveDeletedUserSnapshotFirestore({
  major,
  sourceDocId,
  payload,
  deletedBy,
  majorTitle,
} = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(sourceDocId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("saveDeletedUserSnapshotFirestore: invalid args");

  const snapshot =
    payload && typeof payload === "object" ? structuredClone(payload) : {};
  const email = extractEmailFromCandidatePayload(snapshot);

  const docId = buildDeletedUserDocId({
    major: safeMajor,
    sourceDocId: safeId,
  });
  const ref = doc(db, "deleted_users", docId);
  await setDoc(
    ref,
    {
      sourceMajor: safeMajor,
      sourceDocId: safeId,
      sourceMajorTitle: String(majorTitle || "").trim() || null,
      deletedAt: Date.now(),
      deletedBy: String(deletedBy || "").trim() || null,
      ...(email ? { email: normalizeEmailForRegistry(email) } : {}),
      ...snapshot,
    },
    { merge: true }
  );
  return { id: docId };
}

export async function saveArchivedUserSnapshotFirestore({
  major,
  sourceDocId,
  payload,
  archivedBy,
  majorTitle,
} = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(sourceDocId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("saveArchivedUserSnapshotFirestore: invalid args");

  const snapshot =
    payload && typeof payload === "object" ? structuredClone(payload) : {};
  const email = extractEmailFromCandidatePayload(snapshot);

  const docId = buildArchivedUserDocId({
    major: safeMajor,
    sourceDocId: safeId,
  });
  const ref = doc(db, "archived_users", docId);
  await setDoc(
    ref,
    {
      sourceMajor: safeMajor,
      sourceDocId: safeId,
      sourceMajorTitle: String(majorTitle || "").trim() || null,
      archivedAt: Date.now(),
      archivedBy: String(archivedBy || "").trim() || null,
      ...(email ? { email: normalizeEmailForRegistry(email) } : {}),
      ...snapshot,
    },
    { merge: true }
  );
  return { id: docId };
}

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
  // Filter to our known host/project to avoid deleting unrelated external links.
  // NOTE: Real-world file URLs can vary; keep this permissive enough to catch all consultinguz files.
  return urls.filter((u) => {
    const s = String(u || "").trim();
    const lower = s.toLowerCase();
    if (!/^https?:\/\//.test(s)) return false;
    if (!lower.includes("json-api.uz")) return false;

    // Parse to make path checks reliable (ignore query/hash).
    let url;
    try {
      url = new URL(s);
    } catch {
      return false;
    }
    const host = String(url.hostname || "").toLowerCase();
    if (!host.endsWith("json-api.uz")) return false;
    const path = String(url.pathname || "").toLowerCase();

    // Exclude known non-file API endpoints (we never want to "delete" these).
    const blocked = [
      "/upload/delete",
      "/all_users",
      "/deleted_users",
      "/archived_users",
      "/all_emails",
      "/all_passports",
    ];
    if (blocked.some((p) => path.includes(p))) return false;

    // Exclude the upload endpoint itself (POST target), just in case it appears somewhere.
    if (path.endsWith("/upload")) return false;

    // Accept either:
    // - project upload file urls (may include /api/project/consultinguz/...)
    // - direct storage urls used by the app (e.g. /mt/file-...pdf)
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
    new Set(list.map((u) => String(u || "").trim()).filter(Boolean))
  );
  if (unique.length === 0) return { ok: true, deleted: 0, failed: 0 };

  const results = await Promise.allSettled(
    unique.map((u) => deleteUploadedFileRemote(u))
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  return { ok: failed === 0, deleted: unique.length - failed, failed };
}

// Strict variant: deletes ALL urls (parallel) and throws if any delete fails.
// Use this for hard-delete flows where leaving orphaned remote files is unacceptable.
export async function deleteConsultingUploadUrlsStrict(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const unique = Array.from(
    new Set(list.map((u) => String(u || "").trim()).filter(Boolean))
  );
  if (unique.length === 0) {
    console.debug(
      "[upload-delete] No consultinguz file URLs found in snapshot."
    );
    return { ok: true, deleted: 0 };
  }

  // Promise.all to match expected behavior; enrich error with url for debugging.
  console.debug("[upload-delete] Deleting consultinguz files:", unique);
  await Promise.all(
    unique.map((u) =>
      deleteUploadedFileRemote(u).catch((e) => {
        const err =
          e instanceof Error
            ? e
            : new Error(String(e || "Upload delete failed"));
        // attach context (non-standard field, but useful in console logs)
        err.url = u;
        throw err;
      })
    )
  );
  return { ok: true, deleted: unique.length };
}

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
    // If casing is wrong on the server, retry once with the fallback.
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
  // If the endpoint doesn't exist, don't block the overall submission flow.
  if (res.status === 404) {
    console.warn(
      "[passport-registry] Endpoint missing (404). Create json-api.uz collection 'all_Passports' or update the endpoint path."
    );
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

  // Deterministic strategy (avoids noisy 404s on unsupported /by-property):
  // 1) GET by email (supported by our codebase)
  // 2) DELETE by record id (commonly supported)
  const tryDeleteById = async (baseEndpoint) => {
    const getRes = await fetch(
      `${baseEndpoint}?email=${encodeURIComponent(safeEmail)}`,
      { method: "GET" }
    );
    if (!getRes.ok) return { ok: false, status: getRes.status };
    const json = await getRes.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    const match =
      list.find(
        (item) =>
          String(item?.email || "")
            .trim()
            .toLowerCase() === safeEmail
      ) || null;
    if (!match) return { ok: true, deleted: false, reason: "not-found" };

    const id =
      match.id ?? match._id ?? match.uuid ?? match.key ?? match.docId ?? null;
    if (id !== null && id !== undefined && String(id).trim() !== "") {
      const delRes = await fetch(
        `${baseEndpoint}/${encodeURIComponent(String(id))}`,
        { method: "DELETE" }
      );
      if (delRes.ok) return { ok: true, deleted: true, via: "id" };
      return { ok: false, status: delRes.status };
    }

    // Fallback: some servers only support by-property deletes.
    const byPropUrl = `${baseEndpoint}/by-property?property=email&value=${encodeURIComponent(
      safeEmail
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
    throw new Error(`Upload delete failed: ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

export async function deleteUploadedFilesRemote(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const unique = Array.from(
    new Set(
      list
        .map((u) => String(u || "").trim())
        .filter((u) => /^https?:\/\//.test(u))
    )
  );
  if (unique.length === 0) return [];
  return Promise.all(unique.map((u) => deleteUploadedFileRemote(u)));
}

// Update an existing email in the external API (best-effort).
// Strategy:
// 1) Try to locate record by oldEmail via GET /all_Emails?email=...
// 2) If an id exists, attempt PATCH /all_Emails/:id
// 3) Fallback: delete old + create new (known supported endpoints in this codebase)
export async function updateEmailRemote(oldEmail, newEmail, major) {
  const oldSafe = String(oldEmail || "")
    .trim()
    .toLowerCase();
  const nextSafe = String(newEmail || "")
    .trim()
    .toLowerCase();
  if (!oldSafe || !nextSafe) return;
  if (oldSafe === nextSafe) return;

  // Try direct PATCH by id if API returns one
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
          }
        );
        if (res.ok) return res.json().catch(() => ({}));
      }
    }
  } catch {
    // ignore and fallback
  }

  // Fallback to known supported endpoints (delete + re-create)
  // If delete fails because record doesn't exist, we still try to register new email.
  try {
    await deleteEmailRemote(oldSafe);
  } catch {
    // ignore delete failure
  }
  return registerEmailRemote(String(newEmail || "").trim(), major);
}

// ---- Kommentar helpers (shared across Generate / Live Preview / PDF) ----
export {
  DEFAULT_COMMENT_TEMPLATE_HTML,
  hasRichTextContent,
  getCommentHtmlOrDefault,
  commentHtmlToPlainText,
} from "./commentar";

export {
  addCandidateWithStats,
  addCandidateWithDualStats,
  buildCandidateStatsIncrements,
  buildCandidateStatsIncrementsWithFactor,
  deleteCandidateWithCurrentStats,
  updateCandidateWithCurrentStats,
  updateCandidateWithDualStats,
  rebuildGlobalStatsFromExistingData,
  rebuildCurrentStatsFromExistingData,
  rebuildStatsDocsFromExistingData,
  seedBothStatsFromExistingData,
  ensureStatsDocAtLeast,
  subscribeToGlobalStats,
  subscribeToCurrentStats,
  subscribeToStatsDoc,
  STATS_COLLECTION,
  GLOBAL_STATS_DOC_ID,
  CURRENT_STATS_DOC_ID,
  statsDocRef,
} from "./stats";
