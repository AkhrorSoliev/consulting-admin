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
  firstName,
  lastName,
  candidateBirthDate,
  candidateNationality,
  candidateAddress,
  candidatePassportNr,
  candidateCity,
  pdfGeneratedDate,
}) {
  const candidateNameLine =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : "_____________________";
  const birthDateLine = String(candidateBirthDate || "").trim() || "__________";
  const nationalityLine =
    String(candidateNationality || "").trim() || "__________";
  const addressLine = String(candidateAddress || "").trim() || "__________";
  const passportLine = String(candidatePassportNr || "").trim() || "__________";
  const signaturePlaceLine = String(candidateCity || "").trim() || "__________";
  const signatureDateLine =
    String(pdfGeneratedDate || "").trim() || "____.__.____";

  const SectionTitle = ({ title }) => (
    <div className="mt-[14pt] font-bold text-[#1a365d]">{title}</div>
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

  const NumberedItem = ({ n, children }) => (
    <div className="flex gap-[6pt] mt-[3pt]">
      <span className="shrink-0">{n}.</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );

  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[18pt] font-bold text-[#1a365d] tracking-wide">
            VERMITTLUNGSVERTRAG
          </div>
          <div className="text-[11pt] mt-2 italic">
            Internationale Arbeitsvermittlung
          </div>
        </div>
      ),
    },
    {
      id: "zwischen",
      keepWithNext: true,
      node: (
        <div className="mt-6">
          <div>zwischen</div>
          <div className="mt-4 ml-4">
            <div className="font-bold">Orif Akhmadaliev (ConsultingUz)</div>
            <div>Alemannenweg 6</div>
            <div>72488 Sigmaringen</div>
            <div>Deutschland</div>
            <div>– nachfolgend „Vermittler" –</div>
          </div>

          <div className="mt-4">und</div>

          <div className="mt-4 ml-4">
            <div className="font-bold">{candidateNameLine}</div>
            <div>Geburtsdatum: {birthDateLine}</div>
            <div>Staatsangehörigkeit: {nationalityLine}</div>
            <div>Adresse: {addressLine}</div>
            <div>Reisepass-Nr.: {passportLine}</div>
            <div>– nachfolgend „Bewerber" –</div>
          </div>
        </div>
      ),
    },
    {
      id: "1",
      node: (
        <div>
          <SectionTitle title="§ 1 Vertragsgegenstand" />
          <P>
            (1) Der Bewerber beauftragt den Vermittler mit der Unterstützung bei
            der Vermittlung eines sozialversicherungspflichtigen
            Beschäftigungsverhältnisses in Deutschland.
          </P>
          <P>(2) Der Vermittler erbringt insbesondere:</P>
          <div className="mt-2 ml-6">
            <Bullet>Analyse der beruflichen Qualifikation</Bullet>
            <Bullet>Erstellung/Optimierung von Bewerbungsunterlagen</Bullet>
            <Bullet>Kontaktaufnahme mit Arbeitgebern</Bullet>
            <Bullet>Organisation von Bewerbungsgesprächen</Bullet>
            <Bullet>
              Koordination im Visum- und Anerkennungsverfahren (rein
              organisatorisch)
            </Bullet>
          </div>
          <P>
            (3) Ein Anspruch auf erfolgreiche Vermittlung oder Abschluss eines
            Arbeitsvertrages besteht nicht.
          </P>
        </div>
      ),
    },
    {
      id: "2",
      node: (
        <div>
          <SectionTitle title="§ 2 Vergütung" />
          <P>(1) Der Bewerber schuldet keinerlei Vergütung.</P>
          <P>
            (2) Die Vergütung des Vermittlers erfolgt ausschließlich durch das
            beauftragende Arbeitgeberunternehmen auf Grundlage eines gesonderten
            Vertrages.
          </P>
          <P>(3) Dem Bewerber entstehen keine Vermittlungskosten.</P>
        </div>
      ),
    },
    {
      id: "3",
      node: (
        <div>
          <SectionTitle title="§ 3 Mitwirkungspflichten des Bewerbers" />
          <P>Der Bewerber verpflichtet sich:</P>
          <div className="mt-2 ml-6">
            <NumberedItem n={1}>
              vollständige und wahrheitsgemäße Angaben zu machen
            </NumberedItem>
            <NumberedItem n={2}>
              ausschließlich echte und unverfälschte Dokumente vorzulegen
            </NumberedItem>
            <NumberedItem n={3}>
              erforderliche Unterlagen fristgerecht einzureichen
            </NumberedItem>
            <NumberedItem n={4}>
              aktiv am Vermittlungs- und Visumverfahren mitzuwirken
            </NumberedItem>
            <NumberedItem n={5}>
              den Vermittler unverzüglich über Vertragsangebote oder
              Vertragsabschlüsse zu informieren
            </NumberedItem>
          </div>
        </div>
      ),
    },
    {
      id: "4",
      node: (
        <div>
          <SectionTitle title="§ 4 Internationale Rekrutierung – Risikohinweis" />
          <P>(1) Der Bewerber ist darüber informiert, dass:</P>
          <div className="mt-2 ml-6">
            <Bullet>
              Visumserteilungen ausschließlich durch staatliche Behörden
              erfolgen
            </Bullet>
            <Bullet>
              Anerkennungsverfahren nicht im Einflussbereich des Vermittlers
              liegen
            </Bullet>
            <Bullet>
              gesetzliche Änderungen Einfluss auf das Verfahren haben können
            </Bullet>
          </div>
          <P>(2) Der Vermittler übernimmt keine Haftung für:</P>
          <div className="mt-2 ml-6">
            <Bullet>Ablehnung oder Verzögerung eines Visums</Bullet>
            <Bullet>behördliche Entscheidungen</Bullet>
            <Bullet>Änderungen gesetzlicher Vorschriften</Bullet>
            <Bullet>Entscheidungen des Arbeitgebers</Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "5",
      node: (
        <div>
          <SectionTitle title="§ 5 Schutzklausel bei schuldhaftem Nichtantritt (&#8222;Vertragsstrafe light&#8220;)" />
          <P>
            (1) Kommt infolge der Tätigkeit des Vermittlers ein Arbeitsvertrag
            zustande und nimmt der Bewerber diesen an, verpflichtet sich der
            Bewerber, den Arbeitsantritt ordnungsgemäß vorzubereiten und
            wahrzunehmen.
          </P>
          <P>
            (2) Verletzt der Bewerber diese Verpflichtung schuldhaft,
            insbesondere indem er:
          </P>
          <div className="mt-2 ml-6">
            <Bullet>
              vorsätzlich oder grob fahrlässig falsche Angaben gemacht hat
            </Bullet>
            <Bullet>
              nach Visumerteilung ohne wichtigen Grund nicht einreist
            </Bullet>
            <Bullet>
              ohne wichtigen Grund den Arbeitsantritt endgültig ablehnt
            </Bullet>
            <Bullet>trotz verbindlicher Zusage nicht erscheint</Bullet>
          </div>
          <P>
            so ist der Bewerber zur Zahlung einer Vertragsstrafe verpflichtet.
          </P>
          <P>
            (3) Die Vertragsstrafe beträgt{" "}
            <span className="font-bold text-[#c53030]">
              50 % einer vereinbarten Bruttomonatsvergütung
            </span>
            ,{" "}
            <span className="font-bold text-[#c53030]">
              jedoch maximal 2.000 EUR
            </span>
            .
          </P>
          <P>(4) Ein wichtiger Grund liegt insbesondere vor bei:</P>
          <div className="mt-2 ml-6">
            <Bullet>nachweisbarer Erkrankung</Bullet>
            <Bullet>behördlicher Visumablehnung</Bullet>
            <Bullet>
              wesentlicher nachträglicher Vertragsänderung durch den Arbeitgeber
            </Bullet>
          </div>
          <P>
            (5) Dem Bewerber bleibt ausdrücklich der Nachweis gestattet, dass
            kein oder ein wesentlich geringerer Schaden entstanden ist.
          </P>
          <P>
            (6) Ein weitergehender Schaden kann geltend gemacht werden; die
            Vertragsstrafe wird angerechnet.
          </P>
        </div>
      ),
    },
    {
      id: "6",
      node: (
        <div>
          <SectionTitle title="§ 6 Schutz vor Umgehung der Vermittlung (6 Monate)" />
          <P>
            (1) Der Bewerber ist berechtigt, sich eigenständig oder über Dritte
            zu bewerben.
          </P>
          <P>
            (2) Wird dem Bewerber durch den Vermittler ein konkreter Arbeitgeber
            nachweislich benannt oder vorgestellt, verpflichtet sich der
            Bewerber, für die Dauer von{" "}
            <span className="font-bold">
              6 Monaten ab nachweislicher Benennung
            </span>{" "}
            keinen Arbeitsvertrag mit diesem Arbeitgeber ohne Mitwirkung des
            Vermittlers abzuschließen.
          </P>
          <P>
            (3) Kommt innerhalb dieses Zeitraums dennoch ein Arbeitsvertrag
            zustande, gilt die Vermittlung als durch den Vermittler erfolgt.
          </P>
          <P>
            (4) Diese Regelung gilt ausschließlich für konkret benannte
            Arbeitgeber und stellt kein allgemeines Wettbewerbsverbot dar.
          </P>
          <P>
            (5) Dem Bewerber bleibt der Nachweis gestattet, dass der Vertrag
            unabhängig von der Tätigkeit des Vermittlers zustande gekommen ist.
          </P>
        </div>
      ),
    },
    {
      id: "7",
      forceNewPage: true,
      node: (
        <div>
          <SectionTitle title="§ 7 Datenschutz (DSGVO)" />
          <P>
            (1) Die Verarbeitung personenbezogener Daten erfolgt gemäß Art. 6
            Abs. 1 lit. b DSGVO zur Durchführung dieses Vertrages.
          </P>
          <P>(2) Eine Weitergabe erfolgt ausschließlich an:</P>
          <div className="mt-2 ml-6">
            <Bullet>potenzielle Arbeitgeber</Bullet>
            <Bullet>zuständige Behörden</Bullet>
            <Bullet>Anerkennungsstellen</Bullet>
            <Bullet>Visumstellen</Bullet>
          </div>
          <P>
            (3) Der Bewerber erhält eine gesonderte Datenschutzerklärung gemäß
            Art. 13 DSGVO.
          </P>
          <P>
            (4) Daten werden gelöscht, sobald sie für den Vertragszweck nicht
            mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten
            bestehen.
          </P>
        </div>
      ),
    },
    {
      id: "8",
      node: (
        <div>
          <SectionTitle title="§ 8 Vertraulichkeit" />
          <P>
            (1) Arbeitgeberinformationen, Vertragsunterlagen und interne
            Informationen sind vertraulich zu behandeln.
          </P>
          <P>(2) Eine Weitergabe an Dritte ist unzulässig.</P>
          <P>(3) Diese Verpflichtung gilt auch nach Vertragsende.</P>
        </div>
      ),
    },
    {
      id: "9",
      node: (
        <div>
          <SectionTitle title="§ 9 Haftung" />
          <P>
            (1) Der Vermittler haftet unbeschränkt bei Vorsatz und grober
            Fahrlässigkeit.
          </P>
          <P>
            (2) Bei einfacher Fahrlässigkeit haftet der Vermittler nur bei
            Verletzung wesentlicher Vertragspflichten.
          </P>
          <P>
            (3) Die Haftung für Schäden aus Verletzung von Leben, Körper oder
            Gesundheit bleibt unberührt.
          </P>
        </div>
      ),
    },
    {
      id: "10",
      node: (
        <div>
          <SectionTitle title="§ 10 Vertragsdauer und Kündigung" />
          <P>(1) Der Vertrag wird auf unbestimmte Zeit geschlossen.</P>
          <P>
            (2) Beide Parteien können jederzeit ohne Angabe von Gründen
            kündigen.
          </P>
          <P>(3) Ansprüche nach § 5 und § 6 bleiben unberührt.</P>
        </div>
      ),
    },
    {
      id: "11",
      node: (
        <div>
          <SectionTitle title="§ 11 Rechtswahl und Gerichtsstand" />
          <P>(1) Es gilt das Recht der Bundesrepublik Deutschland.</P>
          <P>
            (2) Für Verbraucher gelten die gesetzlichen
            Gerichtsstandsregelungen.
          </P>
          <P>(3) Gerichtsstand für Kaufleute ist Sigmaringen.</P>
        </div>
      ),
    },
    {
      id: "12",
      node: (
        <div>
          <SectionTitle title="§ 12 Schriftform" />
          <P>Änderungen und Ergänzungen bedürfen der Textform.</P>
        </div>
      ),
    },
    {
      id: "13",
      node: (
        <div>
          <SectionTitle title="§ 13 Salvatorische Klausel" />
          <P>
            Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag im
            Übrigen wirksam.
          </P>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-10">
          <div>
            {signaturePlaceLine}, {signatureDateLine}
          </div>
          <div className="mt-6">
            Unterschrift Vermittler: ____________________________
          </div>
          <div className="mt-4">
            Unterschrift Bewerber: ____________________________
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
    () => {
      const firstName = String(
        form?.candidateFirstName || form?.firstName || "",
      ).trim();
      const lastName = String(
        form?.candidateLastName || form?.lastName || "",
      ).trim();
      const candidateBirthDate = String(
        form?.candidateBirthDate || form?.candidateBirthPlace || "",
      ).trim();
      const candidateNationality = String(
        form?.candidateNationality || form?.candidateLand || "",
      ).trim();
      const street = String(form?.candidateStreet || "").trim();
      const houseNumber = String(form?.candidateHouseNumber || "").trim();
      const postalCode = String(form?.candidatePLZ || "").trim();
      const country = String(form?.candidateLand || "").trim();
      const composedAddress = [street, houseNumber]
        .filter(Boolean)
        .join(" ")
        .trim();
      const composedAddressWithPostal = [composedAddress, postalCode]
        .filter(Boolean)
        .join(", ")
        .trim();
      const candidateAddress =
        [composedAddressWithPostal, country].filter(Boolean).join(", ").trim() ||
        String(form?.candidateAddress || "").trim();

      return buildVermittlungsvertragBlocks({
        firstName,
        lastName,
        candidateBirthDate,
        candidateNationality,
        candidateAddress,
        candidatePassportNr: String(
          form?.candidatePassportNr || form?.passportNumber || form?.passportId || "",
        ).trim(),
        candidateCity: String(
          form?.signatureCity || form?.candidateCity || "",
        ).trim(),
        pdfGeneratedDate: String(
          form?.signatureDate || form?.pdfGeneratedDate || "",
        ).trim(),
      });
    },
    [
      form?.candidateFirstName,
      form?.candidateLastName,
      form?.firstName,
      form?.lastName,
      form?.candidateBirthDate,
      form?.candidateBirthPlace,
      form?.candidateNationality,
      form?.candidateLand,
      form?.candidateAddress,
      form?.candidateStreet,
      form?.candidateHouseNumber,
      form?.candidatePLZ,
      form?.candidatePassportNr,
      form?.passportNumber,
      form?.passportId,
      form?.signatureCity,
      form?.signatureDate,
      form?.candidateCity,
      form?.pdfGeneratedDate,
    ],
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
      arePageIndexGroupsEqual(prev, pages) ? prev : pages,
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
