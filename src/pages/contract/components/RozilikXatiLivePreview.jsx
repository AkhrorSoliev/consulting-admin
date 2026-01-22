import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function arePageIndexGroupsEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (!Array.isArray(pa) || !Array.isArray(pb) || pa.length !== pb.length)
      return false;
    for (let j = 0; j < pa.length; j++) {
      if (pa[j] !== pb[j]) return false;
    }
  }
  return true;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function SafeInline({ children, className }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: escapeHtml(children) }}
    />
  );
}

function buildRozilikXatiBlocks(form) {
  const currentYear = new Date().getFullYear();

  const nomzodIsm = String(form?.nomzodIsm || "").trim();
  const nomzodFamilya = String(form?.nomzodFamilya || "").trim();
  const nomzodJinsi = String(form?.nomzodJinsi || "").trim();
  const nomzodTugilganSana = String(form?.nomzodTugilganSana || "").trim();
  const nomzodManzil = String(form?.nomzodManzil || "").trim();
  const nomzodOqishJoyi = String(form?.nomzodOqishJoyi || "").trim();
  const nomzodTelefon = String(form?.nomzodTelefon || "").trim();
  const joy = String(form?.joy || "").trim();
  const sana = String(form?.sana || "").trim();

  const hasValue = (v) => String(v || "").trim().length > 0;

  const FormRow = ({ label, value }) => (
    <div className="flex mt-[6pt]">
      <div className="w-[140px] shrink-0">{label}:</div>
      {hasValue(value) ? (
        <div className="flex-1 min-h-[14pt]">
          <SafeInline>{value}</SafeInline>
        </div>
      ) : (
        <div className="flex-1 border-b border-slate-700 min-h-[14pt]" />
      )}
    </div>
  );

  const EmptyFormRow = ({ label }) => (
    <div className="flex mt-[6pt]">
      <div className="w-[140px] shrink-0">{label}:</div>
      <div className="flex-1 border-b border-slate-700 min-h-[14pt]" />
    </div>
  );

  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center mb-[20pt]">
          <div className="text-[12pt] font-bold text-blue-600">
            {currentYear}-yil iyun-avgust oylarida Germaniya Federativ Respublikasiga borishiga va ta'til vaqtida yordamchi ishlarda ishlashga rozilik xati
          </div>
        </div>
      ),
    },
    {
      id: "nomzod-section",
      keepWithNext: true,
      node: (
        <div>
          <div className="text-[11pt] font-bold italic mt-[16pt] mb-[8pt]">
            NOMZOD HAQIDA MA'LUMOTLAR:
          </div>
          <FormRow label="Ismi" value={nomzodIsm} />
          <FormRow label="Familyasi" value={nomzodFamilya} />
          <FormRow label="Jinsi" value={nomzodJinsi} />
          <FormRow label="Tug'ilgan sanasi" value={nomzodTugilganSana} />
          <FormRow label="Manzili" value={nomzodManzil} />
          <FormRow label="O'qish joyi" value={nomzodOqishJoyi} />
          <FormRow label="Telefon raqami" value={nomzodTelefon} />
        </div>
      ),
    },
    {
      id: "beruvchi-section",
      node: (
        <div>
          <div className="text-[11pt] font-bold italic mt-[16pt] mb-[8pt]">
            NOMZODGA ROZILIK XATI BERUVCHI SHAXS HAQIDA MA'LUMOTLAR:
          </div>
          <EmptyFormRow label="Rozilik xati beruvchi shaxs" />
          <EmptyFormRow label="Ismi" />
          <EmptyFormRow label="Familyasi" />
          <EmptyFormRow label="Jinsi" />
          <EmptyFormRow label="Tug'ilgan sanasi" />
          <EmptyFormRow label="Manzili" />
          <EmptyFormRow label="Ish joyi" />
          <EmptyFormRow label="Telefon raqami" />
        </div>
      ),
    },
    {
      id: "content",
      node: (
        <div>
          <div className="text-[11pt] font-bold mt-[16pt] mb-[8pt]">
            ROZILIK XATI MAZMUNI:
          </div>
          <div className="mt-[12pt] text-justify">
            Yuqorida ma'lumotlari keltirilgan farzandimning {currentYear}-yil iyun-avgust oylarida Germaniya Federativ Respublikasiga borishiga va ta'til vaqtida yordamchi ishlarda ishlashiga roziman va uning salomatligi hamda xulqi uchun javobgarlikni o'z bo'ynimga olaman. Yuqorida keltirilgan ma'lumotlar to'g'riligiga kafolat beraman.
          </div>
        </div>
      ),
    },
    {
      id: "signatures",
      node: (
        <div className="flex justify-between mt-[40pt]">
          <div className="w-[30%]">
            <div className="border-b border-slate-700 h-[1px] mb-[4pt]" />
            <div className="text-[10pt] text-center">
              {hasValue(joy) && hasValue(sana) ? `${joy}, ${sana}` : "Joy, Sana"}
            </div>
          </div>
          <div className="w-[30%]">
            <div className="border-b border-slate-700 h-[1px] mb-[4pt]" />
            <div className="text-[10pt] text-center">Imzo</div>
          </div>
          <div className="w-[30%]">
            <div className="border-b border-slate-700 h-[1px] mb-[4pt]" />
            <div className="text-[10pt] text-center">Ism, Familya</div>
          </div>
        </div>
      ),
    },
  ];
}

export default function RozilikXatiLivePreview({
  form,
  containerClassName,
  showToolbar = true,
}) {
  const A4_WIDTH_PT = 595;
  const A4_HEIGHT_PT = 842;
  const PT_TO_PX = 96 / 72;
  const A4_WIDTH_PX = A4_WIDTH_PT * PT_TO_PX;
  const A4_HEIGHT_PX = A4_HEIGHT_PT * PT_TO_PX;
  const PAGE_MARGIN_PT = 72;

  const viewportRef = useRef(null);
  const measureRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [pageGroups, setPageGroups] = useState(null);
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
  }, [viewportWidth, A4_WIDTH_PX]);

  const blocks = useMemo(() => buildRozilikXatiBlocks(form), [form]);

  const contentBottomPadPt = PAGE_MARGIN_PT;
  const contentHeightPx =
    A4_HEIGHT_PX - (PAGE_MARGIN_PT + contentBottomPadPt) * PT_TO_PX;

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll("[data-block]"));
    const sentinel = root.querySelector("[data-sentinel]");
    if (!nodes.length || !sentinel) {
      setPageGroups((prev) => {
        const fallback = [blocks.map((_, idx) => idx)];
        return arePageIndexGroupsEqual(prev, fallback) ? prev : fallback;
      });
      return;
    }
    const tops = nodes.map((el) => el.offsetTop || 0);
    const sentinelTop = sentinel.offsetTop || 0;
    const occupied = nodes.map((_, i) => {
      const nextTop = i < nodes.length - 1 ? tops[i + 1] : sentinelTop;
      return Math.max(0, nextTop - tops[i]);
    });
    const pages = [];
    let current = [];
    let used = 0;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const h = occupied[i] || 0;
      const nextH = i + 1 < occupied.length ? occupied[i + 1] || 0 : 0;
      const required =
        block?.keepWithNext && i + 1 < blocks.length ? h + nextH : h;

      if (block?.forceNewPage && current.length > 0) {
        pages.push(current);
        current = [];
        used = 0;
      }
      if (current.length > 0 && used + required > contentHeightPx) {
        pages.push(current);
        current = [];
        used = 0;
      }
      current.push(i);
      used += h;
    }
    if (current.length) pages.push(current);
    if (!pages.length) pages.push([0]);

    setPageGroups((prev) =>
      arePageIndexGroupsEqual(prev, pages) ? prev : pages
    );
  }, [fontReadyTick, blocks, contentHeightPx]);

  const resolvedGroups =
    Array.isArray(pageGroups) && pageGroups.length
      ? pageGroups
      : [blocks.map((_, idx) => idx)];

  function ScaledA4({ children, pageLabel }) {
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
                  paddingBottom: `${contentBottomPadPt}pt`,
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
                <ScaledA4 key={pageIdx} pageLabel={`A4-Seite ${pageIdx + 1}`}>
                  <div
                    className="bg-white shadow-2xl text-[#0f172a] text-[11pt] leading-[1.45] origin-top shrink-0 box-border"
                    style={{
                      fontFamily: "Inter, Helvetica, Arial, sans-serif",
                      width: `${A4_WIDTH_PT}pt`,
                      height: `${A4_HEIGHT_PT}pt`,
                      padding: `${PAGE_MARGIN_PT}pt`,
                      paddingBottom: `${contentBottomPadPt}pt`,
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
