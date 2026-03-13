import { clampInt, luma, quantileSorted } from "./mathUtils.js";
import { estimateBackgroundFromCorners } from "./mathUtils.js";

export function findForegroundBoundingBox(
  imgData,
  width,
  height,
  {
    step = 2,
    // Background-diff based detection
    diffThreshold = 60,
    // Colorfulness (helps ignore gray paper/shadows)
    chromaThreshold = 12,
    // Dark text/ink relative to background luminance
    // NOTE: keep this fairly strict so scanner bed shadows don't become "foreground".
    darkDelta = 80,
    // Prevent gray shading edges from being treated as foreground by diff alone
    minChromaForDiff = 6,
  } = {}
) {
  const data = imgData?.data;
  if (!data || !width || !height) return null;

  const st = clampInt(step, 1, 8);
  const bg = estimateBackgroundFromCorners(imgData, width, height);
  const bgR = bg.r;
  const bgG = bg.g;
  const bgB = bg.b;
  const bgY = bg.y;

  const diffT = clampInt(diffThreshold, 10, 140);
  const chromaT = clampInt(chromaThreshold, 0, 80);
  const darkT = bgY - clampInt(darkDelta, 5, 120);
  const minChromaDiff = clampInt(minChromaForDiff, 0, 80);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  // Ignore a small edge margin to avoid picking up scanner borders/shadows.
  const edge = clampInt(
    Math.floor(Math.min(width, height) * 0.02),
    0,
    40
  );

  // Robust bbox: sample foreground points and use quantiles to ignore tiny dust/outliers.
  const maxSamples = 8000;
  let hits = 0;
  const xs = [];
  const ys = [];
  function samplePoint(x, y) {
    hits += 1;
    if (xs.length < maxSamples) {
      xs.push(x);
      ys.push(y);
      return;
    }
    const j = Math.floor(Math.random() * hits);
    if (j >= 0 && j < maxSamples) {
      xs[j] = x;
      ys[j] = y;
    }
  }

  for (let y = edge; y < height - edge; y += st) {
    const row = y * width * 4;
    for (let x = edge; x < width - edge; x += st) {
      const i = row + x * 4;
      const a = data[i + 3];
      if (a <= 8) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const yv = luma(r, g, b);
      const diff =
        Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

      const isColored = chroma >= chromaT;
      const isDark = yv <= darkT;
      const isDifferent = diff >= diffT && chroma >= minChromaDiff;
      const isFg = isColored || isDark || isDifferent;
      if (!isFg) continue;

      samplePoint(x, y);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0 || maxY < 0) return null;

  // Use robust quantiles if we have enough samples (ignores dust marks near the edges).
  if (xs.length >= 200) {
    const sx = xs.slice().sort((a, b) => a - b);
    const sy = ys.slice().sort((a, b) => a - b);
    const qLow = 0.01;
    const qHigh = 0.99;
    const rx1 = Math.floor(quantileSorted(sx, qLow));
    const rx2 = Math.ceil(quantileSorted(sx, qHigh));
    const ry1 = Math.floor(quantileSorted(sy, qLow));
    const ry2 = Math.ceil(quantileSorted(sy, qHigh));
    const nx1 = clampInt(rx1, 0, width - 1);
    const ny1 = clampInt(ry1, 0, height - 1);
    const nx2 = clampInt(rx2, 0, width - 1);
    const ny2 = clampInt(ry2, 0, height - 1);
    const rw = Math.max(1, nx2 - nx1 + 1);
    const rh = Math.max(1, ny2 - ny1 + 1);
    // Only accept if it's not absurdly small (avoids pathological cases).
    if (rw * rh >= 0.02 * width * height) {
      minX = nx1;
      minY = ny1;
      maxX = nx2;
      maxY = ny2;
    }
  }

  const w = Math.max(1, maxX - minX + 1);
  const h = Math.max(1, maxY - minY + 1);
  return { x: minX, y: minY, w, h };
}
