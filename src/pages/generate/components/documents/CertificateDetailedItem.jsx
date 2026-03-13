import { FaExternalLinkAlt, FaTrash } from "react-icons/fa";

export default function CertificateDetailedItem({
  cert,
  index: i,
  documentsMarkedForDeletion,
  deleteDocumentRemoteFirst,
  isLimitedAdmin,
  setFormCv,
  id,
  resolvedMajor,
  mapFormToDoc,
  updateDocument,
  LANG_CERT_TYPES,
}) {
  const isMarkedForDeletion =
    documentsMarkedForDeletion.certificates.some(
      (marked) => marked.index === i,
    );

  const handleTypeChange = (e) => {
    setFormCv((prev) => {
      const updatedDetailed = [
        ...prev.documents.certificatesDetailed,
      ];
      updatedDetailed[i] = {
        ...updatedDetailed[i],
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

      // Auto-save certificate type change to Firebase
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
        } catch (saveErr) {}
      }, 500);

      return updatedForm;
    });
  };

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
              deleteDocumentRemoteFirst(cert.url, "certificates", i)
            }
          >
            <FaTrash />
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2 items-center">
        <label
          className="label py-0 sm:py-1"
          htmlFor={`langcert-type-${i}`}
        >
          <span className="label-text text-xs sm:text-sm">
            Zertifikat auswählen
          </span>
        </label>
        <select
          id={`langcert-type-${i}`}
          className={`select select-bordered w-full ${
            !cert.type?.trim() ? "select-warning" : ""
          }`}
          aria-label="Typ des Sprachzertifikats"
          value={cert.type || ""}
          onChange={handleTypeChange}
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
