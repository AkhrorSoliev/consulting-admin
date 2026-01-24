import { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import FormInput from "../../../../components/FormInput";

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
    txtf_1_vorname: candidateData?.personalInfo?.name || "",
    txtf_2_name: candidateData?.personalInfo?.lastName || "",
    txtf_3_wohnsitz: "",
    txtf_4_beschaeftigung_von: "",
    txtf_5_beschaeftigung_bis: "",
    txtf_6_arbeitstage: "",
    rbtn_7_kurzfristige_beschaeftigung: "",
    txtf_8_beschaeftigung_1_von: "",
    txtf_8_beschaeftigung_1_bis: "",
    txtf_8_beschaeftigung_1_tage: "",
    txtf_9_beschaeftigung_2_von: "",
    txtf_9_beschaeftigung_2_bis: "",
    txtf_9_beschaeftigung_2_tage: "",
    txtf_10_beschaeftigung_3_von: "",
    txtf_10_beschaeftigung_3_bis: "",
    txtf_10_beschaeftigung_3_tage: "",
    txtf_11_erklarung_ort: "",
    txtf_12_erklarung_datum: todayDdMmYyyy(),
  });

  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
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
      link.download = `Zusatzblatt_D_${form.txtf_2_name || "Dokument"}.pdf`;
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

            {/* Section B - Angaben zur kurzfristigen Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zur kurzfristigen Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="4. Beschäftigung von (TT.MM.JJJJ)"
                  type="date"
                  value={toInputDate(form.txtf_4_beschaeftigung_von)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_4_beschaeftigung_von: fromInputDate(e.target.value) }))
                  }
                />
                <FormInput
                  label="5. Beschäftigung bis (TT.MM.JJJJ)"
                  type="date"
                  value={toInputDate(form.txtf_5_beschaeftigung_bis)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_5_beschaeftigung_bis: fromInputDate(e.target.value) }))
                  }
                />
              </div>
              <FormInput
                label="6. Anzahl der Arbeitstage"
                value={form.txtf_6_arbeitstage}
                onChange={(e) => setForm((p) => ({ ...p, txtf_6_arbeitstage: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    7. War die Person in den letzten 12 Monaten bereits kurzfristig beschäftigt?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_7_kurzfristige_beschaeftigung"
                        className="radio radio-primary"
                        checked={form.rbtn_7_kurzfristige_beschaeftigung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_7_kurzfristige_beschaeftigung: opt }))}
                      />
                      <span className="label-text">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Frühere kurzfristige Beschäftigungen */}
            {form.rbtn_7_kurzfristige_beschaeftigung === "ja" && (
              <>
                <div className="divider divider-start font-bold text-base-content/80">
                  C. Frühere kurzfristige Beschäftigungen (letzte 12 Monate)
                </div>
                <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
                  <p className="text-sm opacity-70">
                    Bitte geben Sie die früheren kurzfristigen Beschäftigungen der letzten 12 Monate an.
                  </p>

                  {/* Beschäftigung 1 */}
                  <div className="border border-base-300 rounded-lg p-3 space-y-3">
                    <h4 className="font-medium text-sm">Beschäftigung 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormInput
                        label="8. Von"
                        type="date"
                        value={toInputDate(form.txtf_8_beschaeftigung_1_von)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, txtf_8_beschaeftigung_1_von: fromInputDate(e.target.value) }))
                        }
                      />
                      <FormInput
                        label="Bis"
                        type="date"
                        value={toInputDate(form.txtf_8_beschaeftigung_1_bis)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, txtf_8_beschaeftigung_1_bis: fromInputDate(e.target.value) }))
                        }
                      />
                      <FormInput
                        label="Arbeitstage"
                        value={form.txtf_8_beschaeftigung_1_tage}
                        onChange={(e) => setForm((p) => ({ ...p, txtf_8_beschaeftigung_1_tage: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Beschäftigung 2 */}
                  <div className="border border-base-300 rounded-lg p-3 space-y-3">
                    <h4 className="font-medium text-sm">Beschäftigung 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormInput
                        label="9. Von"
                        type="date"
                        value={toInputDate(form.txtf_9_beschaeftigung_2_von)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, txtf_9_beschaeftigung_2_von: fromInputDate(e.target.value) }))
                        }
                      />
                      <FormInput
                        label="Bis"
                        type="date"
                        value={toInputDate(form.txtf_9_beschaeftigung_2_bis)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, txtf_9_beschaeftigung_2_bis: fromInputDate(e.target.value) }))
                        }
                      />
                      <FormInput
                        label="Arbeitstage"
                        value={form.txtf_9_beschaeftigung_2_tage}
                        onChange={(e) => setForm((p) => ({ ...p, txtf_9_beschaeftigung_2_tage: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Beschäftigung 3 */}
                  <div className="border border-base-300 rounded-lg p-3 space-y-3">
                    <h4 className="font-medium text-sm">Beschäftigung 3</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormInput
                        label="10. Von"
                        type="date"
                        value={toInputDate(form.txtf_10_beschaeftigung_3_von)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, txtf_10_beschaeftigung_3_von: fromInputDate(e.target.value) }))
                        }
                      />
                      <FormInput
                        label="Bis"
                        type="date"
                        value={toInputDate(form.txtf_10_beschaeftigung_3_bis)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, txtf_10_beschaeftigung_3_bis: fromInputDate(e.target.value) }))
                        }
                      />
                      <FormInput
                        label="Arbeitstage"
                        value={form.txtf_10_beschaeftigung_3_tage}
                        onChange={(e) => setForm((p) => ({ ...p, txtf_10_beschaeftigung_3_tage: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Section D - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Erklärung und Unterschrift
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="11. Ort"
                  value={form.txtf_11_erklarung_ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_11_erklarung_ort: e.target.value }))}
                />
                <FormInput
                  label="12. Datum"
                  type="date"
                  value={toInputDate(form.txtf_12_erklarung_datum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_12_erklarung_datum: fromInputDate(e.target.value) }))
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
