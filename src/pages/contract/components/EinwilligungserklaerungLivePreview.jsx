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

function buildEinwilligungserklaerungBlocks({
  fullName,
  birthDate,
  address,
  city,
  date,
}) {
  const fullNameLine = String(fullName || "").trim();
  const birthDateLine = String(birthDate || "").trim();
  const addressLine = String(address || "").trim();
  const cityLine = String(city || "").trim();
  const dateLine = String(date || "").trim();

  const hasValue = (v) => String(v || "").trim().length > 0;

  const P = ({ children, className = "" }) => (
    <div className={`mt-[8pt] leading-[1.15] mb-[8pt] ${className}`}>
      {children}
    </div>
  );

  const FormRow = ({ label, value }) => (
    <div className="flex gap-[6pt] mt-[10pt] leading-[1.1]">
      <div className="w-[160px] shrink-0 leading-[1.1] font-bold">{label}:</div>
      {hasValue(value) ? (
        <div className="flex-1 min-h-[16pt]">
          <SafeInline>{value}</SafeInline>
        </div>
      ) : (
        <div className="flex-1 border-b border-dotted border-black min-h-[16pt]" />
      )}
    </div>
  );

  // Page 1: German - Split into multiple blocks for pagination
  const germanHeader = {
    id: "german-header",
    keepWithNext: true,
    node: (
      <div>
        <div className="text-center mb-[16pt]">
          <div className="text-[14pt] font-bold leading-[1.1]">
            Einwilligungserklärung zur Nutzung von Foto- und Videoaufnahmen
          </div>
        </div>

        <div className="mb-[12pt]">
          <FormRow label="Name der Person" value={fullNameLine} />
          <FormRow label="Geburtsdatum" value={birthDateLine} />
          <FormRow label="Adresse" value={addressLine} />
        </div>
      </div>
    ),
  };

  const germanSection1 = {
    id: "german-section-1",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">1. Zweck der Einwilligung</P>
        <P className="mt-[8pt]">
          Ich willige ein, dass Orif Akhmadaliev (ConsultingUz) nachfolgend
          „Unternehmen" genannt) Foto- und Videoaufnahmen von mir erstellt und
          diese zu folgenden Zwecken verwendet:
        </P>
        <div className="mt-[8pt]">
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[1.2pt] mb-[1.2pt]">
            • Veröffentlichung auf Social-Media-Plattformen (z. B. Instagram,
            Facebook, LinkedIn, Telegram, YouTube)
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Nutzung auf der Website des Unternehmens
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Verwendung für Werbe-, Informations- und Marketingzwecke
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Darstellung von Erfolgsgeschichten, Erfahrungsberichten sowie
            Präsentationen des Unternehmens
          </div>
        </div>
      </div>
    ),
  };

  const germanSection2 = {
    id: "german-section-2",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">2. Art der verwendeten Medien</P>
        <P className="mt-[8pt]">
          Ich willige ein, dass folgende Arten von Medien genutzt werden dürfen:
        </P>
        <div className="mt-[8pt]">
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Fotos und Videos (Gruppen- und Einzelaufnahmen)
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Kurze Interviews oder Video-Statements
          </div>
        </div>
      </div>
    ),
  };

  const germanSection3 = {
    id: "german-section-3",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">3. Umfang der Nutzung</P>
        <P className="mt-[8pt]">
          Die Aufnahmen dürfen weltweit, zeitlich unbegrenzt und ohne
          Einschränkung genutzt, vervielfältigt, verbreitet und öffentlich
          zugänglich gemacht werden.
        </P>
        <P className="mt-[8pt]">
          Die Einwilligung umfasst insbesondere die Veröffentlichung auf:
        </P>
        <div className="mt-[8pt]">
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Instagram, Facebook, LinkedIn, Telegram
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Website: consultinguz.de / consultinguz.uz
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Sonstige digitale Kommunikationskanäle des Unternehmens
          </div>
        </div>
      </div>
    ),
  };

  const germanSection4 = {
    id: "german-section-4",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">
          4. Freiwilligkeit und Widerruf
        </P>
        <P className="mt-[8pt]">
          Die Einwilligung erfolgt freiwillig. Ich kann sie jederzeit mit
          Wirkung für die Zukunft widerrufen.
        </P>
        <P className="mt-[8pt]">
          Ein Widerruf hat keinen Einfluss auf bereits erfolgte
          Veröffentlichungen, aber zukünftige Nutzungen werden eingestellt.
        </P>
        <P className="mt-[8pt]">Widerrufserklärung bitte senden an:</P>
        <P className="mt-[8pt]">
          <strong>E-Mail:</strong> orif.ahmadaliyev@hotmail.de
        </P>
      </div>
    ),
  };

  const germanSection5 = {
    id: "german-section-5",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">5. Rechte an den Aufnahmen</P>
        <P className="mt-[8pt]">
          Ich bestätige, dass mit der Nutzung der Aufnahmen keine
          Vergütungsansprüche entstehen.
        </P>
        <P className="mt-[8pt]">
          Das Unternehmen darf die Aufnahmen bearbeiten, zuschneiden oder in
          Collagen verwenden, solange meine Persönlichkeitsrechte gewahrt
          bleiben.
        </P>
      </div>
    ),
  };

  const germanSection6 = {
    id: "german-section-6",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">6. Datenschutz</P>
        <P className="mt-[8pt]">
          Die Verarbeitung der Daten erfolgt gemäß der geltenden
          Datenschutzbestimmungen (DSGVO).
        </P>
        <P className="mt-[8pt]">
          Es werden ausschließlich die für die Veröffentlichung notwendigen
          Daten verarbeitet.
        </P>
      </div>
    ),
  };

  const germanSignature = {
    id: "german-signature",
    node: (
      <div className="mt-[24pt]">
        <div className="flex gap-[20pt]">
          <div className="flex-1">
            <FormRow
              label="Ort, Datum"
              value={
                cityLine && dateLine
                  ? `${cityLine}, ${dateLine}`
                  : cityLine || dateLine
              }
            />
          </div>
        </div>

        <FormRow label="Unterschrift der Person" value="" />
        <FormRow label="Unterschrift des Unternehmens (optional)" value="" />
      </div>
    ),
  };

  // Page 2: Uzbek - Split into multiple blocks for pagination
  const uzbekHeader = {
    id: "uzbek-header",
    forceNewPage: true,
    keepWithNext: true,
    node: (
      <div>
        <div className="text-center mb-[16pt]">
          <div className="text-[14pt] font-bold leading-[1.1]">
            Foto va video tasvirlardan foydalanishga rozilik arizasi
          </div>
        </div>

        <div className="mb-[12pt]">
          <FormRow label="Shaxsning ismi-sharifi" value={fullNameLine} />
          <FormRow label="Tug'ilgan sana" value={birthDateLine} />
          <FormRow label="Manzili" value={addressLine} />
        </div>
      </div>
    ),
  };

  const uzbekSection1 = {
    id: "uzbek-section-1",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">1. Rozilikning maqsadi</P>
        <P className="mt-[8pt]">
          Men ushbu orzu orqali Orif Akhmadaliev (ConsultingUz) (keyingi
          o'rinlarda "Kompaniya" deb yuritiladi) tomonidan mening foto va video
          tasvirlarimni yaratish va ulardan quyidagi maqsadlarda foydalanishga
          rozilik bildiraman:
        </P>
        <div className="mt-[8pt]">
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Ijtimoiy tarmoqlarda joylashtirilish (masalan: Instagram,
            Facebook, LinkedIn, Telegram, YouTube)
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Kompaniyaning rasmiy veb-saytida foydalanish
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Reklama, axborot va marketing maqsadlarida qo'llash
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Muvaffaqiyat tariхlari, tajriba hikoyalari hamda kompaniya
            taqdimotlarida foydalanish
          </div>
        </div>
      </div>
    ),
  };

  const uzbekSection2 = {
    id: "uzbek-section-2",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">
          2. Foydalaniladigan media turlari
        </P>
        <P className="mt-[8pt]">
          Quyidagi media turlaridan foydalanishga roziman:
        </P>
        <div className="mt-[8pt]">
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Foto va video tasvirlar (yakka va guruh suratlari)
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Qisqa intervyular yoki video murojaatlar
          </div>
        </div>
      </div>
    ),
  };

  const uzbekSection3 = {
    id: "uzbek-section-3",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">3. Foydalanish doirasi</P>
        <P className="mt-[8pt]">
          Tasvirlar dunyo bo'ylab, muddatsiz va hech qanday cheklovlarsiz
          foydalanilishi, nusxa ko'chirilishi, tarqatilishi va ommaga taqdim
          etilishiga roziman.
        </P>
        <P className="mt-[8pt]">
          Ushbu rozilik quyidagilardagi e'lonlarni o'z ichiga oladi:
        </P>
        <div className="mt-[8pt]">
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Instagram, Facebook, LinkedIn, Telegram
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Kompaniyaning rasmiy saytlarida: consultinguz.de / consultinguz.uz
          </div>
          <div className="ml-[64pt] mr-[71pt] leading-[1.15] mt-[2.4pt]">
            • Kompaniyaning boshqa raqamli aloqa kanallarida
          </div>
        </div>
      </div>
    ),
  };

  const uzbekSection4 = {
    id: "uzbek-section-4",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">
          4. Ixtiyoriylik va bekor qilish huquqi
        </P>
        <P className="mt-[8pt]">
          Ushbu rozilik ixtiyoriy ravishda berilmoqda. Men istalgan vaqtda
          kelajak uchun roziligimni bekor qilishim mumkin.
        </P>
        <P className="mt-[8pt]">
          Bekor qilishgacha bo'lgan e'lonlarga o'zgarish kiritilmaydi, lekin
          kelgusida foydalanish to'xtatiladi.
        </P>
        <P className="mt-[8pt]">
          Bekor qilish uchun murojaat:
          <br />
          <strong>E-mail:</strong> orif.akhmadaliyev@hotmail.de
        </P>
      </div>
    ),
  };

  const uzbekSection5 = {
    id: "uzbek-section-5",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">
          5. Tasvirlarga bo'lgan huquqlar
        </P>
        <P className="mt-[8pt]">
          Men tasdiqlaymanki, ushbu tasvirlardan foydalanish uchun hech qanday
          to'lov yoki mukofot talab qilmayman.
        </P>
        <P className="mt-[8pt]">
          Kompaniya mening shaxsiy huquqlarimni hurmat qilgan holda tasvirlarni
          tahrirlashi, kesish yoki kollaj shaklida qayta ishlashi mumkin.
        </P>
      </div>
    ),
  };

  const uzbekSection6 = {
    id: "uzbek-section-6",
    node: (
      <div>
        <P className="font-semibold mt-[16pt]">
          6. Shaxsiy ma'lumotlarni himoya qilish
        </P>
        <P className="mt-[8pt]">
          Ma'lumotlar amaladagi ma'lumotlarni himoya qilish qonunchiligiga
          (DSGVO) muvofiq qayta ishlanadi. Faqat e'lon qilish uchun zarur
          bo'lgan ma'lumotlarga qayta ishlanadi.
        </P>
      </div>
    ),
  };

  const uzbekSignature = {
    id: "uzbek-signature",
    node: (
      <div className="mt-[24pt]">
        <div className="flex gap-[20pt]">
          <div className="flex-1">
            <FormRow
              label="Joy, sana"
              value={
                cityLine && dateLine
                  ? `${cityLine}, ${dateLine}`
                  : cityLine || dateLine
              }
            />
          </div>
        </div>

        <FormRow label="Shaxsning imzosi" value="" />
        <FormRow label="Kompaniya vakili (ixtiyoriy)" value="" />
      </div>
    ),
  };

  return [
    germanHeader,
    germanSection1,
    germanSection2,
    germanSection3,
    germanSection4,
    germanSection5,
    germanSection6,
    germanSignature,
    uzbekHeader,
    uzbekSection1,
    uzbekSection2,
    uzbekSection3,
    uzbekSection4,
    uzbekSection5,
    uzbekSection6,
    uzbekSignature,
  ];
}

export default function EinwilligungserklaerungLivePreview({
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
      buildEinwilligungserklaerungBlocks({
        fullName: String(form?.fullName || "").trim(),
        birthDate: String(form?.birthDate || "").trim(),
        address: String(form?.address || "").trim(),
        city: String(form?.city || "").trim(),
        date: String(form?.date || "").trim(),
      }),
    [form?.fullName, form?.birthDate, form?.address, form?.city, form?.date]
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
            <span>Ko'rinish (A4)</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Jonli yangilanish
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
                className="bg-white text-[#0f172a] text-[10pt] leading-[1.1] box-border"
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
                <ScaledA4 key={pageIdx} pageLabel={`A4-sahifa ${pageIdx + 1}`}>
                  <div
                    className="bg-white shadow-2xl text-[#0f172a] text-[10pt] leading-[1.1] origin-top shrink-0 box-border"
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
