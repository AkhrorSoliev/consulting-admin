import { useEffect, useMemo, useRef, useState } from "react";
import buildVollmachtBlocks from "./vollmachtPreview/VollmachtBlocks";
import ScaledA4 from "./vollmachtPreview/ScaledA4";
import usePagination from "./vollmachtPreview/usePagination";

const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;
const PT_TO_PX = 96 / 72;
const A4_WIDTH_PX = A4_WIDTH_PT * PT_TO_PX;
const A4_HEIGHT_PX = A4_HEIGHT_PT * PT_TO_PX;
const PAGE_MARGIN_PT = 72;
const CONTENT_BOTTOM_PAD_PT = PAGE_MARGIN_PT;
const CONTENT_HEIGHT_PX =
  A4_HEIGHT_PX - (PAGE_MARGIN_PT + CONTENT_BOTTOM_PAD_PT) * PT_TO_PX;

export default function VollmachtLivePreview({
  form,
  containerClassName,
  showToolbar = true,
}) {
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [fontReadyTick, setFontReadyTick] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const w =
        entry?.contentRect?.width ?? el.getBoundingClientRect?.().width ?? 0;
      setViewportWidth(Number.isFinite(w) ? w : 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    try {
      const fonts = typeof document !== "undefined" ? document.fonts : null;
      if (fonts?.ready && typeof fonts.ready.then === "function") {
        fonts.ready
          .then(() => {
            if (!alive) return;
            setFontReadyTick((t) => t + 1);
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
    return () => {
      alive = false;
    };
  }, []);

  const safeScale = useMemo(() => {
    const paddingPx = 24;
    const available = Math.max(0, (viewportWidth || 0) - paddingPx);
    if (!available) return 1;
    const auto = available / A4_WIDTH_PX;
    return Math.min(1, Math.max(0.4, auto));
  }, [viewportWidth]);

  const blocks = useMemo(
    () =>
      buildVollmachtBlocks({
        lastName: String(form?.lastName || "").trim(),
        firstName: String(form?.firstName || "").trim(),
        birthDate: String(form?.birthDate || "").trim(),
        city: String(form?.city || "").trim(),
        date: String(form?.date || "").trim(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form?.lastName, form?.firstName, form?.birthDate, form?.city, form?.date]
  );

  const { measureRef, resolvedGroups } = usePagination({
    blocks,
    contentHeightPx: CONTENT_HEIGHT_PX,
    fontReadyTick,
  });

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

        <div
          ref={viewportRef}
          className="flex-1 overflow-y-auto w-full bg-slate-100 overflow-x-hidden"
        >
          <div className="w-full flex flex-col gap-6 py-6 items-center">
            {/* Hidden measurement canvas */}
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
                  paddingBottom: `${CONTENT_BOTTOM_PAD_PT}pt`,
                }}
              >
                <div
                  ref={measureRef}
                  style={{ position: "relative", width: "100%" }}
                >
                  {blocks.map((b) => (
                    <div key={b.id} data-block className="pr-[6pt]">
                      {b.node}
                    </div>
                  ))}
                  <div data-sentinel />
                </div>
              </div>
            </div>

            {resolvedGroups.map((group, pageIdx) => {
              const blocksForPage = group.map((i) => blocks[i]).filter(Boolean);
              return (
                <ScaledA4
                  key={pageIdx}
                  pageLabel={`A4-Seite ${pageIdx + 1}`}
                  a4WidthPx={A4_WIDTH_PX}
                  a4HeightPx={A4_HEIGHT_PX}
                  safeScale={safeScale}
                >
                  <div
                    className="bg-white shadow-2xl text-[#0f172a] text-[11pt] leading-[1.45] origin-top shrink-0 box-border"
                    style={{
                      fontFamily: "Inter, Helvetica, Arial, sans-serif",
                      width: `${A4_WIDTH_PT}pt`,
                      height: `${A4_HEIGHT_PT}pt`,
                      padding: `${PAGE_MARGIN_PT}pt`,
                      paddingBottom: `${CONTENT_BOTTOM_PAD_PT}pt`,
                    }}
                  >
                    {blocksForPage.map((b) => (
                      <div key={b.id} className="pr-[6pt]">
                        {b.node}
                      </div>
                    ))}
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
