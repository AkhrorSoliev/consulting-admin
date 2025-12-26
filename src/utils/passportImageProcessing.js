function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, Math.floor(x)));
}

function luma(r, g, b) {
  // Perceived luminance (sRGB)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function median(values) {
  const arr = Array.isArray(values) ? values.slice() : [];
  if (!arr.length) return 0;
  arr.sort((a, b) => a - b);
  return arr[Math.floor(arr.length / 2)] ?? 0;
}

function quantileSorted(sorted, q) {
  const arr = Array.isArray(sorted) ? sorted : [];
  const n = arr.length;
  if (!n) return 0;
  const qq = Math.min(1, Math.max(0, Number(q) || 0));
  const pos = (n - 1) * qq;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return arr[lo] ?? 0;
  const w = pos - lo;
  return (arr[lo] ?? 0) * (1 - w) + (arr[hi] ?? 0) * w;
}

function estimateBackgroundFromCorners(imgData, width, height, sampleSizePx = 40) {
  const data = imgData?.data;
  if (!data || !width || !height) {
    return { r: 255, g: 255, b: 255, y: 255, chroma: 0 };
  }

  const s = clampInt(
    sampleSizePx,
    8,
    Math.min(80, Math.floor(Math.min(width, height) / 4) || 80)
  );

  const corners = [
    { x0: 0, y0: 0 },
    { x0: width - s, y0: 0 },
    { x0: 0, y0: height - s },
    { x0: width - s, y0: height - s },
  ].map((c) => ({
    x0: clampInt(c.x0, 0, Math.max(0, width - 1)),
    y0: clampInt(c.y0, 0, Math.max(0, height - 1)),
  }));

  const avgs = corners.map(({ x0, y0 }) => {
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let count = 0;
    const x1 = Math.min(width, x0 + s);
    const y1 = Math.min(height, y0 + s);
    for (let y = y0; y < y1; y += 2) {
      const row = y * width * 4;
      for (let x = x0; x < x1; x += 2) {
        const i = row + x * 4;
        const a = data[i + 3];
        if (a <= 8) continue;
        rs += data[i];
        gs += data[i + 1];
        bs += data[i + 2];
        count += 1;
      }
    }
    if (!count) return { r: 255, g: 255, b: 255 };
    return {
      r: rs / count,
      g: gs / count,
      b: bs / count,
    };
  });

  // Median across corners is robust if one corner contains the passport.
  const bg = {
    r: median(avgs.map((v) => v.r)),
    g: median(avgs.map((v) => v.g)),
    b: median(avgs.map((v) => v.b)),
  };
  const y = luma(bg.r, bg.g, bg.b);
  const chroma = Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b);
  return { ...bg, y, chroma };
}

function findForegroundBoundingBox(
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

function rotateCanvas90(srcCanvas, direction = "cw") {
  const sw = srcCanvas?.width || 0;
  const sh = srcCanvas?.height || 0;
  if (!sw || !sh) return null;
  const out = document.createElement("canvas");
  out.width = sh;
  out.height = sw;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  if (direction === "ccw") {
    ctx.translate(0, out.height);
    ctx.rotate(-Math.PI / 2);
  } else {
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
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width, out.height);
  ctx.rotate(Math.PI);
  ctx.drawImage(srcCanvas, 0, 0);
  return out;
}

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

function chooseBestRotation(canvas) {
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

function cropCanvas(srcCanvas, bbox) {
  const sw = srcCanvas?.width || 0;
  const sh = srcCanvas?.height || 0;
  if (!sw || !sh) return null;
  const b = bbox && typeof bbox === "object" ? bbox : null;
  if (!b) return null;

  const x = clampInt(b.x, 0, sw - 1);
  const y = clampInt(b.y, 0, sh - 1);
  const w = clampInt(b.w, 1, sw - x);
  const h = clampInt(b.h, 1, sh - y);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h);
  return out;
}

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
  // eslint-disable-next-line no-use-before-define
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
    // eslint-disable-next-line no-use-before-define
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


