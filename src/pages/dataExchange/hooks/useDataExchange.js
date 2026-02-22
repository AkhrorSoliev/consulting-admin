import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "../../../firebase/config";
import {
  resolveCandidateCollectionById,
  getCandidateData,
  subscribeAllowIncomingDelete,
  uploadIncomingDocument,
  updateIncomingDocuments,
  deleteIncomingDocumentFile,
  downloadViaProxy,
  openInNewTab,
} from "../services/dataExchangeService";

export function useDataExchange(id) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [outgoingDocs, setOutgoingDocs] = useState({});
  const [incomingDocs, setIncomingDocs] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [deletingDocs, setDeletingDocs] = useState({});
  const [allowDelete, setAllowDelete] = useState(true);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const findCandidate = async () => {
      try {
        const resolved = await resolveCandidateCollectionById(db, id);
        const collectionName = resolved?.collectionName || null;
        if (typeof resolved?.allowDelete === "boolean") {
          setAllowDelete(resolved.allowDelete);
        }

        if (!collectionName) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const data = await getCandidateData(db, collectionName, id);
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCandidateData({
          name: data?.persoenlicheDaten?.name || data?.personalInfo?.name || "",
          lastName:
            data?.persoenlicheDaten?.nachname ||
            data?.personalInfo?.lastName ||
            "",
          collectionName,
        });
        setOutgoingDocs(data.outgoingDocuments || {});
        setIncomingDocs(data.incomingDocuments || {});
        setLoading(false);
      } catch (error) {
        console.error("Error fetching candidate:", error);
        setNotFound(true);
        setLoading(false);
      }
    };

    findCandidate();
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    const unsubscribe = subscribeAllowIncomingDelete(
      db,
      id,
      (nextAllowDelete) => {
        setAllowDelete(nextAllowDelete);
      },
      (error) => {
        // Silently ignore permission errors for public access
        console.log(
          "[DataExchange] onSnapshot error (ignored):",
          error.message,
        );
      },
    );
    return () => unsubscribe();
  }, [id]);

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

  const candidateName = `${candidateData?.name || ""} ${
    candidateData?.lastName || ""
  }`.trim();

  const outgoingEntries = useMemo(
    () =>
      Object.entries(outgoingDocs).filter(
        ([, v]) => v && typeof v === "object" && String(v?.url || "").trim(),
      ),
    [outgoingDocs],
  );

  const outgoingEntriesWithDefaults = useMemo(
    () =>
      outgoingEntries.map(([docId, docData]) => [
        docId,
        {
          ...docData,
          acceptUpload:
            typeof docData?.acceptUpload === "boolean"
              ? docData.acceptUpload
              : true,
        },
      ]),
    [outgoingEntries],
  );

  return {
    loading,
    notFound,
    candidateName,
    outgoingEntries: outgoingEntriesWithDefaults,
    incomingDocs,
    uploadingDocs,
    deletingDocs,
    allowDelete,
    handleFileUpload,
    handleFileDelete,
    handleDownload,
  };
}

export default useDataExchange;
