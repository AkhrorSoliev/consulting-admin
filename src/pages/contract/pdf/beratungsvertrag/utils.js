import { Font } from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let interRegistered = false;
export function ensureInterRegistered() {
  if (interRegistered) return;
  interRegistered = true;
  Font.register({
    family: "Inter",
    fonts: [
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"), fontWeight: 400 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
}

export function safeDate(d) {
  const v = String(d || "").trim();
  return v || "____.__.____";
}

export function safeName(n) {
  const v = String(n || "").trim();
  return v || "_____________________";
}

export function parseMoneyEur(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatEur(n) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "_____ €";
  try {
    return `${new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: num % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num)} €`;
  } catch {
    return `${String(num)} €`;
  }
}
