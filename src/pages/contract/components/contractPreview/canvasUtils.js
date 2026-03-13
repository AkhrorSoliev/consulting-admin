/**
 * Canvas manipulation utilities for passport image processing.
 */

export function findNonWhiteBoundingBox(
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

export function drawCoverToSquareCanvas(
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

export function rotateCanvas90(srcCanvas, direction = "cw") {
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

export function rotateCanvas180(srcCanvas) {
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
