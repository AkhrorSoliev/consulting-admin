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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
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
    const normalizedName = rawTitle
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

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

    toast.success(`„${rawTitle || normalizedName}“ wurde zur Meta-Liste hinzugefügt!`);
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
    query(
      collection(db, "meta"),
      where("collectionName", "==", safe),
      limit(1)
    )
  );
  if (!byNameSnap.empty) {
    return normalizeMajorMeta(byNameSnap.docs[0]);
  }

  return null;
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
        .filter((n) => typeof n.collectionName === "string" && n.collectionName.trim().length > 0);
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

export async function checkEmailRemote(email) {
  const safeEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!safeEmail) return { exists: false };

  const url = `${EMAIL_API_BASE}/all_Emails?email=${encodeURIComponent(
    safeEmail
  )}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`E-Mail Prüfung fehlgeschlagen: ${res.status}`);
  }
  const json = await res.json();
  const list = Array.isArray(json?.data) ? json.data : [];
  const match =
    list.find(
      (item) =>
        String(item?.email || "")
          .trim()
          .toLowerCase() === safeEmail
    ) || null;
  if (match) return { exists: true, data: match };
  return { exists: false };
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

export async function registerEmailRemote(email, major, passportNumber) {
  const safeEmail = String(email || "").trim();
  if (!safeEmail) return;

  const safePassportId = String(passportNumber || "")
    .trim()
    .toUpperCase();

  const res = await fetch(`${EMAIL_API_BASE}/all_Emails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: safeEmail,
      major: String(major || "").trim() || null,
      ...(safePassportId ? { passportId: safePassportId } : {}),
    }),
  });
  if (!res.ok) {
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
  if (!res.ok) throw new Error(`Passnummer Registrierung fehlgeschlagen: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function deleteEmailRemote(email) {
  const safeEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!safeEmail) return;

  const url = `${EMAIL_API_BASE}/all_Emails/by-property?property=email&value=${encodeURIComponent(
    safeEmail
  )}&all=false`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`E-Mail Löschung fehlgeschlagen: ${res.status}`);
  }
  return res.json().catch(() => ({}));
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
