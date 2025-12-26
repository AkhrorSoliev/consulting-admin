import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { extractPassportCanvasFromCanvas } from "../../../utils/passportImageProcessing";

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

function formatDdMmYyyy(value) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

function parseMoneyEur(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  // allow "1.200", "1200", "1 200", "1200,50"
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // thousand separators
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatEur(n) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "";
  try {
    return `${new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: num % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num)} €`;
  } catch {
    return `${String(num)} €`;
  }
}

function SafeInline({ children, className }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: escapeHtml(children) }}
    />
  );
}

function normalizeMaybeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  // allow http(s) only for now; avoids pdf.js trying to fetch weird schemes
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw;
}

function getFunctionsBaseCandidates() {
  const explicit = String(import.meta?.env?.VITE_FUNCTIONS_BASE || "").trim();
  // IMPORTANT: keep backward-compatible behavior.
  // If VITE_FUNCTIONS_BASE is not configured, fall back to raw URLs (often CORS-enabled)
  // instead of guessing a Functions URL (region can differ and would break working previews).
  if (!explicit) return [];
  return [String(explicit).trim().replace(/\/+$/, "")];
}

function buildProxyPdfUrl(rawPdfUrl) {
  const raw = normalizeMaybeUrl(rawPdfUrl);
  if (!raw) return "";

  // Prefer Firebase Functions base (works in production if configured).
  // Only proxy json-api.uz; the backend allowlist enforces this too.
  try {
    const u = new URL(raw);
    const host = String(u.hostname || "").toLowerCase();
    const isJsonApi = host === "json-api.uz";
    if (isJsonApi) {
      const bases = getFunctionsBaseCandidates();
      const functionsBase = bases[0] || "";
      if (functionsBase) {
        return `${functionsBase}/proxyPdf?url=${encodeURIComponent(raw)}`;
      }
    }
  } catch {
    // ignore and fall through
  }

  // Local dev fallback: Vite proxy (same-origin) for json-api.uz only.
  // NOTE: we also detect localhost via window.location because `import.meta.env.DEV`
  // may be false in some preview/build setups.
  try {
    const u = new URL(raw);
    const host = String(u.hostname || "").toLowerCase();
    const isJsonApi = host === "json-api.uz";

    let isLocalhost = false;
    try {
      const lh = String(window?.location?.hostname || "").toLowerCase();
      isLocalhost =
        lh === "localhost" ||
        lh === "127.0.0.1" ||
        lh === "::1" ||
        /^192\.168\.\d+\.\d+$/.test(lh);
    } catch {
      // ignore
    }

    const isDev = Boolean(import.meta?.env?.DEV) || isLocalhost;
    if (isDev && isJsonApi) return `/__pdf_proxy${u.pathname}${u.search || ""}`;
  } catch {
    // ignore
  }

  // No proxy available
  return raw;
}

async function pdfFirstPageToJpegDataUrl(pdfUrl, { scale = 2 } = {}) {
  const url = normalizeMaybeUrl(pdfUrl);
  if (!url) return null;

  // pdfjs needs a worker; set it once (best-effort)
  try {
    // eslint-disable-next-line no-param-reassign
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  } catch {
    // ignore
  }

  const loadingTask = pdfjsLib.getDocument({
    url,
    withCredentials: false,
    // We fetch the whole file (proxy may not support range); keep it simple.
    disableRange: true,
    disableStream: true,
  });

  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: Number(scale) || 2 });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context not available");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}

function findNonWhiteBoundingBox(
  imageData,
  width,
  height,
  {
    whiteThreshold = 245,
    alphaThreshold = 8,
    step = 2,
    paddingX = 0,
    paddingY = 10,
  } = {}
) {
  // Returns {x,y,w,h} in source pixel coords, or null if nothing found.
  const data = imageData?.data;
  if (!data || !width || !height) return null;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += step) {
    const row = y * width * 4;
    for (let x = 0; x < width; x += step) {
      const i = row + x * 4;
      const a = data[i + 3];
      if (a <= alphaThreshold) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // "Non-white" heuristic (works well for A4 scans with white background)
      if (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null;

  const padX = Math.max(0, Math.floor(Number(paddingX) || 0));
  const padY = Math.max(0, Math.floor(Number(paddingY) || 0));
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(width - 1, maxX + padX);
  maxY = Math.min(height - 1, maxY + padY);

  const w = Math.max(1, maxX - minX + 1);
  const h = Math.max(1, maxY - minY + 1);
  return { x: minX, y: minY, w, h };
}

function drawCoverToSquareCanvas(
  srcCanvas,
  outSizePx,
  { marginX = 0, marginY = 0 } = {}
) {
  const size = Math.max(64, Math.floor(Number(outSizePx) || 0));
  const sw = srcCanvas?.width || 0;
  const sh = srcCanvas?.height || 0;
  if (!size || !sw || !sh) return null;

  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) return null;

  // white background (passport scans are usually white; looks clean)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  if (ctx.imageSmoothingEnabled !== undefined) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  const mx = Math.max(0, Math.floor(Number(marginX) || 0));
  const my = Math.max(0, Math.floor(Number(marginY) || 0));
  const innerW = Math.max(1, size - mx * 2);
  const innerH = Math.max(1, size - my * 2);

  // IMPORTANT: use "contain" so the passport is never cropped inside the square.
  const scale = Math.min(innerW / sw, innerH / sh); // contain into inner rect
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = mx + (innerW - dw) / 2;
  const dy = my + (innerH - dh) / 2;
  ctx.drawImage(srcCanvas, dx, dy, dw, dh);
  return out;
}

function rotateCanvas90(srcCanvas, direction = "cw") {
  // direction: "cw" (clockwise) or "ccw"
  const sw = srcCanvas?.width || 0;
  const sh = srcCanvas?.height || 0;
  if (!sw || !sh) return null;

  const out = document.createElement("canvas");
  out.width = sh;
  out.height = sw;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) return null;

  // white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);

  if (direction === "ccw") {
    ctx.translate(0, out.height);
    ctx.rotate(-Math.PI / 2);
  } else {
    // cw
    ctx.translate(out.width, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.drawImage(srcCanvas, 0, 0);
  return out;
}

function rotateCanvas180(srcCanvas) {
  const sw = srcCanvas?.width || 0;
  const sh = srcCanvas?.height || 0;
  if (!sw || !sh) return null;

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) return null;

  // white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);

  ctx.translate(out.width, out.height);
  ctx.rotate(Math.PI);
  ctx.drawImage(srcCanvas, 0, 0);
  return out;
}

async function pdfFirstPageToPassportImages(
  pdfUrl,
  {
    scale = 2,
    outSize = 720,
    whiteThreshold = 245,
    cropPaddingTopBottomPx = 60,
    cropPaddingLeftRightPx = 40,
    forceOrientation = "portrait",
    outputMarginTopBottomPx = 100,
    outputMarginLeftRightPx = 50,
    outputFillFactor = 1,
  } = {}
) {
  const url = normalizeMaybeUrl(pdfUrl);
  if (!url) return null;

  // pdfjs needs a worker; set it once (best-effort)
  try {
    // eslint-disable-next-line no-param-reassign
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  } catch {
    // ignore
  }

  const loadingTask = pdfjsLib.getDocument({
    url,
    withCredentials: false,
    disableRange: true,
    disableStream: true,
  });

  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: Number(scale) || 2 });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context not available");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Robust passport extraction (crop + rotation normalization)
  // Note: `whiteThreshold` is kept for backwards compatibility but the extractor is adaptive.
  const extracted =
    extractPassportCanvasFromCanvas(canvas, {
      paddingLeftRightPx: cropPaddingLeftRightPx,
      paddingBottomPx: cropPaddingTopBottomPx,
      paddingTopPx: 8,
    }) || canvas;

  // For Beratungsvertrag: rotate passport image 180deg (scanner output is upside down)
  const extractedRotated = rotateCanvas180(extracted) || extracted;

  const fill = Math.max(0.5, Math.min(3, Number(outputFillFactor) || 1));
  const outCanvas = drawCoverToSquareCanvas(extractedRotated, outSize, {
    marginX: (Number(outputMarginLeftRightPx) || 0) / fill,
    marginY: (Number(outputMarginTopBottomPx) || 0) / fill,
  });
  const previewCanvas = outCanvas || extractedRotated;
  return {
    // For PDF export: use the real cropped (non-square) image so it can fill the page width.
    exportDataUrl: extractedRotated.toDataURL("image/jpeg", 0.92),
    // For UI preview: keep the square preview (as before).
    previewDataUrl: previewCanvas.toDataURL("image/jpeg", 0.92),
  };
}

function buildContractBlocks({
  clientFullName,
  contractDate,
  signatureCity,
  totalText = "_____ €",
  advText = "_____ €",
  restText = "_____ €",
}) {
  const nameLine =
    String(clientFullName || "").trim() || "_____________________";
  const dateLine = String(contractDate || "").trim() || "____.__.____";
  const signatureCityLine =
    String(signatureCity || "").trim() || "_____________________";

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
      <span className="shrink-0">-</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </div>
  );

  return [
    {
      id: "header",
      keepWithNext: true,
      node: (
        <div className="text-center">
          <div className="text-[18pt] font-bold">Beratungsvertrag</div>
        </div>
      ),
    },
    {
      id: "zwischen",
      keepWithNext: true,
      node: (
        <div className="mt-[14pt]">
          <div className="font-semibold">Zwischen</div>
          <div className="mt-[10pt]">
            <div className="font-semibold">
              <SafeInline>{nameLine}</SafeInline>
            </div>
            <div className="mt-[4pt] text-right">
              - nachfolgend „Auftraggeber“ genannt –
            </div>
          </div>

          <div className="mt-[12pt]">und</div>

          <div className="mt-[10pt]">
            <div className="font-semibold">ConsultingUz</div>
            <div className="mt-[2pt]">vertreten durch Orif Akhmadaliev</div>
            <div className="mt-[4pt] text-right">
              - nachfolgend „Auftragnehmer“ genannt –
            </div>
          </div>

          <div className="mt-[12pt]">
            wird folgender Beratungsvertrag geschlossen:
          </div>
        </div>
      ),
    },
    {
      id: "1",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={1} title="Vertragsgegenstand" />
          <P>
            Der Auftraggeber erteilt hiermit dem Auftragnehmer den Auftrag,
            ihn/sie bei folgenden Vorhaben zu beraten:
          </P>
          <P className="font-medium">
            Unterstützung bei der Suche Arbeitsstelle in Deutschland
          </P>
        </div>
      ),
    },
    {
      id: "2",
      node: (
        <div>
          <SectionTitle n={2} title="Leistungen des Auftragnehmers" />
          <P>
            Zur Erfüllung der in Ziffer 1 genannten Aufgaben wird der
            Auftragnehmer insbesondere folgende Leistungen erbringen:
          </P>
          <div className="mt-[6pt]">
            <Bullet>
              Beratung über die Anforderungen der zuständigen Behörden in
              Deutschland
            </Bullet>
            <Bullet>Unterstützung bei der Vorbereitung von Unterlagen</Bullet>
            <Bullet>
              Unterstützung bei der Antragstellung für die Erteilung einer neuen
              Aufenthaltserlaubnis in Deutschland
            </Bullet>
            <Bullet>
              Unterstützung bei der Suche Arbeitsstelle in Deutschland
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      id: "3",
      node: (
        <div>
          <SectionTitle n={3} title="Pflichten des Auftraggebers" />
          <P>
            Zur Erfüllung der in Ziffer 1 genannten Aufgaben wird der
            Auftraggeber insbesondere folgende Pflichten erfüllen:
          </P>
          <div className="mt-[6pt]">
            <Bullet>
              Alle angeforderten Unterlagen und Informationen an dem
              Auftragsnehmer fristgerecht liefern
            </Bullet>
            <Bullet>
              Über die Änderungen den Auftragsnehmer rechtzeitig informieren
            </Bullet>
          </div>
        </div>
      ),
    },
    {
      // IMPORTANT: split long sections into multiple blocks so pagination
      // doesn't push the entire section to the next page and leave a big gap.
      id: "4-title",
      keepWithNext: true,
      node: <SectionTitle n={4} title="Vergütung" />,
    },
    {
      id: "4-p1",
      node: (
        <P>
          Der Auftragnehmer erhält vom Auftraggeber für die vertraglich
          geschuldeten Leistungen ein pauschales Honorar in Höhe von insgesamt{" "}
          <span className="font-bold">{totalText}</span> einschließlich der
          gesetzlichen Mehrwertsteuer.
        </P>
      ),
    },
    {
      id: "4-p2",
      node: (
        <P>
          Der Auftraggeber verpflichtet sich, bei Vertragsschluss eine nicht
          erstattungsfähige Anzahlung in Höhe von{" "}
          <span className="font-bold">{advText}</span> an den Auftragnehmer zu
          leisten. Der Restbetrag in Höhe von{" "}
          <span className="font-bold">{restText}</span> ist nach erfolgreichem
          Abschluss der vereinbarten Leistungen zur Zahlung fällig.
        </P>
      ),
    },
    {
      id: "4-p3",
      node: (
        <P>
          Die Anzahlung dient zur Absicherung der ersten Aufwendungen und
          Organisationstätigkeiten des Auftragnehmers. Ein
          Rückforderungsanspruch besteht auch im Falle einer einseitigen
          Kündigung oder Nichterfüllung durch den Auftraggeber nicht, sofern der
          Auftragnehmer seine Tätigkeit bereits aufgenommen oder vorbereitende
          Maßnahmen getroffen hat.
        </P>
      ),
    },
    {
      id: "4-1",
      node: (
        <P>
          4.1 Auftragnehmer erhält vom Auftraggeber ein Pauschalhonorar in Höhe
          von insgesamt <span className="font-bold">{totalText}</span> inkl.
          Mehrwertsteuer
        </P>
      ),
    },
    {
      id: "4-2",
      node: (
        <P>
          4.2 Der Auftraggeber zahlt an den Auftragnehmer bei Auftragserteilung
          einen Vorschuss in Höhe von{" "}
          <span className="font-bold">{advText}</span>. Ein weiterer Betrag in
          Höhe von <span className="font-bold">{restText}</span> ist zum
          erfolgreichen Abschluss fällig.
        </P>
      ),
    },
    {
      id: "5",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={5} title="Zeit und Ort der Leistungserbringung" />
          <P>
            5.1 Der Auftragnehmer bestimmt seinen Arbeitsort und seine
            Arbeitszeit eigenverantwortlich.
          </P>
        </div>
      ),
    },
    {
      id: "6",
      node: (
        <div>
          <SectionTitle n={6} title="Berichterstattung" />
          <P>
            Der Auftragnehmer informiert den Auftraggeber regelmäßig über den
            Fortschritt der Beratungsleistungen. Die Berichterstattung erfolgt
            nach Wahl des Auftraggebers entweder einmalig oder in Form von
            Zwischenberichten entsprechend dem Arbeitsfortschritt. Die Berichte
            können auf elektronischem Wege über einen Messenger-Dienst (z. B.
            Telegram) oder per E-Mail übermittelt werden.
          </P>
          <P>
            6.1 Der Auftragnehmer erstattet dem Auftraggeber einen schriftlichen
            Bericht über seine laufende Arbeit und deren Ergebnisse. Die
            Berichterstattung kann nach Wahl des Auftraggebers einmalig oder
            entsprechend dem Arbeitsfortschritt in Form von Zwischenberichten
            erfolgen. Diese kann über Messenger Dienst Telegram oder per Mail
            erfolgen.
          </P>
        </div>
      ),
    },
    {
      id: "7",
      node: (
        <div>
          <SectionTitle n={7} title="Aufwendungsersatz" />
          <P>
            Der Auftraggeber erstattet dem Auftragnehmer nach Vorlage
            entsprechender Nachweise alle erforderlichen und im Zusammenhang mit
            der Vertragserfüllung entstandenen Aufwendungen, soweit diese zuvor
            vom Auftraggeber genehmigt wurden.
          </P>
          <P>
            Unterlässt der Auftraggeber die Erfüllung seiner in Ziffer 3
            genannten Mitwirkungspflichten oder kündigt er den Vertrag vorzeitig
            ohne wichtigen Grund, behält der Auftragnehmer das Recht,
            angefallene Aufwendungen in Rechnung zu stellen. Die geleistete
            Anzahlung wird in diesem Fall nicht erstattet.
          </P>
          <P>
            Der Ersatz weiterer, nicht ausdrücklich vereinbarter Aufwendungen
            bedarf der vorherigen schriftlichen Zustimmung des Auftraggebers.
          </P>
          <P>
            7.1 Der Auftraggeber erstattet dem Auftragnehmer folgende im
            Zusammenhang mit seiner Tätigkeit anfallenden erforderlichen
            Aufwendungen:
          </P>
          <P>
            Wenn der Auftraggeber sein im 3. Punkt genannte Pflichten nicht
            erfüllt oder den Vertrag vorläufig kündigt, wird dem Auftraggeber
            die Aufwandkosten in die Rechnung gestellt oder der Vorschuss nicht
            zurückerstattet.
          </P>
          <P>
            7.2 Der Ersatz aller sonstigen Aufwendungen des Auftragnehmers
            bedarf der (schriftlichen) Zustimmung des Auftraggebers.
          </P>
        </div>
      ),
    },
    {
      id: "8",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={8} title="Wettbewerbsverbot" />
          <P>
            Während der Laufzeit des Vertrages verpflichtet sich der
            Auftragnehmer, sein Wissen und Können nicht in die Dienste eines mit
            dem Auftraggeber in Konkurrenz stehenden Unternehmens zu stellen
            oder ein solches zu gründen.
          </P>
        </div>
      ),
    },
    {
      id: "9",
      node: (
        <div>
          <SectionTitle n={9} title="Mitwirkungspflicht des Auftraggebers" />
          <P>
            Der Auftraggeber ist verpflichtet, dem Auftragnehmer alle zur
            Erbringung der vertraglich geschuldeten Leistungen erforderlichen
            Unterlagen vollständig, richtig und rechtzeitig zur Verfügung zu
            stellen sowie sämtliche relevanten Informationen mitzuteilen. Er hat
            den Auftragnehmer über sämtliche Umstände zu informieren, die für
            die Ausführung des Auftrags von Bedeutung sein könnten.
          </P>
          <P>
            Der Auftraggeber hat auf Verlangen des Auftragnehmers die
            Richtigkeit und Vollständigkeit der übermittelten Unterlagen und
            Auskünfte schriftlich zu bestätigen.
          </P>
          <P>
            9.1 Der Auftraggeber hat dafür Sorge zu tragen, dass dem
            Auftragnehmer alle für die Ausführung seiner Tätigkeit notwendigen
            Unterlagen rechtzeitig vorgelegt werden, ihm alle Informationen
            erteilt werden und er von allen Vorgängen und Umständen in Kenntnis
            gesetzt wird. Dies gilt auch für Unterlagen, Vorgänge und Umstände,
            die erst während der Tätigkeit des Auftragnehmers bekannt werden.
          </P>
          <P>
            9.2 Auf Verlangen des Auftragnehmers hat der Auftraggeber die
            Richtigkeit und Vollständigkeit der von ihm vorgelegten Unterlagen
            sowie seiner Auskünfte und mündlichen Erklärungen schriftlich zu
            bestätigen.
          </P>
        </div>
      ),
    },
    {
      id: "10",
      node: (
        <div>
          <SectionTitle n={10} title="Schweigepflicht" />
          <P>
            Der Auftragnehmer ist verpflichtet, über alle Informationen, die ihm
            im Zusammenhang mit seiner Tätigkeit für den Auftraggeber bekannt
            werden, Stillschweigen zu bewahren, gleichviel ob es sich dabei um
            den Auftraggeber selbst oder dessen Geschäftsverbindungen handelt,
            es sei denn, dass der Auftraggeber ihn von dieser Schweigepflicht
            entbindet.
          </P>
        </div>
      ),
    },
    {
      id: "11",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={11} title="Datenschutz" />
          <P>
            Der Auftragnehmer verpflichtet sich zur Einhaltung sämtlicher
            datenschutzrechtlicher Vorschriften, insbesondere der
            Datenschutz-Grundverordnung (DSGVO). Personenbezogene Daten des
            Auftraggebers dürfen nur verarbeitet werden, soweit dies zur
            Erfüllung des Vertragszwecks erforderlich ist.
          </P>
        </div>
      ),
    },
    {
      id: "11-2",
      node: (
        <div>
          <P>
            Der Auftragnehmer gewährleistet, geeignete technische und
            organisatorische Maßnahmen zum Schutz der personenbezogenen Daten zu
            treffen und verpflichtet sich, ohne vorherige schriftliche
            Zustimmung des Auftraggebers keine weiteren Auftragsverarbeiter
            einzusetzen.
          </P>
        </div>
      ),
    },
    {
      id: "11-3",
      node: (
        <div>
          <P>
            Im Falle der Einbindung Dritter informiert der Auftragnehmer den
            Auftraggeber rechtzeitig über Art und Umfang der beabsichtigten
            Änderungen, damit dieser gegebenenfalls Widerspruch einlegen kann.
            Für den Fall einer Auftragsverarbeitung gilt Art. 28 Abs. 3 DSGVO.
          </P>
        </div>
      ),
    },
    {
      id: "11-4",
      node: (
        <div>
          <P>
            11.1 Erfolgt eine Verarbeitung personenbezogener Daten für den
            Auftraggeber, so ist der Auftragnehmer verpflichtet, hinreichende
            Garantien dafür zu bieten, dass geeignete technische und
            organisatorische Maßnahmen so durchgeführt werden, dass die
            Verarbeitung im Einklang mit den Anforderungen der DSGVO erfolgt und
            den Schutz der Rechte der betroffenen Person gewährleistet.
          </P>
        </div>
      ),
    },
    {
      id: "11-5",
      node: (
        <div>
          <P>
            11.2 Der Auftragnehmer nimmt keine weiteren Auftragsverarbeiter ohne
            vorherige gesonderte oder allgemeine schriftliche Genehmigung des
            Verantwortlichen in Anspruch. Im Fall einer allgemein schriftlichen
            Genehmigung informiert der Auftragsverarbeiter den Verantwortlichen
            immer über jede beabsichtigte Änderung in Bezug auf die Hinzuziehung
            oder die Ersetzung anderer Auftragsverarbeiter, wodurch der
            Auftraggeber die Möglichkeit erhält, gegen derartige Veränderungen
            Einspruch zu erheben. In Bezug auf die Inhalte eines
            Auftragsdatenverarbeitungsvertrages gelten die Anforderungen nach
            Art. 28 Abs. 3 DSGVO.
          </P>
        </div>
      ),
    },
    {
      id: "12",
      node: (
        <div>
          <SectionTitle n={12} title="Vertragsdauer / Kündigung" />
          <P>
            Dieser Vertrag tritt mit der Unterzeichnung durch beide
            Vertragsparteien in Kraft und wird auf unbestimmte Zeit geschlossen.
            Er endet automatisch mit der vollständigen Erbringung der in diesem
            Vertrag vereinbarten Leistungen.
          </P>
          <P>
            Beide Vertragsparteien können den Vertrag mit einer Frist von 14
            Tagen zum Monatsende kündigen. Das Recht zur außerordentlichen
            Kündigung aus wichtigem Grund bleibt unberührt.
          </P>
          <P>Kündigungen bedürfen zu ihrer Wirksamkeit der Schriftform.</P>
          <P>
            12.1 Der Vertrag wird mit der Unterzeichnung wirksam und läuft auf
            unbestimmte Zeit und endet mit Erbringung der vereinbarten
            Leistungen, sofern die Punkte beim 2. vollständig erfüllt sind.
          </P>
          <P>12.2 Kündigungen bedürfen zu ihrer Wirksamkeit der Schriftform.</P>
        </div>
      ),
    },
    {
      id: "13",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle
            n={13}
            title="Aufbewahrung und Rückgabe von Unterlagen"
          />
          <P>
            Der Auftragnehmer verpflichtet sich, alle ihm zur Verfügung
            gestellten Geschäfts- und Betriebsunterlagen ordnungsgemäß
            aufzubewahren, insbesondere dafür zu sorgen, dass Dritte nicht
            Einsicht nehmen können. Die zur Verfügung gestellten Unterlagen sind
            während der Dauer des Vertrages auf Anforderung, nach Beendigung des
            Vertrages unaufgefordert dem Vertragspartner zurückzugeben.
          </P>
        </div>
      ),
    },
    {
      id: "14",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={14} title="Sonstige Ansprüche" />
          <P>
            Mit der Zahlung der in diesem Vertrag vereinbarten Vergütung sind
            sämtliche Ansprüche des Auftragnehmers aus diesem Vertrag
            abgegolten.
          </P>
        </div>
      ),
    },
    {
      id: "14-2",
      node: (
        <div>
          <P>
            Der Auftragnehmer ist für die ordnungsgemäße Versteuerung der
            erhaltenen Vergütung eigenverantwortlich.
          </P>
        </div>
      ),
    },
    {
      id: "14-3",
      node: (
        <div>
          <P>
            14.1 Mit der Zahlung der in diesem Vertrag vereinbarten Vergütung
            sind alle Ansprüche des Auftragnehmers gegen den Auftraggeber aus
            diesem Vertrag erfüllt.
          </P>
        </div>
      ),
    },
    {
      id: "14-4",
      node: (
        <div>
          <P>
            14.2 Für die Versteuerung der Vergütung hat der Auftragnehmer selbst
            zu sorgen.
          </P>
        </div>
      ),
    },
    {
      id: "15",
      keepWithNext: true,
      node: (
        <div>
          <SectionTitle n={15} title="Schlussbestimmungen" />
          <P>
            15.1 Änderungen und Ergänzungen dieses Vertrages bedürfen zu ihrer
            Wirksamkeit der Schriftform. Dies gilt auch für die Änderung oder
            Aufhebung dieser Klausel.
          </P>
        </div>
      ),
    },
    {
      id: "15-2",
      node: (
        <div>
          <P>15.2 Mündliche Nebenabreden bestehen nicht.</P>
        </div>
      ),
    },
    {
      id: "15-3",
      keepWithNext: true,
      node: (
        <div>
          <P>
            15.3 Sind oder werden einzelne Bestimmungen dieses Vertrages
            unwirksam, so wird dadurch die Gültigkeit der übrigen Bestimmungen
            nicht berührt. Die Vertragspartner werden in diesem Fall die
            ungültige Bestimmung durch eine andere ersetzen, die dem
            wirtschaftlichen Zweck der weggefallenen Regelung in zulässiger
            Weise am nächsten kommt.
          </P>
        </div>
      ),
    },
    {
      id: "15-signature",
      node: (
        <div className="mt-[18pt]">
          <div className="mt-[18pt] flex justify-between gap-12">
            <div className="flex-1">
              <div className="font-medium">
                Sigmaringen, <SafeInline>{dateLine}</SafeInline>
              </div>
              <div className="font-medium">Orif Akhmadaliev</div>
              <div className="text-[10pt]">Unterschrift:</div>
              <div className="border-b border-slate-700 mt-[12pt] h-[22pt]" />
            </div>
            <div className="flex-1">
              <div className="font-medium">
                <SafeInline>{signatureCityLine}</SafeInline>,{" "}
                <SafeInline>{dateLine}</SafeInline>
              </div>
              <div className="font-medium">
                <SafeInline>{nameLine}</SafeInline>
              </div>
              <div className="text-[10pt]">Unterschrift:</div>
              <div className="border-b border-slate-700 mt-[12pt] h-[22pt]" />
            </div>
          </div>
        </div>
      ),
    },
  ];
}

export default function ContractLivePreview({
  form,
  containerClassName,
  showToolbar = true,
  pdfUrl,
  onPassportPreviewReady,
}) {
  const A4_WIDTH_PT = 595;
  const A4_HEIGHT_PT = 842;
  const PT_TO_PX = 96 / 72;
  const A4_WIDTH_PX = A4_WIDTH_PT * PT_TO_PX;
  const A4_HEIGHT_PX = A4_HEIGHT_PT * PT_TO_PX;
  // Match Word "Normal" margins: 1 inch on all sides = 72pt
  const PAGE_MARGIN_PT = 72;

  const viewportRef = useRef(null);
  const measureRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [pageGroups, setPageGroups] = useState(null);
  const [fontReadyTick, setFontReadyTick] = useState(0);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewError, setPdfPreviewError] = useState("");
  const [pdfFetchUrl, setPdfFetchUrl] = useState("");

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

  useEffect(() => {
    let alive = true;
    const url = buildProxyPdfUrl(pdfUrl);

    // reset
    setPdfPreviewError("");
    setPdfPreviewUrl(null);
    setPdfFetchUrl(url || "");

    if (!url) return () => {};

    // Extract "passport part" from an A4 scan:
    // - UI preview remains a 1:1 square (so the live preview layout stays stable)
    // - PDF export gets a real cropped (non-square) image to avoid "shrinking" the passport
    pdfFirstPageToPassportImages(url, {
      scale: 2,
      outSize: 820,
      whiteThreshold: 245,
      forceOrientation: "portrait",
      // Mild padding so we don't cut edges; keeps passport larger in export.
      cropPaddingTopBottomPx: 60,
      cropPaddingLeftRightPx: 40,
      // No extra inner margins needed.
      outputMarginTopBottomPx: 0,
      outputMarginLeftRightPx: 0,
      outputFillFactor: 1,
    })
      .then((out) => {
        if (!alive) return;
        const preview = String(out?.previewDataUrl || "").trim() || null;
        const exported = String(out?.exportDataUrl || "").trim() || preview || null;
        setPdfPreviewUrl(preview);
        try {
          if (typeof onPassportPreviewReady === "function") {
            onPassportPreviewReady(exported);
          }
        } catch {
          // ignore
        }
      })
      .catch((e) => {
        if (!alive) return;
        const msg = String(e?.message || e || "PDF preview failed");
        // Common case: CORS blocks cross-origin fetch
        const hint = /cors|cross-origin|fetch/i.test(msg)
          ? " (CORS blok bo‘lishi mumkin)"
          : "";
        setPdfPreviewError(`${msg}${hint}\nTried URL: ${url}`);
        try {
          if (typeof onPassportPreviewReady === "function") {
            onPassportPreviewReady(null);
          }
        } catch {
          // ignore
        }
      });

    return () => {
      alive = false;
    };
  }, [pdfUrl]);

  const safeScale = useMemo(() => {
    const paddingPx = 24;
    const available = Math.max(0, (viewportWidth || 0) - paddingPx);
    if (!available) return 1;
    const auto = available / A4_WIDTH_PX;
    return Math.min(1, Math.max(0.4, auto));
  }, [viewportWidth, A4_WIDTH_PX]);

  const blocks = useMemo(
    () =>
      (() => {
        const total = parseMoneyEur(form?.feeTotalEur);
        const adv = parseMoneyEur(form?.feeAdvanceEur);
        const rest =
          total != null && adv != null && Number.isFinite(total - adv)
            ? Math.max(0, total - adv)
            : null;
        const totalText = total != null ? formatEur(total) : "_____ €";
        const advText = adv != null ? formatEur(adv) : "_____ €";
        const restText = rest != null ? formatEur(rest) : "_____ €";

        const base = buildContractBlocks({
          clientFullName: `${String(form?.firstName || "").trim()} ${String(
            form?.lastName || ""
          ).trim()}`.trim(),
          contractDate: String(form?.contractDate || "").trim(),
          signatureCity: String(form?.signatureCity || "").trim(),
          totalText,
          advText,
          restText,
        });

        const url = normalizeMaybeUrl(pdfUrl);
        if (!url) return base;

        const extra = [];
        if (pdfPreviewUrl) {
          const candidateCity = String(form?.candidateCity || "").trim();
          const pdfGeneratedDateRaw =
            String(form?.pdfGeneratedDate || "").trim() ||
            formatDdMmYyyy(new Date());
          const candidateFullName = `${String(
            form?.firstName || ""
          ).trim()} ${String(form?.lastName || "").trim()}`.trim();

          extra.push({
            id: "pdf-preview",
            forceNewPage: true,
            node: (
              <div
                className="flex flex-col justify-end items-center"
                style={{ height: "100%" }}
              >
                <div style={{ width: "78.4%" }}>
                  <img
                    src={pdfPreviewUrl}
                    alt="Passport preview"
                    className="block"
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "contain",
                      backgroundColor: "#ffffff",
                    }}
                  />

                  <div className="mt-[14pt] text-[11pt] leading-[1.4]">
                    <div className="font-medium">
                      Datum:{" "}
                      <SafeInline>
                        {candidateCity ? `${candidateCity}, ` : ""}
                      </SafeInline>
                      <SafeInline>{pdfGeneratedDateRaw}</SafeInline>
                    </div>

                    <div className="mt-[8pt] font-medium">
                      Name: <SafeInline>{candidateFullName}</SafeInline>
                    </div>

                    <div className="mt-[18pt] font-medium">Unterschrift:</div>
                    <div className="mt-[10pt] border-b border-slate-700 h-[22pt]" />
                  </div>
                </div>
              </div>
            ),
          });
        } else if (pdfPreviewError) {
          extra.push({
            id: "pdf-preview-error",
            forceNewPage: true,
            node: (
              <div className="mt-[10pt]">
                <div className="mt-[6pt] text-[10pt] text-red-700 bg-red-50 border border-red-200 rounded-md p-2 whitespace-pre-wrap">
                  {pdfPreviewError}
                </div>
              </div>
            ),
          });
        } else {
          extra.push({
            id: "pdf-preview-loading",
            forceNewPage: true,
            node: (
              <div className="mt-[10pt]">
                <div className="mt-[6pt] text-[10pt] text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2">
                  Loading…
                </div>
              </div>
            ),
          });
        }

        // Always render PDF/passport preview as the LAST block(s),
        // so we can force it onto a dedicated final page.
        return [...base, ...extra];
      })(),
    [
      form?.firstName,
      form?.lastName,
      form?.contractDate,
      form?.signatureCity,
      form?.feeTotalEur,
      form?.feeAdvanceEur,
      pdfUrl,
      pdfPreviewUrl,
      pdfPreviewError,
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
      // Hard page break before this block (e.g., PDF/passport preview on its own page)
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
