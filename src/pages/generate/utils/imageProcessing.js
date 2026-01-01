import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { extractPassportCanvasFromCanvas } from "../../../utils/passportImageProcessing";

export async function blobToDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

export function sniffFileKindFromArrayBuffer(ab) {
  try {
    const u8 = new Uint8Array(ab instanceof ArrayBuffer ? ab : []);
    if (u8.length >= 5) {
      if (
        u8[0] === 0x25 &&
        u8[1] === 0x50 &&
        u8[2] === 0x44 &&
        u8[3] === 0x46 &&
        u8[4] === 0x2d
      )
        return "pdf";
    }
    if (u8.length >= 3) {
      if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "jpeg";
    }
    if (u8.length >= 8) {
      if (
        u8[0] === 0x89 &&
        u8[1] === 0x50 &&
        u8[2] === 0x4e &&
        u8[3] === 0x47 &&
        u8[4] === 0x0d &&
        u8[5] === 0x0a &&
        u8[6] === 0x1a &&
        u8[7] === 0x0a
      )
        return "png";
    }
    if (u8.length >= 12) {
      const riff =
        u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46;
      const webp =
        u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50;
      if (riff && webp) return "webp";
    }
  } catch {
    // ignore
  }
  return "unknown";
}

export function rotateCanvas180(srcCanvas) {
  try {
    const sw = srcCanvas?.width || 0;
    const sh = srcCanvas?.height || 0;
    if (!sw || !sh) return null;
    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const ctx = out.getContext("2d", { alpha: false });
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.translate(out.width, out.height);
    ctx.rotate(Math.PI);
    ctx.drawImage(srcCanvas, 0, 0);
    return out;
  } catch {
    return null;
  }
}

export async function blobToJpegDataUrlBestEffort(
  blob,
  { quality = 0.92 } = {}
) {
  try {
    const b = blob instanceof Blob ? blob : null;
    if (!b) return "";
    const objUrl = URL.createObjectURL(b);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width || 0;
      canvas.height = img.naturalHeight || img.height || 0;
      if (!canvas.width || !canvas.height) return "";
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.imageSmoothingEnabled = true;
      try {
        ctx.imageSmoothingQuality = "high";
      } catch {
        // ignore
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const processed =
        extractPassportCanvasFromCanvas(canvas, {
          paddingLeftRightPx: 40,
          paddingBottomPx: 60,
          paddingTopPx: 8,
        }) || canvas;
      const rotated = rotateCanvas180(processed) || processed;
      return rotated.toDataURL("image/jpeg", quality);
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } catch {
    return "";
  }
}

export async function pdfArrayBufferFirstPageToJpegDataUrlBestEffort(
  arrayBuffer,
  {
    scale = 2,
    quality = 0.92,
    crop = true,
    whiteThreshold = 245,
    cropPaddingTopBottomPx = 60,
    cropPaddingLeftRightPx = 40,
    forcePortrait = true,
  } = {}
) {
  try {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
    } catch {
      // ignore
    }

    const ab = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : null;
    if (!ab) return "";
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) })
      .promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    await page.render({ canvasContext: ctx, viewport }).promise;

    if (!crop) return canvas.toDataURL("image/jpeg", quality);

    try {
      const processed =
        extractPassportCanvasFromCanvas(canvas, {
          paddingLeftRightPx: cropPaddingLeftRightPx,
          paddingBottomPx: cropPaddingTopBottomPx,
          paddingTopPx: 8,
        }) || canvas;
      const rotated = rotateCanvas180(processed) || processed;
      return rotated.toDataURL("image/jpeg", quality);
    } catch {
      return canvas.toDataURL("image/jpeg", quality);
    }
  } catch {
    return "";
  }
}
