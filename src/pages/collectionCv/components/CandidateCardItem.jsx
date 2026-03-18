import {
  FaEnvelope,
  FaPhone,
  FaTrash,
  FaTelegram,
} from "react-icons/fa";
import { BsSendCheck } from "react-icons/bs";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import CandidateCard from "../../../components/CandidateCard";
import { formatCreatedAt } from "../utils";
import { CardFooter } from "./CardFooterBadges";

export default function CandidateCardItem({
  item,
  deletingId,
  isLimitedAdmin,
  isSuperAdmin,
  userPhotosCache,
  onNavigate,
  onDelete,
  onReaction,
}) {
  return (
    <CandidateCard
      tone={item.statusTone || "info"}
      onClick={() => onNavigate(item.id)}
      busy={deletingId === item.id}
      name={item.name || "Ohne Namen"}
      photo={item.photo || ""}
      meta={<CandidateMeta item={item} />}
      topRight={
        !isLimitedAdmin ? (
          <button
            className="btn btn-ghost btn-circle btn-sm text-error/70 hover:text-error hover:bg-error/10"
            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
            disabled={deletingId === item.id}
            title="Löschen"
            type="button"
          >
            {deletingId === item.id ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FaTrash size={16} />
            )}
          </button>
        ) : null
      }
      lines={[
        item.phone ? { icon: <FaPhone className="w-4 h-4" />, text: item.phone, title: item.phone } : null,
        item.email ? { icon: <FaEnvelope className="w-4 h-4" />, text: item.email, title: item.email } : null,
      ].filter(Boolean)}
      emptyLabel="Keine Kontaktdaten"
      footer={
        <CardFooter
          item={item}
          deletingId={deletingId}
          isSuperAdmin={isSuperAdmin}
          userPhotosCache={userPhotosCache}
          onReaction={onReaction}
        />
      }
    />
  );
}

function CandidateMeta({ item }) {
  return (
    <>
      {typeof item.age === "number" && item.age >= 1 ? (
        <span className="text-base-content/70">{item.age} Jahre</span>
      ) : null}
      <span>{formatCreatedAt(item.createdAt)}</span>
      {item.telegramId ? (
        <span className="inline-flex items-center gap-1 text-[#0088cc]" title="Über Telegram registriert">
          <FaTelegram className="w-3 h-3" />
        </span>
      ) : null}
      {item.lead ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium" title={`Lead: ${item.lead}`}>
          {item.lead}
        </span>
      ) : null}
      {item.documentReady ? (
        <span className="inline-flex items-center gap-1 text-green-600" title="Das Dokument ist fertig">
          <HiMiniDocumentCheck className="w-4 h-4" />
        </span>
      ) : null}
      {item.isDocumentSend ? (
        <span className="inline-flex items-center gap-1 text-blue-500" title="Das Dokument wurde gesendet.">
          <BsSendCheck className="w-3.5 h-3.5" />
        </span>
      ) : null}
    </>
  );
}
