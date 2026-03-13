import CollapsibleSection from "../../../components/CollapsibleSection";
import DocumentList from "./documents/DocumentList";
import CertificatesSection from "./documents/CertificatesSection";
import DocumentUpload from "./documents/DocumentUpload";
import IncomingDocuments from "./documents/IncomingDocuments";

export default function DocumentsSection({
  formCv,
  setFormCv,
  documentsCount,
  showDocuments,
  setShowDocuments,
  documentsMarkedForDeletion,
  deleteDocumentRemoteFirst,
  isLimitedAdmin,
  selectedDocumentType,
  setSelectedDocumentType,
  handleDocumentFileChange,
  selectBase,
  fileInputBase,
  mapFormToDoc,
  id,
  resolvedMajor,
  updateDocument,
  LANG_CERT_TYPES,
  docCv,
  userRole,
  savingAllowDelete,
  allowIncomingDelete,
  handleToggleAllowIncomingDelete,
  handleDownloadIncomingDoc,
  handleDeleteIncomingDoc,
  deletingIncomingDoc,
}) {
  return (
    <>
      <CollapsibleSection
        title="Dokumente"
        count={documentsCount}
        defaultOpen={false}
      >
        <div className="form-control mb-4">
          <label className="label cursor-pointer justify-start gap-3">
            <span className="label-text font-semibold">
              Dokumente im PDF anzeigen
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={showDocuments}
              onChange={(e) => setShowDocuments(e.target.checked)}
            />
          </label>
        </div>

        <DocumentList
          title="Reisepass"
          emptyMessage="Kein Reisepass vorhanden."
          urls={formCv.documents?.passport}
          docType="passport"
          documentsMarkedForDeletion={documentsMarkedForDeletion}
          deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
          isLimitedAdmin={isLimitedAdmin}
        />

        <DocumentList
          title="Diplome"
          emptyMessage="Keine Diplome vorhanden."
          urls={formCv.documents?.diplomas}
          docType="diplomas"
          documentsMarkedForDeletion={documentsMarkedForDeletion}
          deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
          isLimitedAdmin={isLimitedAdmin}
        />

        <CertificatesSection
          formCv={formCv}
          setFormCv={setFormCv}
          documentsMarkedForDeletion={documentsMarkedForDeletion}
          deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
          isLimitedAdmin={isLimitedAdmin}
          id={id}
          resolvedMajor={resolvedMajor}
          mapFormToDoc={mapFormToDoc}
          updateDocument={updateDocument}
          LANG_CERT_TYPES={LANG_CERT_TYPES}
        />

        {!isLimitedAdmin && (
          <DocumentUpload
            selectedDocumentType={selectedDocumentType}
            setSelectedDocumentType={setSelectedDocumentType}
            handleDocumentFileChange={handleDocumentFileChange}
            selectBase={selectBase}
            fileInputBase={fileInputBase}
          />
        )}
      </CollapsibleSection>

      <IncomingDocuments
        docCv={docCv}
        userRole={userRole}
        savingAllowDelete={savingAllowDelete}
        allowIncomingDelete={allowIncomingDelete}
        handleToggleAllowIncomingDelete={handleToggleAllowIncomingDelete}
        handleDownloadIncomingDoc={handleDownloadIncomingDoc}
        handleDeleteIncomingDoc={handleDeleteIncomingDoc}
        deletingIncomingDoc={deletingIncomingDoc}
      />
    </>
  );
}
