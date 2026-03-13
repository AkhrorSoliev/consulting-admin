import { clampInt } from "./mathUtils.js";
import { findForegroundBoundingBox } from "./foregroundDetection.js";
import { cropCanvas } from "./canvasTransforms.js";
import { chooseBestRotation } from "./orientationScoring.js";

export function extractPassportCanvasFromCanvas(
  srcCanvas,
  {
    // Padding around detected passport bbox
    paddingLeftRightPx = 40,
    paddingBottomPx = 60,
    paddingTopPx = 8,

    // Foreground detection tuning
    step = 2,
    diffThreshold = 60,
    chromaThreshold = 12,
    darkDelta = 80,
    minChromaForDiff = 6,

    // Performance: downscale for bbox detection if the image is huge (keeps output quality).
    analysisMaxDim = 1400,
  } = {}
) {
  const sw = srcCanvas?.width || 0;
  const sh = srcCanvas?.height || 0;
  if (!srcCanvas || !sw || !sh) return null;
  const maxDim = Math.max(sw, sh);
  const maxAllowed = Math.max(256, Math.floor(Number(analysisMaxDim) || 0));

  let scanCanvas = srcCanvas;
  let scanScale = 1; // scan = src * scanScale
  if (maxDim > maxAllowed) {
    scanScale = maxAllowed / maxDim;
    const tw = Math.max(1, Math.floor(sw * scanScale));
    const th = Math.max(1, Math.floor(sh * scanScale));
    const tmp = document.createElement("canvas");
    tmp.width = tw;
    tmp.height = th;
    const tctx = tmp.getContext("2d", { alpha: false });
    if (tctx) {
      tctx.fillStyle = "#ffffff";
      tctx.fillRect(0, 0, tw, th);
      tctx.imageSmoothingEnabled = true;
      try {
        tctx.imageSmoothingQuality = "high";
      } catch {
        // ignore
      }
      tctx.drawImage(srcCanvas, 0, 0, sw, sh, 0, 0, tw, th);
      scanCanvas = tmp;
    }
  }

  const sctx = scanCanvas.getContext("2d", { alpha: false });
  if (!sctx) return null;

  let img;
  try {
    img = sctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
  } catch {
    return null;
  }

  // Try a couple of passes: first more permissive, then stricter if bbox is too large.
  const passes = [
    {
      diffThreshold,
      chromaThreshold,
      darkDelta,
      minChromaForDiff,
    },
    {
      diffThreshold: diffThreshold + 18,
      chromaThreshold: chromaThreshold + 6,
      darkDelta: darkDelta + 10,
      minChromaForDiff,
    },
  ];

  // Pass 1: normal thresholds. Pass 2: stricter thresholds if pass 1 looks like "almost whole page".
  let bbox = null;
  let bboxRatio = 1;
  const b1 = findForegroundBoundingBox(img, scanCanvas.width, scanCanvas.height, {
    step,
    ...passes[0],
  });
  if (b1) {
    const r1 = (b1.w * b1.h) / Math.max(1, scanCanvas.width * scanCanvas.height);
    bbox = b1;
    bboxRatio = r1;
  }

  if (bbox && bboxRatio >= 0.9 && passes[1]) {
    const b2 = findForegroundBoundingBox(img, scanCanvas.width, scanCanvas.height, {
      step,
      ...passes[1],
    });
    if (b2) {
      const r2 =
        (b2.w * b2.h) / Math.max(1, scanCanvas.width * scanCanvas.height);
      // Only accept stricter bbox if it meaningfully reduces the area
      // but doesn't collapse to something tiny/unreliable.
      if (r2 < bboxRatio - 0.05 && r2 > 0.05) {
        bbox = b2;
        bboxRatio = r2;
      }
    }
  }

  if (!bbox) return null;

  // Padding specified in SOURCE pixels; convert to scan pixels.
  const padXScan = Math.max(
    0,
    Math.floor((Number(paddingLeftRightPx) || 0) * scanScale)
  );
  const padBottomScan = Math.max(
    0,
    Math.floor((Number(paddingBottomPx) || 0) * scanScale)
  );
  const padTopScan = Math.max(
    0,
    Math.floor((Number(paddingTopPx) || 0) * scanScale)
  );

  const sx1 = Math.max(0, bbox.x - padXScan);
  const sy1 = Math.max(0, bbox.y - padTopScan);
  const sx2 = Math.min(
    scanCanvas.width - 1,
    bbox.x + bbox.w - 1 + padXScan
  );
  const sy2 = Math.min(
    scanCanvas.height - 1,
    bbox.y + bbox.h - 1 + padBottomScan
  );

  // Map bbox back to SOURCE coords
  const inv = scanScale ? 1 / scanScale : 1;
  const x1 = clampInt(sx1 * inv, 0, sw - 1);
  const y1 = clampInt(sy1 * inv, 0, sh - 1);
  const x2 = clampInt(sx2 * inv, 0, sw - 1);
  const y2 = clampInt(sy2 * inv, 0, sh - 1);

  const cropped = cropCanvas(srcCanvas, {
    x: x1,
    y: y1,
    w: Math.max(1, x2 - x1 + 1),
    h: Math.max(1, y2 - y1 + 1),
  });
  const out = cropped || srcCanvas;

  // Normalize rotation (0/90/180/270) so passports are upright and portrait.
  return chooseBestRotation(out);
}
