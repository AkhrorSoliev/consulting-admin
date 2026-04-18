import toast from "react-hot-toast";
import { deleteField } from "firebase/firestore";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
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
 * Factory for stage-meta mutation actions (reset, leadership toggle).
 * Keeps useStatusPersistence under the 200-line limit.
 */
export function createStageMetaActions({
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
}) {
  function resolveIds() {
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    return { col, docId };
  }

  function guardBusy() {
    if (sendingEmailLockRef.current || sendingStepValue) {
      toast("E-Mail-Vorgang läuft, bitte warten...");
      return true;
    }
    return false;
  }

  async function resetCandidateStages() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, die Stufen zurückzusetzen.");
      return;
    }
    if (guardBusy()) return;
    const { col, docId } = resolveIds();
    if (!col || !docId) return;

    try {
      const now = Date.now();
      const statusMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
      const by = user?.email || user?.uid || "admin";
      await updateDocument(col, docId, {
        status: {
          value: CANDIDATE_STATUS_DEFAULT,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: by,
        },
        emailMeta: {
          count: 0,
          lastSentAt: null,
          lastSentBy: null,
          lastSentType: null,
          lastSentStage: null,
          resetAt: now,
          resetBy: by,
        },
        stageMeta: deleteField(),
      });
      setStatusValue(CANDIDATE_STATUS_DEFAULT);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(by);
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
    if (guardBusy()) return;
    const { col, docId } = resolveIds();
    if (!col || !docId) return;

    try {
      const now = Date.now();
      const sMeta = getCandidateStatus(stageValue);
      const by = user?.email || user?.uid || "admin";
      const updatePayload = {
        status: {
          value: stageValue,
          label: sMeta.label,
          updatedAt: now,
          updatedBy: by,
        },
      };
      const stagesToClear = getStagesFromInclusive(stageValue);
      stagesToClear.forEach((s) => {
        updatePayload[`stageMeta.${s}`] = deleteField();
      });

      await updateDocument(col, docId, updatePayload);
      setStatusValue(stageValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(by);
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

  async function setLeadershipPlanned(planned) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Stufen anzupassen.");
      return;
    }
    const { col, docId } = resolveIds();
    if (!col || !docId) return;
    const next = Boolean(planned);
    try {
      await updateDocument(col, docId, {
        "stageMeta.stage_2.plannedLeadership": next,
      });
      setDocCv((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stageMeta: {
            ...(prev.stageMeta || {}),
            stage_2: {
              ...(prev.stageMeta?.stage_2 || {}),
              plannedLeadership: next,
            },
          },
        };
      });
    } catch (e) {
      toast.error("Fehler beim Speichern der Leadership-Einstellung.");
    }
  }

  return { resetCandidateStages, resetSingleStage, setLeadershipPlanned };
}
