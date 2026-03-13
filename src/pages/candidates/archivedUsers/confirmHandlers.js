import toast from "react-hot-toast";
import {
  addCandidateWithDualStats,
  deleteEmailAndPassIdByEmail,
  saveDeletedUserSnapshotFirestore,
  upsertEmailAndPassIdFirestore,
} from "../../../utils";
import { db } from "../../../firebase/config";
import { deleteDoc, doc } from "firebase/firestore";
import {
  extractEmailFromSnapshot,
  extractPassportIdFromSnapshot,
  stripArchivedUserMetaForRestore,
} from "./utils";

export async function handleBulkDeleteConfirm({ confirmState, items, user, clearSelection, load }) {
  const keys = Array.isArray(confirmState.keys) ? confirmState.keys : [];
  if (keys.length === 0) return;
  let errorCount = 0;
  for (const key of keys) {
    const record = items.find((r) => String(r.id) === String(key));
    if (record) {
      try {
        const major = String(record?.sourceMajor || record?.major || "").trim();
        const sourceDocId = String(record?.sourceDocId || record?.firebaseId || "").trim();
        if (major && sourceDocId) {
          await saveDeletedUserSnapshotFirestore({
            major, sourceDocId,
            majorTitle: String(record?.sourceMajorTitle || "").trim() || major,
            deletedBy: user?.email || user?.uid || "admin",
            payload: { major, ...stripArchivedUserMetaForRestore(record) },
          });
        }
        const email = extractEmailFromSnapshot(record);
        if (email) await deleteEmailAndPassIdByEmail(String(email).trim().toLowerCase());
        await deleteDoc(doc(db, "archived_users", key));
      } catch (e) { errorCount++; }
    }
  }
  const successCount = keys.length - errorCount;
  if (successCount > 0 && errorCount === 0) toast.success(`${successCount} Kandidat(en) erfolgreich gelöscht.`);
  else if (successCount > 0) toast.success(`${successCount} Kandidat(en) gelöscht, ${errorCount} Fehler.`);
  else toast.error(`Fehler beim Löschen.`);
  clearSelection();
  await load();
}

export async function handleRestoreConfirm({ confirmState, setRestoringKey, load }) {
  const record = confirmState.record;
  const key = String(record?.id || "").trim() || "x";
  try {
    setRestoringKey(key);
    const majorCol = String(confirmState.majorKey || "").trim();
    if (!majorCol) throw new Error("major missing for restore");
    const payload = stripArchivedUserMetaForRestore(record);
    const previousMajor = String(record?.sourceMajor || record?.major || "").trim();
    const previousMajorTitle = String(record?.sourceMajorTitle || "").trim() || previousMajor;
    const directionHistory = Array.isArray(payload.directionHistory) ? [...payload.directionHistory] : [];
    if (previousMajor) {
      directionHistory.push({ major: previousMajor, majorTitle: previousMajorTitle, movedAt: Date.now(), movedToMajor: majorCol });
    }
    const oldRegistrationDate = payload.registrationDate || payload.createdAt || Date.now();
    const registrationHistory = Array.isArray(payload.registrationHistory) ? [...payload.registrationHistory] : [];
    if (oldRegistrationDate) {
      registrationHistory.push({ date: oldRegistrationDate, major: previousMajor || "unknown", type: "original" });
    }
    const newRegistrationDate = Date.now();
    const enhancedPayload = {
      ...payload, directionHistory, registrationHistory,
      registrationDate: newRegistrationDate, createdAt: newRegistrationDate,
      restoredAt: newRegistrationDate, restoredFrom: previousMajor || "unknown", restoredToMajor: majorCol,
    };
    const { id: newId } = await addCandidateWithDualStats(majorCol, enhancedPayload, {
      majorLabel: String(confirmState.majorLabel || "").trim() || majorCol,
    });
    const email = extractEmailFromSnapshot(enhancedPayload);
    const passportId = extractPassportIdFromSnapshot(enhancedPayload);
    if (email) await upsertEmailAndPassIdFirestore({ email, major: majorCol, passportId });
    await deleteDoc(doc(db, "archived_users", String(record.id).trim()));
    toast.success(`Wiederhergestellt: ${majorCol} (id=${newId})`);
    await load();
  } catch (e) { toast.error("Fehler beim Wiederherstellen."); }
  finally { setRestoringKey(""); }
}

export async function handleMoveToDeletedConfirm({ confirmState, setMovingKey, user, load }) {
  const record = confirmState.record;
  try {
    setMovingKey(String(record?.id || "").trim() || "x");
    const major = String(record?.sourceMajor || record?.major || "").trim();
    const sourceDocId = String(record?.sourceDocId || record?.firebaseId || "").trim();
    if (!major || !sourceDocId) throw new Error("archived snapshot is missing major/sourceDocId");
    const email = extractEmailFromSnapshot(record);
    if (email) await deleteEmailAndPassIdByEmail(String(email).trim().toLowerCase());
    await saveDeletedUserSnapshotFirestore({
      major, sourceDocId,
      majorTitle: String(record?.sourceMajorTitle || "").trim() || major,
      deletedBy: user?.email || user?.uid || "admin",
      payload: { major, ...stripArchivedUserMetaForRestore(record) },
    });
    await deleteDoc(doc(db, "archived_users", String(record.id).trim()));
    toast.success("In Gelöschte verschoben.");
    await load();
  } catch (e) { toast.error("Fehler beim Löschen."); }
  finally { setMovingKey(""); }
}
