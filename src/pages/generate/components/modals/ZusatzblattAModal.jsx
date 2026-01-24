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

export default function ZusatzblattAModal({ open, onClose, candidateData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitialForm = () => ({
    txtf_1_Vorname: candidateData?.personalInfo?.name || "",
    txtf_2_Nachname: candidateData?.personalInfo?.lastName || "",
    txtf_3_Wohnsitz: "",
    rbtn_B_ArtBeschaeftigung: "",
    txtf_4_Anerkennungsbehoerde: "",
    txtf_5_Strasse: "",
    txtf_6_Hausnummer: "",
    txtf_7_PLZ: "",
    txtf_8_Ort: "",
    rbtn_9_AntragAnerkennungsbehoerde: "",
    rbtn_10_UnterschiedeBerufsqualifikation: "",
    rbtn_11_Sprachkenntnisse: "",
    rbtn_12_vollstaendigeAnerkennung: "",
    rbtn_13_betrieblicheQualifizierung: "",
    rbtn_14_Betriebsdauer: "",
    txtf_14_Gruende_beruflicherZusammenhang: "",
    txtf_15_geplanterZielberuf: "",
    chbx_15a_Zielberuf: false,
    chbx_15b_Zielberuf: false,
    chbx_15c_Zielberuf: false,
    chbx_15d_Zielberuf: false,
    chbx_15e_Zielberuf: false,
    chbx_15f_Zielberuf: false,
    chbx_15g_Zielberuf: false,
    chbx_15h_Zielberuf: false,
    rbtn_16_Anerkennungsbescheid: "",
    rbtn_17_Nachqualifizierung: "",
    txtf_17_von: "",
    txtf_17_bis: "",
    txtf_18_Sprachkenntnisse: "",
    chbx_18_a: false,
    chbx_18_b: false,
    chbx_18_c: false,
    chbx_18_d: false,
    rbtn_19_Sprachniveau: "",
    txtf_20_Ort: "",
    txtf_21_Datum: todayDdMmYyyy(),
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
        template: "zusatzblatt_a_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
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
      link.download = `Zusatzblatt_A_${form.txtf_2_Nachname || "Dokument"}.pdf`;
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
              <h3 className="text-lg font-bold">Zusatzblatt A - Anerkennungsverfahren</h3>
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
                  label="1. Vorname(n)"
                  value={form.txtf_1_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_1_Vorname: e.target.value }))}
                />
                <FormInput
                  label="2. Nachname"
                  value={form.txtf_2_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_2_Nachname: e.target.value }))}
                />
              </div>
              <FormInput
                label="3. Derzeitiger Wohnsitz"
                value={form.txtf_3_Wohnsitz}
                onChange={(e) => setForm((p) => ({ ...p, txtf_3_Wohnsitz: e.target.value }))}
              />
            </div>

            {/* Section B - Art der Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Art der Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Art der Beschäftigung</span>
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "Beschaeftigung_Anerkennungspartnerschaft", label: "Beschäftigung im Rahmen einer Anerkennungspartnerschaft" },
                    { value: "Beschaeftigung_Anerkennungsverfahren", label: "Beschäftigung während des Anerkennungsverfahrens" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="modal_rbtn_B_ArtBeschaeftigung"
                        className="radio radio-primary"
                        checked={form.rbtn_B_ArtBeschaeftigung === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_B_ArtBeschaeftigung: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Anerkennungsbehörde */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zur Anerkennungsbehörde
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="4. Anerkennungsbehörde"
                value={form.txtf_4_Anerkennungsbehoerde}
                onChange={(e) => setForm((p) => ({ ...p, txtf_4_Anerkennungsbehoerde: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="5. Straße"
                  value={form.txtf_5_Strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_5_Strasse: e.target.value }))}
                />
                <FormInput
                  label="6. Hausnummer"
                  value={form.txtf_6_Hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_6_Hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="7. PLZ"
                  value={form.txtf_7_PLZ}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_7_PLZ: e.target.value }))}
                />
                <FormInput
                  label="8. Ort"
                  value={form.txtf_8_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_8_Ort: e.target.value }))}
                />
              </div>
            </div>

            {/* Section D - Antrag */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Angaben zum Antrag
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">9. Wurde ein Antrag bei der Anerkennungsbehörde gestellt?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_9_AntragAnerkennungsbehoerde"
                        className="radio radio-primary"
                        checked={form.rbtn_9_AntragAnerkennungsbehoerde === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_9_AntragAnerkennungsbehoerde: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">10. Wurden Unterschiede in der Berufsqualifikation festgestellt?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_10_UnterschiedeBerufsqualifikation"
                        className="radio radio-primary"
                        checked={form.rbtn_10_UnterschiedeBerufsqualifikation === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_10_UnterschiedeBerufsqualifikation: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">11. Wurden fehlende Sprachkenntnisse festgestellt?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_11_Sprachkenntnisse"
                        className="radio radio-primary"
                        checked={form.rbtn_11_Sprachkenntnisse === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_11_Sprachkenntnisse: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">12. Ist eine vollständige Anerkennung möglich?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_12_vollstaendigeAnerkennung"
                        className="radio radio-primary"
                        checked={form.rbtn_12_vollstaendigeAnerkennung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_12_vollstaendigeAnerkennung: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">13. Ist eine betriebliche Qualifizierung geplant?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_13_betrieblicheQualifizierung"
                        className="radio radio-primary"
                        checked={form.rbtn_13_betrieblicheQualifizierung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_13_betrieblicheQualifizierung: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section E - Beschäftigung während Anerkennung */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Beschäftigung während des Anerkennungsverfahrens
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="15. Geplanter Zielberuf"
                value={form.txtf_15_geplanterZielberuf}
                onChange={(e) => setForm((p) => ({ ...p, txtf_15_geplanterZielberuf: e.target.value }))}
              />
            </div>

            {/* Section H - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              H. Erklärung und Unterschrift
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="20. Ort"
                  value={form.txtf_20_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_20_Ort: e.target.value }))}
                />
                <FormInput
                  label="21. Datum"
                  type="date"
                  value={toInputDate(form.txtf_21_Datum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_21_Datum: fromInputDate(e.target.value) }))
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
