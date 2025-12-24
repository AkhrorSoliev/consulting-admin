import LivePreview from "../../../generate/components/LivePreview";

export default function PdfPreviewModal({
  open,
  onClose,
  form,
  showDocuments = false,
  showComment = false,
  showCommentDate = false,
  onPhotoClick,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 p-0 sm:p-4">
        <div className="bg-base-100 text-base-content h-full w-full flex flex-col overflow-hidden shadow-2xl rounded-none sm:rounded-box border-0 sm:border border-base-300">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-base-200">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Vorschau (A4)</div>
              <div className="text-xs opacity-70 truncate">
                Nur Vorschau (Download deaktiviert)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                aria-label="Modalni yopish"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 bg-base-200 min-h-0">
            <LivePreview
              formCv={form}
              commentMeta={null}
              showDocuments={showDocuments}
              showComment={showComment}
              showCommentDate={showCommentDate}
              onPhotoClick={onPhotoClick}
              showToolbar={false}
              enableClickZoom={true}
              minScale={0.35}
              containerClassName="block w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


