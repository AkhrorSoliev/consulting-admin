import { useState } from "react";
import toast from "react-hot-toast";
import {
  deleteCandidateWithCurrentStats,
  getDocumentDataById,
  saveArchivedUserSnapshotFirestore,
  saveDeletedUserSnapshotFirestore,
  deleteEmailAndPassIdByEmail,
  deleteUploadedFile,
} from "../../../../utils";

/**
 * Sub-hook for candidate delete and archive logic.
 */
export function useDeleteArchive({
  resolvedMajor,
  major,
  user,
  isLimitedAdmin,
  navigate,
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  function closeDeleteModal() {
    if (isDeletingCandidate) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDeleteCandidate() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = String(deleteTarget?.id || "").trim();
    if (!colName || !itemId) return;
    try {
      setIsDeletingCandidate(true);

      // 0) Load full candidate doc so we can snapshot it into deleted_users
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 0.5) Delete all document files from Storage (Firebase + json-api)
      const docs = full?.documents || {};
      const allFileUrls = [
        ...(Array.isArray(docs.passport) ? docs.passport : []),
        ...(Array.isArray(docs.diplomas) ? docs.diplomas : []),
        ...(Array.isArray(docs.certificates) ? docs.certificates : []),
        ...(Array.isArray(docs.certificatesDetailed)
          ? docs.certificatesDetailed.map((c) => c?.url).filter(Boolean)
          : []),
      ].filter((url) => typeof url === "string" && url.trim());

      // Also collect outgoing documents
      const outgoing = full?.outgoingDocuments || {};
      const outgoingUrls = Object.values(outgoing)
        .map((d) => d?.url)
        .filter((url) => typeof url === "string" && url.trim());

      const allUrls = [...new Set([...allFileUrls, ...outgoingUrls])];

      if (allUrls.length > 0) {
        await Promise.all(
          allUrls.map((url) => deleteUploadedFile(url).catch(() => {})),
        );
      }

      // 1) Remove from Firestore email registry (`email_and_passId`)
      const emailFromDoc = String(full?.persoenlicheDaten?.email || "").trim();
      const targetEmail = String(deleteTarget?.email || emailFromDoc || "")
        .trim()
        .toLowerCase();
      if (targetEmail) {
        await deleteEmailAndPassIdByEmail(targetEmail);
      }

      // 1.5) Store deleted user snapshot in Firestore `deleted_users`
      await saveDeletedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        deletedBy: user?.email || user?.uid || "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      toast.error("Fehler beim Löschen.");
    } finally {
      setIsDeletingCandidate(false);
    }
  }

  async function confirmArchiveCandidate() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = String(deleteTarget?.id || "").trim();
    if (!colName || !itemId) return;
    try {
      setIsDeletingCandidate(true);

      // 0) Load full candidate doc (we do NOT delete uploaded file URLs here)
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 1.5) Store archived user snapshot in Firestore `archived_users`
      await saveArchivedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        archivedBy: user?.email || user?.uid || "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde archiviert.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      toast.error("Fehler beim Archivieren.");
    } finally {
      setIsDeletingCandidate(false);
    }
  }

  return {
    deleteModalOpen,
    setDeleteModalOpen,
    deleteTarget,
    setDeleteTarget,
    isDeletingCandidate,
    setIsDeletingCandidate,
    closeDeleteModal,
    confirmDeleteCandidate,
    confirmArchiveCandidate,
  };
}
