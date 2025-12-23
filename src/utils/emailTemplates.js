import { db } from "../firebase/config";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export const EMAIL_TEMPLATES_COLLECTION = "emailTemplates";

export function normalizeDecision(decision) {
  return decision === "rejected" ? "rejected" : "accepted";
}

export function makeEmailTemplateId(stage, decision) {
  const s = String(stage || "").trim();
  const d = normalizeDecision(decision);
  if (!s) return "";
  return `${s}.${d}`;
}

export function toCopyOverridesFromTemplateDoc(docData) {
  if (!docData || typeof docData !== "object") return null;
  const out = {};

  if (docData.emailTitle !== undefined) out.emailTitle = String(docData.emailTitle || "");
  if (docData.statusLabel !== undefined) out.statusLabel = String(docData.statusLabel || "");
  if (docData.subject !== undefined) out.subject = String(docData.subject || "");
  if (docData.mainText !== undefined) out.mainText = String(docData.mainText || "");
  if (docData.nextStepNote !== undefined) out.nextStepNote = String(docData.nextStepNote || "");
  if (docData.channelsText !== undefined) out.channelsText = String(docData.channelsText || "");
  if (docData.emphasizeMainText !== undefined)
    out.emphasizeMainText = Boolean(docData.emphasizeMainText);

  return out;
}

export function subscribeToEmailTemplates(callback) {
  const colRef = collection(db, EMAIL_TEMPLATES_COLLECTION);
  return onSnapshot(colRef, (snap) => {
    const map = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data();
    });
    callback(map);
  });
}

export async function getEmailTemplate(stage, decision) {
  const id = makeEmailTemplateId(stage, decision);
  if (!id) return null;
  const ref = doc(db, EMAIL_TEMPLATES_COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveEmailTemplate(stage, decision, data) {
  const id = makeEmailTemplateId(stage, decision);
  if (!id) throw new Error("Email template id is empty.");
  const ref = doc(db, EMAIL_TEMPLATES_COLLECTION, id);
  await setDoc(ref, data, { merge: true });
  return { id };
}

export async function deleteEmailTemplate(stage, decision) {
  const id = makeEmailTemplateId(stage, decision);
  if (!id) return { id: "" };
  const ref = doc(db, EMAIL_TEMPLATES_COLLECTION, id);
  await deleteDoc(ref);
  return { id };
}


