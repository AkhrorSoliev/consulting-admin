import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import toast from "react-hot-toast";

/**
 * Sub-hook for document-ready and document-send flag toggling.
 */
export function useDocumentFlags({
  id,
  resolvedMajor,
  docCv,
  setDocCv,
  user,
  remoteMode,
}) {
  async function handleDocumentReady() {
    if (remoteMode) {
      toast.error("Document ready can only be set in edit mode.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();

    if (!col || !docId) {
      toast.error("Candidate information not found.");
      return;
    }

    const currentStatus = docCv?.documentReady || false;
    const newStatus = !currentStatus;

    try {
      const candidateRef = doc(db, col, docId);

      if (newStatus) {
        // Setting to ready
        await updateDoc(candidateRef, {
          documentReady: true,
          documentReadyAt: Date.now(),
          documentReadyBy: user?.email || user?.uid || "admin",
        });

        // Update local state
        setDocCv((prev) => ({
          ...prev,
          documentReady: true,
          documentReadyAt: Date.now(),
          documentReadyBy: user?.email || user?.uid || "admin",
        }));

        toast.success("Dokument als bereit markiert!");
      } else {
        // Setting to not ready
        await updateDoc(candidateRef, {
          documentReady: false,
          documentReadyAt: null,
          documentReadyBy: null,
        });

        // Update local state
        setDocCv((prev) => ({
          ...prev,
          documentReady: false,
          documentReadyAt: null,
          documentReadyBy: null,
        }));

        toast.success("Dokument als nicht bereit markiert!");
      }
    } catch (err) {
      toast.error("Error updating document ready status.");
      console.error("Error updating document ready:", err);
    }
  }

  async function handleDocumentSend() {
    if (remoteMode) {
      toast.error("Document send can only be set in edit mode.");
      return;
    }

    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();

    if (!col || !docId) {
      toast.error("Candidate information not found.");
      return;
    }

    const currentStatus = docCv?.isDocumentSend || false;
    const newStatus = !currentStatus;

    try {
      const candidateRef = doc(db, col, docId);

      if (newStatus) {
        await updateDoc(candidateRef, {
          isDocumentSend: true,
          isDocumentSendAt: Date.now(),
          isDocumentSendBy: user?.email || user?.uid || "admin",
        });

        setDocCv((prev) => ({
          ...prev,
          isDocumentSend: true,
          isDocumentSendAt: Date.now(),
          isDocumentSendBy: user?.email || user?.uid || "admin",
        }));

        toast.success("Dokument als gesendet markiert!");
      } else {
        await updateDoc(candidateRef, {
          isDocumentSend: false,
          isDocumentSendAt: null,
          isDocumentSendBy: null,
        });

        setDocCv((prev) => ({
          ...prev,
          isDocumentSend: false,
          isDocumentSendAt: null,
          isDocumentSendBy: null,
        }));

        toast.success("Dokument als nicht gesendet markiert!");
      }
    } catch (err) {
      toast.error("Error updating document send status.");
      console.error("Error updating document send:", err);
    }
  }

  return {
    handleDocumentReady,
    handleDocumentSend,
  };
}
