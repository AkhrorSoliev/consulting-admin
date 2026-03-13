import { A4_WIDTH_PX, A4_HEIGHT_PX } from "./utils";

export default function ScaledA4({ children, pageLabel, safeScale }) {
  const scaledW = A4_WIDTH_PX * safeScale;
  const scaledH = A4_HEIGHT_PX * safeScale;
  return (
    <div style={{ width: `${scaledW}px`, height: `${scaledH}px` }}>
      <div
        aria-label={pageLabel}
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
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
