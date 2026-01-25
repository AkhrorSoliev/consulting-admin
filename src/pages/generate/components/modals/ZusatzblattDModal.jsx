import { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import FormInput from "../../../../components/FormInput";
import { getFillablePdfDefaults } from "../../../../utils/fillablePdfDefaults";

const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || "http://localhost:3001";

function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function toInputDate(ddMmYyyy) {
  if (!ddMmYyyy) return "";
  const parts = String(ddMmYyyy).split(".");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

function fromInputDate(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const parts = String(yyyyMmDd).split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${dd}.${mm}.${yyyy}`;
}

export default function ZusatzblattDModal({ open, onClose, candidateData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitialForm = () => ({
    // Section A - Angaben zur Person
    txtf_1_Vorname: candidateData?.personalInfo?.name || "",
    txtf_2_Nachname: candidateData?.personalInfo?.lastName || "",
    txtf_3_Wohnsitz: "",

    // Section B - Kurzfristige Beschäftigung
    rbtn_4_Arbeit_90_Tage: "",
    rbtn_5_Arbeit_8_Monate: "",
    rbtn_6_Erntehelfer: "",
    rbtn_7_Arbeit_visumfrei: "",
    rbtn_8_Unternehmen_beschaeftigt: "",
    rbtn_9_Reisekosten: "",

    // Section C - Unterschrift
    txtf_10_Ort: "",
    txtf_11_Datum: todayDdMmYyyy(),
  });

  const [form, setForm] = useState(getInitialForm);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (open) {
      const baseForm = getInitialForm();
      setForm(baseForm);
      setLoadingDefaults(true);
      getFillablePdfDefaults("zusatzblatt_d")
        .then((defaults) => {
          if (defaults && typeof defaults === "object") {
            setForm((prev) => {
              const merged = { ...prev };
              Object.keys(defaults).forEach((key) => {
                if (key in merged && key !== "updatedAt" && !prev[key]) {
                  merged[key] = defaults[key];
                }
              });
              return merged;
            });
          }
        })
        .catch((err) => console.error("Failed to load defaults:", err))
        .finally(() => setLoadingDefaults(false));
    }
  }, [open, candidateData]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);

      const payload = {
        template: "zusatzblatt_d_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
        data: {
          textFields: {},
          radioGroups: {},
          checkboxes: {},
        },
      };

      Object.entries(form).forEach(([key, value]) => {
        if (key.startsWith("txtf_")) {
          payload.data.textFields[key] = value;
        } else if (key.startsWith("rbtn_") && value) {
          payload.data.radioGroups[key] = value;
        } else if (key.startsWith("chbx_")) {
          payload.data.checkboxes[key] = value;
        }
      });

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
      link.download = `Zusatzblatt_D_${form.txtf_2_Nachname || "Dokument"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 flex flex-col max-h-[90vh]">
          <div className="p-4 sm:p-6 border-b border-base-300 flex items-start justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-lg font-bold">Zusatzblatt D - Kurzfristige Beschäftigung</h3>
              <p className="text-sm opacity-70">
                Kandidat ma'lumotlari bilan to'ldirilgan forma
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                <FaDownload />
                {isDownloading ? "Wird erstellt..." : "PDF"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
            {/* Section A - Angaben zur Person */}
            <div className="divider divider-start font-bold text-base-content/80">
              A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="1 Vorname"
                  value={form.txtf_1_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_1_Vorname: e.target.value }))}
                />
                <FormInput
                  label="2 Nachname"
                  value={form.txtf_2_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_2_Nachname: e.target.value }))}
                />
              </div>
              <FormInput
                label="3 derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort"
                value={form.txtf_3_Wohnsitz}
                onChange={(e) => setForm((p) => ({ ...p, txtf_3_Wohnsitz: e.target.value }))}
              />
            </div>

            {/* Section B - Angaben zur kurzfristigen kontingentierten Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zur kurzfristigen kontingentierten Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">4 Die Arbeitnehmerin/Der Arbeitnehmer arbeitet insgesamt (inklusive bisheriger Beschäftigungen und der hier beantragten Beschäftigung) in Deutschland nicht mehr als 90 Tage je Zeitraum von 180 Tagen.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_4_Arbeit_90_Tage"
                        className="radio radio-primary"
                        checked={form.rbtn_4_Arbeit_90_Tage === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_4_Arbeit_90_Tage: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label flex-col items-start gap-1">
                  <span className="label-text whitespace-normal font-medium">5 Die Arbeitnehmerin/Der Arbeitnehmer arbeitet insgesamt (inklusive bisheriger Beschäftigungen und der hier beantragten Beschäftigung) in Deutschland nicht mehr als acht Monate innerhalb eines Zeitraumes von zwölf Monaten.</span>
                  <span className="label-text whitespace-normal text-xs opacity-70">Hinweis: Diese Frage ist auch zu beantworten, wenn Frage 4 mit Ja beantwortet wurde. Grund hierfür ist, dass die maximale Beschäftigungsdauer von acht Monaten innerhalb eines Zeitraumes von zwölf Monaten auch für Beschäftigungen nach Frage 4 gilt.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_5_Arbeit_8_Monate"
                        className="radio radio-primary"
                        checked={form.rbtn_5_Arbeit_8_Monate === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_5_Arbeit_8_Monate: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">6 Handelt es sich um eine Beschäftigung als Erntehelferin/Erntehelfer in der Landwirtschaft?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_6_Erntehelfer"
                        className="radio radio-primary"
                        checked={form.rbtn_6_Erntehelfer === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_6_Erntehelfer: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label flex-col items-start gap-1">
                  <span className="label-text whitespace-normal font-medium">7 Die Arbeitnehmerin/Der Arbeitnehmer darf visumfrei zur Ausübung einer Beschäftigung einreisen (90 Tage je Zeitraum von 180 Tagen).</span>
                  <span className="label-text whitespace-normal text-xs opacity-70">Hinweis: Staatsangehörige aus der Liste in Anhang II zur Verordnung (EU) 2018/1806 (sogenannte Positiv-Staater) können für 90 Tage innerhalb eines Zeitraums von 180 Tagen visumfrei einreisen.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_7_Arbeit_visumfrei"
                        className="radio radio-primary"
                        checked={form.rbtn_7_Arbeit_visumfrei === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_7_Arbeit_visumfrei: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">8 Im Unternehmen werden in höchstens zehn Monaten innerhalb von zwölf Monaten Arbeitnehmerinnen und Arbeitnehmer auf Grundlage des § 15d BeschV beschäftigt.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_8_Unternehmen_beschaeftigt"
                        className="radio radio-primary"
                        checked={form.rbtn_8_Unternehmen_beschaeftigt === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_8_Unternehmen_beschaeftigt: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">9 Die erforderlichen Reisekosten für Hin- und Rückreise werden von dem Arbeitgeber übernommen.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_9_Reisekosten"
                        className="radio radio-primary"
                        checked={form.rbtn_9_Reisekosten === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_9_Reisekosten: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Erklärung und Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Erklärung und Unterschrift
            </div>
            <p className="text-sm opacity-70">Die Richtigkeit der Angaben wird durch Datum und Unterschrift bestätigt.</p>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="10 Ort"
                  value={form.txtf_10_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_10_Ort: e.target.value }))}
                />
                <FormInput
                  label="11 Datum"
                  type="date"
                  value={toInputDate(form.txtf_11_Datum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_11_Datum: fromInputDate(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
