import DocumentItem from "./DocumentItem";

export default function DocumentList({
  title,
  emptyMessage,
  urls,
  docType,
  documentsMarkedForDeletion,
  deleteDocumentRemoteFirst,
  isLimitedAdmin,
}) {
  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
        {title}
      </h4>
      <div className="flex flex-col gap-2">
        {!urls || urls.length === 0 ? (
          <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
            {emptyMessage}
          </div>
        ) : (
          urls.map((url, i) => (
            <DocumentItem
              key={i}
              url={url}
              index={i}
              docType={docType}
              documentsMarkedForDeletion={documentsMarkedForDeletion}
              deleteDocumentRemoteFirst={deleteDocumentRemoteFirst}
              isLimitedAdmin={isLimitedAdmin}
            />
          ))
        )}
      </div>
    </div>
  );
}
