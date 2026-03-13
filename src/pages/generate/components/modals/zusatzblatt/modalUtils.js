import toast from "react-hot-toast";

export const PDF_BACKEND_URL =
  import.meta.env.VITE_PDF_BACKEND_URL ||
  "https://unsincerely-monarchal-alva.ngrok-free.dev";

export function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
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

/**
 * Build a PDF payload from a form object, splitting keys by prefix.
 * Optional `textFieldOverrides` for keys that should be treated as text
 * despite a different prefix (e.g. rbtn_5_fahrerlaubnis_ausgestellt in C).
 */
export function buildPdfPayload(template, form, textFieldOverrides = []) {
  const payload = {
    template,
    data: { textFields: {}, radioGroups: {}, checkboxes: {} },
  };
  const overrideSet = new Set(textFieldOverrides);

  Object.entries(form).forEach(([key, value]) => {
    if (overrideSet.has(key)) {
      payload.data.textFields[key] = value;
    } else if (key.startsWith("txtf_")) {
      payload.data.textFields[key] = value;
    } else if (key.startsWith("rbtn_") && value) {
      payload.data.radioGroups[key] = value;
    } else if (key.startsWith("chbx_")) {
      payload.data.checkboxes[key] = value;
    }
  });
  return payload;
}

export async function downloadPdf(payload, filename) {
  const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "PDF generation failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("PDF wurde erstellt.");
}
