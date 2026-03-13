import { useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineRestorePage } from "react-icons/md";
import RemoteUserCard from "../../../components/RemoteUserCard";

function CardFooter({ restoring, deleting, disabled, onRestoreOriginal, onRestore, onDelete }) {
  return (
    <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
      <button
        type="button"
        className="btn btn-xs sm:btn-sm btn-primary"
        onClick={onRestoreOriginal}
        disabled={disabled}
        title="In ursprünglichen Bereich wiederherstellen"
      >
        {restoring ? (
          <>
            <span className="loading loading-spinner loading-xs sm:loading-sm" />
            <span className="hidden xs:inline">Original...</span>
            <span className="xs:hidden">...</span>
          </>
        ) : (
          <>
            <span className="hidden xs:inline">Original</span>
            <MdOutlineRestorePage size={16} className="xs:hidden" />
            <MdOutlineRestorePage size={18} className="hidden xs:inline" />
          </>
        )}
      </button>
      <button
        type="button"
        className="btn btn-xs sm:btn-sm btn-outline"
        onClick={onRestore}
        disabled={disabled}
        title="Berufsfeld auswählen"
      >
        {restoring ? (
          <>
            <span className="loading loading-spinner loading-xs sm:loading-sm" />
            <span className="hidden xs:inline">Auswählen...</span>
            <span className="xs:hidden">...</span>
          </>
        ) : (
          <>
            <span className="hidden xs:inline">Auswählen</span>
            <MdOutlineRestorePage size={16} className="xs:hidden" />
            <MdOutlineRestorePage size={18} className="hidden xs:inline" />
          </>
        )}
      </button>
      <button
        type="button"
        className="btn btn-xs sm:btn-sm btn-error btn-outline"
        onClick={onDelete}
        disabled={disabled}
        title="Endgültig löschen (nicht wiederherstellbar)"
      >
        {deleting ? (
          <>
            <span className="loading loading-spinner loading-xs sm:loading-sm" />
            <span className="hidden xs:inline">Deleting...</span>
            <span className="xs:hidden">...</span>
          </>
        ) : (
          <>
            <span className="hidden xs:inline">Delete</span>
            <FiTrash2 size={14} className="xs:hidden" />
            <FiTrash2 size={16} className="hidden xs:inline" />
          </>
        )}
      </button>
    </div>
  );
}

export default function DeletedUserCard({
  record,
  idx,
  restoringKey,
  deletingKey,
  checked,
  onToggleSelect,
  onRestoreOriginal,
  onRestore,
  onDelete,
}) {
  const navigate = useNavigate();
  const r = record;
  const first = String(r?.persoenlicheDaten?.name || "").trim();
  const last = String(r?.persoenlicheDaten?.nachname || "").trim();
  const full = [first, last].filter(Boolean).join(" ") || "\u2014";
  const email =
    String(r?.persoenlicheDaten?.email || r?.email || "").trim() || "\u2014";
  const photo =
    String(r?.persoenlicheDaten?.foto || r?.foto || r?.photo || "").trim() || "";
  const major = String(r?.sourceMajor || r?.major || "").trim() || "\u2014";
  const telegramId = String(r?.telegramId || "").trim() || "";
  const lead = String(r?.lead || "").trim() || "";
  const key = String(r?.id || idx);
  const restoring = restoringKey && String(restoringKey) === String(key);
  const deleting = deletingKey && String(deletingKey) === String(key);
  const disabled = Boolean(restoringKey) || Boolean(deletingKey);

  return (
    <div className="relative">
      <input
        type="checkbox"
        className="absolute top-2 left-2 z-10 scale-125"
        checked={checked}
        onChange={() => onToggleSelect(key)}
        disabled={disabled}
        title="Tanlash"
      />
      <RemoteUserCard
        key={String(r?.id || idx)}
        name={full}
        photo={photo}
        email={email === "\u2014" ? "" : email}
        major={major === "\u2014" ? "" : major}
        firebaseId={String(r?.sourceDocId || "").trim() || ""}
        telegramId={telegramId}
        lead={lead}
        tone="error"
        onClick={() => {
          const majorParam = major && major !== "\u2014" ? major : "unknown";
          const idParam = String(r?.sourceDocId || "").trim() || "deleted";
          navigate(
            `/generate/${majorParam}/${idParam}?remote=1&kind=deleted&deletedDocId=${encodeURIComponent(
              String(r?.id || ""),
            )}`,
            { state: { remoteRecord: r } },
          );
        }}
        footer={
          <CardFooter
            restoring={restoring}
            deleting={deleting}
            disabled={disabled}
            onRestoreOriginal={() => onRestoreOriginal(r)}
            onRestore={() => onRestore(r)}
            onDelete={() => onDelete(r)}
          />
        }
      />
    </div>
  );
}
