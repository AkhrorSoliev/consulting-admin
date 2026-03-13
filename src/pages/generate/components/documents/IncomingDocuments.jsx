import { FaExternalLinkAlt, FaTrash, FaDownload } from "react-icons/fa";
import CollapsibleSection from "../../../../components/CollapsibleSection";

export default function IncomingDocuments({
  docCv,
  userRole,
  savingAllowDelete,
  allowIncomingDelete,
  handleToggleAllowIncomingDelete,
  handleDownloadIncomingDoc,
  handleDeleteIncomingDoc,
  deletingIncomingDoc,
}) {
  const incomingDocs = docCv?.incomingDocuments || {};
  const outgoingDocsMap = docCv?.outgoingDocuments || {};
  const entries = Object.entries(incomingDocs).filter(
    ([, v]) =>
      v &&
      typeof v === "object" &&
      String(v?.url || "").trim(),
  );

  return (
    <CollapsibleSection
      title="Von Kandidat erhaltene Dokumente"
      count={
        docCv?.incomingDocuments
          ? Object.keys(docCv.incomingDocuments).length
          : 0
      }
      defaultOpen={false}
    >
      {/* Admin toggle for allowing candidate to delete documents */}
      {(userRole === "admin" || userRole === "super_admin") && (
        <div className="flex items-center justify-between mb-3 p-2 bg-base-200 rounded-lg">
          <span className="text-sm font-medium">
            Kandidat darf Dokumente löschen
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            {savingAllowDelete && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={allowIncomingDelete}
              onChange={(e) =>
                handleToggleAllowIncomingDelete(e.target.checked)
              }
              disabled={savingAllowDelete}
            />
          </label>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
          Keine Dokumente vom Kandidaten erhalten.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(([docId, docData]) => {
            const outgoingDoc = outgoingDocsMap[docId];
            const docLabel = String(
              outgoingDoc?.title || "",
            ).trim();
            const fileName =
              String(docData?.fileName || "").trim() ||
              "Dokument";
            const url = String(docData?.url || "").trim();
            const uploadedAt = docData?.uploadedAt;

            return (
              <div
                key={docId}
                className="border border-base-300 rounded-lg p-3 bg-base-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {docLabel && (
                      <div className="badge badge-primary badge-sm mb-2">
                        {docLabel}
                      </div>
                    )}
                    <div className="font-semibold text-sm">
                      {fileName}
                    </div>
                    {uploadedAt && (
                      <div className="text-xs text-base-content/60 mt-1">
                        Hochgeladen:{" "}
                        {new Date(uploadedAt).toLocaleString(
                          "de-DE",
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline gap-1"
                      title="Öffnen"
                    >
                      <FaExternalLinkAlt />
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline gap-1"
                      onClick={() =>
                        handleDownloadIncomingDoc(url, fileName)
                      }
                      title="Herunterladen"
                    >
                      <FaDownload />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-error gap-1"
                      onClick={() =>
                        handleDeleteIncomingDoc(docId)
                      }
                      disabled={deletingIncomingDoc[docId]}
                      title="Löschen"
                    >
                      {deletingIncomingDoc[docId] ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}
