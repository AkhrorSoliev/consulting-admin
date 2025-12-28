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

function buildVermittlungsvertragBlocks({
  candidateName,
  contractDurationYears,
  signatureCity,
  signatureDate,
}) {
  const nameLine =
    String(candidateName || "").trim() || "_____________________";

  // Calculate contract dates
  const today = new Date();
  const startDate = new Date(today);
  const years = parseInt(contractDurationYears) || 2;
  const endDate = new Date(today);
  endDate.setFullYear(endDate.getFullYear() + years);

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  };

  const startDateLine = formatDate(startDate);
  const endDateLine = formatDate(endDate);
  const signatureCityLine =
    String(signatureCity || "").trim() || "_____________________";
  const signatureDateLine =
    String(signatureDate || "").trim() || "____.__.____";

  const SectionTitle = ({ n, title }) => (
    <div className="mt-[10pt] font-semibold">
      {n}. {title}
    </div>
  );

  const P = ({ children, className = "" }) => (
    <div className={`mt-[6pt] ${className}`}>{children}</div>
  );

  const Bullet = ({ children }) => (
    <div className="flex gap-[6pt] mt-[3pt]">
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
          <div className="text-[18pt] font-bold">Vermittlungsvertrag</div>
        </div>
      ),
    },
    {
      id: "zwischen",
      keepWithNext: true,
      node: (
        <div className="mt-[14pt] text-center">
          <div>zwischen:</div>
          <div className="mt-[6pt]">
            <div className="font-semibold">Orif Akhmadaliev</div>
            <div className="mt-[2pt]">Alemannenweg. 6</div>
            <div className="mt-[2pt]">72488 Sigmaringen</div>
            <div className="mt-[2pt]">Deutschland</div>
            <div className="mt-[4pt]">(nachstehend "Vermittler" genannt)</div>
          </div>

          <div className="mt-[10pt]">und</div>

          <div className="mt-[6pt]">
            <div className="mt-[2pt]">__________________________________</div>
            <div className="mt-[2pt]">__________________________________</div>
            <div className="mt-[2pt]">__________________________________</div>
            <div className="mt-[4pt]">
              (nachstehend "Auftraggeber/Bewerber" genannt)
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "1",
      node: (
        <div>
          <SectionTitle n={1} title="Leistungen des Vermittlers" />
          <P>
            Der Auftraggeber / Bewerber beauftragt den Vermittler mit seiner
            Arbeitsvermittlung. Dabei erbringt der Vermittler für den
            Auftraggeber / Bewerber folgende Leistungen:
          </P>
          <div className="mt-[6pt] ml-3">
            <Bullet>Individuelle, vermittlungsrelevante Beratung</Bullet>
            <Bullet>Berufsberatung</Bullet>
            <Bullet>
              Feststellung der Kenntnisse und Fertigkeiten des Auftraggebers
            </Bullet>
            <Bullet>
              Unterstützung bei der Erstellung von Bewerbungsunterlagen
            </Bullet>
            <Bullet>Vorbereitung auf Vorstellungsgespräche</Bullet>
          </div>
          <P>
            Der Vermittler akquiriert auf Grund des erhobenen Bewerberprofils
            geeignete Arbeitsstellen und unterstützt den Auftraggeber während
            des gesamten Vermittlungsprozesses. Der Vermittler kann an
            Vorstellungsgesprächen teilnehmen.
          </P>
        </div>
      ),
    },
    {
      id: "2",
      node: (
        <div>
          <SectionTitle n={2} title="Leistungen des Auftraggebers" />
          <P>
            Zur Erfüllung der unter Punkt 1 genannten Leistungen des Vermittlers
            erbringt der Auftraggeber folgende Leistungen:
          </P>
          <div className="mt-[6pt] ml-3">
            <Bullet>
              Aktive Mithilfe bei der Erstellung des Bewerberprofils
            </Bullet>
            <Bullet>Wahrheitsgemäße Angaben zu personenbezogenen Daten</Bullet>
            <Bullet>Einhaltung von vereinbarten Terminen</Bullet>
            <Bullet>
              Umgehende Mitteilung des Auftraggebers an den Vermittler über das
              Zustandekommen eines sozialversicherungspflichtigen
              Beschäftigungsverhältnisses sowie über dessen vereinbarte Dauer
            </Bullet>
          </div>
          <P>
            Die Arbeitsplatzangebote des Vermittlers sind vertraulich und nur
            für den Auftraggeber bestimmt. Eine Weitergabe an Dritte bedarf der
            schriftlichen Zustimmung des Vermittlers.
          </P>
        </div>
      ),
    },
    {
      id: "3",
      node: (
        <div>
          <SectionTitle n={3} title="Vertragsdauer" />
          <P>
            Dieses Vertragsverhältnis beginnt mit Vertragsabschluss und wird auf
            die Gültigkeitsdauer des vom Auftraggeber vorgelegten
            Vermittlungsgutscheines vom{" "}
            <span className="font-bold">
              <SafeInline>{startDateLine}</SafeInline>
            </span>{" "}
            bis{" "}
            <span className="font-bold">
              <SafeInline>{endDateLine}</SafeInline>
            </span>{" "}
            befristet und endet automatisch ohne eine Kündigung.
          </P>
        </div>
      ),
    },
    {
      id: "4",
      node: (
        <div>
          <SectionTitle n={4} title="Wettbewerbsabrede" />
          <P>
            Während der Laufzeit des Vertrages darf der Auftraggeber/Bewerber{" "}
            <span className="font-bold">nicht</span> andere Vermittler für sich
            tätig werden lassen.
          </P>
        </div>
      ),
    },
    {
      id: "5",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle
            n={5}
            title="Geheimhaltungsvereinbarung / Non-Disclosure Agreement (NDA)"
          />
          <P>Auftraggeber verpflichtet sich,</P>
        </div>
      ),
    },
    {
      id: "5-list",
      node: (
        <div className="ml-3">
          <Bullet>
            die mitgeteilten Informationen, ohne ausdrückliche schriftliche
            Einwilligung durch den Vermittler nicht selbst zu verwerten;
          </Bullet>
          <Bullet>
            die Vertraulichen Informationen streng vertraulich zu behandeln und
            nur im Zusammenhang mit dem Zweck zu verwenden;
          </Bullet>
          <Bullet>
            die Vertraulichen Informationen ebenfalls durch angemessene
            Geheimhaltungsmaßnahmen gegen den unbefugten Zugriff durch Dritte zu
            sichern und bei der Verarbeitung der Vertraulichen Informationen die
            gesetzlichen und vertraglichen Vorschriften zum Datenschutz
            einzuhalten. Dies beinhaltet auch dem aktuellen Stand der Technik
            angepasste technische Sicherheitsmaßnahmen (Art. 32 DS-GVO) und die
            Verpflichtung der Mitarbeiter auf die Vertraulichkeit und die
            Beachtung des Datenschutzes (Art. 28 Abs. 3 lit. b DS-GVO); Der
            Vermittler behält sich das alleinige und uneingeschränkte Recht zur
            Schutzrechtsanmeldung vor.
          </Bullet>
        </div>
      ),
    },
    {
      id: "5-2",
      node: (
        <div>
          <P>
            Vertrauliche Informationen im Sinne dieser Vereinbarung sind
            sämtliche Informationen (ob schriftlich, elektronisch, mündlich,
            digital verkörpert oder in anderer Form), die von dem Vermittler an
            den Auftraggeber oder einem mit dem Interessenten im Sinne der §§ 15
            ff. AktG verbundenen Unternehmen zum vorgenannten Zweck offenbart
            werden. Als Vertrauliche Informationen gelten insbesondere:
          </P>
          <div className="mt-[6pt] ml-3">
            <Bullet>
              Geschäftsgeheimnisse, Produkte, Bewerbungsprozesse, Know-how,
              Erfindungen, geschäftliche Beziehungen, Geschäftsstrategien,
              Businesspläne, Finanzplanung, Personalangelegenheiten, digital
              verkörperte Informationen (Daten);
            </Bullet>
            <Bullet>
              Jegliche Unterlagen und Informationen des Vermittlers, die
              Gegenstand technischer und organisatorischer
              Geheimhaltungsmaßnahmen sind und als vertraulich gekennzeichnet
              oder nach der Art der Information oder den Umständen der
              Übermittlung als vertraulich anzusehen sind;
            </Bullet>
            <Bullet>das Bestehen dieser Vereinbarung und ihr Inhalt.</Bullet>
            <Bullet>
              Alle Unterlagen (Informationen über Arbeitgeber, Arbeitsverträge,
              Vorabzustimmungen, alle behördliche Unterlagen etc.), die vom
              Vermittler an Auftraggeber zur Verfügung gestellt worden sind
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "6",
      node: (
        <div>
          <SectionTitle
            n={6}
            title="Schadens - / Aufwendungsersatz bei Abbruch"
          />
          <P>
            Für den Fall, dass die Auftraggeber / Bewerber trotz der Zusage der
            Arbeitsgebers und Abschluss eines Ausbildungs- /Arbeitsvertrages -
            egal aus welchem Grund, nicht zu dem in der Stellenanforderung
            vereinbarten Termin, nach Deutschland einreist oder
            Vermittlungsprozess abbricht und nicht hier die Arbeit aufnimmt, ist
            der Vermittler ab Scheitern des Vermittlungsprozesses berechtigt,
            die, bis dahin bei ihm anfallenden Verwaltungskosten als Schadens -
            / Aufwendungsersatz geltend zu machen. Der Auftraggeber / Bewerber
            stimmt dieser Aufrechnung zu.
          </P>
        </div>
      ),
    },
    {
      id: "7",
      node: (
        <div>
          <SectionTitle n={6} title="Datenschutz" />
          <P>
            Personenbezogene Daten werden vertraulich behandelt und nicht an
            Dritte weitergegeben. Mit der Weitergabe solcher personenbezogenen
            Daten an Dritte, die im Rahmen der Verrichtung der
            Vermittlungstätigkeit erhoben werden, ist der Auftraggeber
            einverstanden.
          </P>
        </div>
      ),
    },
    {
      id: "8",
      node: (
        <div>
          <SectionTitle
            n={7}
            title="Vertragsänderungen / Salvatorische Klausel"
          />
          <P>
            Änderungen und Ergänzungen dieses Vertrages bedürfen zu ihrer
            Rechtsgültigkeit der Schriftform. Nebenabreden sind nicht getroffen.
          </P>
          <P>
            Sollten einzelne Bestimmungen dieses Vertrages ganz oder teilweise
            unwirksam oder undurchführbar sein oder werden, so berührt das den
            Vertrag im Übrigen nicht. Anstelle der unwirksamen oder
            undurchführbaren Bestimmung gilt eine solche als vereinbart, die dem
            von den Parteien gewollten Zweck der unwirksamen oder
            undurchführbaren Regelung am nächsten kommt.
          </P>
        </div>
      ),
    },
    {
      id: "9",
      node: (
        <div>
          <SectionTitle n={8} title="Gerichtsstand" />
          <P>
            Der Gerichtsstand ist Namangan (Usbekistan) und Sigmaringen
            (Deutschland).
          </P>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-[18pt]">
          <div className="mt-[18pt] flex justify-between gap-12">
            <div className="flex-1">
              <div className="border-b border-slate-700 h-[22pt]" />
              <div className="font-bold italic mt-[4pt]">Orif Akhmadaliev</div>
              <div className="text-[10pt] mt-[2pt]">Vermittler</div>
            </div>
            <div className="flex-1">
              <div className="border-b border-slate-700 h-[22pt]" />
              <div className="border-b border-slate-700 h-[22pt] mt-[6pt]" />
              <div className="font-medium mt-[4pt]">
                Auftraggeber / Bewerber
              </div>
            </div>
          </div>
          <div className="mt-[64pt] text-left">
            <span className="font-medium">
              <SafeInline>{signatureCityLine}</SafeInline> /{" "}
              <SafeInline>{signatureDateLine}</SafeInline>
            </span>
          </div>
        </div>
      ),
    },
  ];
}

export default function VermittlungsvertragLivePreview({
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
      buildVermittlungsvertragBlocks({
        candidateName: String(form?.candidateName || "").trim(),
        contractDurationYears: form?.contractDurationYears || 2,
        signatureCity: String(form?.signatureCity || "").trim(),
        signatureDate: String(form?.signatureDate || "").trim(),
      }),
    [
      form?.candidateName,
      form?.contractDurationYears,
      form?.signatureCity,
      form?.signatureDate,
    ]
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
