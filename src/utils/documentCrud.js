import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

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
