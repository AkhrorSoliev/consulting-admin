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

function buildVollmachtArbeitgeberBlocks(form) {
  const hasValue = (v) => String(v || "").trim().length > 0;
  const PLACEHOLDER = "";
  const getOmitKey = (fieldKey) =>
    fieldKey
      ? `omit${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`
      : "";
  const isOmitted = (fieldKey) => Boolean(form?.[getOmitKey(fieldKey)]);

  const buildRepAddressLine = () => {
    const street = String(form?.employerRepStreet || "").trim();
    const house = String(form?.employerRepHouseNumber || "").trim();
    const plz = String(form?.employerRepPostalCode || "").trim();
    const city = String(form?.employerRepCity || "").trim();

    let line = "";

    if (street) {
      line += street;
    }
    if (house) {
      line += (line ? ". " : "") + house;
    }
    if (plz) {
      line += (line ? ", " : "") + plz;
    }
    if (city) {
      // two spaces before Ort as requested ("PLZ  Ort")
      line += (plz ? "  " : line ? " " : "") + city;
    }

    return line;
  };

  const buildEmployerAddressLine = () => {
    const street = String(form?.employerStreet || "").trim();
    const house = String(form?.employerHouseNumber || "").trim();
    const plz = String(form?.employerPostalCode || "").trim();
    const city = String(form?.employerCity || "").trim();

    let line = "";

    if (street) {
      line += street;
    }
    if (house) {
      line += (line ? ". " : "") + house;
    }
    if (plz) {
      line += (line ? ", " : "") + plz;
    }
    if (city) {
      // two spaces before Ort as requested ("PLZ  Ort")
      line += (plz ? "  " : line ? " " : "") + city;
    }

    return line;
  };

  const candidateFieldConfigs = [
    { key: "candidateFirstName" },
    { key: "candidateLastName" },
    { key: "candidateBirthDate" },
    { key: "candidateBirthPlace" },
    { key: "candidateBirthCountry" },
    { key: "candidateStreet" },
    { key: "candidateHouseNumber" },
    { key: "candidatePostalCode" },
    { key: "candidateCity" },
    { key: "candidateCountry" },
    { key: "candidatePhone" },
    { key: "candidateEmail" },
  ];

  const candidateFieldGroups = [
    {
      keys: ["candidateFirstName", "candidateLastName"],
      separator: " ",
    },
    {
      keys: [
        "candidateBirthDate",
        "candidateBirthPlace",
        "candidateBirthCountry",
      ],
      separator: ", ",
    },
    {
      keys: ["candidateStreet", "candidateHouseNumber"],
      separator: " ",
    },
    {
      keys: ["candidatePostalCode", "candidateCity"],
      separator: " ",
    },
    {
      keys: ["candidatePhone"],
      separator: "",
    },
    {
      keys: ["candidateEmail"],
      separator: "",
    },
  ];

  const employerFieldKeys = [
    "employerCompanyName",
    "employerStreet",
    "employerHouseNumber",
    "employerPostalCode",
    "employerCity",
    "employerCountry",
    "employerRepFirstName",
    "employerRepLastName",
    "employerRepStreet",
    "employerRepHouseNumber",
    "employerRepPostalCode",
    "employerRepCity",
    "employerRepCountry",
    "employerRepPhone",
    "employerRepEmail",
  ];

  const employerFieldGroups = [
    {
      keys: ["employerCompanyName"],
      separator: "",
    },
    {
      keys: ["employerStreet", "employerHouseNumber"],
      separator: " ",
      useAddressFunction: true,
    },
    {
      keys: ["employerPostalCode", "employerCity"],
      separator: " ",
    },
    {
      keys: ["employerCountry"],
      separator: "",
    },
    {
      keys: ["employerRepFirstName", "employerRepLastName"],
      separator: " ",
    },
    {
      keys: [
        "employerRepStreet",
        "employerRepHouseNumber",
        "employerRepPostalCode",
        "employerRepCity",
      ],
      separator: " ",
    },
    {
      keys: ["employerRepCountry"],
      separator: "",
    },
    {
      keys: ["employerRepPhone"],
      separator: "",
    },
    {
      keys: ["employerRepEmail"],
      separator: "",
    },
  ];

  const employerDisplayName = (() => {
    const designation = form?.employerDesignation;
    if (hasValue(designation)) return designation;
    const companyName = form?.employerCompanyName;
    if (hasValue(companyName)) return companyName;
    return "";
  })();

  const employerRepDisplayName = (() => {
    const full = form?.employerRepFullName;
    if (hasValue(full)) return full;
    const parts = [form?.employerRepFirstName, form?.employerRepLastName]
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    return parts.join(" ");
  })();

  const P = ({ children, className = "" }) => (
    <div className={`mt-2 ${className}`}>{children}</div>
  );

  const FormRow = ({
    label,
    value,
    omit,
    showColon = true,
    addComma = false,
  }) => {
    if (omit) return null;
    return (
      <div className="flex mt-1">
        <div className="w-[100px] shrink-0 text-[10pt]">
          {label}
          {addComma ? "," : ""}
          {showColon && !addComma ? ":" : ""}
        </div>
        {hasValue(value) ? (
          <div className="flex-1 min-h-[14pt] pb-0.5">
            <SafeInline>{value}</SafeInline>
          </div>
        ) : (
          <div className="flex-1 border-b border-slate-700 min-h-[14pt]" />
        )}
      </div>
    );
  };

  const TableCell = ({ children, className = "" }) => (
    <div className={`border border-slate-700 px-2 py-1.5  ${className}`}>
      {children}
    </div>
  );

  const FieldWithLabel = ({ value, label }) => (
    <div className="flex items-center gap-2 mt-1">
      <div
        className={`flex-1 min-h-[14pt] pb-0.5 ${
          hasValue(value) ? "" : "border-b border-slate-700"
        }`}
      >
        {hasValue(value) ? (
          <SafeInline>{value}</SafeInline>
        ) : (
          <span className="text-[9pt] tracking-[0.15em] text-slate-400">
            {PLACEHOLDER}
          </span>
        )}
      </div>
      {label ? (
        <div className="text-[9pt] italic opacity-70 shrink-0">{label}</div>
      ) : null}
    </div>
  );

  const Bullet = ({ children }) => (
    <div className="flex gap-2 mt-1">
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
          <div className="text-[14pt] font-bold text-[#30849b]">
            Vollmacht nach § 81a Abs. 1 AufenthG
          </div>
        </div>
      ),
    },
    {
      id: "table",
      keepWithNext: true,
      node: (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-0">
            <TableCell className="font-bold underline">
              Vollmachtgeber
            </TableCell>
            <TableCell className="font-bold text-right underline">
              Arbeitgeber
            </TableCell>

            <TableCell>
              {candidateFieldGroups.map((group, groupIndex) => {
                const values = group.keys
                  .map((key) => form[key])
                  .filter((v) => hasValue(v));
                const combinedValue = values.join(group.separator);
                return isOmitted(group.keys[0]) ? null : (
                  <FieldWithLabel key={groupIndex} value={combinedValue} />
                );
              })}
            </TableCell>

            <TableCell>
              {employerFieldGroups.map((group, groupIndex) => {
                const values = group.keys
                  .map((key) => form[key])
                  .filter((v) => hasValue(v));
                const combinedValue =
                  group.keys[0] === "employerRepStreet"
                    ? buildRepAddressLine()
                    : group.keys[0] === "employerStreet" &&
                      group.useAddressFunction
                    ? buildEmployerAddressLine()
                    : values.join(group.separator);
                return isOmitted(group.keys[0]) ? null : (
                  <FieldWithLabel key={groupIndex} value={combinedValue} />
                );
              })}
            </TableCell>
          </div>
        </div>
      ),
    },
    {
      id: "title",
      keepWithNext: true,
      node: (
        <div className="mt-4">
          <div className="text-[14pt] font-bold text-center">
            Vollmacht für die Beantragung eines beschleunigten
            Fachkräfteverfahrens
          </div>
        </div>
      ),
    },
    {
      id: "intro",
      node: (
        <div>
          <P>
            Hiermit bevollmächtige ich{" "}
            {hasValue(employerDisplayName) && (
              <span className="font-semibold">
                <SafeInline>{employerDisplayName} </SafeInline>
              </span>
            )}
          </P>

          <P className="mt-2"> - im Folgenden: „der Bevollmächtigte",</P>

          <P className="text-justify">
            vertreten durch{" "}
            {hasValue(employerRepDisplayName) && (
              <span className="font-semibold">
                <SafeInline>{employerRepDisplayName}</SafeInline>
              </span>
            )}{" "}
            - Vollmacht, aus der sich deren Vertretungsbefugnis für den
            Arbeitgeber ergibt, muss als Anlage beigefügt werden, bei der
            zuständigen Ausländerbehörde das beschleunigte Fachkräfteverfahren
            nach § 81a AufenthG sowie die sonstigen ggf. damit zusammenhängenden
            und in § 81a Absatz 3 AufenthG aufgeführten Verfahren zu beantragen,
            und mich in diesen Verfahren bezüglich aller gesetzlich zulässigen
            Angelegenheiten außergerichtlich zu vertreten.
          </P>

          <P className="mt-3 text-justify">
            Ich erteile dem Bevollmächtigten die Befugnis, sämtliche Erklärungen
            und Handlungen verbindlich vorzunehmen, die nach den gesetzlichen
            Regelungen vorgenommen werden können und für die Verfahren
            erforderlich sind.
          </P>

          <P className="mt-3">
            Der Umfang der Vertretungsbefugnis beinhaltet insbesondere
          </P>
        </div>
      ),
    },
    {
      id: "list",
      node: (
        <div className="ml-3">
          <div className="mt-2">
            <Bullet>
              <span className="text-justify">
                die Vertretung in allen für die Durchführung des beschleunigten
                Fachkräfteverfahrens erforderlichen Angelegenheiten gegenüber
                der zuständigen Ausländerbehörde, der für die berufliche
                Anerkennung zuständigen Stelle sowie der ggf. sonstigen
                zuständigen Behörden,
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                das Ein- und Nachreichen der für die Verfahren erforderlichen
                Unterlagen einschließlich meiner personenbezogenen Daten,
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                die Vornahme von Zahlungen von für den Abschluss der Verfahren
                erforderlichen Gebühren,
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                die Entgegennahme der die Verfahren betreffenden schriftlichen
                sowie elektronischen Unterlagen, die Durchführung des
                Schriftverkehrs und das Öffnen der an mich adressierten Post und
              </span>
            </Bullet>
            <Bullet>
              <span className="text-justify">
                den Antrag auf Aufnahme der Familienzusammenführung nach § 81a
                Absatz 4 AufenthG ins beschleunigte Fachkräfteverfahren.
              </span>
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "closing",
      node: (
        <div className="mt-3">
          <P className="text-justify">
            Der Bevollmächtigte ist berechtigt, eine Untervollmacht, die den
            Umfang dieser Vollmacht nicht überschreiten darf, zu erteilen und zu
            widerrumen [
            <span className="italic">
              auf die Möglichkeit der Verwendung des Musters für die
              Untervollmacht als Anlage zu einer Vollmacht nach § 81a Abs. 1
              AufenthG wird hingewiesen
            </span>
            ]. Die Vollmacht erlischt mit Abschluss des beschleunigten
            Fachkräfteverfahrens.
          </P>

          <P className="mt-3 text-justify">
            Da diese Vollmacht meine rechtliche Möglichkeit selbst zu handeln
            nicht ausschließt, bitte ich um direkten Kontakt zu mir, sofern dies
            zur Klärung von Sachverhalten und zur Verfahrensbeschleunigung
            erforderlich erscheint.
          </P>
        </div>
      ),
    },
    {
      id: "signature",
      node: (
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <FormRow
                label={form.candidateBirthPlace || "Ort"}
                value={form.candidatePlaceDate}
                omit={isOmitted("candidatePlaceDate")}
                showColon={false}
                addComma={true}
              />
              <div className="text-center">
                <div className="border-t border-slate-700 text-[10pt]"></div>
              </div>
            </div>

            <div>
              <FormRow
                label={form.employerCity || "Ort"}
                omit={isOmitted("employerPlaceDate")}
              />
              <div className="text-center">
                <div className="border-t border-slate-700 pt-1 text-[10pt]"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
}

export default function VollmachtArbeitgeberLivePreview({
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

  const blocks = useMemo(() => buildVollmachtArbeitgeberBlocks(form), [form]);

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
                className="bg-white text-[#0f172a] text-[11pt] leading-[1.3] box-border"
                style={{
                  fontFamily: "Arimo, Helvetica, Arial, sans-serif",
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
                    <div key={b.id} data-block className="pr-2">
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
                    className="bg-white shadow-2xl text-[#0f172a] text-[11pt] leading-[1.3] origin-top shrink-0 box-border"
                    style={{
                      fontFamily: "Arimo, Helvetica, Arial, sans-serif",
                      width: `${A4_WIDTH_PT}pt`,
                      height: `${A4_HEIGHT_PT}pt`,
                      padding: `${PAGE_MARGIN_PT}pt`,
                      paddingBottom: `${contentBottomPadPt}pt`,
                    }}
                  >
                    {blocksForPage.map((b) => (
                      <div key={b.id} className="pr-2">
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
