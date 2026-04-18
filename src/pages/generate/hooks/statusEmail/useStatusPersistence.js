import { useState } from "react";
import toast from "react-hot-toast";
import { deleteField } from "firebase/firestore";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../../../../constants/candidateStatus";
import { updateDocument } from "../../../../utils";

function getStagesFromInclusive(stageValue) {
  const idx = CANDIDATE_STATUS_OPTIONS.findIndex(
    (s) => s.value === stageValue,
  );
  if (idx === -1) return [];
  return CANDIDATE_STATUS_OPTIONS.slice(idx).map((s) => s.value);
}

/**
 * Sub-hook: status persistence, save, and reset logic.
 */
export function useStatusPersistence({
  id,
  resolvedMajor,
  isLimitedAdmin,
  user,
  docCv,
  sendingEmailLockRef,
  sendingStepValue,
  setDocCv,
}) {
  const [statusValue, setStatusValue] = useState(CANDIDATE_STATUS_DEFAULT);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  async function persistStatus(targetValue, { silent = false } = {}) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, den Status zu ändern.");
      return false;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return false;

    try {
      setIsSavingStatus(true);
      const now = Date.now();
      const normalizedValue =
        normalizeCandidateStatusValue(targetValue) || CANDIDATE_STATUS_DEFAULT;
      const statusMeta = getCandidateStatus(normalizedValue);
      await updateDocument(col, docId, {
        status: {
          value: normalizedValue,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(normalizedValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      if (!silent) {
        toast.success("Status gespeichert.");
      }
      return true;
    } catch (err) {
      if (!silent) {
        toast.error("Fehler beim Speichern des Status.");
      }
      return false;
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleStatusSave() {
    await persistStatus(statusValue, { silent: false });
  }

  async function resetCandidateStages() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, die Stufen zurückzusetzen.");
      return;
    }
    if (sendingEmailLockRef.current || sendingStepValue) {
      toast("E-Mail-Vorgang läuft, bitte warten...");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const ok = window.confirm(
      "Kandidatenstufen auf Anfang (Stufe 1) zurücksetzen?\n\nHinweis: Der E-Mail-Zähler wird ebenfalls auf 0 gesetzt.",
    );
    if (!ok) return;

    try {
      const now = Date.now();
      const statusMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
      const updatePayload = {
        status: {
          value: CANDIDATE_STATUS_DEFAULT,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
        emailMeta: {
          count: 0,
          lastSentAt: null,
          lastSentBy: null,
          lastSentType: null,
          lastSentStage: null,
          resetAt: now,
          resetBy: user?.email || user?.uid || "admin",
        },
        stageMeta: deleteField(),
      };
      await updateDocument(col, docId, updatePayload);
      setStatusValue(CANDIDATE_STATUS_DEFAULT);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      setDocCv((prev) => {
        if (!prev) return prev;
        const { stageMeta: _omit, ...rest } = prev;
        return rest;
      });
      toast.success("Stufen wurden zurückgesetzt.");
    } catch (e) {
      toast.error("Fehler beim Zurücksetzen der Stufen.");
    }
  }

  async function resetSingleStage(stageValue) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, die Stufe zurückzusetzen.");
      return;
    }
    if (sendingEmailLockRef.current || sendingStepValue) {
      toast("E-Mail-Vorgang läuft, bitte warten...");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    try {
      const now = Date.now();
      const sMeta = getCandidateStatus(stageValue);
      const updatePayload = {
        status: {
          value: stageValue,
          label: sMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      };

      const stagesToClear = getStagesFromInclusive(stageValue);
      stagesToClear.forEach((s) => {
        updatePayload[`stageMeta.${s}`] = deleteField();
      });

      await updateDocument(col, docId, updatePayload);
      setStatusValue(stageValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");

      setDocCv((prev) => {
        if (!prev) return prev;
        const nextStageMeta = { ...(prev.stageMeta || {}) };
        stagesToClear.forEach((s) => {
          delete nextStageMeta[s];
        });
        return { ...prev, stageMeta: nextStageMeta };
      });

      toast.success(`Stufe "${sMeta.label}" wurde zurückgesetzt.`);
    } catch (e) {
      toast.error("Fehler beim Zurücksetzen der Stufe.");
    }
  }

  return {
    statusValue,
    setStatusValue,
    statusUpdatedAt,
    setStatusUpdatedAt,
    statusUpdatedBy,
    setStatusUpdatedBy,
    isSavingStatus,
    persistStatus,
    handleStatusSave,
    resetCandidateStages,
    resetSingleStage,
  };
}
