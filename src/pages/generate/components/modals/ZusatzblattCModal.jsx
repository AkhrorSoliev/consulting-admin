import { useState, useEffect } from "react";
import { FaDownload, FaInfoCircle } from "react-icons/fa";
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

export default function ZusatzblattCModal({ open, onClose, candidateData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitialForm = () => ({
    txtf_1_vorname: candidateData?.personalInfo?.name || "",
    txtf_2_name: candidateData?.personalInfo?.lastName || "",
    txtf_3_wohnsitz: "",
    rbtn_4_fahrerlaubnis: "",
    rbtn_5_fahrerlaubnis_ausgestellt: "",
    rbtn_6_fahrerlaubnis_schluesselzahl: "",
    rbtn_7_fahrerlaubnis_erworben: "",
    rbtn_8_fahrerlaubnis_drittstaat: "",
    rbtn_9_fahrerlaubnis_erteilt: "",
    rbtn_10_fahrerqualifizierungsnachweis: "",
    rbtn_11_fuehrerschein: "",
    rbtn_12_fahrerbescheinigung: "",
    txtf_13_grundqualifikationsstaat: "",
    rbtn_14_grundqualifiziert: "",
    chbx_erwerb_fahrerlaubnis_1: false,
    chbx_erwerb_fahrerlaubnis_2: false,
    chbx_erwerb_fahrerlaubnis_3: false,
    txtf_15_erwerb_kurs_wochen: "",
    txtf_15_erwerb_kurs_monat: "",
    txtf_16_erwerb_kurs_wochenstunden: "",
    txtf_17_erwerb_kurs_freigestellt: "",
    txtf_18_beschaeftigungsaufnahme_kurs_wochen: "",
    txtf_18_beschaeftigungsaufnahme_kurs_monat: "",
    txtf_19_weiterbildung_kurs_wochenstunden: "",
    txtf_20_weiterbildung_kurs_freigestellt: "",
    txtf_21_erwerb_sprachkurs_wochen: "",
    txtf_21_erwerb_sprachkurs_monat: "",
    txtf_22_erwerb_sprachkurs_wochenstunden: "",
    txtf_23_erwerb_sprachkurs_freigestellt: "",
    rbtn_24_zeitlicher_ablauf: "",
    txtf_25_erwerb_begruendung: "",
    txtf_26_erklarung_ort: "",
    txtf_27_erklarung_datum: todayDdMmYyyy(),
  });

  const [form, setForm] = useState(getInitialForm);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (open) {
      const baseForm = getInitialForm();
      setForm(baseForm);
      setLoadingDefaults(true);
      getFillablePdfDefaults("zusatzblatt_c")
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
        template: "zusatzblatt_c_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
        data: {
          textFields: {},
          radioGroups: {},
          checkboxes: {},
        },
      };

      Object.entries(form).forEach(([key, value]) => {
        if (key.startsWith("txtf_")) {
          payload.data.textFields[key] = value;
        } else if (key === "rbtn_5_fahrerlaubnis_ausgestellt") {
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
      link.download = `Zusatzblatt_C_${form.txtf_2_name || "Dokument"}.pdf`;
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
              <h3 className="text-lg font-bold">Zusatzblatt C - Berufskraftfahrer</h3>
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

            {/* Section B - Angaben zur Fahrerlaubnis */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zur Fahrerlaubnis
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    4. Ist der/die Arbeitnehmer/in im Besitz der erforderlichen EU- oder EWR-Fahrerlaubnis?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_4_fahrerlaubnis"
                        className="radio radio-primary"
                        checked={form.rbtn_4_fahrerlaubnis === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_4_fahrerlaubnis: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <FormInput
                label="5. Staat, in dem die EU- oder EWR-Fahrerlaubnis ausgestellt wurde"
                value={form.rbtn_5_fahrerlaubnis_ausgestellt}
                onChange={(e) => setForm((p) => ({ ...p, rbtn_5_fahrerlaubnis_ausgestellt: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm">
                    6. Ist die EU- oder EWR-Fahrerlaubnis mit der Schlüsselzahl 70 versehen?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_6_fahrerlaubnis_schluesselzahl"
                        className="radio radio-primary"
                        checked={form.rbtn_6_fahrerlaubnis_schluesselzahl === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_6_fahrerlaubnis_schluesselzahl: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm">
                    8. Ist der/die Arbeitnehmer/in im Besitz einer Fahrerlaubnis aus einem Drittstaat?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_8_fahrerlaubnis_drittstaat"
                        className="radio radio-primary"
                        checked={form.rbtn_8_fahrerlaubnis_drittstaat === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_8_fahrerlaubnis_drittstaat: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Grundqualifikation */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zur Grundqualifikation
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm">
                    10. Verfügt der/die Arbeitnehmer/in über einen Fahrerqualifizierungsnachweis?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_10_fahrerqualifizierungsnachweis"
                        className="radio radio-primary"
                        checked={form.rbtn_10_fahrerqualifizierungsnachweis === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_10_fahrerqualifizierungsnachweis: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm">
                    11. Verfügt der/die Arbeitnehmer/in über einen Führerschein mit Schlüsselzahl 95?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_11_fuehrerschein"
                        className="radio radio-primary"
                        checked={form.rbtn_11_fuehrerschein === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_11_fuehrerschein: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <FormInput
                label="13. Staat, in dem die Grundqualifikation erworben wurde"
                value={form.txtf_13_grundqualifikationsstaat}
                onChange={(e) => setForm((p) => ({ ...p, txtf_13_grundqualifikationsstaat: e.target.value }))}
              />

              <div className="alert alert-info">
                <FaInfoCircle className="text-lg" />
                <div className="text-sm">
                  <strong>Hinweis:</strong> Für die Besitzstandsregelung ist eine Weiterbildung von 35 Stunden erforderlich.
                </div>
              </div>
            </div>

            {/* Section D - Erwerb */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Erwerb von deutscher Fahrerlaubnis und/oder Grundqualifikation
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_erwerb_fahrerlaubnis_1}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_erwerb_fahrerlaubnis_1: e.target.checked }))}
                />
                <span className="label-text text-sm">
                  Die Teilnahme an Kursen/Prüfungen zum Erwerb der deutschen Fahrerlaubnis und/oder Grundqualifikation ist geplant.
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="15. Kurs-/Prüfungsteilnahme (Wochen)"
                  value={form.txtf_15_erwerb_kurs_wochen}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_15_erwerb_kurs_wochen: e.target.value }))}
                />
                <FormInput
                  label="15. Kurs-/Prüfungsteilnahme (Monate)"
                  value={form.txtf_15_erwerb_kurs_monat}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_15_erwerb_kurs_monat: e.target.value }))}
                />
              </div>

              <FormInput
                label="16. Wochenstunden für Kurs-/Prüfungsteilnahme"
                value={form.txtf_16_erwerb_kurs_wochenstunden}
                onChange={(e) => setForm((p) => ({ ...p, txtf_16_erwerb_kurs_wochenstunden: e.target.value }))}
              />

              <FormInput
                label="17. Freigestellte Wochenstunden"
                value={form.txtf_17_erwerb_kurs_freigestellt}
                onChange={(e) => setForm((p) => ({ ...p, txtf_17_erwerb_kurs_freigestellt: e.target.value }))}
              />

              <label className="label cursor-pointer justify-start gap-3 mt-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_erwerb_fahrerlaubnis_2}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_erwerb_fahrerlaubnis_2: e.target.checked }))}
                />
                <span className="label-text text-sm">
                  Für die Kurs-/Prüfungsteilnahme ist ein Sprachkurs erforderlich und geplant.
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="21. Sprachkurs (Wochen)"
                  value={form.txtf_21_erwerb_sprachkurs_wochen}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_21_erwerb_sprachkurs_wochen: e.target.value }))}
                />
                <FormInput
                  label="21. Sprachkurs (Monate)"
                  value={form.txtf_21_erwerb_sprachkurs_monat}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_21_erwerb_sprachkurs_monat: e.target.value }))}
                />
              </div>

              <FormInput
                label="22. Wochenstunden für Sprachkurs"
                value={form.txtf_22_erwerb_sprachkurs_wochenstunden}
                onChange={(e) => setForm((p) => ({ ...p, txtf_22_erwerb_sprachkurs_wochenstunden: e.target.value }))}
              />

              <FormInput
                label="23. Freigestellte Wochenstunden für Sprachkurs"
                value={form.txtf_23_erwerb_sprachkurs_freigestellt}
                onChange={(e) => setForm((p) => ({ ...p, txtf_23_erwerb_sprachkurs_freigestellt: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm">
                    24. Zeitlicher Ablauf der Kurse
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["parallel", "aufeinanderfolgend"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_24_zeitlicher_ablauf"
                        className="radio radio-primary"
                        checked={form.rbtn_24_zeitlicher_ablauf === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_24_zeitlicher_ablauf: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">25. Begründung</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={form.txtf_25_erwerb_begruendung}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_25_erwerb_begruendung: e.target.value }))}
                />
              </div>
            </div>

            {/* Section E - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Erklärung und Unterschrift
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="26. Ort"
                  value={form.txtf_26_erklarung_ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_26_erklarung_ort: e.target.value }))}
                />
                <FormInput
                  label="27. Datum"
                  type="date"
                  value={toInputDate(form.txtf_27_erklarung_datum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_27_erklarung_datum: fromInputDate(e.target.value) }))
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
