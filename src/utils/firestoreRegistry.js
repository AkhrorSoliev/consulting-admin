import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  limit,
} from "firebase/firestore";

const EMAIL_AND_PASSID_COLLECTION = "email_and_passId";

function normalizeEmailForRegistry(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePassportIdForRegistry(passportId) {
  const raw = String(passportId || "").trim();
  if (!raw) return "";
  return raw.toUpperCase().replace(/\s+/g, " ").trim();
}

export async function checkEmailFirestore(email) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { exists: false };
  const ref = doc(db, EMAIL_AND_PASSID_COLLECTION, safeEmail);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { exists: false };
  return { exists: true, data: { id: snap.id, ...snap.data() } };
}

export async function checkPassportFirestore(passportId) {
  const safePassport = normalizePassportIdForRegistry(passportId);
  if (!safePassport) return { exists: false };
  const q = query(
    collection(db, EMAIL_AND_PASSID_COLLECTION),
    where("passportId", "==", safePassport),
    limit(1),
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return { exists: false };
  const d = snaps.docs[0];
  return { exists: true, data: { id: d.id, ...d.data() } };
}

export async function deleteEmailAndPassIdByEmail(email) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { ok: false, reason: "missing-email" };
  await deleteDoc(doc(db, EMAIL_AND_PASSID_COLLECTION, safeEmail));
  return { ok: true, email: safeEmail };
}

export async function upsertEmailAndPassIdFirestore({
  email,
  major,
  passportId,
} = {}) {
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { ok: false, reason: "missing-email" };
  const safeMajor = String(major || "").trim() || null;
  const safePassport = normalizePassportIdForRegistry(passportId);
  await setDoc(
    doc(db, EMAIL_AND_PASSID_COLLECTION, safeEmail),
    {
      email: safeEmail,
      major: safeMajor,
      ...(safePassport ? { passportId: safePassport } : {}),
      updatedAt: Date.now(),
    },
    { merge: true },
  );
  return { ok: true, email: safeEmail };
}

// ---- User snapshot/archive helpers ----

function buildDeletedUserDocId({ major, sourceDocId }) {
  return `${encodeURIComponent(
    String(major || "").trim(),
  )}__${encodeURIComponent(String(sourceDocId || "").trim())}`;
}

function buildArchivedUserDocId({ major, sourceDocId }) {
  return `${encodeURIComponent(
    String(major || "").trim(),
  )}__${encodeURIComponent(String(sourceDocId || "").trim())}`;
}

function extractEmailFromCandidatePayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const email =
    p?.persoenlicheDaten?.email ??
    p?.personalInfo?.email ??
    p?.personalData?.email ??
    p?.email ??
    "";
  return String(email || "").trim();
}

export async function saveDeletedUserSnapshotFirestore({
  major,
  sourceDocId,
  payload,
  deletedBy,
  majorTitle,
} = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(sourceDocId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("saveDeletedUserSnapshotFirestore: invalid args");

  const snapshot =
    payload && typeof payload === "object" ? structuredClone(payload) : {};
  const email = extractEmailFromCandidatePayload(snapshot);

  const docId = buildDeletedUserDocId({
    major: safeMajor,
    sourceDocId: safeId,
  });
  const ref = doc(db, "deleted_users", docId);
  await setDoc(
    ref,
    {
      sourceMajor: safeMajor,
      sourceDocId: safeId,
      sourceMajorTitle: String(majorTitle || "").trim() || null,
      deletedAt: Date.now(),
      deletedBy: String(deletedBy || "").trim() || null,
      ...(email ? { email: normalizeEmailForRegistry(email) } : {}),
      ...snapshot,
    },
    { merge: true },
  );
  return { id: docId };
}

export async function saveArchivedUserSnapshotFirestore({
  major,
  sourceDocId,
  payload,
  archivedBy,
  majorTitle,
} = {}) {
  const safeMajor = String(major || "").trim();
  const safeId = String(sourceDocId || "").trim();
  if (!safeMajor || !safeId)
    throw new Error("saveArchivedUserSnapshotFirestore: invalid args");

  const snapshot =
    payload && typeof payload === "object" ? structuredClone(payload) : {};
  const email = extractEmailFromCandidatePayload(snapshot);

  const docId = buildArchivedUserDocId({
    major: safeMajor,
    sourceDocId: safeId,
  });
  const ref = doc(db, "archived_users", docId);
  await setDoc(
    ref,
    {
      sourceMajor: safeMajor,
      sourceDocId: safeId,
      sourceMajorTitle: String(majorTitle || "").trim() || null,
      archivedAt: Date.now(),
      archivedBy: String(archivedBy || "").trim() || null,
      ...(email ? { email: normalizeEmailForRegistry(email) } : {}),
      ...snapshot,
    },
    { merge: true },
  );
  return { id: docId };
}
