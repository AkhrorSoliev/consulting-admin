import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import toast from "react-hot-toast";
import {
  addCandidateWithDualStats,
  upsertEmailAndPassIdFirestore,
  getMetaByName,
} from "../../../../utils";
import { restoreRemoteRecordToFirebase } from "../../../candidates/remoteUserUtils";
import {
  extractEmailFromSnapshot,
  extractPassportIdFromSnapshot,
  stripDeletedUserMetaForRestore,
  stripArchivedUserMetaForRestore,
} from "../../utils";

/**
 * Builds the `confirmRestoreFromModal` handler.
 */
export function buildConfirmRestoreFromModal({
  remoteKind,
  remoteRecord,
  archivedDocId,
  deletedDocId,
  user,
  navigate,
  majorModalKey,
  setRestoreBusy,
  setMajorModalOpen,
}) {
  return async function confirmRestoreFromModal() {
    if (!majorModalKey) {
      toast.error("Bitte wählen Sie zuerst einen Bereich (Major) aus.");
      return;
    }
    try {
      setRestoreBusy(true);
      const meta = await getMetaByName(majorModalKey);
      const col = String(meta?.collectionName || "").trim();
      if (!col) {
        toast.error("Bereich (Major) wurde nicht gefunden.");
        return;
      }
      setMajorModalOpen(false);

      if (remoteKind === "archived" || remoteKind === "all") {
        if (remoteKind === "all") {
          const res = await restoreRemoteRecordToFirebase({
            kind: "all",
            record: remoteRecord,
            restoredBy: user?.email || user?.uid || "admin",
            majorOverride: col,
            majorLabel: meta?.title || col,
          });
          toast.success(
            `Wiederhergestellt: ${meta?.title || res.major} (ID=${
              res.firebaseId
            })`,
          );
          navigate(`/generate/${meta.linkId || col}/${res.firebaseId}`);
          return;
        }
        if (remoteKind === "archived") {
          if (archivedDocId) {
            const majorLabel =
              String(remoteRecord?.sourceMajorTitle || "").trim() ||
              meta?.title ||
              col;
            const payload = stripArchivedUserMetaForRestore(remoteRecord);
            const { id: newId } = await addCandidateWithDualStats(
              col,
              payload,
              { majorLabel },
            );
            const email = extractEmailFromSnapshot(payload);
            const passportId = extractPassportIdFromSnapshot(payload);
            if (email) {
              await upsertEmailAndPassIdFirestore({
                email,
                major: col,
                passportId,
              });
            }
            await deleteDoc(doc(db, "archived_users", archivedDocId));
            toast.success(
              `Wiederhergestellt: ${meta?.title || col} (ID=${newId})`,
            );
            navigate(`/generate/${meta.linkId || col}/${newId}`);
            return;
          }

          const res = await restoreRemoteRecordToFirebase({
            kind: "archived",
            record: remoteRecord,
            restoredBy: user?.email || user?.uid || "admin",
            majorOverride: col,
            majorLabel: meta?.title || col,
          });
          toast.success(
            `Wiederhergestellt: ${meta?.title || res.major} (ID=${
              res.firebaseId
            })`,
          );
          navigate(`/generate/${meta.linkId || col}/${res.firebaseId}`);
          return;
        }
      }

      if (remoteKind === "deleted") {
        if (!deletedDocId) {
          toast.error("deletedDocId nicht gefunden.");
          return;
        }

        const majorLabel =
          String(remoteRecord?.sourceMajorTitle || "").trim() ||
          meta?.title ||
          col;
        const payload = stripDeletedUserMetaForRestore(remoteRecord);
        const { id: newId } = await addCandidateWithDualStats(col, payload, {
          majorLabel,
        });
        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: col,
            passportId,
          });
        }
        if (deletedDocId) {
          await deleteDoc(doc(db, "deleted_users", deletedDocId));
        }
        toast.success(`Wiederhergestellt: ${meta?.title || col} (ID=${newId})`);
        navigate(`/generate/${meta.linkId || col}/${newId}`);
        return;
      }

      toast.error("Remote-Quelle unbekannt (kind).");
    } catch (e) {
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoreBusy(false);
    }
  };
}
