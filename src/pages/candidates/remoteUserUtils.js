import {
  addCandidateWithDualStats,
  addUserRemoteDeleted,
  deleteRemoteUserRecord,
  registerEmailRemote,
  upsertUserRemoteAllUsers,
} from "../../utils";

export function getRemoteRecordId(record) {
  if (!record || typeof record !== "object") return "";
  return String(
    record.id ?? record._id ?? record.uuid ?? record.key ?? record.docId ?? ""
  ).trim();
}

export function resolveMajorFromRemoteRecord(record) {
  const m = String(record?.major || record?.collectionName || "").trim();
  return m;
}

export function stripRemoteMetaForRestore(record) {
  const r = record && typeof record === "object" ? record : {};
  // Remove json-api bookkeeping + our deletion/archive metadata.
  const omit = new Set([
    "id",
    "_id",
    "uuid",
    "key",
    "docId",
    "firebaseId",
    "syncedAt",
    "deletedAt",
    "deletedBy",
    "archivedAt",
    "archivedBy",
  ]);
  const out = {};
  Object.keys(r).forEach((k) => {
    if (!omit.has(k)) out[k] = r[k];
  });
  return out;
}

function pickFirstNonEmptyString(values) {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function extractEmailFromPayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  return pickFirstNonEmptyString([
    p?.persoenlicheDaten?.email,
    p?.personalInfo?.email,
    p?.personalData?.email,
    p?.email,
  ]);
}

function extractPassportIdFromPayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  return pickFirstNonEmptyString([
    // canonical (Create.jsx)
    p?.passportId,
    // legacy variations
    p?.passportID,
    p?.passportNumber,
    p?.reisepassNummer,
    // nested variants used in some forms/exports
    p?.persoenlicheDaten?.reisepassNummer,
    p?.persoenlicheDaten?.passportId,
    p?.persoenlicheDaten?.passportID,
    p?.persoenlicheDaten?.passportNumber,
    p?.personalInfo?.passportNumber,
    p?.personalInfo?.reisepassNummer,
    p?.personalData?.passportNumber,
    p?.personalData?.reisepassNummer,
  ]);
}

export async function restoreRemoteRecordToFirebase({
  kind, // "deleted" | "archived"
  record,
  restoredBy,
  majorOverride,
  majorLabel,
}) {
  const major =
    String(majorOverride || "").trim() || resolveMajorFromRemoteRecord(record);
  if (!major) throw new Error("major is missing on remote record");
  const payload = stripRemoteMetaForRestore(record);

  // During restore we must also restore the external registry entry (`all_Emails`).
  // Email is required for the registry; passportId may be missing for some users.
  const email = extractEmailFromPayload(payload);
  if (!email) throw new Error("email is missing on remote record");
  const passportId = extractPassportIdFromPayload(payload);

  // Restore into Firebase (new doc id). This increments stats (as create).
  const { id: newId } = await addCandidateWithDualStats(major, payload, {
    majorLabel: String(majorLabel || "").trim() || major,
  });

  // Sync restored doc to all_users
  await upsertUserRemoteAllUsers({
    firebaseId: newId,
    major,
    payload,
  });

  // Best-effort: register email (+passportId if available) in the remote registry.
  // We do not want a transient json-api outage to block a successful restore.
  try {
    await registerEmailRemote(email, major, passportId);
  } catch (e) {
    console.warn("restoreRemoteRecordToFirebase: registerEmailRemote failed:", e);
  }

  // Best-effort: remove remote record from its list so it disappears from the UI
  try {
    const remoteId = getRemoteRecordId(record);
    if (remoteId) await deleteRemoteUserRecord(kind, remoteId);
  } catch {
    // ignore
  }

  return { firebaseId: newId, major, restoredBy: restoredBy || null };
}

export async function moveArchivedRemoteRecordToDeleted({ record, deletedBy }) {
  const remoteId = getRemoteRecordId(record);
  if (!remoteId) throw new Error("remote record id is missing");

  const major = resolveMajorFromRemoteRecord(record) || null;
  const payload = stripRemoteMetaForRestore(record);

  await addUserRemoteDeleted({
    major,
    deletedBy: String(deletedBy || "").trim() || null,
    payload: {
      ...(major ? { major } : {}),
      ...payload,
    },
  });

  // Remove from archived list so it moves to /deleted UI.
  await deleteRemoteUserRecord("archived", remoteId);

  return { moved: true, from: "archived", to: "deleted", remoteId };
}


