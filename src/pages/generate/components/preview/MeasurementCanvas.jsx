import { A4_WIDTH_PT, A4_HEIGHT_PT } from "./utils";
import { renderStars } from "./utils";

export default function MeasurementCanvas({
  mainMeasureRef,
  commentHeaderMeasureRef,
  commentBodyMeasureRef,
  mainBlocks,
  mainContentBottomPadPt,
  commentLineEntries,
  renderCommentLine,
  rating,
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[99999px] top-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      <div
        className="bg-base-100 text-base-content text-[11pt] leading-[1.38] box-border"
        style={{
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          width: `${A4_WIDTH_PT}pt`,
          padding: "44pt",
          paddingBottom: `${mainContentBottomPadPt}pt`,
        }}
      >
        <div
          ref={mainMeasureRef}
          style={{ position: "relative", width: "100%" }}
        >
          {mainBlocks.map((b) => (
            <div
              key={b.id}
              data-main-block
              className={b.kind === "header" ? "" : "pr-[6pt]"}
            >
              {b.node}
            </div>
          ))}
          <div data-main-sentinel />
        </div>
      </div>

      <div
        className="bg-base-100 text-base-content text-[11pt] leading-normal box-border"
        style={{
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          width: `${A4_WIDTH_PT}pt`,
          height: `${A4_HEIGHT_PT}pt`,
          padding: "44pt",
          paddingBottom: "72pt",
        }}
      >
        <div ref={commentHeaderMeasureRef} className="mb-[18pt]">
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
        <div
          ref={commentBodyMeasureRef}
          className="mt-[10pt] text-[11pt] leading-normal whitespace-pre-wrap break-words"
        >
          {commentLineEntries.map((entry) => (
            <div key={entry.id} data-comment-line-block>
              {renderCommentLine(entry)}
            </div>
          ))}
          <div data-comment-line-sentinel />
        </div>
      </div>
    </div>
  );
}
