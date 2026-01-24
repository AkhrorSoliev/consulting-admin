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

export default function ZusatzblattBModal({ open, onClose, candidateData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitialForm = () => ({
    txtf_1_vorname: candidateData?.personalInfo?.name || "",
    txtf_2_name: candidateData?.personalInfo?.lastName || "",
    txtf_3_wohnsitz: "",
    rbtn_4_ict: "",
    txtf_5_aufnehmende_niederlassung: "",
    txtf_6_strasse: "",
    txtf_7_hausnummer: "",
    txtf_8_plz: "",
    txtf_9_ort: "",
    txtf_10_entsendende_niederlassung: "",
    txtf_11_strasse: "",
    txtf_12_hausnummer: "",
    txtf_13_plz: "",
    txtf_14_ort: "",
    txtf_15_staat: "",
    rbtn_16_verbindung: "",
    txtf_17_verbindung: "",
    txtf_18_erklarung_ort: "",
    txtf_19_erklarung_datum: todayDdMmYyyy(),
  });

  const [form, setForm] = useState(getInitialForm);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (open) {
      const baseForm = getInitialForm();
      setForm(baseForm);
      setLoadingDefaults(true);
      getFillablePdfDefaults("zusatzblatt_b")
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
        template: "zusatzblatt_b_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
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
      link.download = `Zusatzblatt_B_${form.txtf_2_name || "Dokument"}.pdf`;
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
              <h3 className="text-lg font-bold">Zusatzblatt B - ICT / Personalaustausch</h3>
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
                  label="1. Vorname"
                  value={form.txtf_1_vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_1_vorname: e.target.value }))}
                />
                <FormInput
                  label="2. Nachname"
                  value={form.txtf_2_name}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_2_name: e.target.value }))}
                />
              </div>
              <FormInput
                label="3. Derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort"
                value={form.txtf_3_wohnsitz}
                onChange={(e) => setForm((p) => ({ ...p, txtf_3_wohnsitz: e.target.value }))}
              />
            </div>

            {/* Section B - ICT */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zum unternehmensinternen Transfer (ICT)
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">4. Art des ICT</span>
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "Fuehrungskraft", label: "Führungskraft" },
                    { value: "Spezialist", label: "Spezialist" },
                    { value: "Trainee", label: "Trainee" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="modal_rbtn_4_ict"
                        className="radio radio-primary"
                        checked={form.rbtn_4_ict === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_4_ict: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Aufnehmende Niederlassung */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zur aufnehmenden Niederlassung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="5. Name der aufnehmenden Niederlassung"
                value={form.txtf_5_aufnehmende_niederlassung}
                onChange={(e) => setForm((p) => ({ ...p, txtf_5_aufnehmende_niederlassung: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="6. Straße"
                  value={form.txtf_6_strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_6_strasse: e.target.value }))}
                />
                <FormInput
                  label="7. Hausnummer"
                  value={form.txtf_7_hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_7_hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="8. PLZ"
                  value={form.txtf_8_plz}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_8_plz: e.target.value }))}
                />
                <FormInput
                  label="9. Ort"
                  value={form.txtf_9_ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_9_ort: e.target.value }))}
                />
              </div>
            </div>

            {/* Section D - Entsendende Niederlassung */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Angaben zur entsendenden Niederlassung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="10. Name der entsendenden Niederlassung"
                value={form.txtf_10_entsendende_niederlassung}
                onChange={(e) => setForm((p) => ({ ...p, txtf_10_entsendende_niederlassung: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="11. Straße"
                  value={form.txtf_11_strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_11_strasse: e.target.value }))}
                />
                <FormInput
                  label="12. Hausnummer"
                  value={form.txtf_12_hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_12_hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="13. PLZ"
                  value={form.txtf_13_plz}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_13_plz: e.target.value }))}
                />
                <FormInput
                  label="14. Ort"
                  value={form.txtf_14_ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_14_ort: e.target.value }))}
                />
              </div>
              <FormInput
                label="15. Staat"
                value={form.txtf_15_staat}
                onChange={(e) => setForm((p) => ({ ...p, txtf_15_staat: e.target.value }))}
              />
            </div>

            {/* Section E - Verbindung */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Angaben zur Verbindung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">16. Art der Verbindung zwischen den Niederlassungen</span>
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "Muttergesellschaft", label: "Muttergesellschaft" },
                    { value: "Tochtergesellschaft", label: "Tochtergesellschaft" },
                    { value: "Niederlassung", label: "Niederlassung" },
                    { value: "sonstige", label: "Sonstige" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="modal_rbtn_16_verbindung"
                        className="radio radio-primary"
                        checked={form.rbtn_16_verbindung === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_16_verbindung: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.rbtn_16_verbindung === "sonstige" && (
                <FormInput
                  label="17. Sonstige Verbindung (bitte beschreiben)"
                  value={form.txtf_17_verbindung}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_verbindung: e.target.value }))}
                />
              )}
            </div>

            {/* Section F - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              F. Erklärung und Unterschrift
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="18. Ort"
                  value={form.txtf_18_erklarung_ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_18_erklarung_ort: e.target.value }))}
                />
                <FormInput
                  label="19. Datum"
                  type="date"
                  value={toInputDate(form.txtf_19_erklarung_datum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_19_erklarung_datum: fromInputDate(e.target.value) }))
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
