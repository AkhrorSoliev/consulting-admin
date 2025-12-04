import toast from "react-hot-toast";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  arrayRemove,
} from "firebase/firestore";

export async function createCollection(name) {
  try {
    await setDoc(doc(collection(db, name)), {
      createdAt: Date.now(),
      initialized: true,
    });

    const metaRef = doc(db, "meta", "collectionsList");

    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
      await setDoc(metaRef, {
        names: [name],
      });
    } else {
      await updateDoc(metaRef, {
        names: arrayUnion(name),
      });
    }

    toast.success(`Collection "${name}" muvaffaqiyatli yaratildi!`);
  } catch (error) {
    toast.error(`Xato yuz berdi: ${error.message}`);
    console.error("createCollection error:", error);
  }
}

export function subscribeToCollections(callback) {
  try {
    const metaRef = doc(db, "meta", "collectionsList");

    const unsubscribe = onSnapshot(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const names = snapshot.data().names || [];
        callback(names);
      } else {
        callback([]);
      }
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

    const metaRef = doc(db, "meta", "collectionsList");
    await updateDoc(metaRef, {
      names: arrayRemove(name),
    });

    toast.success(`Collection "${name}" o‘chirildi!`);
  } catch (error) {
    toast.error(`Xatolik: ${error.message}`);
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