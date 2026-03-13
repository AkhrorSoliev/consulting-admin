import { FaExternalLinkAlt, FaTrash } from "react-icons/fa";
import { updateDocument } from "../../../../utils";

function CertificateDetailedItem({
  cert,
  index,
  isMarkedForDeletion,
  isLimitedAdmin,
  onDeleteDocumentRemoteFirst,
  onFormCvChange,
  id,
  resolvedMajor,
  mapFormToDoc,
  LANG_CERT_TYPES,
}) {
  return (
    <li
      className={`flex flex-col gap-2 rounded-box border border-base-300 px-3 py-2 ${
        isMarkedForDeletion
          ? "bg-error/10 border-error/50 opacity-60"
          : "bg-base-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            <a
              href={cert.url}
              target="_blank"
              rel="noreferrer"
              className={`link truncate flex-1 ${
                isMarkedForDeletion
                  ? "link-error line-through"
                  : "link-primary"
              }`}
            >
              {cert.url}
            </a>
          </div>
        </div>
        <a
          href={cert.url}
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
              onDeleteDocumentRemoteFirst(cert.url, "certificates", index)
            }
          >
            <FaTrash />
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2 items-center">
        <label className="label py-0 sm:py-1" htmlFor={`langcert-type-${index}`}>
          <span className="label-text text-xs sm:text-sm">Zertifikat auswählen</span>
        </label>
        <select
          id={`langcert-type-${index}`}
          className={`select select-bordered w-full ${
            !cert.type?.trim() ? "select-warning" : ""
          }`}
          aria-label="Typ des Sprachzertifikats"
          value={cert.type || ""}
          onChange={(e) => {
            onFormCvChange((prev) => {
              const updatedDetailed = [...prev.documents.certificatesDetailed];
              updatedDetailed[index] = {
                ...updatedDetailed[index],
                type: e.target.value,
              };

              const updatedDocs = {
                ...prev.documents,
                certificatesDetailed: updatedDetailed,
              };
              updatedDocs.certificates = updatedDetailed
                .map((c) => c.url)
                .filter((url) => url && typeof url === "string");

              const updatedForm = {
                ...prev,
                documents: updatedDocs,
              };

              setTimeout(async () => {
                try {
                  const candidateDocId = String(id || "").trim();
                  const collectionName = String(
                    resolvedMajor?.collectionName || "",
                  ).trim();

                  if (candidateDocId && collectionName) {
                    const docData = mapFormToDoc(updatedForm);

                    await updateDocument(collectionName, candidateDocId, {
                      documents: docData.documents,
                    });
                  }
                } catch (saveErr) {
                  void saveErr;
                }
              }, 500);

              return updatedForm;
            });
          }}
        >
          <option value="">Zertifikat auswählen</option>
          {LANG_CERT_TYPES.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {!cert.type?.trim() ? (
        <p className="text-warning text-sm">
          Bitte wählen Sie, zu welchem Zertifikat die Datei gehört.
        </p>
      ) : null}
    </li>
  );
}

function CertificateFallbackItem({
  url,
  index,
  isMarkedForDeletion,
  isLimitedAdmin,
  onDeleteDocumentRemoteFirst,
}) {
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
          onClick={() => onDeleteDocumentRemoteFirst(url, "certificates", index)}
        >
          <FaTrash />
        </button>
      )}
    </div>
  );
}

export { CertificateDetailedItem, CertificateFallbackItem };
