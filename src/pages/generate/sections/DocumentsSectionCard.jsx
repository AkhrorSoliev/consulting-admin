import { FaExternalLinkAlt, FaTrash } from "react-icons/fa";
import CollapsibleSection from "../../../components/CollapsibleSection";
import { updateDocument } from "../../../utils";

export default function DocumentsSectionCard({
  documentsCount,
  showDocuments,
  onToggleShowDocuments,
  formCv,
  documentsMarkedForDeletion,
  isLimitedAdmin,
  onDeleteDocumentRemoteFirst,
  onFormCvChange,
  id,
  resolvedMajor,
  mapFormToDoc,
  selectBase,
  selectedDocumentType,
  onSelectDocumentType,
  fileInputBase,
  onDocumentFileChange,
  LANG_CERT_TYPES,
}) {
  return (
    <CollapsibleSection title="Dokumente" count={documentsCount} defaultOpen={false}>
      <div className="form-control mb-4">
        <label className="label cursor-pointer justify-start gap-3">
          <span className="label-text font-semibold">Dokumente im PDF anzeigen</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={showDocuments}
            onChange={(e) => onToggleShowDocuments(e.target.checked)}
          />
        </label>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">Reisepass</h4>
        <div className="flex flex-col gap-2">
          {!formCv.documents?.passport || formCv.documents.passport.length === 0 ? (
            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
              Kein Reisepass vorhanden.
            </div>
          ) : (
            formCv.documents.passport.map((url, i) => {
              const isMarkedForDeletion = documentsMarkedForDeletion.passport.some(
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
                      onClick={() => onDeleteDocumentRemoteFirst(url, "passport", i)}
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

      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">Diplome</h4>
        <div className="flex flex-col gap-2">
          {!formCv.documents?.diplomas || formCv.documents.diplomas.length === 0 ? (
            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
              Keine Diplome vorhanden.
            </div>
          ) : (
            formCv.documents.diplomas.map((url, i) => {
              const isMarkedForDeletion = documentsMarkedForDeletion.diplomas.some(
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
                      onClick={() => onDeleteDocumentRemoteFirst(url, "diplomas", i)}
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

      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">Zertifikate</h4>
        <div className="flex flex-col gap-2">
          {(!formCv.documents?.certificatesDetailed ||
            formCv.documents.certificatesDetailed.length === 0) &&
          (!formCv.documents?.certificates || formCv.documents.certificates.length === 0) ? (
            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
              Keine Zertifikate vorhanden.
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-xs opacity-70 mb-1">Nur PDF</div>
              <ul className="space-y-2">
                {Array.isArray(formCv.documents?.certificatesDetailed) &&
                  formCv.documents.certificatesDetailed.map((cert, i) => {
                    const isMarkedForDeletion = documentsMarkedForDeletion.certificates.some(
                      (marked) => marked.index === i,
                    );
                    return (
                      <li
                        key={cert.url || i}
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
                                onDeleteDocumentRemoteFirst(cert.url, "certificates", i)
                              }
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 items-center">
                          <label className="label py-0 sm:py-1" htmlFor={`langcert-type-${i}`}>
                            <span className="label-text text-xs sm:text-sm">Zertifikat auswählen</span>
                          </label>
                          <select
                            id={`langcert-type-${i}`}
                            className={`select select-bordered w-full ${
                              !cert.type?.trim() ? "select-warning" : ""
                            }`}
                            aria-label="Typ des Sprachzertifikats"
                            value={cert.type || ""}
                            onChange={(e) => {
                              onFormCvChange((prev) => {
                                const updatedDetailed = [...prev.documents.certificatesDetailed];
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
                  })}

                {!Array.isArray(formCv.documents?.certificatesDetailed) ||
                formCv.documents.certificatesDetailed.length === 0
                  ? formCv.documents?.certificates?.map((url, i) => {
                      const isMarkedForDeletion = documentsMarkedForDeletion.certificates.some(
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
                              onClick={() => onDeleteDocumentRemoteFirst(url, "certificates", i)}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      );
                    })
                  : null}
              </ul>
            </div>
          )}
        </div>
      </div>

      {!isLimitedAdmin && (
        <div className="mb-2">
          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
            Neues Dokument hochladen
          </h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className={selectBase}
              value={selectedDocumentType}
              onChange={(e) => onSelectDocumentType(e.target.value)}
            >
              <option value="">Dokumenttyp wählen</option>
              <option value="passport">Reisepass</option>
              <option value="diplomas">Diplome</option>
              <option value="certificates">Zertifikate</option>
            </select>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className={fileInputBase}
              onChange={onDocumentFileChange}
              disabled={!selectedDocumentType}
            />
          </div>
          {selectedDocumentType && (
            <div className="mt-2 text-xs opacity-70">Akzeptierte Formate: PDF, JPG, PNG, WEBP</div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
