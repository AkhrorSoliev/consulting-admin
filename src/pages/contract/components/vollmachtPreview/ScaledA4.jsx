export default function ScaledA4({
  children,
  pageLabel,
  a4WidthPx,
  a4HeightPx,
  safeScale,
}) {
  const scaledW = a4WidthPx * safeScale;
  const scaledH = a4HeightPx * safeScale;
  return (
    <div style={{ width: `${scaledW}px`, height: `${scaledH}px` }}>
      <div
        aria-label={pageLabel}
        style={{
          width: `${a4WidthPx}px`,
          height: `${a4HeightPx}px`,
          position: "relative",
          left: "50%",
          top: 0,
          transform: `translateX(-50%) scale(${safeScale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
