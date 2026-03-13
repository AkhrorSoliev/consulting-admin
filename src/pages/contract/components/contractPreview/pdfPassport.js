/**
 * PDF-to-passport-image extraction utilities.
 *
 * Renders the first page of a PDF via pdfjs, then crops and normalises the
 * passport area into square (preview) and non-square (export) images.
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { extractPassportCanvasFromCanvas } from "../../../../utils/passportImageProcessing";
import { normalizeMaybeUrl } from "./utils";
import { drawCoverToSquareCanvas, rotateCanvas180 } from "./canvasUtils";

function ensurePdfjsWorker() {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  } catch {
    // ignore
  }
}

function loadPdfDocument(url) {
  return pdfjsLib.getDocument({
    url,
    withCredentials: false,
    disableRange: true,
    disableStream: true,
  });
}

export async function pdfFirstPageToJpegDataUrl(
  pdfUrl,
  { scale = 2 } = {}
) {
  const url = normalizeMaybeUrl(pdfUrl);
  if (!url) return null;

  ensurePdfjsWorker();

  const loadingTask = loadPdfDocument(url);
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

export async function pdfFirstPageToPassportImages(
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

  ensurePdfjsWorker();

  const loadingTask = loadPdfDocument(url);
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
