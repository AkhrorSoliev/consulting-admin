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
 * Builds the `restoreFromRemoteMode` handler.
 */
export function buildRestoreFromRemoteMode({
  remoteMode,
  remoteKind,
  remoteRecord,
  archivedDocId,
  deletedDocId,
  user,
  navigate,
  restoreBusy,
  setRestoreBusy,
  setMajorModalKey,
  setMajorModalOpen,
}) {
  return async function restoreFromRemoteMode() {
    if (!remoteMode) return;
    if (restoreBusy) return;
    if (!remoteRecord) {
      toast.error("Remote-Kandidat nicht gefunden.");
      return;
    }
    try {
      setRestoreBusy(true);

      const rawMajor = String(
        remoteRecord?.sourceMajor ||
          remoteRecord?.major ||
          remoteRecord?.collectionName ||
          "",
      ).trim();

      let majorKey = rawMajor;
      let resolvedMeta = null;
      if (majorKey) {
        try {
          resolvedMeta = await getMetaByName(majorKey);
        } catch {
          resolvedMeta = null;
        }
      }

      // Always open Berufsfeld selection modal
      setMajorModalKey(majorKey || "");
      setMajorModalOpen(true);
      return;

      // Restore based on source
      if (remoteKind === "all") {
        const res = await restoreRemoteRecordToFirebase({
          kind: "all",
          record: remoteRecord,
          restoredBy: user?.email || user?.uid || "admin",
          majorOverride: resolvedMeta.collectionName,
          majorLabel: resolvedMeta.title || resolvedMeta.collectionName,
        });
        toast.success(`Wiederhergestellt: ${res.major} (ID=${res.firebaseId})`);
        navigate(
          `/generate/${resolvedMeta.linkId || res.major}/${res.firebaseId}`,
        );
        return;
      }

      if (remoteKind === "archived") {
        if (archivedDocId) {
          const majorCol = resolvedMeta.collectionName;
          const majorLabel =
            String(remoteRecord?.sourceMajorTitle || "").trim() ||
            resolvedMeta.title ||
            majorCol;
          const payload = stripArchivedUserMetaForRestore(remoteRecord);
          const { id: newId } = await addCandidateWithDualStats(
            majorCol,
            payload,
            { majorLabel },
          );

          const email = extractEmailFromSnapshot(payload);
          const passportId = extractPassportIdFromSnapshot(payload);
          if (email) {
            await upsertEmailAndPassIdFirestore({
              email,
              major: majorCol,
              passportId,
            });
          }

          await deleteDoc(doc(db, "archived_users", archivedDocId));

          toast.success(`Wiederhergestellt: ${majorCol} (ID=${newId})`);
          navigate(`/generate/${resolvedMeta.linkId || majorCol}/${newId}`);
          return;
        }

        const res = await restoreRemoteRecordToFirebase({
          kind: "archived",
          record: remoteRecord,
          restoredBy: user?.email || user?.uid || "admin",
          majorOverride: resolvedMeta.collectionName,
          majorLabel: resolvedMeta.title || resolvedMeta.collectionName,
        });
        toast.success(`Wiederhergestellt: ${res.major} (ID=${res.firebaseId})`);
        navigate(
          `/generate/${resolvedMeta.linkId || res.major}/${res.firebaseId}`,
        );
        return;
      }

      if (remoteKind === "deleted") {
        if (!deletedDocId) {
          toast.error("deletedDocId nicht gefunden.");
          return;
        }
        const majorCol = resolvedMeta.collectionName;
        const majorLabel =
          String(remoteRecord?.sourceMajorTitle || "").trim() ||
          resolvedMeta.title ||
          majorCol;
        const payload = stripDeletedUserMetaForRestore(remoteRecord);
        const { id: newId } = await addCandidateWithDualStats(
          majorCol,
          payload,
          { majorLabel },
        );

        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: majorCol,
            passportId,
          });
        }

        if (deletedDocId) {
          await deleteDoc(doc(db, "deleted_users", deletedDocId));
        }

        toast.success(`Wiederhergestellt: ${majorCol} (ID=${newId})`);
        navigate(`/generate/${resolvedMeta.linkId || majorCol}/${newId}`);
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
