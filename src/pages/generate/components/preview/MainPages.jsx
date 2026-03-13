import ScaledA4 from "./ScaledA4";
import { A4_WIDTH_PT, A4_HEIGHT_PT, AUTO_GENERATED_NOTE } from "./utils";

export default function MainPages({
  resolvedMainPageGroups,
  mainBlocks,
  mainPageCount,
  showComment,
  showCommentDate,
  commentDate,
  mainContentBottomPadPt,
  effectiveScale,
  isZoomedIn,
  isPanning,
  enableClickZoom,
  toggleZoom,
}) {
  return resolvedMainPageGroups.map((group, pageIdx) => {
    const blocksForPage = group.map((i) => mainBlocks[i]).filter(Boolean);
    const showFooter =
      !showComment && pageIdx === Math.max(0, mainPageCount - 1);

    return (
      <ScaledA4
        key={`main-${pageIdx}`}
        pageLabel={`A4-Seite ${pageIdx + 1}`}
        effectiveScale={effectiveScale}
        isZoomedIn={isZoomedIn}
        isPanning={isPanning}
        enableClickZoom={enableClickZoom}
        toggleZoom={toggleZoom}
      >
        <div
          className={`bg-base-100 shadow-2xl text-base-content text-[11pt] leading-[1.38] origin-top shrink-0 box-border overflow-hidden ${
            showFooter ? "relative" : ""
          }`}
          style={{
            fontFamily: "Inter, Helvetica, Arial, sans-serif",
            width: `${A4_WIDTH_PT}pt`,
            height: `${A4_HEIGHT_PT}pt`,
            padding: "44pt",
            paddingBottom: `${mainContentBottomPadPt}pt`,
          }}
        >
          {blocksForPage.map((b) => (
            <div
              key={b.id}
              className={b.kind === "header" ? "" : "pr-[6pt]"}
            >
              {b.node}
            </div>
          ))}

          {showFooter && showCommentDate && (
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
    );
  });
}
