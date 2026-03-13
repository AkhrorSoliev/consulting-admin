import { useMemo } from "react";
import { useCandidateLoader } from "./useCandidateLoader";
import { useDocumentActions } from "./useDocumentActions";

export function useDataExchange(id) {
  const {
    loading,
    notFound,
    candidateData,
    outgoingDocs,
    incomingDocs,
    setIncomingDocs,
    allowDelete,
  } = useCandidateLoader(id);

  const {
    uploadingDocs,
    deletingDocs,
    handleFileUpload,
    handleFileDelete,
    handleDownload,
  } = useDocumentActions({
    id,
    candidateData,
    outgoingDocs,
    incomingDocs,
    setIncomingDocs,
  });

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
