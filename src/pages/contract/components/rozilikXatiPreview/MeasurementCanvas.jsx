import { forwardRef } from "react";
import { A4_WIDTH_PT, PAGE_MARGIN_PT } from "./utils";

const MeasurementCanvas = forwardRef(function MeasurementCanvas(
  { blocks, contentBottomPadPt },
  ref
) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[99999px] top-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      <div
        className="bg-white text-[#0f172a] text-[11pt] leading-[1.45] box-border"
        style={{
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          width: `${A4_WIDTH_PT}pt`,
          padding: `${PAGE_MARGIN_PT}pt`,
          paddingBottom: `${contentBottomPadPt}pt`,
        }}
      >
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
          {blocks.map((b) => (
            <div key={b.id} data-block className="pr-[6pt]">
              {b.node}
            </div>
          ))}
          <div data-sentinel />
        </div>
      </div>
    </div>
  );
});

export default MeasurementCanvas;
