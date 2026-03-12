const { getDb } = require("./admin");

const EMAIL_AND_PASSID_COLLECTION = "email_and_passId";

const IGNORED_COLLECTIONS_FOR_REGISTRY = new Set([
  EMAIL_AND_PASSID_COLLECTION,
  "meta",
  "stats",
  "deleted_users",
  "all_users",
  "archived_users",
  "deleted_users_remote",
]);

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

function extractEmailFromAnyCandidateDoc(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const email =
    p?.persoenlicheDaten?.email ??
    p?.personalInfo?.email ??
    p?.personalData?.email ??
    p?.email ??
    "";
  return String(email || "").trim();
}

function extractPassportIdFromAnyCandidateDoc(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const passport =
    p?.passportId ??
    p?.passportID ??
    p?.passportNumber ??
    p?.reisepassNummer ??
    p?.persoenlicheDaten?.reisepassNummer ??
    p?.persoenlicheDaten?.passportId ??
    p?.persoenlicheDaten?.passportID ??
    p?.persoenlicheDaten?.passportNumber ??
    p?.personalInfo?.passportNumber ??
    p?.personalInfo?.reisepassNummer ??
    p?.personalData?.passportNumber ??
    p?.personalData?.reisepassNummer ??
    "";
  return String(passport || "").trim();
}

function extractTelegramIdFromAnyCandidateDoc(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const telegramId =
    p?.telegramId ??
    p?.telegram_id ??
    p?.tgId ??
    p?.persoenlicheDaten?.telegramId ??
    p?.personalInfo?.telegramId ??
    "";
  return String(telegramId || "").trim();
}

async function checkEmailRegistry(email) {
  const db = getDb();
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return { exists: false };
  const snap = await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .doc(safeEmail)
    .get();
  if (!snap.exists) return { exists: false };
  return { exists: true, data: { id: snap.id, ...snap.data() } };
}

async function checkPassportRegistry(passportId) {
  const db = getDb();
  const safePassport = normalizePassportIdForRegistry(passportId);
  if (!safePassport) return { exists: false };
  const q = await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .where("passportId", "==", safePassport)
    .limit(1)
    .get();
  if (q.empty) return { exists: false };
  const d = q.docs[0];
  return { exists: true, data: { id: d.id, ...d.data() } };
}

async function checkTelegramIdRegistry(telegramId) {
  const db = getDb();
  const safeTelegramId = String(telegramId || "").trim();
  if (!safeTelegramId) return { exists: false };
  const q = await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .where("telegramId", "==", safeTelegramId)
    .limit(1)
    .get();
  if (q.empty) return { exists: false };
  const d = q.docs[0];
  return { exists: true, data: { id: d.id, ...d.data() } };
}

async function upsertEmailPassportRegistry({ email, passportId, major }) {
  const db = getDb();
  const safeEmail = normalizeEmailForRegistry(email);
  if (!safeEmail) return;
  const safePassport = normalizePassportIdForRegistry(passportId);
  const payload = {
    email: safeEmail,
    major: String(major || "").trim() || null,
    updatedAt: Date.now(),
    ...(safePassport ? { passportId: safePassport } : {}),
  };
  await db
    .collection(EMAIL_AND_PASSID_COLLECTION)
    .doc(safeEmail)
    .set(payload, { merge: true });
}

module.exports = {
  EMAIL_AND_PASSID_COLLECTION,
  IGNORED_COLLECTIONS_FOR_REGISTRY,
  normalizeEmailForRegistry,
  normalizePassportIdForRegistry,
  extractEmailFromAnyCandidateDoc,
  extractPassportIdFromAnyCandidateDoc,
  extractTelegramIdFromAnyCandidateDoc,
  checkEmailRegistry,
  checkPassportRegistry,
  checkTelegramIdRegistry,
  upsertEmailPassportRegistry,
};
