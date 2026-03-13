const ZOOM_RANGE_LEN_PX = 260;

export default function ZoomControls({
  showToolbar,
  zoomFactor,
  zoomBounds,
  setZoomClamped,
}) {
  return (
    <>
      {/* Mobile zoom bar (bottom, horizontal) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 pointer-events-auto sm:hidden">
        <div className="rounded-2xl border border-base-200 bg-base-100/95 backdrop-blur shadow-lg px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
            onClick={() => setZoomClamped(zoomFactor - 0.05)}
            aria-label="Herauszoomen"
            title="Zoom -"
            disabled={zoomFactor <= zoomBounds.min + 0.0001}
          >
            −
          </button>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold text-base-content/70 tracking-wide select-none">
                {Math.round(zoomFactor * 100)}%
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs normal-case h-auto min-h-0 px-2 py-1 text-[10px]"
                onClick={() => setZoomClamped(1)}
                aria-label="Zoom zurücksetzen"
                title="Reset (100%)"
              >
                Reset
              </button>
            </div>
            <input
              type="range"
              className="range range-primary w-full"
              min={zoomBounds.min}
              max={zoomBounds.max}
              step={0.05}
              value={zoomFactor}
              onChange={(e) => setZoomClamped(e.target.value)}
              aria-label="Zoom"
            />
          </div>
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
            onClick={() => setZoomClamped(zoomFactor + 0.05)}
            aria-label="Hineinzoomen"
            title="Zoom +"
            disabled={zoomFactor >= zoomBounds.max - 0.0001}
          >
            +
          </button>
        </div>
      </div>

      {/* Desktop/tablet zoom bar (top-right, vertical) */}
      <div
        className={`absolute ${
          showToolbar ? "top-12" : "top-3"
        } right-3 sm:right-4 z-30 pointer-events-auto hidden sm:block`}
      >
        <div className="rounded-2xl border border-base-200 bg-base-100/95 backdrop-blur shadow-lg p-2 flex flex-col items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
            onClick={() => setZoomClamped(zoomFactor + 0.05)}
            aria-label="Hineinzoomen"
            title="Zoom +"
            disabled={zoomFactor >= zoomBounds.max - 0.0001}
          >
            +
          </button>

          <div className="flex flex-col items-center gap-2 flex-1 min-h-0 py-1">
            <div className="text-[10px] font-semibold text-base-content/70 tracking-wide select-none">
              {Math.round(zoomFactor * 100)}%
            </div>
            <div
              className="relative w-12 flex items-center justify-center"
              style={{ height: `${ZOOM_RANGE_LEN_PX}px` }}
            >
              <input
                type="range"
                className="range range-primary -rotate-90 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
                min={zoomBounds.min}
                max={zoomBounds.max}
                step={0.05}
                value={zoomFactor}
                onChange={(e) => setZoomClamped(e.target.value)}
                aria-label="Zoom"
                style={{ width: `${ZOOM_RANGE_LEN_PX}px` }}
              />
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs normal-case h-auto min-h-0 px-2 py-1 text-[10px]"
              onClick={() => setZoomClamped(1)}
              aria-label="Zoom zurücksetzen"
              title="Reset (100%)"
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
            onClick={() => setZoomClamped(zoomFactor - 0.05)}
            aria-label="Herauszoomen"
            title="Zoom -"
            disabled={zoomFactor <= zoomBounds.min + 0.0001}
          >
            −
          </button>
        </div>
      </div>
    </>
  );
}
