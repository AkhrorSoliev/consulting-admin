import { deleteFileFromFirebase } from "./firebaseUpload";
import { deleteUploadedFileRemote } from "../remoteApi";

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
