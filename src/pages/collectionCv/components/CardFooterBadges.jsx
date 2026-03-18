import {
  FaCommentDots,
  FaEnvelope,
  FaStar,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { formatCreatedAt } from "../utils";
import { formatRatingForUi } from "../../generate/utils/ratingUtils";
import UserAvatar from "./UserAvatar";

export function CardFooter({ item, deletingId, isSuperAdmin, userPhotosCache, onReaction }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {item.rating !== null ? (
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60"
            title={`Bewertung: ${formatRatingForUi(item.rating)}`}
          >
            <FaStar className="shrink-0 w-4 h-4 text-warning" />
            <span className="tabular-nums text-sm font-semibold">{formatRatingForUi(item.rating)}</span>
          </div>
        ) : null}

        <EmailBadge item={item} userPhotosCache={userPhotosCache} />

        {item.hasComment ? (
          <CommentBadge item={item} userPhotosCache={userPhotosCache} />
        ) : null}
      </div>

      <ReactionButtons
        item={item}
        deletingId={deletingId}
        isSuperAdmin={isSuperAdmin}
        onReaction={onReaction}
      />
    </div>
  );
}

function EmailBadge({ item, userPhotosCache }) {
  const photoUrl =
    userPhotosCache[item.emailLastSentByUid] ||
    userPhotosCache[item.emailLastSentBy] ||
    item.emailLastSentByPhoto || "";

  const emailTitle = item.emailSentCount > 0
    ? `E-Mails gesendet: ${item.emailSentCount || 0}${item.emailLastSentAt ? ` • Zuletzt: ${formatCreatedAt(item.emailLastSentAt)}` : ""}${item.emailLastSentByName ? ` • Von: ${item.emailLastSentByName}` : ""}`
    : "E-Mails gesendet: 0";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60" title={emailTitle}>
      <UserAvatar photoUrl={photoUrl} name={item.emailLastSentByName} colorClass="bg-primary text-primary-content" />
      <FaEnvelope className="shrink-0 w-4 h-4 text-base-content/50" />
      <span className="tabular-nums text-sm font-semibold">{item.emailSentCount || 0}</span>
    </div>
  );
}

function CommentBadge({ item, userPhotosCache }) {
  const photoUrl =
    userPhotosCache[item.commentUpdatedByUid] ||
    userPhotosCache[item.commentUpdatedBy] ||
    item.commentUpdatedByPhoto || "";

  const commentTitle = item.commentUpdatedAt
    ? `Kommentar aktualisiert: ${formatCreatedAt(item.commentUpdatedAt)}${item.commentUpdatedByName ? ` • Von: ${item.commentUpdatedByName}` : ""}`
    : "Kommentar vorhanden";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-base-300/60 bg-base-100/60" title={commentTitle}>
      <UserAvatar photoUrl={photoUrl} name={item.commentUpdatedByName} colorClass="bg-success text-success-content" />
      <FaCommentDots className="shrink-0 w-5 h-5 text-success" />
      <span className="sr-only">Kommentar vorhanden</span>
    </div>
  );
}

function ReactionButtons({ item, deletingId, isSuperAdmin, onReaction }) {
  return (
    <div className="flex items-center gap-1" data-no-card-click>
      <button
        type="button"
        className={[
          "btn btn-sm btn-circle",
          item.reaction === "like" ? "btn-success text-white" : "btn-ghost hover:btn-success hover:text-white",
          !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
        onClick={(e) => { e.stopPropagation(); onReaction(item.id, "like"); }}
        title={isSuperAdmin ? "Gefällt mir" : "Faqat super_admin uchun"}
        disabled={deletingId === item.id || !isSuperAdmin}
      >
        <FaThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className={[
          "btn btn-sm btn-circle",
          item.reaction === "dislike" ? "btn-error text-white" : "btn-ghost hover:btn-error hover:text-white",
          !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
        onClick={(e) => { e.stopPropagation(); onReaction(item.id, "dislike"); }}
        title={isSuperAdmin ? "Gefällt mir nicht" : "Faqat super_admin uchun"}
        disabled={deletingId === item.id || !isSuperAdmin}
      >
        <FaThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
