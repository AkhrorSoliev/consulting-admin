import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { uploadFileToFirebase, deleteUploadedFile } from "../../../utils";

const FALLBACK_COLLECTIONS = [
  "krankenpfleger",
  "altenpfleger",
  "pflegefachkraft",
  "kinderkrankenpfleger",
  "uy-quruvchisi-fachkraft-2026",
];

export async function findCandidateInCollections(db, id, collections) {
  for (const col of collections) {
    try {
      const candidateRef = doc(db, col, id);
      const candidateSnap = await getDoc(candidateRef);
      if (candidateSnap.exists()) {
        return col;
      }
    } catch {
      // Continue to next collection
    }
  }
  return null;
}

export async function resolveCandidateCollectionById(db, id) {
  const metadataRef = doc(db, "candidate_metadata", id);
  const metadataSnap = await getDoc(metadataRef);

  if (metadataSnap.exists()) {
    const metadata = metadataSnap.data() || {};
    return {
      collectionName: metadata.collectionName || null,
      allowDelete: metadata.allowIncomingDelete !== false,
    };
  }

  try {
    const metaSnapshot = await getDocs(collection(db, "meta"));
    const collections = metaSnapshot.docs
      .map((d) => d.data()?.collectionName || d.id)
      .filter(Boolean);
    const collectionName = await findCandidateInCollections(db, id, collections);
    return { collectionName, allowDelete: true };
  } catch {
    const collectionName = await findCandidateInCollections(
      db,
      id,
      FALLBACK_COLLECTIONS,
    );
    return { collectionName, allowDelete: true };
  }
}

export async function getCandidateData(db, collectionName, id) {
  const candidateRef = doc(db, collectionName, id);
  const candidateSnap = await getDoc(candidateRef);
  if (!candidateSnap.exists()) return null;
  return candidateSnap.data() || null;
}

export function subscribeAllowIncomingDelete(db, id, onValue, onError) {
  const metadataRef = doc(db, "candidate_metadata", id);
  return onSnapshot(
    metadataRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const metadata = snapshot.data() || {};
      onValue(metadata.allowIncomingDelete !== false);
    },
    onError,
  );
}

export async function uploadIncomingDocument(file, fileName) {
  const renamedFile = new File([file], fileName, { type: file.type });
  return uploadFileToFirebase(renamedFile, "incoming");
}

export async function updateIncomingDocuments(
  db,
  collectionName,
  id,
  incomingDocuments,
) {
  await updateDoc(doc(db, collectionName, id), { incomingDocuments });
}

export async function deleteIncomingDocumentFile(url) {
  await deleteUploadedFile(url);
}

export async function downloadViaProxy(url, fileName) {
  const proxyUrl = `https://us-central1-consulting-bdb74.cloudfunctions.net/downloadProxy?url=${encodeURIComponent(
    url,
  )}&filename=${encodeURIComponent(fileName || "document.pdf")}`;

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName || "document.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export function openInNewTab(url) {
  window.open(url, "_blank");
}
