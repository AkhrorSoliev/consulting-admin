import DocumentExchangeItem from "./DocumentExchangeItem";

export default function DocumentExchangeList({
  outgoingEntries,
  incomingDocs,
  uploadingDocs,
  deletingDocs,
  allowDelete,
  onDownload,
  onDelete,
  onUpload,
}) {
  if (outgoingEntries.length === 0) {
    return (
      <div className="text-center py-12 text-base-content/60">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-base-content/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg">Hozircha hujjatlar mavjud emas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outgoingEntries.map(([docId, docData]) => (
        <DocumentExchangeItem
          key={docId}
          docId={docId}
          docData={docData}
          incomingDoc={incomingDocs[docId]}
          isUploading={Boolean(uploadingDocs[docId])}
          isDeleting={Boolean(deletingDocs[docId])}
          allowDelete={allowDelete}
          onDownload={onDownload}
          onDelete={onDelete}
          onUpload={onUpload}
        />
      ))}
    </div>
  );
}
