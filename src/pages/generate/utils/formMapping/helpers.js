import { fromInputMonth } from "../../../../utils";
import { pickFirstNonEmptyString } from "../snapshotUtils";

export function getCommentHtml(obj) {
  return String(obj?.commentar || "");
}

export function normalizeMonth(value) {
  const toYyyyMm = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = String(d.getFullYear());
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${yyyy}-${mm}`;
      }
      return String(v);
    }
    if (v instanceof Date) {
      if (Number.isNaN(v.getTime())) return "";
      const yyyy = String(v.getFullYear());
      const mm = String(v.getMonth() + 1).padStart(2, "0");
      return `${yyyy}-${mm}`;
    }
    if (typeof v === "object") {
      if (typeof v.toDate === "function") {
        try {
          return toYyyyMm(v.toDate());
        } catch {
          return "";
        }
      }
      if (typeof v.seconds === "number") {
        return toYyyyMm(new Date(v.seconds * 1000));
      }
    }
    return String(v || "").trim();
  };

  const raw = toYyyyMm(value);
  if (!raw) return "";
  const from = fromInputMonth(raw);
  return from || raw;
}

export function normalizeWorkRecord(rec) {
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
  const position = pickFirstNonEmptyString([r?.position, r?.role]);
  const unternehmen = pickFirstNonEmptyString([r?.unternehmen, r?.company]);
  const ort = pickFirstNonEmptyString([r?.ort, r?.location]);
  const aufgaben = Array.isArray(r?.aufgaben)
    ? r.aufgaben
    : Array.isArray(r?.responsibilities)
      ? r.responsibilities
      : [];
  if (
    !beginn &&
    !ende &&
    !position &&
    !unternehmen &&
    !ort &&
    aufgaben.length === 0
  )
    return null;
  return {
    beginn: String(beginn || ""),
    ende: String(ende || ""),
    position: String(position || ""),
    unternehmen: String(unternehmen || ""),
    ort: String(ort || ""),
    aufgaben,
  };
}
