import CertificateDetailedItem from "./CertificateDetailedItem";
import DocumentItem from "./DocumentItem";

export default function CertificatesSection({
  formCv,
  setFormCv,
  documentsMarkedForDeletion,
  deleteDocumentRemoteFirst,
  isLimitedAdmin,
  id,
  resolvedMajor,
  mapFormToDoc,
  updateDocument,
  LANG_CERT_TYPES,
}) {
  const hasDetailed =
    Array.isArray(formCv.documents?.certificatesDetailed) &&
    formCv.documents.certificatesDetailed.length > 0;
  const hasLegacy =
    Array.isArray(formCv.documents?.certificates) &&
    formCv.documents.certificates.length > 0;

  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
        Zertifikate
      </h4>
      <div className="flex flex-col gap-2">
        {!hasDetailed && !hasLegacy ? (
          <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
            Keine Zertifikate vorhanden.
          </div>
        ) : (
          <div className="mt-2">
            <div className="text-xs opacity-70 mb-1">Nur PDF</div>
            <ul className="space-y-2">
              {Array.isArray(
                formCv.documents?.certificatesDetailed,
              ) &&
                formCv.documents.certificatesDetailed.map((cert, i) => (
                  <CertificateDetailedItem
                    key={cert.url || i}
                    cert={cert}
                    index={i}
                    documentsMarkedForDeletion={documentsMarkedForDeletion}
                    deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
                    isLimitedAdmin={isLimitedAdmin}
                    setFormCv={setFormCv}
                    id={id}
                    resolvedMajor={resolvedMajor}
                    mapFormToDoc={mapFormToDoc}
                    updateDocument={updateDocument}
                    LANG_CERT_TYPES={LANG_CERT_TYPES}
                  />
                ))}

              {!hasDetailed
                ? formCv.documents?.certificates?.map((url, i) => (
                    <DocumentItem
                      key={i}
                      url={url}
                      index={i}
                      docType="certificates"
                      documentsMarkedForDeletion={documentsMarkedForDeletion}
                      deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
                      isLimitedAdmin={isLimitedAdmin}
                    />
                  ))
                : null}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
