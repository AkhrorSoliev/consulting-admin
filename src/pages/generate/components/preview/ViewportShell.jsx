export default function ViewportShell({
  viewportRef,
  panStateRef,
  enableClickZoom,
  isZoomedIn,
  setIsPanning,
  showToolbar,
  children,
}) {
  return (
    <div className="bg-base-200/50 rounded-xl border border-base-300 shadow-inner h-full flex flex-col overflow-hidden">
      {showToolbar ? (
        <div className="bg-base-100 border-b border-base-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-base-content/70 uppercase tracking-wider z-10">
          <span>Vorschau (A4)</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live-Aktualisierung
          </span>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        onPointerDown={(e) => {
          if (!enableClickZoom || !isZoomedIn) return;
          if (e.button != null && e.button !== 0) return;
          const el = viewportRef.current;
          if (!el) return;
          panStateRef.current.active = true;
          panStateRef.current.moved = false;
          panStateRef.current.startX = e.clientX;
          panStateRef.current.startY = e.clientY;
          panStateRef.current.startLeft = el.scrollLeft;
          panStateRef.current.startTop = el.scrollTop;
          setIsPanning(true);
          try {
            el.setPointerCapture?.(e.pointerId);
          } catch {
            // ignore
          }
        }}
        onPointerMove={(e) => {
          if (!enableClickZoom || !isZoomedIn) return;
          const st = panStateRef.current;
          if (!st.active) return;
          const el = viewportRef.current;
          if (!el) return;
          const dx = e.clientX - st.startX;
          const dy = e.clientY - st.startY;
          if (!st.moved && Math.hypot(dx, dy) > 3) st.moved = true;
          el.scrollLeft = st.startLeft - dx;
          el.scrollTop = st.startTop - dy;
        }}
        onPointerUp={(e) => {
          if (!enableClickZoom || !isZoomedIn) return;
          const el = viewportRef.current;
          panStateRef.current.active = false;
          setIsPanning(false);
          try {
            el?.releasePointerCapture?.(e.pointerId);
          } catch {
            // ignore
          }
        }}
        onPointerCancel={(e) => {
          if (!enableClickZoom || !isZoomedIn) return;
          const el = viewportRef.current;
          panStateRef.current.active = false;
          setIsPanning(false);
          try {
            el?.releasePointerCapture?.(e.pointerId);
          } catch {
            // ignore
          }
        }}
        className={`flex-1 overflow-y-auto w-full bg-base-200 ${
          enableClickZoom && isZoomedIn
            ? "overflow-x-auto"
            : "overflow-x-hidden"
        }`}
        style={{
          userSelect: enableClickZoom && isZoomedIn ? "none" : undefined,
          touchAction: enableClickZoom && isZoomedIn ? "none" : undefined,
        }}
      >
        <div
          className={`w-full flex flex-col gap-6 py-6 ${
            enableClickZoom && isZoomedIn
              ? "items-start px-6"
              : "items-center"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
