import { useMemo } from "react";
import {
  A4_WIDTH_PT,
  A4_HEIGHT_PT,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  PAGE_MARGIN_PT,
} from "./utils";
import { buildVollmachtArbeitgeberBlocks } from "./buildVollmachtArbeitgeberBlocks";
import useA4Pagination from "./useA4Pagination";

export default function VollmachtArbeitgeberLivePreview({
  form,
  containerClassName,
  showToolbar = true,
}) {
  const blocks = useMemo(() => buildVollmachtArbeitgeberBlocks(form), [form]);

  const { viewportRef, measureRef, safeScale, resolvedGroups, contentBottomPadPt } =
    useA4Pagination(blocks);

  function ScaledA4({ children, pageLabel }) {
    const scaledW = A4_WIDTH_PX * safeScale;
    const scaledH = A4_HEIGHT_PX * safeScale;
    return (
      <div style={{ width: `${scaledW}px`, height: `${scaledH}px` }}>
        <div
          aria-label={pageLabel}
          style={{
            width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`,
            position: "relative", left: "50%", top: 0,
            transform: `translateX(-50%) scale(${safeScale})`,
            transformOrigin: "top center",
          }}
        >{children}</div>
      </div>
    );
  }

  return (
    <section
      className={
        (containerClassName ||
          "w-full flex-1 min-w-0 h-[calc(100vh-2rem)] lg:sticky lg:top-4") +
        " relative"
      }
    >
      <div className="bg-slate-200/50 rounded-xl border border-slate-300 shadow-inner h-full flex flex-col overflow-hidden">
        {showToolbar ? (
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider z-10">
            <span>Vorschau (A4)</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live-Aktualisierung
            </span>
          </div>
        ) : null}
        <div ref={viewportRef} className="flex-1 overflow-y-auto w-full bg-slate-100 overflow-x-hidden">
          <div className="w-full flex flex-col gap-6 py-6 items-center">
            <div aria-hidden="true" className="absolute -left-[99999px] top-0 h-0 overflow-hidden opacity-0 pointer-events-none">
              <div
                className="bg-white text-[#0f172a] text-[11pt] leading-[1.3] box-border"
                style={{ fontFamily: "Arimo, Helvetica, Arial, sans-serif", width: `${A4_WIDTH_PT}pt`, padding: `${PAGE_MARGIN_PT}pt`, paddingBottom: `${contentBottomPadPt}pt` }}
              >
                <div ref={measureRef} style={{ position: "relative", width: "100%" }}>
                  {blocks.map((b) => (<div key={b.id} data-block className="pr-2">{b.node}</div>))}
                  <div data-sentinel />
                </div>
              </div>
            </div>
            {resolvedGroups.map((group, pageIdx) => {
              const blocksForPage = group.map((i) => blocks[i]).filter(Boolean);
              return (
                <ScaledA4 key={pageIdx} pageLabel={`A4-Seite ${pageIdx + 1}`}>
                  <div
                    className="bg-white shadow-2xl text-[#0f172a] text-[11pt] leading-[1.3] origin-top shrink-0 box-border"
                    style={{ fontFamily: "Arimo, Helvetica, Arial, sans-serif", width: `${A4_WIDTH_PT}pt`, height: `${A4_HEIGHT_PT}pt`, padding: `${PAGE_MARGIN_PT}pt`, paddingBottom: `${contentBottomPadPt}pt` }}
                  >
                    {blocksForPage.map((b) => (<div key={b.id} className="pr-2">{b.node}</div>))}
                  </div>
                </ScaledA4>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
