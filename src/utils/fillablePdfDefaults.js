import { db } from "../firebase/config";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export const FILLABLE_PDF_DEFAULTS_COLLECTION = "fillablePdfDefaults";

export const FILLABLE_PDF_TEMPLATE_IDS = [
  "erklaerung_beschaeftigung",
  "zusatzblatt_a",
  "zusatzblatt_b",
  "zusatzblatt_c",
  "zusatzblatt_d",
];

export const FILLABLE_PDF_TEMPLATE_LABELS = {
  erklaerung_beschaeftigung: "Erklärung zum Beschäftigungsverhältnis",
  zusatzblatt_a: "Zusatzblatt A - Anerkennungsverfahren",
  zusatzblatt_b: "Zusatzblatt B - ICT / Personalaustausch",
  zusatzblatt_c: "Zusatzblatt C - Berufskraftfahrer",
  zusatzblatt_d: "Zusatzblatt D - Kurzfristige Beschäftigung",
};

export function subscribeToFillablePdfDefaults(callback) {
  const colRef = collection(db, FILLABLE_PDF_DEFAULTS_COLLECTION);
  return onSnapshot(colRef, (snap) => {
    const map = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data();
    });
    callback(map);
  });
}

export async function getFillablePdfDefaults(templateId) {
  if (!templateId) return null;
  const ref = doc(db, FILLABLE_PDF_DEFAULTS_COLLECTION, templateId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveFillablePdfDefaults(templateId, data) {
  if (!templateId) throw new Error("Template ID is required.");
  const ref = doc(db, FILLABLE_PDF_DEFAULTS_COLLECTION, templateId);
  await setDoc(ref, { ...data, updatedAt: Date.now() }, { merge: true });
  return { id: templateId };
}

export async function clearFillablePdfDefaults(templateId) {
  if (!templateId) return { id: "" };
  const ref = doc(db, FILLABLE_PDF_DEFAULTS_COLLECTION, templateId);
  await deleteDoc(ref);
  return { id: templateId };
}
