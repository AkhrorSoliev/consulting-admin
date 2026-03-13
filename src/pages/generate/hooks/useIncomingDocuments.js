import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import toast from "react-hot-toast";
import {
  getDocumentDataById,
  updateDocument,
  deleteUploadedFile,
} from "../../../utils";

/**
 * Incoming-document CRUD:
 *  - fetch/toggle allowIncomingDelete from candidate_metadata
 *  - delete an incoming document
 *  - download an incoming document
 *  - soft-delete a document (mark for deletion on save)
 */
export function useIncomingDocuments({
  candidateDocId,
  candidateCollection,
  docCv,
  setAllowIncomingDelete,
  setSavingAllowDelete,
  setDeletingIncomingDoc,
  setDocumentsMarkedForDeletion,
}) {
  // ── Fetch allowIncomingDelete from candidate_metadata ──
  useEffect(() => {
    if (!candidateDocId) return;
    const fetchMetadata = async () => {
      try {
        const metaDoc = await getDocumentDataById(
          "candidate_metadata",
          candidateDocId,
        );
        if (metaDoc && typeof metaDoc.allowIncomingDelete === "boolean") {
          setAllowIncomingDelete(metaDoc.allowIncomingDelete);
        } else {
          setAllowIncomingDelete(true);
        }
      } catch {
        setAllowIncomingDelete(true);
      }
    };
    fetchMetadata();
  }, [candidateDocId, setAllowIncomingDelete]);

  // ── Toggle allowIncomingDelete ──
  async function handleToggleAllowIncomingDelete(newValue) {
    if (!candidateDocId) return;
    setSavingAllowDelete(true);
    try {
      const metadataRef = doc(db, "candidate_metadata", candidateDocId);
      await setDoc(
        metadataRef,
        {
          allowIncomingDelete: newValue,
          collectionName: candidateCollection,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      setAllowIncomingDelete(newValue);
      toast.success(newValue ? "Löschen erlaubt" : "Löschen gesperrt");
    } catch (err) {
      console.error("Failed to update allowIncomingDelete:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setSavingAllowDelete(false);
    }
  }

  // ── Delete an incoming document ──
  async function handleDeleteIncomingDoc(docId) {
    if (!candidateDocId || !candidateCollection) return;
    const incomingDocs = docCv?.incomingDocuments || {};
    const docData = incomingDocs[docId];
    if (!docData?.url) return;

    setDeletingIncomingDoc((prev) => ({ ...prev, [docId]: true }));
    try {
      await deleteUploadedFile(docData.url);
      const updatedIncoming = { ...incomingDocs };
      delete updatedIncoming[docId];
      await updateDocument(candidateCollection, candidateDocId, {
        incomingDocuments: updatedIncoming,
      });
      toast.success("Dokument gelöscht");
    } catch (err) {
      console.error("Failed to delete incoming doc:", err);
      toast.error("Fehler beim Löschen");
    } finally {
      setDeletingIncomingDoc((prev) => ({ ...prev, [docId]: false }));
    }
  }

  // ── Download an incoming document ──
  async function handleDownloadIncomingDoc(url, fileName) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download fehlgeschlagen");
    }
  }

  // ── Soft-delete: mark document for deletion (applied on save) ──
  async function deleteDocumentRemoteFirst(url, documentType, index) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) return { ok: false, remoteMissing: false };

    setDocumentsMarkedForDeletion((prev) => ({
      ...prev,
      [documentType]: [...(prev[documentType] || []), { url, index }],
    }));

    toast.success(
      "Dokument zum Löschen markiert. Wird beim Speichern endgültig gelöscht.",
    );
    return { ok: true, remoteMissing: false };
  }

  return {
    handleToggleAllowIncomingDelete,
    handleDeleteIncomingDoc,
    handleDownloadIncomingDoc,
    deleteDocumentRemoteFirst,
  };
}
