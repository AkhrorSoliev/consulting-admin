import toast from "react-hot-toast";
import { db } from "../../../firebase/config";
import { deleteDoc, doc } from "firebase/firestore";
import {
  addCandidateWithDualStats,
  upsertEmailAndPassIdFirestore,
} from "../../../utils";
import {
  extractEmailFromSnapshot,
  extractPassportIdFromSnapshot,
  stripDeletedUserMetaForRestore,
} from "./utils";

export async function executeRestore(record, c) {
  const major = String(c.majorKey || "").trim();
  if (!major) throw new Error("major is missing on deleted snapshot");
  const majorLabel = String(c.majorLabel || "").trim() || major;
  const payload = stripDeletedUserMetaForRestore(record);

  const previousMajor = String(
    record?.sourceMajor || record?.major || "",
  ).trim();
  const previousMajorTitle =
    String(record?.sourceMajorTitle || "").trim() || previousMajor;
  const directionHistory = Array.isArray(payload.directionHistory)
    ? [...payload.directionHistory]
    : [];

  if (previousMajor) {
    directionHistory.push({
      major: previousMajor,
      majorTitle: previousMajorTitle,
      movedAt: Date.now(),
      movedToMajor: major,
    });
  }

  const oldRegistrationDate =
    payload.registrationDate || payload.createdAt || Date.now();
  const registrationHistory = Array.isArray(payload.registrationHistory)
    ? [...payload.registrationHistory]
    : [];

  if (oldRegistrationDate) {
    registrationHistory.push({
      date: oldRegistrationDate,
      major: previousMajor || "unknown",
      type: "original",
    });
  }

  const newRegistrationDate = Date.now();
  const enhancedPayload = {
    ...payload,
    directionHistory,
    registrationHistory,
    registrationDate: newRegistrationDate,
    createdAt: newRegistrationDate,
    restoredAt: newRegistrationDate,
    restoredFrom: previousMajor || "unknown",
    restoredToMajor: major,
  };

  const { id: newId } = await addCandidateWithDualStats(
    major,
    enhancedPayload,
    { majorLabel },
  );

  const email = extractEmailFromSnapshot(enhancedPayload);
  const passportId = extractPassportIdFromSnapshot(enhancedPayload);
  if (email) {
    await upsertEmailAndPassIdFirestore({ email, major, passportId });
  }

  if (String(record?.id || "").trim()) {
    await deleteDoc(doc(db, "deleted_users", String(record.id).trim()));
  }

  toast.success(`Wiederhergestellt: ${major} (id=${newId})`);
}
