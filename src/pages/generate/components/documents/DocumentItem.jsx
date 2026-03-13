import { FaExternalLinkAlt, FaTrash } from "react-icons/fa";

export default function DocumentItem({
  url,
  index: i,
  docType,
  documentsMarkedForDeletion,
  deleteDocumentRemoteFirst,
  isLimitedAdmin,
}) {
  const isMarkedForDeletion =
    documentsMarkedForDeletion[docType]?.some(
      (marked) => marked.index === i,
    );

  return (
    <div
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
          isMarkedForDeletion
            ? "link-error line-through"
            : "link-primary"
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
          onClick={() =>
            deleteDocumentRemoteFirst(url, docType, i)
          }
        >
          <FaTrash />
        </button>
      )}
    </div>
  );
}
