import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { updateDocument, deleteUploadedFileRemote } from "../../../utils";

export function useDocumentManagement(
  candidateCollection,
  candidateDocId,
  remoteMode,
  docCv
) {
  const [outgoingDocs, setOutgoingDocs] = useState(() => ({}));
  const [outgoingBusyById, setOutgoingBusyById] = useState(() => ({}));
  const [outgoingBulkBusy, setOutgoingBulkBusy] = useState(false);
  const outgoingDocsRef = useRef({});

  const [documentsMarkedForDeletion, setDocumentsMarkedForDeletion] = useState({
    passport: [],
    diplomas: [],
    certificates: [],
  });

  const getOutgoingDocState = useCallback(
    (templateId) => {
      const key = String(templateId || "").trim();
      const raw = outgoingDocs?.[key];
      return raw && typeof raw === "object" ? raw : {};
    },
    [outgoingDocs]
  );

  const cloneOutgoingDocsState = useCallback((map) => {
    if (!map || typeof map !== "object" || Array.isArray(map)) {
      return {};
    }
    const cloned = {};
    for (const key of Object.keys(map)) {
      const value = map[key];
      cloned[key] =
        value && typeof value === "object" && !Array.isArray(value)
          ? { ...value }
          : value;
    }
    return cloned;
  }, []);

  const persistOutgoingDocs = useCallback(
    async (updater) => {
      if (remoteMode) return false;
      if (!candidateCollection || !candidateDocId) return false;

      const prevStateRaw =
        outgoingDocsRef.current &&
        typeof outgoingDocsRef.current === "object" &&
        !Array.isArray(outgoingDocsRef.current)
          ? outgoingDocsRef.current
          : {};
      const prevSnapshot = cloneOutgoingDocsState(prevStateRaw);

      const nextCandidate =
        typeof updater === "function"
          ? updater(cloneOutgoingDocsState(prevSnapshot))
          : updater || {};

      const nextState = cloneOutgoingDocsState(nextCandidate);

      outgoingDocsRef.current = nextState;
      setOutgoingDocs(nextState);

      try {
        await updateDocument(candidateCollection, candidateDocId, {
          outgoingDocuments: nextState,
          outgoingDocumentsUpdatedAt: Date.now(),
        });
        return true;
      } catch (e) {
        toast.error("Hujjatlar bo'limini saqlashda xatolik.");
        outgoingDocsRef.current = prevSnapshot;
        setOutgoingDocs(prevSnapshot);
        return false;
      }
    },
    [remoteMode, candidateCollection, candidateDocId, cloneOutgoingDocsState]
  );

  const deleteOutgoingDocFromState = useCallback(
    async (tplId) => {
      return persistOutgoingDocs((current) => {
        const next = { ...current };
        delete next[tplId];
        return next;
      });
    },
    [persistOutgoingDocs]
  );

  const deleteOutgoingDocRemoteFirst = useCallback(
    async (tplId, options = {}) => {
      const safeId = String(tplId || "").trim();
      if (!safeId) return { ok: false, remoteMissing: false };

      const currentSnapshot =
        options?.current && typeof options.current === "object"
          ? options.current
          : getOutgoingDocState(safeId);
      const url = String(
        options?.urlOverride ?? currentSnapshot?.url ?? ""
      ).trim();

      let remoteMissing = false;
      if (url) {
        try {
          await deleteUploadedFileRemote(url);
        } catch (err) {
          if (Number(err?.status) === 404) {
            remoteMissing = true;
          } else {
            throw err;
          }
        }
      }

      const persisted = await deleteOutgoingDocFromState(safeId);
      return { ok: Boolean(persisted), remoteMissing };
    },
    [getOutgoingDocState, deleteOutgoingDocFromState]
  );

  const deleteDocumentRemoteFirst = useCallback(
    async (url, documentType, index) => {
      const safeUrl = String(url || "").trim();
      if (!safeUrl) return { ok: false, remoteMissing: false };

      setDocumentsMarkedForDeletion((prev) => ({
        ...prev,
        [documentType]: [...(prev[documentType] || []), { url, index }],
      }));

      toast.success(
        "Dokument zum Löschen markiert. Wird beim Speichern endgültig gelöscht."
      );
      return { ok: true, remoteMissing: false };
    },
    []
  );

  return {
    outgoingDocs,
    setOutgoingDocs,
    outgoingBusyById,
    setOutgoingBusyById,
    outgoingBulkBusy,
    setOutgoingBulkBusy,
    outgoingDocsRef,
    documentsMarkedForDeletion,
    setDocumentsMarkedForDeletion,
    getOutgoingDocState,
    persistOutgoingDocs,
    deleteOutgoingDocFromState,
    deleteOutgoingDocRemoteFirst,
    deleteDocumentRemoteFirst,
  };
}
