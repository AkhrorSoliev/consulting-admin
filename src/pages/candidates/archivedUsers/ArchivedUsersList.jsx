import { useNavigate } from "react-router-dom";
import RemoteUserCard from "../../../components/RemoteUserCard";
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineRestorePage } from "react-icons/md";

export default function ArchivedUsersList({
  filtered,
  restoringKey,
  movingKey,
  selectedKeys,
  toggleSelect,
  onRestore,
  onMoveToDeleted,
}) {
  const navigate = useNavigate();
  const disabled = Boolean(restoringKey) || Boolean(movingKey);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6">
      {filtered.map((r, idx) => {
        const first = String(r?.persoenlicheDaten?.name || "").trim();
        const last = String(r?.persoenlicheDaten?.nachname || "").trim();
        const full = [first, last].filter(Boolean).join(" ") || "\u2014";
        const email =
          String(r?.persoenlicheDaten?.email || r?.email || "").trim() ||
          "\u2014";
        const photo =
          String(
            r?.persoenlicheDaten?.foto || r?.foto || r?.photo || ""
          ).trim() || "";
        const major =
          String(r?.sourceMajor || r?.major || "").trim() || "\u2014";
        const telegramId = String(r?.telegramId || "").trim() || "";
        const lead = String(r?.lead || "").trim() || "";
        const key = String(r?.id || idx);
        const moving = movingKey && String(movingKey) === String(key);
        const checked = selectedKeys.includes(key);
        return (
          <div className="relative" key={key}>
            <input
              type="checkbox"
              className="absolute top-2 left-2 z-10 scale-125"
              checked={checked}
              onChange={() => toggleSelect(key)}
              disabled={disabled}
              title="Auswählen"
            />
            <RemoteUserCard
              name={full}
              photo={photo}
              email={email === "\u2014" ? "" : email}
              major={major === "\u2014" ? "" : major}
              firebaseId={String(r?.sourceDocId || "").trim() || ""}
              telegramId={telegramId}
              lead={lead}
              tone="warning"
              onClick={() => {
                const majorParam =
                  major && major !== "\u2014" ? major : "unknown";
                const idParam =
                  String(r?.sourceDocId || "").trim() || "archived";
                navigate(
                  `/generate/${majorParam}/${idParam}?remote=1&kind=archived&archivedDocId=${encodeURIComponent(
                    String(r?.id || "")
                  )}`,
                  { state: { remoteRecord: r } }
                );
              }}
              footer={
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary whitespace-nowrap"
                    onClick={() => onRestore(r)}
                    disabled={disabled}
                    title="Wiederherstellen"
                  >
                    <span className="hidden sm:inline">
                      Wiederherstellen
                    </span>
                    <MdOutlineRestorePage size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-error btn-outline whitespace-nowrap"
                    onClick={() => onMoveToDeleted(r)}
                    disabled={disabled}
                    title="O'chirish (deleted ga ko'chadi)"
                  >
                    {moving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Löschen</span>
                        <FiTrash2 size={16} />
                      </>
                    )}
                  </button>
                </div>
              }
            />
          </div>
        );
      })}
    </div>
  );
}
