export function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, Math.floor(x)));
}

export function luma(r, g, b) {
  // Perceived luminance (sRGB)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function median(values) {
  const arr = Array.isArray(values) ? values.slice() : [];
  if (!arr.length) return 0;
  arr.sort((a, b) => a - b);
  return arr[Math.floor(arr.length / 2)] ?? 0;
}

export function quantileSorted(sorted, q) {
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

export function estimateBackgroundFromCorners(imgData, width, height, sampleSizePx = 40) {
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
