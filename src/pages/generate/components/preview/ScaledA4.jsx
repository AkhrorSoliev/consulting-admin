import { A4_WIDTH_PX, A4_HEIGHT_PX } from "./utils";

export default function ScaledA4({
  children,
  pageLabel = "A4-Seite",
  effectiveScale,
  isZoomedIn,
  isPanning,
  enableClickZoom,
  toggleZoom,
}) {
  const scaledW = A4_WIDTH_PX * effectiveScale;
  const scaledH = A4_HEIGHT_PX * effectiveScale;
  const zoomPanMode = isZoomedIn;
  return (
    <div
      style={{
        width: `${scaledW}px`,
        height: `${scaledH}px`,
      }}
    >
      <div
        role={enableClickZoom ? "button" : undefined}
        tabIndex={enableClickZoom ? 0 : undefined}
        aria-label={
          enableClickZoom
            ? isZoomedIn
              ? `${pageLabel} – klicken zum Herauszoomen`
              : `${pageLabel} – klicken zum Hineinzoomen`
            : undefined
        }
        onClick={enableClickZoom ? toggleZoom : undefined}
        onKeyDown={
          enableClickZoom
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleZoom();
                }
              }
            : undefined
        }
        className={
          enableClickZoom
            ? `select-none ${
                isZoomedIn
                  ? isPanning
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-zoom-in"
              }`
            : undefined
        }
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          position: "relative",
          left: zoomPanMode ? 0 : "50%",
          top: 0,
          transform: zoomPanMode
            ? `scale(${effectiveScale})`
            : `translateX(-50%) scale(${effectiveScale})`,
          transformOrigin: zoomPanMode ? "top left" : "top center",
          transition: enableClickZoom
            ? "transform 220ms ease-out"
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
