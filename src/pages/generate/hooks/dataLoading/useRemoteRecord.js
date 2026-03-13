import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { getRemoteUserRecord } from "../../../../utils";

/**
 * Loads a remote record (archived / deleted / all) and initializes the form
 * when in remote mode.
 */
export function useRemoteRecord({
  remoteMode,
  remoteKind,
  remoteRid,
  deletedDocId,
  archivedDocId,
  id,
  stateRemoteRecord,
  // form init deps
  setDocCv,
  setNotFound,
  setLoading,
  setFormCv,
  setFormInitialized,
  formInitializedRef,
  baselineInitializedRef,
  setSavedBaselineJson,
  normalizeForm,
  mapDocToForm,
}) {
  const [remoteRecord, setRemoteRecord] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(false);

  // Load remote record
  useEffect(() => {
    if (!remoteMode) return undefined;
    if (stateRemoteRecord) {
      setRemoteRecord(stateRemoteRecord);
      setRemoteLoading(false);
      return undefined;
    }
    setRemoteLoading(true);
    let cancelled = false;
    (async () => {
      try {
        if (remoteKind === "archived") {
          if (archivedDocId) {
            const snap = await getDoc(doc(db, "archived_users", archivedDocId));
            if (!cancelled) {
              setRemoteRecord(
                snap.exists() ? { id: snap.id, ...snap.data() } : null,
              );
            }
            return;
          }
          const rec = await getRemoteUserRecord("archived", remoteRid || id);
          if (!cancelled) setRemoteRecord(rec || null);
        } else if (remoteKind === "all") {
          const rec = await getRemoteUserRecord("all", remoteRid || id);
          if (!cancelled) setRemoteRecord(rec || null);
        } else if (remoteKind === "deleted") {
          if (!deletedDocId) {
            if (!cancelled) setRemoteRecord(null);
            return;
          }
          const snap = await getDoc(doc(db, "deleted_users", deletedDocId));
          if (!cancelled) {
            setRemoteRecord(
              snap.exists() ? { id: snap.id, ...snap.data() } : null,
            );
          }
        } else {
          if (!cancelled) setRemoteRecord(null);
        }
      } catch (e) {
        if (!cancelled) setRemoteRecord(null);
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    remoteMode,
    remoteKind,
    remoteRid,
    deletedDocId,
    archivedDocId,
    id,
    stateRemoteRecord,
  ]);

  // Remote mode form init
  useEffect(() => {
    if (!remoteMode) return undefined;
    if (remoteLoading) return undefined;

    if (!remoteRecord) {
      setDocCv(null);
      setNotFound(true);
      setLoading(false);
      return undefined;
    }

    try {
      setDocCv(remoteRecord);
      const mapped = mapDocToForm(remoteRecord);
      const normalized = normalizeForm(mapped);
      setFormCv(normalized);
      setFormInitialized(true);
      formInitializedRef.current = true;

      // Set baseline for remote mode
      if (!baselineInitializedRef.current) {
        const baseline = JSON.stringify(normalized);
        setSavedBaselineJson(baseline);
        baselineInitializedRef.current = true;
      }

      setNotFound(false);
      setLoading(false);
    } catch (e) {
      setDocCv(null);
      setNotFound(true);
      setLoading(false);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteMode, remoteLoading, remoteRecord]);

  return { remoteRecord, remoteLoading };
}
