import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { updateDocument, deleteUploadedFile } from "../../../utils";
import { usePdfGeneration } from "./pdfGeneration";
import { useOutgoingToggle } from "./useOutgoingToggle";

export function useOutgoingDocuments({
  docCv,
  formCv,
  addressFields,
  remoteMode,
  candidateCollection,
  candidateDocId,
  sendingStepValue,
  askContinueWithoutPassport,
}) {
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
    if (!map || typeof map !== "object" || Array.isArray(map)) return {};
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
    async (tplId) =>
      persistOutgoingDocs((current) => {
        const next = { ...current };
        delete next[tplId];
        return next;
      }),
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
          await deleteUploadedFile(url);
        } catch (err) {
          if (Number(err?.status) === 404) remoteMissing = true;
          else throw err;
        }
      }
      const persisted = await deleteOutgoingDocFromState(safeId);
      return { ok: Boolean(persisted), remoteMissing };
    },
    [getOutgoingDocState, deleteOutgoingDocFromState]
  );

  const generators = usePdfGeneration(formCv, addressFields, docCv);

  const handleToggleOutgoingDoc = useOutgoingToggle({
    remoteMode,
    formCv,
    askContinueWithoutPassport,
    outgoingBusyById,
    setOutgoingBusyById,
    getOutgoingDocState,
    persistOutgoingDocs,
    deleteOutgoingDocRemoteFirst,
    generators,
  });

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
    deleteOutgoingDocFromState,
    deleteOutgoingDocRemoteFirst,
    handleToggleOutgoingDoc,
  };
}
