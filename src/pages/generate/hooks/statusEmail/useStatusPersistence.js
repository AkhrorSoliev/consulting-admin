import { useState } from "react";
import toast from "react-hot-toast";
import {
  CANDIDATE_STATUS_DEFAULT,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../../../../constants/candidateStatus";
import { updateDocument } from "../../../../utils";
import { createStageMetaActions } from "./stageMetaActions";

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

  const { resetCandidateStages, resetSingleStage, setLeadershipPlanned } =
    createStageMetaActions({
      id,
      resolvedMajor,
      isLimitedAdmin,
      user,
      sendingEmailLockRef,
      sendingStepValue,
      setDocCv,
      setStatusValue,
      setStatusUpdatedAt,
      setStatusUpdatedBy,
    });

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
    setLeadershipPlanned,
  };
}
