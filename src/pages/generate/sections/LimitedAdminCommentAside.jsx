import RichTextEditor from "../../../components/RichTextEditor";

export default function LimitedAdminCommentAside({
  isLimitedAdmin,
  showCommentPreview,
  renderCommentPreview,
  isCommentEditorOpen,
  commentHtml,
  onCommentHtmlChange,
  hasComment,
  onCorrectComment,
  isSaving,
  loading,
  notFound,
  isCorrectingComment,
  onPrimaryCommentAction,
  commentActionLabel,
}) {
  if (!isLimitedAdmin) {
    return null;
  }

  return (
    <aside className="w-full lg:basis-[40%] lg:max-w-[40%] shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[90vh] flex">
      <div className="card bg-base-100 border border-base-300 shadow-2xl w-full h-full flex flex-col">
        <div className="card-body space-y-3 flex-1 flex flex-col">
          <div>
            <h3 className="card-title text-lg mb-1">Kommentar</h3>
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Notiz zum Kandidaten</p>
          </div>
          {showCommentPreview && renderCommentPreview("flex-1")}
          {isCommentEditorOpen && (
            <RichTextEditor
              value={commentHtml}
              onChange={onCommentHtmlChange}
              placeholder='Allgemeine Notiz: "Der Kandidat passt sehr gut, nur das Foto sollte aktualisiert werden."'
              className="flex-1"
              editorClassName="min-h-[220px]"
            />
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {isCommentEditorOpen && hasComment && (
              <button
                type="button"
                className="btn btn-sm btn-outline btn-info w-full"
                onClick={onCorrectComment}
                disabled={isSaving || loading || notFound || isCorrectingComment}
                title="Kommentar mit KI korrigieren"
              >
                {isCorrectingComment ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Korrigieren...
                  </>
                ) : (
                  <>
                    <img src="/ai-icon.svg" alt="AI" className="w-4 h-4" />
                    Korrigieren
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline w-full"
              onClick={onPrimaryCommentAction}
              disabled={isSaving || loading || notFound}
            >
              {commentActionLabel}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
