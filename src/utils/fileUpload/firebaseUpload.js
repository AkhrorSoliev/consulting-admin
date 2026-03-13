import { storage } from "../../firebase/config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

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
