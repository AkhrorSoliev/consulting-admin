import { Link } from "react-router-dom";
import { FaCog, FaRegCopy, FaTrash } from "react-icons/fa";
import {
  resolveMajorKey,
  resolveMajorCount,
  getMajorCollectionName,
} from "./majorUtils";

export default function MajorListItem({
  major,
  serverCounts,
  loadingCounts,
  isLimitedAdmin,
  onCopyLink,
  onDelete,
  onOpenSettings,
}) {
  const title =
    major?.title ||
    major?.collectionName ||
    major?.slug ||
    major?.name ||
    String(major);
  const linkId =
    major?.linkId ||
    major?.uuid ||
    major?.id ||
    major?.collectionName ||
    major;
  const majorKey = resolveMajorKey(major);
  const count = resolveMajorCount(major, serverCounts);
  const colNameForCount = getMajorCollectionName(major);
  const isCountLoading = Boolean(
    colNameForCount && loadingCounts?.[colNameForCount],
  );

  return (
    <li
      key={linkId}
      className="flex w-full items-center gap-2 rounded-lg border border-base-200 p-2 hover:bg-base-200/50 transition-colors"
    >
      <div className="indicator grow min-w-0">
        <span
          className="indicator-item indicator-top indicator-end badge badge-sm badge-primary pointer-events-none select-none -translate-x-[20%]"
          aria-label={
            isCountLoading
              ? "Kandidaten werden geladen..."
              : `Kandidaten: ${count ?? 0}`
          }
        >
          {isCountLoading ? "\u2026" : (count ?? 0)}
        </span>
        <Link
          to={`collectionCv/${linkId}`}
          className="btn btn-sm btn-outline-info justify-start overflow-hidden min-w-0 w-full pr-12"
          title={title}
        >
          <span className="font-medium truncate">{title}</span>
        </Link>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onCopyLink(major)}
        aria-label="Asosiy linkni nusxalash"
        title="Asosiy linkni copy qilish"
      >
        <FaRegCopy />
      </button>
      {!isLimitedAdmin ? (
        <>
          <button
            type="button"
            className="btn btn-sm btn-outline btn-error"
            onClick={() => onDelete(major)}
            aria-label={`\u201E${title}\u201C yo\u2018nalishini o\u2018chirish`}
            title="Yo'nalishni o'chirish"
          >
            <FaTrash />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => onOpenSettings({ major, key: majorKey })}
            aria-label={`Einstellungen f\u00FCr \u201E${title}\u201C \u00F6ffnen`}
            title="Einstellungen"
          >
            <FaCog />
          </button>
        </>
      ) : null}
    </li>
  );
}
