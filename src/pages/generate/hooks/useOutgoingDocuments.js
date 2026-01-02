import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { updateDocument } from "../../../utils";

export function useOutgoingDocuments(
  candidateCollection,
  candidateDocId,
  remoteMode,
  docCv
) {
  const [outgoingDocs, setOutgoingDocs] = useState(() => ({}));
  const [outgoingBusyById, setOutgoingBusyById] = useState(() => ({}));
  const [outgoingBulkBusy, setOutgoingBulkBusy] = useState(false);
  const outgoingDocsRef = useRef({});

  useEffect(() => {
    const raw = docCv?.outgoingDocuments;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      setOutgoingDocs(raw);
      outgoingDocsRef.current = raw;
    } else {
      setOutgoingDocs({});
      outgoingDocsRef.current = {};
    }
  }, [docCv]);

  const outgoingEntries = useMemo(
    () =>
      Object.entries(outgoingDocs || {}).filter(
        ([, v]) => v && typeof v === "object" && String(v?.url || "").trim()
      ),
    [outgoingDocs]
  );

  const outgoingAnyBusy = useMemo(
    () => Object.values(outgoingBusyById || {}).some(Boolean),
    [outgoingBusyById]
  );

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

  return {
    outgoingDocs,
    setOutgoingDocs,
    outgoingBusyById,
    setOutgoingBusyById,
    outgoingBulkBusy,
    setOutgoingBulkBusy,
    outgoingDocsRef,
    outgoingEntries,
    outgoingAnyBusy,
    getOutgoingDocState,
    cloneOutgoingDocsState,
    persistOutgoingDocs,
  };
}
