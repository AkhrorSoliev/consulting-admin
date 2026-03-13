import countries from "../../utils/const";

export function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

export function formatMaskedBody(raw, countryPhone) {
  const d = digitsOnly(raw);
  const phone = String(countryPhone || "").trim();

  // Russia: +7 XXX XXX-XX-XX (3-3-2-2, 10 digits)
  if (phone === "+7") {
    const limited = d.slice(0, 10);
    const parts = [];
    let i = 0;
    const groups = [3, 3, 2, 2];
    for (const g of groups) {
      const chunk = limited.slice(i, i + g);
      if (!chunk) break;
      parts.push(chunk);
      i += g;
    }
    return parts.join(" ");
  }

  // Default: 00 000 00 00 (2-3-2-2, 9 digits)
  const limited = d.slice(0, 9);
  const parts = [];
  let i = 0;
  const groups = [2, 3, 2, 2];
  for (const g of groups) {
    const chunk = limited.slice(i, i + g);
    if (!chunk) break;
    parts.push(chunk);
    i += g;
  }
  return parts.join(" ");
}

export function normalizeText(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

export function getDefaultCountry() {
  const list = Array.isArray(countries) ? countries : [];
  return (
    list.find((c) => normalizeText(c?.deu) === "usbekistan") ||
    list.find((c) =>
      String(c?.flagSvg || "")
        .toLowerCase()
        .includes("/uz.svg")
    ) ||
    list.find((c) => String(c?.phone || "").trim() === "+998") ||
    list.find((c) => normalizeText(c?.deu) === "deutschland") ||
    list.find((c) => String(c?.phone || "").trim() === "+49") ||
    list[0] || { deu: "Deutschland", phone: "+49", flagSvg: "" }
  );
}

function getPriorityIndex(country) {
  const flag = String(country?.flagSvg || "").toLowerCase();
  if (flag.includes("/uz.svg")) return 0; // Usbekistan
  if (flag.includes("/de.svg")) return 1; // Deutschland
  if (flag.includes("/ru.svg")) return 2; // Russland
  if (flag.includes("/kr.svg")) return 3; // S Korea

  const name = normalizeText(country?.deu);
  if (name.includes("usbek")) return 0;
  if (name.includes("deutsch")) return 1;
  if (name.includes("russ")) return 2;
  if (name.includes("korea")) return 3;
  return 999;
}

export function sortWithPriority(list) {
  return [...list].sort((a, b) => {
    const pa = getPriorityIndex(a);
    const pb = getPriorityIndex(b);
    if (pa !== pb) return pa - pb;
    return String(a?.deu || "").localeCompare(String(b?.deu || ""), undefined, {
      sensitivity: "base",
    });
  });
}

export function findCountryByPhonePrefix(full) {
  const v = String(full || "").trim();
  if (!v) return null;
  const list = Array.isArray(countries) ? countries : [];
  const normalized = v.replace(/\s+/g, "");
  // Sort by phone code length desc so +390... matches before +39, etc.
  const sorted = [...list].sort(
    (a, b) => String(b?.phone || "").length - String(a?.phone || "").length
  );
  return (
    sorted.find((c) => {
      const p = String(c?.phone || "").trim();
      if (!p) return false;
      return normalized.startsWith(p.replace(/\s+/g, ""));
    }) || null
  );
}

export function stripPhonePrefix(full, phonePrefix) {
  const v = String(full || "").trim();
  const p = String(phonePrefix || "").trim();
  if (!v || !p) return v;
  const normalized = v.replace(/\s+/g, " ");
  const prefix = p.replace(/\s+/g, " ");
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length).trim();
  }
  // Also try without spaces for safety
  const ns = v.replace(/\s+/g, "");
  const ps = p.replace(/\s+/g, "");
  if (ns.startsWith(ps)) {
    return ns.slice(ps.length).trim();
  }
  return v;
}
