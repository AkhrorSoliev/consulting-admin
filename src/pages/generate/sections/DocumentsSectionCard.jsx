import CollapsibleSection from "../../../components/CollapsibleSection";
import DocumentList from "./documentsSectionCard/DocumentList";
import {
  CertificateDetailedItem,
  CertificateFallbackItem,
} from "./documentsSectionCard/CertificatesSection";
import DocumentUpload from "./documentsSectionCard/DocumentUpload";

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
  const hasDetailedCerts =
    Array.isArray(formCv.documents?.certificatesDetailed) &&
    formCv.documents.certificatesDetailed.length > 0;

  const hasAnyCerts =
    hasDetailedCerts ||
    (formCv.documents?.certificates && formCv.documents.certificates.length > 0);

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

      <DocumentList
        title="Reisepass"
        emptyMessage="Kein Reisepass vorhanden."
        urls={formCv.documents?.passport}
        markedForDeletion={documentsMarkedForDeletion.passport}
        isLimitedAdmin={isLimitedAdmin}
        documentType="passport"
        onDeleteDocumentRemoteFirst={onDeleteDocumentRemoteFirst}
      />

      <DocumentList
        title="Diplome"
        emptyMessage="Keine Diplome vorhanden."
        urls={formCv.documents?.diplomas}
        markedForDeletion={documentsMarkedForDeletion.diplomas}
        isLimitedAdmin={isLimitedAdmin}
        documentType="diplomas"
        onDeleteDocumentRemoteFirst={onDeleteDocumentRemoteFirst}
      />

      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
          Zertifikate
        </h4>
        <div className="flex flex-col gap-2">
          {!hasAnyCerts ? (
            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
              Keine Zertifikate vorhanden.
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-xs opacity-70 mb-1">Nur PDF</div>
              <ul className="space-y-2">
                {hasDetailedCerts &&
                  formCv.documents.certificatesDetailed.map((cert, i) => (
                    <CertificateDetailedItem
                      key={cert.url || i}
                      cert={cert}
                      index={i}
                      isMarkedForDeletion={documentsMarkedForDeletion.certificates.some(
                        (marked) => marked.index === i,
                      )}
                      isLimitedAdmin={isLimitedAdmin}
                      onDeleteDocumentRemoteFirst={onDeleteDocumentRemoteFirst}
                      onFormCvChange={onFormCvChange}
                      id={id}
                      resolvedMajor={resolvedMajor}
                      mapFormToDoc={mapFormToDoc}
                      LANG_CERT_TYPES={LANG_CERT_TYPES}
                    />
                  ))}

                {!hasDetailedCerts &&
                  formCv.documents?.certificates?.map((url, i) => (
                    <CertificateFallbackItem
                      key={i}
                      url={url}
                      index={i}
                      isMarkedForDeletion={documentsMarkedForDeletion.certificates.some(
                        (marked) => marked.index === i,
                      )}
                      isLimitedAdmin={isLimitedAdmin}
                      onDeleteDocumentRemoteFirst={onDeleteDocumentRemoteFirst}
                    />
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {!isLimitedAdmin && (
        <DocumentUpload
          selectBase={selectBase}
          selectedDocumentType={selectedDocumentType}
          onSelectDocumentType={onSelectDocumentType}
          fileInputBase={fileInputBase}
          onDocumentFileChange={onDocumentFileChange}
        />
      )}
    </CollapsibleSection>
  );
}
