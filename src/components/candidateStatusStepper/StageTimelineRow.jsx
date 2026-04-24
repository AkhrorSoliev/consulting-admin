import { FaEnvelope, FaRedoAlt, FaTrophy } from "react-icons/fa";
import CandidateStatusBadge from "../CandidateStatusBadge";
import {
  formatDecisionDateTime,
  resolveStageTone,
  DecisionMetaRow,
  StageDescriptionIcon,
} from "./stageTimelineHelpers.jsx";

export default function StageTimelineRow({
  step,
  idx,
  isLast,
  isCurrent,
  isCompleted,
  isSending,
  disabled,
  meta,
  onSendEmail,
  onResetStage,
  plannedLeadership = false,
  onToggleLeadership,
}) {
  const decision = meta?.decision;
  const isAccepted = decision === "accepted" && isCompleted;
  const isRejected = decision === "rejected";
  const isFinalSuccess = step.value === "stage_4" && isAccepted;
  const currentEffective = isCurrent && !isRejected;
  const showLeadershipToggle =
    step.value === "stage_2" &&
    currentEffective &&
    typeof onToggleLeadership === "function";

  const tone = resolveStageTone({
    isCurrent: currentEffective,
    isAccepted,
    isRejected,
    isFinalSuccess,
    idx,
  });

  const decidedAt = formatDecisionDateTime(meta?.decidedAt);
  const decidedBy = String(meta?.decidedBy || "").trim();
  const decisionNote = String(meta?.decisionNote || "").trim();
  const connectorCls =
    isAccepted || isFinalSuccess
      ? "bg-success/40"
      : isRejected
        ? "bg-error/30"
        : "bg-base-300";

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ring-4 transition-all ${tone.circle}`}
        >
          {tone.icon}
        </div>
        {!isLast && (
          <div className={`flex-1 w-0.5 mt-1 mb-1 ${connectorCls}`} />
        )}
      </div>

      <div
        className={`flex-1 rounded-xl border-2 p-3 sm:p-4 transition-all ${tone.card} ${
          !isLast ? "mb-2 sm:mb-3" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <CandidateStatusBadge value={step.value} />
            <StageDescriptionIcon stageValue={step.value} />
          </div>
          <DecisionMetaRow
            isAccepted={isAccepted}
            isRejected={isRejected}
            isFinalSuccess={isFinalSuccess}
            decidedAt={decidedAt}
            decidedAtMs={meta?.decidedAt}
            decidedBy={decidedBy}
          />
        </div>

        {isFinalSuccess && (
          <div className="mt-2 text-xs sm:text-sm font-semibold text-success flex items-center gap-1.5">
            <FaTrophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Kandidat erfolgreich platziert
          </div>
        )}

        {decisionNote && (isAccepted || isRejected) && (
          <div className="mt-2 p-2 rounded-md bg-base-200/60 border border-base-300 text-[11px] sm:text-xs text-base-content/80 whitespace-pre-wrap">
            <span className="font-medium">Izoh: </span>
            {decisionNote}
          </div>
        )}

        {showLeadershipToggle && (
          <div className="mt-3 p-2.5 rounded-lg bg-base-200/60 border border-base-300 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium">
                Rahbariyat bilan suhbat rejalashtirilganmi?
              </div>
              <div className="text-[11px] sm:text-xs text-base-content/60">
                Yoqilsa, qo'shimcha „2-bosqich natijasi" oralig'i paydo bo'ladi.
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-warning toggle-sm"
              checked={Boolean(plannedLeadership)}
              onChange={(e) => onToggleLeadership?.(e.target.checked)}
              disabled={disabled || isSending}
              title="Rahbariyat bilan suhbatni rejalashtirish"
            />
          </div>
        )}

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          {currentEffective && (
            <button
              type="button"
              className="btn btn-sm btn-warning"
              onClick={() => onSendEmail?.(step.value)}
              disabled={disabled || isSending}
            >
              {isSending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <FaEnvelope className="text-xs sm:text-sm" />
              )}
              <span className="text-xs sm:text-sm ml-1">E-Mail senden</span>
            </button>
          )}

          {(isAccepted || isRejected) && (
            <button
              type="button"
              className="btn btn-sm btn-outline btn-warning"
              onClick={() => onResetStage?.(step.value)}
              disabled={disabled || isSending}
              title={`${step.label} wiederholen`}
            >
              <FaRedoAlt className="text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm ml-1">Wiederholen</span>
            </button>
          )}

          {!currentEffective && !isAccepted && !isRejected && (
            <div className="text-xs sm:text-sm text-base-content/60 italic">
              Noch nicht verfügbar — vorherige Stufe abschließen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
