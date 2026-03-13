import { pickFirstNonEmptyString } from "../snapshotUtils";

function normalizeEduRecord(rec) {
  const r = rec && typeof rec === "object" ? rec : {};
  const beginn = pickFirstNonEmptyString([
    r?.beginn,
    r?.startDate,
    r?.startdatum,
    r?.startDatum,
    r?.von,
    r?.from,
  ]);
  const ende = pickFirstNonEmptyString([
    r?.ende,
    r?.endDate,
    r?.enddatum,
    r?.endDatum,
    r?.bis,
    r?.to,
  ]);
  const bildungseinrichtung = pickFirstNonEmptyString([
    r?.bildungseinrichtung,
    r?.bildungseinrichtungAufDeutsch,
    r?.bildungseinrichtungDeutsch,
    r?.bildungseinrichtung_de,
    r?.bildungseinrichtungDE,
    r?.institution,
    r?.schule,
    r?.university,
    r?.college,
  ]);
  const abschluss = pickFirstNonEmptyString([
    r?.abschluss,
    r?.abschlussAufDeutsch,
    r?.abschlussDeutsch,
    r?.abschluss_de,
    r?.abschlussDE,
    r?.degree,
    r?.studiengang,
  ]);
  if (!beginn && !ende && !bildungseinrichtung && !abschluss) return null;
  return {
    beginn: String(beginn || ""),
    ende: String(ende || ""),
    bildungseinrichtung: String(bildungseinrichtung || ""),
    abschluss: String(abschluss || ""),
  };
}

function normalizeKey(k) {
  const base = String(k || "")
    .trim()
    .toLowerCase();
  try {
    return base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  } catch {
    return base.replace(/[^a-z0-9]/g, "");
  }
}

export function parseEducation(data, debugGenerate) {
  let ausb = [];
  const rawAusbildung =
    data?.ausbildung ??
    data?.education ??
    data?.ausbildungen ??
    data?.Ausbildung ??
    data?.bildung ??
    null;

  const pushEdu = (rec) => {
    if (Array.isArray(rec)) {
      rec.forEach(pushEdu);
      return;
    }
    const normalized = normalizeEduRecord(rec);
    if (normalized) ausb.push(normalized);
  };

  if (debugGenerate) {
    console.log("AUSBILDUNG DEBUG:", {
      raw: rawAusbildung,
      isArray: Array.isArray(rawAusbildung),
      isObject: rawAusbildung && typeof rawAusbildung === "object",
      type: typeof rawAusbildung,
      keys:
        rawAusbildung && typeof rawAusbildung === "object"
          ? Object.keys(rawAusbildung)
          : [],
    });
  }

  if (Array.isArray(rawAusbildung)) {
    rawAusbildung.forEach(pushEdu);
  } else if (rawAusbildung && typeof rawAusbildung === "object") {
    const eduObj = rawAusbildung;
    const entries = Object.entries(eduObj);
    const findValueByAliases = (aliases) => {
      const wanted = new Set(aliases.map(normalizeKey));
      for (const [k, v] of entries) {
        if (wanted.has(normalizeKey(k))) return v;
      }
      return undefined;
    };

    const schoolVal = findValueByAliases([
      "schule",
      "school",
      "maktab",
      "schulen",
    ]);
    const collegeVal = findValueByAliases([
      "kollej",
      "college",
      "kollejlitsey",
      "litsey",
      "lyceum",
      "lice",
    ]);
    const uniVal = findValueByAliases([
      "universitat",
      "universitaet",
      "universitet",
      "university",
      "uni",
    ]);

    if (schoolVal !== undefined) pushEdu(schoolVal);
    if (collegeVal !== undefined) pushEdu(collegeVal);
    if (uniVal !== undefined) pushEdu(uniVal);

    // Fallback: if object doesn't match known keys but contains a single record.
    if (ausb.length === 0) {
      const normalizedRoot = normalizeEduRecord(eduObj);
      if (normalizedRoot) {
        ausb.push(normalizedRoot);
      } else {
        // Last resort: try to parse each value as a record.
        for (const [, v] of entries) pushEdu(v);
      }
    }
  }

  if (debugGenerate) {
    console.log("Total education entries extracted:", ausb.length, ausb);
  }

  return ausb;
}
