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

function buildVollmachtBlocks({ lastName, firstName, birthDate, city, date }) {
  const lastNameLine = String(lastName || "").trim();
  const firstNameLine = String(firstName || "").trim();
  const birthDateLine = String(birthDate || "").trim();
  const cityLine = String(city || "").trim();
  const dateLine = String(date || "").trim();

  const hasValue = (v) => String(v || "").trim().length > 0;

  const P = ({ children, className = "" }) => (
    <div className={`mt-[8pt] ${className}`}>{children}</div>
  );

  const FormRow = ({ label, value }) => (
    <div className="flex gap-[6pt] mt-[10pt]">
      <div className="w-[120px] shrink-0">{label}:</div>
      {hasValue(value) ? (
        <div className="flex-1 min-h-[16pt]">
          <SafeInline>{value}</SafeInline>
        </div>
      ) : (
        <div className="flex-1 border-b border-slate-700 min-h-[16pt]" />
      )}
    </div>
  );

  const Bullet = ({ children }) => (
    <div className="flex gap-[6pt] mt-[4pt]">
      <span className="shrink-0">•</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );

  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[18pt] font-bold">Vollmacht</div>
        </div>
      ),
    },
    {
      id: "intro",
      keepWithNext: true,
      node: (
        <div>
          <P>Hiermit bevollmächtige ich</P>

          <div className="ml-5 mt-[8pt]">
            <FormRow label="Nachname" value={lastNameLine} />
            <FormRow label="Vorname" value={firstNameLine} />
            <FormRow label="geboren am" value={birthDateLine} />
          </div>

          <P className="mt-[16pt]">den Vollmachtnehmer</P>

          <P className="font-bold mt-[8pt]">
            Orif Akhmadaliev, (ConsultingUz), Alemannenweg 6, 72488 Sigmaringen
          </P>

          <P className="mt-[12pt]">
            mich zu unterstützen und zu vertreten in der Angelegenheit Erlangung
            und Antritt einer Fachkraft in Deutschland.
          </P>

          <P className="mt-[12pt]">Die Vollmacht umfasst insbesondere</P>
        </div>
      ),
    },
    {
      id: "list",
      node: (
        <div className="ml-3">
          <div className="mt-[8pt]">
            <Bullet>
              die Vertretung bei allen erforderlichen Maßnahmen gegenüber
              Behörden und Intuitionen, um eine Fachkraft in Deutschland
              antreten zu können,
            </Bullet>
            <Bullet>die Einholung von beglaubigten Übersetzungen,</Bullet>
            <Bullet>
              die Versendung und Entgegennahme von Schriftstücken sowie die
              Abgabe und Entgegennahme von mündlichen Erklärungen im Rahmen der
              vorgenannten Tätigkeiten ist ausdrücklich eingeschlossen.
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-[32pt]">
          <div className="ml-5">
            <FormRow label="Wohnort" value={cityLine} />
            <FormRow label="Datum" value={dateLine} />

            <div className="flex gap-[6pt] mt-[20pt]">
              <div className="w-[120px] shrink-0">Unterschrift:</div>
              <div className="flex-1 border-b border-slate-700 min-h-[20pt]" />
            </div>
          </div>
        </div>
      ),
    },
  ];
}

export default function VollmachtLivePreview({
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

  const blocks = useMemo(
    () =>
      buildVollmachtBlocks({
        lastName: String(form?.lastName || "").trim(),
        firstName: String(form?.firstName || "").trim(),
        birthDate: String(form?.birthDate || "").trim(),
        city: String(form?.city || "").trim(),
        date: String(form?.date || "").trim(),
      }),
    [form?.lastName, form?.firstName, form?.birthDate, form?.city, form?.date]
  );

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
