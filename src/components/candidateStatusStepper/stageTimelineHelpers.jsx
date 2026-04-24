import { FaCheck, FaLock, FaTimes, FaTrophy, FaInfoCircle } from "react-icons/fa";

const STAGE_DESCRIPTIONS = {
  stage_1:
    "Ichki suhbat kutilmoqda. Bu bosqichda kandidatga ichki suhbatga taklifnoma yoki rad javobi yuboriladi.",
  stage_2:
    "Ichki suhbat natijasi. Muvaffaqiyatli o'tgan bo'lsa: to'g'ridan ish beruvchiga yoki rahbariyat bilan qo'shimcha suhbatga yo'naltiriladi.",
  stage_2_result:
    "Rahbariyat bilan suhbat natijasi. Qabul qilinsa — hujjatlar ish beruvchiga jo'natiladi; rad etilsa — kandidat yakunlanadi.",
  stage_3:
    "Ish beruvchi bilan suhbatga taklif. Suhbat sana, vaqt va havolasi kandidatga yuboriladi.",
  stage_4:
    "Ish beruvchining yakuniy qarori. Qabul qilinsa — hujjat yuklash havolasi yuboriladi va platsment yakunlanadi.",
};

export function StageDescriptionIcon({ stageValue }) {
  const description = STAGE_DESCRIPTIONS[stageValue];
  if (!description) return null;
  return (
    <span
      className="tooltip tooltip-right"
      data-tip={description}
    >
      <FaInfoCircle className="text-base-content/40 hover:text-primary cursor-help w-3.5 h-3.5" />
    </span>
  );
}

export function formatDecisionDateTime(ms) {
  if (!ms) return "";
  try {
    const d = new Date(ms);
    const date = d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} ${time}`;
  } catch {
    return "";
  }
}

export function formatRelativeTime(ms) {
  if (!ms) return "";
  const diff = Date.now() - Number(ms);
  if (diff < 0) return "";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "hozirgina";
  if (diff < hour) return `${Math.floor(diff / minute)} daqiqa oldin`;
  if (diff < day) return `${Math.floor(diff / hour)} soat oldin`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} kun oldin`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} oy oldin`;
  return `${Math.floor(diff / (365 * day))} yil oldin`;
}

export function resolveStageTone({
  isCurrent,
  isAccepted,
  isRejected,
  isFinalSuccess,
  idx,
}) {
  if (isFinalSuccess) {
    return {
      card: "border-success bg-gradient-to-br from-success/10 to-warning/10 shadow-lg",
      circle: "bg-success text-success-content ring-success/20",
      icon: <FaTrophy className="text-xs sm:text-sm" />,
    };
  }
  if (isRejected) {
    return {
      card: "border-error bg-error/5",
      circle: "bg-error text-error-content ring-error/20",
      icon: <FaTimes className="text-xs sm:text-sm" />,
    };
  }
  if (isCurrent) {
    return {
      card: "border-warning bg-warning/5 shadow-md",
      circle: "bg-warning text-warning-content ring-warning/20",
      icon: <span className="font-bold">{idx + 1}</span>,
    };
  }
  if (isAccepted) {
    return {
      card: "border-success bg-success/5",
      circle: "bg-success text-success-content ring-success/20",
      icon: <FaCheck className="text-xs sm:text-sm" />,
    };
  }
  return {
    card: "border-base-300 bg-base-100 opacity-70",
    circle: "bg-base-300 text-base-content/60 ring-base-300/30",
    icon: <FaLock className="text-[10px] sm:text-xs" />,
  };
}

export function DecisionMetaRow({
  isAccepted,
  isRejected,
  isFinalSuccess,
  decidedAt,
  decidedAtMs,
  decidedBy,
}) {
  if (!decidedAt || (!isAccepted && !isRejected)) return null;
  const toneCls = isRejected ? "text-error/90" : "text-success/90";
  const label = isFinalSuccess
    ? "Platzierung erfolgreich"
    : isRejected
      ? "Rad etildi"
      : "Qabul qilindi";
  const Icon = isRejected ? FaTimes : isFinalSuccess ? FaTrophy : FaCheck;
  const relative = formatRelativeTime(decidedAtMs);
  return (
    <div className={`text-[11px] sm:text-xs flex items-center gap-1.5 ${toneCls}`}>
      <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      <span className="font-medium">{label}</span>
      <span
        className="text-base-content/60"
        title={decidedAt}
      >
        • {relative || decidedAt}
      </span>
      {decidedBy && (
        <span
          className="text-base-content/60 truncate max-w-40 sm:max-w-56"
          title={decidedBy}
        >
          • {decidedBy}
        </span>
      )}
    </div>
  );
}
