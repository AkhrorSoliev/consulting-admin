import { formatCommentDate } from "../../utils";

/**
 * Returns a JSX renderer for the comment preview block.
 */
export function buildRenderCommentPreview({ hasComment, commentHtml, commentMeta }) {
  return function renderCommentPreview(extraClassName = "") {
    return (
      <div
        className={`rounded-lg border border-base-300 bg-base-100 p-3 max-h-60 overflow-auto ${extraClassName}`}
      >
        {hasComment ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {commentMeta?.updatedByPhoto ? (
                  <img
                    src={commentMeta.updatedByPhoto}
                    alt={commentMeta?.updatedByName || "Kommentator"}
                    className="w-8 h-8 rounded-full object-cover border border-base-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-base-300 text-base-content/70 flex items-center justify-center text-xs font-semibold">
                    {(commentMeta?.updatedByName || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-base-content">
                    {commentMeta?.updatedByName || "Unbekannter Benutzer"}
                  </div>
                  {commentMeta?.updatedAt && (
                    <div className="text-[11px] text-base-content/60">
                      Aktualisiert: {formatCommentDate(commentMeta.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              className="prose prose-sm max-w-none text-base-content"
              dangerouslySetInnerHTML={{ __html: commentHtml }}
            />
          </div>
        ) : (
          <p className="text-sm text-base-content/60 italic">
            Kein Kommentar vorhanden.
          </p>
        )}
      </div>
    );
  };
}
