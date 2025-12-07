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
} from "firebase/firestore";

export async function createCollection(name) {
  try {
    // Normalize name defensively here as well; we only add meta now
    const normalizedName = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (!normalizedName) {
      toast.error("Der Name des Berufsfelds darf nicht leer sein.");
      return { created: false, reason: "empty" };
    }

    // Check existence in meta collection (doc id = normalizedName)
    const metaDocRef = doc(db, "meta", normalizedName);
    const metaDocSnap = await getDoc(metaDocRef);
    if (metaDocSnap.exists()) {
      toast.error(`„${normalizedName}“ ist bereits vorhanden.`);
      return { created: false, reason: "exists" };
    }

    // Only add a meta document; do NOT create the actual collection here
    await setDoc(metaDocRef, {
      name: normalizedName,
      createdAt: Date.now(),
    });

    toast.success(`„${normalizedName}“ wurde zur Meta-Liste hinzugefügt!`);
    return { created: true, name: normalizedName };
  } catch (error) {
    toast.error(`Fehler: ${error.message}`);
    console.error("createCollection error:", error);
    return { created: false, reason: "error", error };
  }
}

export function subscribeToCollections(callback) {
  try {
    // Listen to documents inside "meta" collection and map to names
    const metaColRef = collection(db, "meta");
    const q = query(metaColRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const names = snapshot.docs
        .map((d) => d.data()?.name)
        .filter((n) => typeof n === "string" && n.trim().length > 0);
      callback(names);
    });

    return unsubscribe;
  } catch (error) {
    console.error("subscribeToCollections error:", error);
  }
}

export async function deleteCollectionByName(name) {
  try {
    const colRef = collection(db, name);
    const docsSnapshot = await getDocs(colRef);

    const deletePromises = docsSnapshot.docs.map((d) =>
      deleteDoc(doc(db, name, d.id))
    );
    await Promise.all(deletePromises);

    // Remove meta document entry
    const metaDocRef = doc(db, "meta", name);
    await deleteDoc(metaDocRef);

    toast.success(`Sammlung „${name}“ wurde gelöscht!`);
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
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
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
      else if (typeof parsed.data?.url === "string") urlCandidate = parsed.data.url;
      else if (typeof parsed.data?.link === "string") urlCandidate = parsed.data.link;
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
