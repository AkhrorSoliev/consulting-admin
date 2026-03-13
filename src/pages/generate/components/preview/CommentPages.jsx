import ScaledA4 from "./ScaledA4";
import { A4_WIDTH_PT, A4_HEIGHT_PT, AUTO_GENERATED_NOTE, renderStars } from "./utils";

export default function CommentPages({
  resolvedCommentPageGroups,
  commentLineEntries,
  renderCommentLine,
  mainPageCount,
  showCommentDate,
  commentDate,
  rating,
  effectiveScale,
  isZoomedIn,
  isPanning,
  enableClickZoom,
  toggleZoom,
}) {
  return resolvedCommentPageGroups.map((group, commentPageIdx) => (
    <ScaledA4
      key={`comment-${commentPageIdx}`}
      pageLabel={`A4-Seite ${mainPageCount + commentPageIdx + 1}`}
      effectiveScale={effectiveScale}
      isZoomedIn={isZoomedIn}
      isPanning={isPanning}
      enableClickZoom={enableClickZoom}
      toggleZoom={toggleZoom}
    >
      <div
        className="bg-base-100 shadow-2xl text-base-content text-[11pt] leading-normal origin-top shrink-0 relative box-border overflow-hidden"
        style={{
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          width: `${A4_WIDTH_PT}pt`,
          height: `${A4_HEIGHT_PT}pt`,
          padding: "44pt",
          paddingBottom: "72pt",
        }}
      >
        {commentPageIdx === 0 && (
          <div className="mb-[18pt]">
            <div className="text-[24pt] font-bold leading-tight">
              Erst- und Zweitgesprächsfeedback
            </div>
            {rating !== null && rating > 0 && (
              <div className="flex items-center gap-1 mt-2 mb-1">
                {renderStars(rating)}
              </div>
            )}
            <div className="h-[2pt] bg-base-content/80 mt-[17pt] mb-[12pt] w-full" />
          </div>
        )}
        <div
          className={`text-[11pt] leading-normal whitespace-pre-wrap break-words ${
            commentPageIdx === 0 ? "mt-[10pt]" : ""
          }`}
        >
          {group.map((lineIdx) => {
            const item = commentLineEntries[lineIdx];
            if (!item) return null;
            return <div key={item.id}>{renderCommentLine(item)}</div>;
          })}
        </div>

        {commentPageIdx === resolvedCommentPageGroups.length - 1 &&
          showCommentDate && (
            <div className="absolute left-[44pt] right-[44pt] bottom-[34pt]">
              <div className="text-[10pt] text-right">
                Datum: {commentDate || "—"}
              </div>
              <div className="text-[9pt] text-center">
                {AUTO_GENERATED_NOTE}
              </div>
            </div>
          )}
      </div>
    </ScaledA4>
  ));
}
