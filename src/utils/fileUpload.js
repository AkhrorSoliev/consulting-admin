import { storage } from "../firebase/config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { deleteUploadedFileRemote } from "./remoteApi";

// Convert an image File to a high-quality Base64 data URL.
export async function imageFileToBase64(
  file,
  {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.9,
    mimeType = "image/jpeg",
  } = {},
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

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  let targetWidth = img.width;
  let targetHeight = img.height;

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

  if (ctx.imageSmoothingEnabled !== undefined) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const result = canvas.toDataURL(mimeType, quality);
  return result;
}

// Upload a single File to consultinguz external storage and return a URL string
export async function uploadFileToConsulting(file) {
  if (!(file instanceof File)) {
    throw new Error("uploadFileToConsulting: file must be a File");
  }
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch(
    "https://json-api.uz/api/project/consultinguz/upload",
    {
      method: "POST",
      body: formData,
    },
  );
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  const contentType = String(
    response.headers.get("content-type") || "",
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
    parsed = rawText;
  }

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
        (v) => typeof v === "string" && /^https?:\/\//.test(v),
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
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadFileToConsulting(f);
    results.push(url);
  }
  return results;
}

// Upload a single File to Firebase Storage and return a download URL
export async function uploadFileToFirebase(file, folder = "documents") {
  if (!(file instanceof File)) {
    throw new Error("uploadFileToFirebase: file must be a File");
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${folder}/${timestamp}_${safeName}`;

  const storageRef = ref(storage, filePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

// Upload multiple files to Firebase Storage and return an array of URL strings
export async function uploadFilesToFirebase(files, folder = "documents") {
  if (!files) return [];
  const arr = Array.from(files).filter((f) => f instanceof File);
  if (arr.length === 0) return [];

  const results = [];
  for (const f of arr) {
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadFileToFirebase(f, folder);
    results.push(url);
  }
  return results;
}

// Delete a file from Firebase Storage by its download URL
export async function deleteFileFromFirebase(fileUrl) {
  const safeUrl = String(fileUrl || "").trim();
  if (!safeUrl) return;

  try {
    const url = new URL(safeUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (!pathMatch) {
      throw new Error("Invalid Firebase Storage URL format");
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (err) {
    if (err?.code === "storage/object-not-found") {
      return;
    }
    throw err;
  }
}

// Hybrid delete function - works with both Firebase Storage and json-api URLs
export async function deleteUploadedFile(fileUrl) {
  const safeUrl = String(fileUrl || "").trim();
  if (!safeUrl) return;

  if (safeUrl.includes("firebasestorage.googleapis.com")) {
    return deleteFileFromFirebase(safeUrl);
  } else if (safeUrl.includes("json-api.uz")) {
    return deleteUploadedFileRemote(safeUrl);
  }

  console.warn("deleteUploadedFile: Unknown URL format:", safeUrl);
}

// Delete multiple files (hybrid - works with both Firebase and json-api)
export async function deleteUploadedFiles(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const unique = Array.from(
    new Set(
      list
        .map((u) => String(u || "").trim())
        .filter((u) => /^https?:\/\//.test(u)),
    ),
  );
  if (unique.length === 0) return [];
  return Promise.all(unique.map((u) => deleteUploadedFile(u)));
}
