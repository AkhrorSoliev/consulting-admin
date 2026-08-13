/**
 * CandidateRow - a single row of the candidate table.
 *
 * Memoized: with 500+ candidates in state, re-rendering every row on each
 * snapshot or filter change is the dominant main-thread cost.
 */

import { memo } from "react";
import {
  FaTrash, FaStar, FaCommentDots,
  FaThumbsUp, FaThumbsDown, FaEnvelope,
} from "react-icons/fa";
import { BsSendCheck } from "react-icons/bs";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import UserAvatar from "./UserAvatar";
import { formatCreatedAt, toDateFromMetaCreatedAt } from "../utils";
import { formatRatingForUi } from "../../generate/utils/ratingUtils";

const STATUS_SHORT = {
  stage_1: "1-bosqich",
  stage_2: "2-bosqich",
  stage_2_result: "2-bosqich+",
  stage_3: "3-bosqich",
  stage_4: "4-bosqich",
};

// Hoisted: building an Intl formatter per row per render is expensive.
let dateFormatter = null;
try {
  dateFormatter = new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tashkent",
  });
} catch {
  dateFormatter = null;
}

/** Format date as DD.MM.YYYY only (no time) */
function formatDateOnly(value) {
  const d = toDateFromMetaCreatedAt(value);
  if (!d) return "—";
  return dateFormatter ? dateFormatter.format(d) : d.toLocaleDateString();
}

function CandidateRow({
  item,
  rowNumber,
  emailPhoto,
  isLimitedAdmin,
  isSuperAdmin,
  isDeleting,
  onOpen,
  onReaction,
  onDelete,
}) {
  const stLabel = STATUS_SHORT[item.statusValue] || item.statusLabel;

  const emailTooltip = item.emailSentCount > 0
    ? `E-Mails: ${item.emailSentCount}${item.emailLastSentAt ? ` • Zuletzt: ${formatCreatedAt(item.emailLastSentAt)}` : ""}${item.emailLastSentByName ? ` • Von: ${item.emailLastSentByName}` : ""}`
    : "Keine E-Mails gesendet";

  const commentTooltip = item.hasComment
    ? `Kommentar${item.commentUpdatedByName ? ` von ${item.commentUpdatedByName}` : ""}${item.commentUpdatedAt ? ` • ${formatCreatedAt(item.commentUpdatedAt)}` : ""}`
    : "";

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-primary/5"
      onClick={() => onOpen(item.id)}
    >
      {/* # */}
      <td className="text-base-content/40 border-r border-base-300/50">{rowNumber}</td>

      {/* Kandidat: avatar + name */}
      <td>
        <div className="flex items-center gap-2">
          {item.photo ? (
            <div className="avatar">
              <div className="w-10 h-10 rounded-full">
                <img src={item.photo} alt={item.name} className="object-cover" loading="lazy" />
              </div>
            </div>
          ) : (
            <div className="avatar placeholder">
              <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content text-sm font-semibold">
                <span>{(item.name || "?").charAt(0).toUpperCase()}</span>
              </div>
            </div>
          )}
          <span className="font-medium truncate max-w-[200px]">
            {item.name || "Ohne Namen"}
          </span>
        </div>
      </td>

      {/* Alter */}
      <td className="text-center">{item.age ?? <span>&mdash;</span>}</td>

      {/* Status */}
      <td>
        <span className={`badge badge-sm badge-${item.statusTone}`} title={item.statusLabel}>
          {stLabel}
        </span>
      </td>

      {/* Erstellt */}
      <td className="text-center text-xs text-base-content/60">
        {formatDateOnly(item.createdAt)}
      </td>

      {/* Info: email sender, lead, doc, comment */}
      <td>
        <div className="flex items-center gap-1.5">
          {item.emailSentCount > 0 ? (
            <div className="inline-flex items-center gap-1" title={emailTooltip}>
              <UserAvatar
                photoUrl={emailPhoto}
                name={item.emailLastSentByName}
                colorClass="bg-primary text-primary-content"
              />
              <FaEnvelope className="w-3 h-3 text-accent" />
              <span className="text-xs font-semibold tabular-nums">{item.emailSentCount}</span>
            </div>
          ) : (
            <span className="text-base-content/30" title="Hali email yuborilmagan">&mdash;</span>
          )}

          {item.documentReady && (
            <HiMiniDocumentCheck className="text-success w-3.5 h-3.5" title="Hujjat tayyor" />
          )}
          {item.isDocumentSend && (
            <BsSendCheck className="text-info w-3.5 h-3.5" title="Hujjat yuborilgan" />
          )}
          {item.hasComment && (
            <FaCommentDots className="text-success w-3.5 h-3.5" title={commentTooltip} />
          )}
        </div>
      </td>

      {/* Bewertung */}
      <td className="text-center">
        {item.rating !== null && item.rating !== undefined ? (
          <span
            className="inline-flex items-center gap-1"
            title={`Bewertung: ${formatRatingForUi(item.rating)}`}
          >
            <FaStar className="text-warning w-3 h-3" />
            <span className="text-xs font-semibold tabular-nums">
              {formatRatingForUi(item.rating)}
            </span>
          </span>
        ) : (
          <span className="text-base-content/30">&mdash;</span>
        )}
      </td>

      {/* Reaktion */}
      <td className="text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className={[
              "btn btn-xs btn-circle",
              item.reaction === "like" ? "btn-success text-white" : "btn-ghost",
              !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
            onClick={() => onReaction(item.id, "like")}
            disabled={isDeleting || !isSuperAdmin}
            title={isSuperAdmin ? "Yoqdi" : "Faqat super_admin uchun"}
          >
            <FaThumbsUp className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            className={[
              "btn btn-xs btn-circle",
              item.reaction === "dislike" ? "btn-error text-white" : "btn-ghost",
              !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
            onClick={() => onReaction(item.id, "dislike")}
            disabled={isDeleting || !isSuperAdmin}
            title={isSuperAdmin ? "Yoqmadi" : "Faqat super_admin uchun"}
          >
            <FaThumbsDown className="w-2.5 h-2.5" />
          </button>
        </div>
      </td>

      {/* Delete */}
      {!isLimitedAdmin && (
        <td className="text-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error"
            onClick={() => onDelete(item)}
            disabled={isDeleting}
            title="O'chirish"
          >
            {isDeleting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FaTrash className="w-3 h-3" />
            )}
          </button>
        </td>
      )}
    </tr>
  );
}

export default memo(CandidateRow);
