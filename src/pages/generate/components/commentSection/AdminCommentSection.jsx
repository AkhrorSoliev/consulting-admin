import React from "react";
import RichTextEditor from "../../../../components/RichTextEditor";

export default function AdminCommentSection({
  showComment,
  setShowComment,
  showCommentDate,
  setShowCommentDate,
  showCommentPreview,
  renderCommentPreview,
  isCommentEditorOpen,
  commentHtml,
  setCommentHtml,
  canUndoComment,
  canRedoComment,
  undoComment,
  redoComment,
  isCorrectingComment,
  handleCorrectComment,
  handleCommentPrimaryAction,
  commentActionLabel,
  handleClearComment,
  isSuperAdmin,
  isSaving,
  loading,
  notFound,
  hasComment,
}) {
  return (
    <>
      <div className="divider mt-1">Kommentar</div>
      <div className="form-control mb-2">
        <label className="label cursor-pointer justify-start gap-3">
          <span className="label-text font-semibold">
            Kommentar in Vorschau & PDF anzeigen
          </span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={showComment}
            onChange={(e) => setShowComment(e.target.checked)}
          />
        </label>
      </div>
      <div className="form-control mb-3">
        <label className="label cursor-pointer justify-start gap-3">
          <span className="label-text font-semibold">
            Datum im Footer anzeigen
          </span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={showCommentDate}
            onChange={(e) =>
              setShowCommentDate(e.target.checked)
            }
          />
        </label>
      </div>
      <div className="form-control gap-3">
        <label className="label" htmlFor="comment-admin">
          <span className="label-text font-medium">
            Allgemeiner Kommentar (zum Kandidaten)
          </span>
        </label>
        {showCommentPreview && renderCommentPreview()}
        {isCommentEditorOpen && (
          <RichTextEditor
            value={commentHtml}
            onChange={setCommentHtml}
            placeholder='Allgemeine Notiz: "Der Kandidat passt sehr gut, nur das Foto sollte aktualisiert werden."'
          />
        )}
        {isCommentEditorOpen && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 mt-3">
            {(canUndoComment() || canRedoComment()) && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={undoComment}
                  disabled={
                    !canUndoComment() || isCorrectingComment
                  }
                  title="Rückgängig"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={redoComment}
                  disabled={
                    !canRedoComment() || isCorrectingComment
                  }
                  title="Wiederherstellen"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-sm btn-primary gap-2"
              onClick={handleCorrectComment}
              disabled={
                isSaving ||
                loading ||
                notFound ||
                isCorrectingComment ||
                !hasComment
              }
              title="Kommentar mit KI korrigieren"
            >
              {isCorrectingComment ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Korrigieren...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  KI
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleCommentPrimaryAction}
              disabled={isSaving || loading || notFound}
            >
              {commentActionLabel}
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                className="btn btn-sm btn-outline btn-error"
                onClick={handleClearComment}
                disabled={isSaving || loading || notFound}
                title="Kommentar löschen (nur Super-Admin)"
              >
                Löschen
              </button>
            )}
          </div>
        )}
        {!isCommentEditorOpen && (
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleCommentPrimaryAction}
              disabled={isSaving || loading || notFound}
            >
              {commentActionLabel}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
