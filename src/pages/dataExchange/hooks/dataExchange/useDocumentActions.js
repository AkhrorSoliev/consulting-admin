import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "../../../../firebase/config";
import {
  uploadIncomingDocument,
  updateIncomingDocuments,
  deleteIncomingDocumentFile,
  downloadViaProxy,
  openInNewTab,
} from "../../services/dataExchangeService";

/**
 * File upload, delete, and download actions.
 */
export function useDocumentActions({
  id,
  candidateData,
  outgoingDocs,
  incomingDocs,
  setIncomingDocs,
}) {
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [deletingDocs, setDeletingDocs] = useState({});

  const handleFileUpload = async (docId, file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Faqat PDF fayllariga ruxsat berilgan.");
      return;
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Fayl hajmi 2MB dan oshmasligi kerak.");
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [docId]: true }));

    try {
      const name = `${candidateData?.name || ""} ${
        candidateData?.lastName || ""
      }`.trim();
      const docTitle = outgoingDocs[docId]?.title || docId;
      const fileName = `${docTitle} - ${name}.pdf`;
      const url = await uploadIncomingDocument(file, fileName);

      const updatedIncoming = {
        ...incomingDocs,
        [docId]: {
          url,
          uploadedAt: Date.now(),
          fileName,
        },
      };

      await updateIncomingDocuments(
        db,
        candidateData.collectionName,
        id,
        updatedIncoming,
      );

      setIncomingDocs(updatedIncoming);
      toast.success("Hujjat muvaffaqiyatli yuklandi.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Hujjatni yuklashda xatolik yuz berdi.");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleFileDelete = async (docId) => {
    const incomingDoc = incomingDocs[docId];
    if (!incomingDoc?.url) return;

    setDeletingDocs((prev) => ({ ...prev, [docId]: true }));

    try {
      await deleteIncomingDocumentFile(incomingDoc.url);

      const updatedIncoming = { ...incomingDocs };
      delete updatedIncoming[docId];

      await updateIncomingDocuments(
        db,
        candidateData.collectionName,
        id,
        updatedIncoming,
      );

      setIncomingDocs(updatedIncoming);
      toast.success("Hujjat muvaffaqiyatli o'chirildi.");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Hujjatni o'chirishda xatolik yuz berdi.");
    } finally {
      setDeletingDocs((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleDownload = async (url, fileName) => {
    try {
      toast.loading("Hujjat yuklab olinmoqda...", { id: "download" });
      await downloadViaProxy(url, fileName);
      toast.success("Hujjat muvaffaqiyatli yuklab olindi", { id: "download" });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Yuklab olishda xatolik. Fayl yangi tabda ochiladi.", {
        id: "download",
      });
      openInNewTab(url);
    }
  };

  return {
    uploadingDocs,
    deletingDocs,
    handleFileUpload,
    handleFileDelete,
    handleDownload,
  };
}
