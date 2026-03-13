/**
 * Hook that loads a PDF URL, extracts passport images, and manages preview state.
 */

import { useEffect, useState } from "react";
import { buildProxyPdfUrl } from "./pdfProxy";
import { pdfFirstPageToPassportImages } from "./pdfPassport";

export function usePdfPreview(pdfUrl, onPassportPreviewReady) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewError, setPdfPreviewError] = useState("");
  const [pdfFetchUrl, setPdfFetchUrl] = useState("");

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
        const exported =
          String(out?.exportDataUrl || "").trim() || preview || null;
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
          ? " (CORS blok bo'lishi mumkin)"
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

  return { pdfPreviewUrl, pdfPreviewError, pdfFetchUrl };
}
