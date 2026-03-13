import { clampInt, luma } from "./mathUtils.js";
import { estimateBackgroundFromCorners } from "./mathUtils.js";
import { rotateCanvas90, rotateCanvas180 } from "./canvasTransforms.js";

function scoreOrientation(canvas) {
  const w = canvas?.width || 0;
  const h = canvas?.height || 0;
  if (!w || !h) return -Infinity;

  // Downsample for speed
  const maxDim = 240;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const sw = Math.max(1, Math.floor(w * scale));
  const sh = Math.max(1, Math.floor(h * scale));
  const sample = document.createElement("canvas");
  sample.width = sw;
  sample.height = sh;
  const ctx = sample.getContext("2d", { alpha: false });
  if (!ctx) return -Infinity;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sw, sh);
  ctx.drawImage(canvas, 0, 0, w, h, 0, 0, sw, sh);

  let img;
  try {
    img = ctx.getImageData(0, 0, sw, sh);
  } catch {
    return -Infinity;
  }
  const data = img?.data;
  if (!data) return -Infinity;

  // Focus on MRZ/text position: for an upright passport, the densest "ink strokes"
  // (dark + low-chroma + adjacent-to-light pixels) are typically near the bottom (MRZ).
  // This is more robust than counting generic dark pixels, because a photo block can be dark
  // but has far fewer crisp black-on-white stroke edges than text.

  // Ignore outer edges to avoid scanner borders influencing the decision.
  const mx = Math.floor(sw * 0.08);
  const my = Math.floor(sh * 0.06);
  const x0 = clampInt(mx, 0, Math.max(0, sw - 1));
  const x1 = clampInt(sw - mx, 1, sw);
  const y0 = clampInt(my, 0, Math.max(0, sh - 1));
  const y1 = clampInt(sh - my, 1, sh);

  const usableH = Math.max(1, y1 - y0);
  const bandH = Math.max(1, Math.floor(usableH * 0.24));
  const topEnd = y0 + bandH;
  const bottomStart = y1 - bandH;

  const bg = estimateBackgroundFromCorners(img, sw, sh, 22);
  const darkT = bg.y - 70; // ink threshold (relative to background)
  const lightT = bg.y - 12; // "paper/background-ish" threshold
  const chromaTextMax = 22; // keep only near-gray/black strokes (filters colored photo areas)

  let topStrokes = 0;
  let bottomStrokes = 0;
  let totalStrokes = 0;

  // Fallback counters (if we can't detect enough strokes, use plain dark count)
  let topDark = 0;
  let bottomDark = 0;
  let totalDark = 0;

  for (let y = y0; y < y1; y += 2) {
    const row = y * sw * 4;
    for (let x = x0; x < x1; x += 2) {
      const i = row + x * 4;
      const a = data[i + 3];
      if (a <= 8) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const yv = luma(r, g, b);
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const isDark = yv < darkT;
      if (!isDark) continue;

      totalDark += 1;
      if (y <= topEnd) topDark += 1;
      if (y >= bottomStart) bottomDark += 1;

      // Only treat as "ink stroke" if it's dark AND low-chroma (black/gray).
      if (chroma > chromaTextMax) continue;

      // Edge-to-light check: text strokes often border the paper background.
      let hasLightNeighbor = false;
      if (x + 2 < x1) {
        const j = row + (x + 2) * 4;
        const a2 = data[j + 3];
        if (a2 > 8) {
          const y2 = luma(data[j], data[j + 1], data[j + 2]);
          if (y2 > lightT) hasLightNeighbor = true;
        }
      }
      if (!hasLightNeighbor && y + 2 < y1) {
        const j = (y + 2) * sw * 4 + x * 4;
        const a2 = data[j + 3];
        if (a2 > 8) {
          const y2 = luma(data[j], data[j + 1], data[j + 2]);
          if (y2 > lightT) hasLightNeighbor = true;
        }
      }
      if (!hasLightNeighbor) continue;

      totalStrokes += 1;
      if (y <= topEnd) topStrokes += 1;
      if (y >= bottomStart) bottomStrokes += 1;
    }
  }

  // Prefer portrait when plausible, but keep it a small bonus so we don't rotate incorrectly.
  const portraitBonus = h >= w ? 180 : 0;

  // Use stroke-based signal when available; otherwise fallback to generic dark signal.
  if (totalStrokes >= 80) {
    const norm = (bottomStrokes - topStrokes) / totalStrokes;
    return portraitBonus + norm * 1400;
  }

  const normDark = totalDark > 0 ? (bottomDark - topDark) / totalDark : 0;
  return portraitBonus + normDark * 700;
}

export function chooseBestRotation(canvas) {
  const c0 = canvas;
  const c90 = rotateCanvas90(canvas, "cw");
  const c180 = rotateCanvas180(canvas);
  const c270 = rotateCanvas90(canvas, "ccw");

  const candidates = [
    { c: c0, r: 0 },
    { c: c90, r: 90 },
    { c: c180, r: 180 },
    { c: c270, r: 270 },
  ].filter((x) => x.c);

  let best = candidates[0] || null;
  let bestScore = -Infinity;
  for (const item of candidates) {
    const sc = scoreOrientation(item.c);
    if (sc > bestScore) {
      bestScore = sc;
      best = item;
    }
  }
  return best?.c || canvas;
}
