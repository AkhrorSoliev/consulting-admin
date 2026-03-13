import { clampInt } from "./mathUtils.js";

export function rotateCanvas90(srcCanvas, direction = "cw") {
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

export function rotateCanvas180(srcCanvas) {
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

export function cropCanvas(srcCanvas, bbox) {
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
