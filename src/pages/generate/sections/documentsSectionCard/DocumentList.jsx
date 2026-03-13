import { FaExternalLinkAlt, FaTrash } from "react-icons/fa";

export default function DocumentList({
  title,
  emptyMessage,
  urls,
  markedForDeletion,
  isLimitedAdmin,
  documentType,
  onDeleteDocumentRemoteFirst,
}) {
  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">{title}</h4>
      <div className="flex flex-col gap-2">
        {!urls || urls.length === 0 ? (
          <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
            {emptyMessage}
          </div>
        ) : (
          urls.map((url, i) => {
            const isMarkedForDeletion = markedForDeletion.some(
              (marked) => marked.index === i,
            );
            return (
              <div
                key={i}
                className={`flex gap-2 items-center p-2 border rounded ${
                  isMarkedForDeletion
                    ? "bg-error/10 border-error/50 opacity-60"
                    : "bg-base-100"
                }`}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`link text-sm truncate flex-1 ${
                    isMarkedForDeletion ? "link-error line-through" : "link-primary"
                  }`}
                >
                  {url}
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-square btn-sm btn-ghost text-primary"
                  title="Link öffnen"
                >
                  <FaExternalLinkAlt />
                </a>
                {!isLimitedAdmin && (
                  <button
                    type="button"
                    className="btn btn-square btn-sm btn-ghost text-error"
                    title={
                      isMarkedForDeletion
                        ? "Löschung wird beim Speichern ausgeführt"
                        : "Dokument löschen"
                    }
                    onClick={() => onDeleteDocumentRemoteFirst(url, documentType, i)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
