export const UZBEK_MONTHS = [
  { value: "yanvar", label: "Yanvar" },
  { value: "fevral", label: "Fevral" },
  { value: "mart", label: "Mart" },
  { value: "aprel", label: "Aprel" },
  { value: "may", label: "May" },
  { value: "iyun", label: "Iyun" },
  { value: "iyul", label: "Iyul" },
  { value: "avgust", label: "Avgust" },
  { value: "sentyabr", label: "Sentyabr" },
  { value: "oktyabr", label: "Oktyabr" },
  { value: "noyabr", label: "Noyabr" },
  { value: "dekabr", label: "Dekabr" },
];

export const TEMPLATE_COLLECTION = "template_documents";
export const TEMPLATE_ID = "nomzod_rozilik_xati";

export function todayDdMmYyyy() {
  try {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

export function toInputDate(ddMmYyyy) {
  if (!ddMmYyyy) return "";
  const parts = String(ddMmYyyy).split(".");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

export function fromInputDate(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const parts = String(yyyyMmDd).split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${dd}.${mm}.${yyyy}`;
}

export function getDefaultForm() {
  return {
    sana: todayDdMmYyyy(),
    nomzodIsmFamilya: "",
    ishBeruvchiNomi: "",
    kasb: "Fachkraft für Lagerlogistik",
    dasturSana: todayDdMmYyyy(),
    oyNomi: "",
  };
}
