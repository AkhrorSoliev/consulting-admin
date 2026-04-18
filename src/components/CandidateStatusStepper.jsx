import { useState } from "react";
import {
  CANDIDATE_STATUS_OPTIONS,
  CANDIDATE_STATUS_DEFAULT,
} from "../constants/candidateStatus";
import ConfirmActionModal from "./ConfirmActionModal";
import StageTimelineRow from "./candidateStatusStepper/StageTimelineRow";
import { FaUndo, FaEnvelope, FaRedoAlt } from "react-icons/fa";

function CandidateStatusStepper({
  currentValue = CANDIDATE_STATUS_DEFAULT,
  onSendEmail,
  sendingValue = null,
  disabled = false,
  resetStages,
  openCustomEmailModal,
  onResetStage,
  hasLeadershipInterview = false,
  stageMeta = null,
  plannedLeadership = false,
  onToggleLeadership,
}) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingResetStage, setPendingResetStage] = useState(null);
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);

  const steps = CANDIDATE_STATUS_OPTIONS.filter((step) => {
    if (step.value === "stage_2_result" && !hasLeadershipInterview) {
      return false;
    }
    return true;
  });
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.value === currentValue),
  );

  const isStageDecided = (value) =>
    stageMeta?.[value]?.decision === "accepted";

  const completedCount = steps.filter((s, idx) => {
    const decided = isStageDecided(s.value);
    return idx < currentIndex || decided;
  }).length;

  const handleResetStageClick = (stageValue) => {
    setPendingResetStage(stageValue);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    if (pendingResetStage) onResetStage?.(pendingResetStage);
    setIsResetModalOpen(false);
    setPendingResetStage(null);
  };

  const handleCloseModal = () => {
    setIsResetModalOpen(false);
    setPendingResetStage(null);
  };

  const pendingStageMeta = steps.find((s) => s.value === pendingResetStage);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Kandidatenstufen</h3>
            <p className="text-xs sm:text-sm text-base-content/70">
              Für jede Stufe E-Mail senden und entscheiden. Bei Annahme wird
              die nächste Stufe freigeschaltet.
            </p>
          </div>
          <div className="shrink-0 text-xs sm:text-sm px-3 py-1.5 rounded-full bg-base-200 font-medium">
            {completedCount}/{steps.length} bosqich tugallandi
          </div>
        </div>

        <div className="flex flex-col">
          {steps.map((step, idx) => {
            const decided = isStageDecided(step.value);
            const isCompleted = idx < currentIndex || decided;
            const isCurrent = !isCompleted && step.value === currentValue;
            const isSending = sendingValue === step.value;
            return (
              <StageTimelineRow
                key={step.value}
                step={step}
                idx={idx}
                isLast={idx === steps.length - 1}
                isCurrent={isCurrent}
                isCompleted={isCompleted}
                isSending={isSending}
                disabled={disabled}
                meta={stageMeta?.[step.value] || null}
                onSendEmail={onSendEmail}
                onResetStage={handleResetStageClick}
                plannedLeadership={plannedLeadership}
                onToggleLeadership={onToggleLeadership}
              />
            );
          })}
        </div>

        <div className="divider my-3 sm:my-4"></div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            className="btn btn-xs sm:btn-sm btn-outline btn-error"
            onClick={() => setIsResetAllModalOpen(true)}
            disabled={Boolean(sendingValue)}
            title="Alle Stufen auf Anfang (Stufe 1) zurücksetzen und E-Mail-Zähler auf 0 setzen"
          >
            <FaUndo className="text-xs sm:text-sm" />
            <span className="hidden sm:inline text-xs sm:text-sm ml-1">
              Alle Stufen zurücksetzen
            </span>
            <span className="sm:hidden text-xs ml-1">Alle zurücksetzen</span>
          </button>
          <button
            type="button"
            className="btn btn-xs sm:btn-sm btn-outline"
            onClick={openCustomEmailModal}
            disabled={Boolean(sendingValue)}
          >
            <FaEnvelope className="text-xs sm:text-sm" />
            <span className="hidden sm:inline text-xs sm:text-sm ml-1">
              Benutzerdefinierte E-Mail
            </span>
            <span className="sm:hidden text-xs ml-1">Custom E-Mail</span>
          </button>
        </div>
      </div>

      <ConfirmActionModal
        open={isResetModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmReset}
        title="Stufe wiederholen"
        message={`Möchten Sie die Stufe "${
          pendingStageMeta?.label || ""
        }" wirklich wiederholen? Alle Daten dieser und der nachfolgenden Stufen werden zurückgesetzt.`}
        confirmLabel="Wiederholen"
        confirmVariant="warning"
        confirmIcon={<FaRedoAlt />}
      />

      <ConfirmActionModal
        open={isResetAllModalOpen}
        onClose={() => setIsResetAllModalOpen(false)}
        onConfirm={() => {
          setIsResetAllModalOpen(false);
          resetStages?.();
        }}
        title="Alle Stufen zurücksetzen"
        message={
          "Barcha bosqichlar 1-bosqichga qaytariladi. Email hisoblagichi va barcha qarorlar (stageMeta) o'chiriladi. Bu amalni bekor qilib bo'lmaydi."
        }
        confirmLabel="Zurücksetzen"
        confirmVariant="btn-error"
        confirmIcon={<FaUndo />}
        seconds={3}
      />
    </div>
  );
}

export default CandidateStatusStepper;
