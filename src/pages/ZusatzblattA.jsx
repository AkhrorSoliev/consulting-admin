import { useState, useEffect } from "react";
import { FaDownload, FaSave, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import {
  getFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../utils/fillablePdfDefaults";
import useUserRole from "../hooks/useUserRole";

const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || "https://unsincerely-monarchal-alva.ngrok-free.dev";

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

export default function ZusatzblattA() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);
  const { role } = useUserRole();
  const canManageDefaults = role === "super_admin" || role === "admin";

  const [form, setForm] = useState({
    // Section A - Angaben zur Person
    txtf_1_Vorname: "",
    txtf_2_Nachname: "",
    txtf_3_Wohnsitz: "",

    // Section B - Art der Beschäftigung
    rbtn_B_ArtBeschaeftigung: "",

    // Section C - Anerkennungsbehörde
    txtf_4_Anerkennungsbehoerde: "",
    txtf_5_Strasse: "",
    txtf_6_Hausnummer: "",
    txtf_7_PLZ: "",
    txtf_8_Ort: "",

    // Section D - Antrag
    rbtn_9_AntragAnerkennungsbehoerde: "",
    rbtn_10_UnterschiedeBerufsqualifikation: "",
    rbtn_11_Sprachkenntnisse: "",
    rbtn_12_vollstaendigeAnerkennung: "",
    rbtn_13_betrieblicheQualifizierung: "",

    // Section E - Beschäftigung während Anerkennung
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

    // Section F - Anerkennungspartnerschaft
    rbtn_16_Anerkennungsbescheid: "",
    rbtn_17_Nachqualifizierung: "",
    txtf_17_von: "",
    txtf_17_bis: "",

    // Section G - Sprachkenntnisse
    txtf_18_Sprachkenntnisse: "",
    chbx_18_a: false,
    chbx_18_b: false,
    chbx_18_c: false,
    chbx_18_d: false,
    rbtn_19_Sprachniveau: "",

    // Section H - Unterschrift
    txtf_20_Ort: "",
    txtf_21_Datum: todayDdMmYyyy(),
  });

  useEffect(() => {
    getFillablePdfDefaults("zusatzblatt_a")
      .then((defaults) => {
        if (defaults && typeof defaults === "object") {
          setHasDefaults(Object.keys(defaults).some((k) => k !== "updatedAt" && defaults[k]));
          setForm((prev) => {
            const merged = { ...prev };
            Object.keys(defaults).forEach((key) => {
              if (key in merged && key !== "updatedAt") {
                merged[key] = defaults[key];
              }
            });
            return merged;
          });
        }
      })
      .catch((err) => console.error("Failed to load defaults:", err));
  }, []);

  async function handleSaveAsDefaults() {
    setIsSavingDefaults(true);
    try {
      await saveFillablePdfDefaults("zusatzblatt_a", form);
      setHasDefaults(true);
      toast.success("Standardwerte gespeichert");
    } catch (err) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setIsSavingDefaults(false);
    }
  }

  async function handleClearDefaults() {
    if (!window.confirm("Möchten Sie alle Standardwerte für dieses Template löschen?")) return;
    setIsClearingDefaults(true);
    try {
      await clearFillablePdfDefaults("zusatzblatt_a");
      setHasDefaults(false);
      // Reset form to initial empty values
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => {
          if (key.startsWith("chbx_")) {
            reset[key] = false;
          } else if (key === "txtf_21_Datum") {
            reset[key] = todayDdMmYyyy();
          } else {
            reset[key] = "";
          }
        });
        return reset;
      });
      toast.success("Standardwerte gelöscht");
    } catch (err) {
      toast.error(err.message || "Fehler beim Löschen");
    } finally {
      setIsClearingDefaults(false);
    }
  }

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

  const formCard = "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto";

  return (
    <div className="p-2 min-h-screen">
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link to="/settings/documents" className="link flex items-center gap-2">
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">Zusatzblatt A</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            {canManageDefaults && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-secondary"
                  onClick={handleSaveAsDefaults}
                  disabled={isSavingDefaults}
                >
                  <FaSave className="w-3 h-3" />
                  {isSavingDefaults ? "Speichern..." : "Als Standard speichern"}
                </button>
                {hasDefaults && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-error"
                    onClick={handleClearDefaults}
                    disabled={isClearingDefaults}
                  >
                    <FaTrash className="w-3 h-3" />
                    {isClearingDefaults ? "Löschen..." : "Standard löschen"}
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              <FaDownload />
              {isDownloading ? "Wird erstellt..." : "PDF Herunterladen"}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16">
        <section className={formCard}>
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">
                Zusatzblatt A - Anerkennungsverfahren
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Zusatzblatt für Beschäftigung im Rahmen des Anerkennungsverfahrens
              </p>
            </div>

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

            {/* Section B - Art der Beschäftigung */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">B. Um welche Art der Beschäftigung beziehungsweise Qualifizierung handelt es sich im Formular „Erklärung zum Beschäftigungsverhältnis"?</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist \n(bitte die Abschnitte C, D, G und H ausfuellen)", label: "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist (bitte die Abschnitte C, D, G und H ausfüllen)" },
                    { value: "Beschaeftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeuebt wird \n(bitte die Abschnitte C, E, G und H ausfuellen)", label: "Beschäftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeübt wird (bitte die Abschnitte C, E, G und H ausfüllen)" },
                    { value: "Beschaeftigung waehrend der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfuellen)", label: "Beschäftigung während der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfüllen)" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_B_ArtBeschaeftigung"
                        className="radio radio-primary"
                        checked={form.rbtn_B_ArtBeschaeftigung === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_B_ArtBeschaeftigung: opt.value }))}
                      />
                      <span className="label-text whitespace-normal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Anerkennungsbehörde */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zum Anerkennungsverfahren
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="4 Name der zuständigen Anerkennungsbehörde"
                value={form.txtf_4_Anerkennungsbehoerde}
                onChange={(e) => setForm((p) => ({ ...p, txtf_4_Anerkennungsbehoerde: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="5 Straße"
                  value={form.txtf_5_Strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_5_Strasse: e.target.value }))}
                />
                <FormInput
                  label="6 Hausnummer"
                  value={form.txtf_6_Hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_6_Hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="7 Postleitzahl"
                  value={form.txtf_7_PLZ}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_7_PLZ: e.target.value }))}
                />
                <FormInput
                  label="8 Ort"
                  value={form.txtf_8_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_8_Ort: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">9 Welcher Antrag wurde bei der zuständigen Anerkennungsbehörde gestellt?</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Antrag auf Feststellung der Gleichwertigkeit der auslaendischen Berufsqualifikation mit einer inlaendischen Berufsqualifikation (weiter mit 10)", label: "Antrag auf Feststellung der Gleichwertigkeit der ausländischen Berufsqualifikation mit einer inländischen Berufsqualifikation (weiter mit 10)" },
                    { value: "Antrag auf Erteilung einer Berufsausuebungserlaubnis – bei reglementierten Berufen (weiter mit 11)", label: "Antrag auf Erteilung einer Berufsausübungserlaubnis – bei reglementierten Berufen (weiter mit 11)" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_9_AntragAnerkennungsbehoerde"
                        className="radio radio-primary"
                        checked={form.rbtn_9_AntragAnerkennungsbehoerde === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_9_AntragAnerkennungsbehoerde: opt.value }))}
                      />
                      <span className="label-text whitespace-normal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">10 Hat die zuständige Behörde festgestellt, dass wesentliche Unterschiede im Vergleich zu einer inländischen Berufsqualifikation bestehen?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_10_UnterschiedeBerufsqualifikation"
                        className="radio radio-primary"
                        checked={form.rbtn_10_UnterschiedeBerufsqualifikation === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_10_UnterschiedeBerufsqualifikation: opt }))}
                      />
                      <span className="label-text whitespace-normal">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">11 Hat die zuständige Anerkennungsstelle festgestellt, dass Ausgleichsmaßnahmen oder weitere Qualifikationen (zum Beispiel Sprachkenntnisse) erforderlich sind? Bitte fügen Sie den Bescheid der zuständigen Anerkennungsbehörde bei.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_11_Sprachkenntnisse"
                        className="radio radio-primary"
                        checked={form.rbtn_11_Sprachkenntnisse === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_11_Sprachkenntnisse: opt }))}
                      />
                      <span className="label-text whitespace-normal">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">12 Falls bekannt: Kann nach Einschätzung der Anerkennungsbehörde die vollständige Anerkennung nach erfolgreichem Abschluss der vorgesehenen Qualifizierungsmaßnahme/n erlangt werden? Bitte fügen Sie eine entsprechende Erklärung der zuständigen Stelle bei, falls diese vorliegt.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_12_vollstaendigeAnerkennung"
                        className="radio radio-primary"
                        checked={form.rbtn_12_vollstaendigeAnerkennung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_12_vollstaendigeAnerkennung: opt }))}
                      />
                      <span className="label-text whitespace-normal">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section D - Betriebliche Qualifizierungsmaßnahme */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Betriebliche Qualifizierungsmaßnahme
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">13 Handelt es sich um eine überwiegend betriebliche Qualifizierung im Rahmen des Anerkennungsverfahrens (mehr als die Hälfte der Qualifizierungsmaßnahme erfolgt im Rahmen einer Beschäftigung in einem Betrieb)? Bitte fügen Sie einen Weiterbildungsplan für die Qualifizierungsmaßnahme bei. Aus dem Weiterbildungsplan muss hervorgehen, in welcher Form, auf welche Art und Weise und/oder mit welchen Methoden die im Bescheid der zuständigen Stelle aufgelisteten Unterschiede ausgeglichen werden sollen.</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_13_betrieblicheQualifizierung"
                        className="radio radio-primary"
                        checked={form.rbtn_13_betrieblicheQualifizierung === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_13_betrieblicheQualifizierung: opt }))}
                      />
                      <span className="label-text whitespace-normal">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section E - Beschäftigung während Anerkennung */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Beschäftigung, die zusätzlich zu einer Qualifizierungsmaßnahme ausgeübt wird
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">14 Bitte machen Sie Angaben zur Beschäftigungsdauer.</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Die Beschaeftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G)", label: "Die Beschäftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G)." },
                    { value: "Die Beschaeftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschaeftigung waehrend des Anerkennungsverfahrens und der spaeteren Beschaeftigung nach Erlangung der vollstaendigen Anerkennung besteht ein berufsfachlicher Zusammenhang", label: "Die Beschäftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschäftigung während des Anerkennungsverfahrens und der späteren Beschäftigung nach Erlangung der vollständigen Anerkennung besteht ein berufsfachlicher Zusammenhang." },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_14_Betriebsdauer"
                        className="radio radio-primary"
                        checked={form.rbtn_14_Betriebsdauer === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_14_Betriebsdauer: opt.value }))}
                      />
                      <span className="label-text whitespace-normal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">Bitte geben Sie die Gründe des berufsfachlichen Zusammenhangs an:</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={form.txtf_14_Gruende_beruflicherZusammenhang}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_14_Gruende_beruflicherZusammenhang: e.target.value }))}
                />
              </div>
            </div>

            {/* Section F - Anerkennungspartnerschaft */}
            <div className="divider divider-start font-bold text-base-content/80">
              F. Beschäftigung während der Anerkennungspartnerschaft
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <label className="label cursor-pointer justify-start gap-2 items-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mt-1"
                    checked={form.chbx_15g_Zielberuf}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_15g_Zielberuf: e.target.checked }))}
                  />
                  <span className="label-text text-sm whitespace-normal">Während der Anerkennungspartnerschaft soll eine qualifizierte Beschäftigung ausgeübt werden (weiter mit Abschnitt G).</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2 items-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mt-1"
                    checked={form.chbx_15h_Zielberuf}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_15h_Zielberuf: e.target.checked }))}
                  />
                  <span className="label-text text-sm whitespace-normal">Während der Anerkennungspartnerschaft kann nur eine nicht qualifizierte Beschäftigung ausgeübt werden, da zur Ausübung der qualifizierten Beschäftigung eine Berufsausübungserlaubnis erforderlich wäre.</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">15 Bitte wählen Sie Zutreffendes aus und machen Sie Angaben zum Zielberuf:</span>
                </label>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_15a_Zielberuf}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_15a_Zielberuf: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Die Arbeitnehmerin/Der Arbeitnehmer hat sich in einer Vereinbarung mit mir als Arbeitgeber verpflichtet, spätestens unverzüglich nach der Einreise die Anerkennung ihrer/seiner im Ausland erworbenen Berufsqualifikation bei der zuständigen Anerkennungsstelle zu beantragen (bitte Nachweis beifügen).</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_15b_Zielberuf}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_15b_Zielberuf: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Ich als Arbeitgeber habe mich in einer Vereinbarung mit der Arbeitnehmerin/dem Arbeitnehmer verpflichtet, der Arbeitnehmerin/dem Arbeitnehmer die von der zuständigen Anerkennungsstelle gegebenenfalls geforderten Qualifizierungsmaßnahmen im Rahmen des Arbeitsverhältnisses zu ermöglichen (bitte Nachweis beifügen).</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_15c_Zielberuf}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_15c_Zielberuf: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Mir ist bekannt, dass die Arbeitnehmerin/der Arbeitnehmer das Anerkennungsverfahren so verfolgen sollte, dass der (Teil-)Anerkennungsbescheid der zuständigen Anerkennungsbehörde spätestens 12 Monate nach Einreise vorliegt.</span>
                  </label>
                </div>
              </div>

              <FormInput
                label="Der geplante Zielberuf nach erfolgreicher Anerkennung der Berufsqualifikation der Arbeitnehmerin/des Arbeitnehmers lautet:"
                value={form.txtf_15_geplanterZielberuf}
                onChange={(e) => setForm((p) => ({ ...p, txtf_15_geplanterZielberuf: e.target.value }))}
              />

              <div className="space-y-2">
                <label className="label cursor-pointer justify-start gap-2 items-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mt-1"
                    checked={form.chbx_15d_Zielberuf}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_15d_Zielberuf: e.target.checked }))}
                  />
                  <span className="label-text text-sm whitespace-normal">Ich als Arbeitgeber bin für eine Ausbildung oder Nachqualifizierung im geplanten Zielberuf geeignet (bitte Nachweise wie zum Beispiel Ausbildungsberechtigung, Meisterbetrieb, letzte in der Lehrlingsrolle eingetragene Ausbildungen des Betriebs oder bereits erfolgreiche Nachqualifizierungen im Rahmen eines Anerkennungsverfahrens beifügen).</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2 items-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mt-1"
                    checked={form.chbx_15e_Zielberuf}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_15e_Zielberuf: e.target.checked }))}
                  />
                  <span className="label-text text-sm whitespace-normal">Ich als Arbeitgeber bin eine Pflegeeinrichtung im Sinne des § 72 Sozialgesetzbuch XI (bitte Nachweis beifügen) (weiter mit Abschnitt G).</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2 items-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mt-1"
                    checked={form.chbx_15f_Zielberuf}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_15f_Zielberuf: e.target.checked }))}
                  />
                  <span className="label-text text-sm whitespace-normal">Ich als Arbeitgeber und die angebotenen Beschäftigungsbedingungen unterliegen kirchlichem Recht (bitte Nachweis beifügen).</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">16 Liegt bereits ein (Teil-)Anerkennungsbescheid vor?</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "ja - (bitte Nachweis beifuegen und auch Abschnitt C. ausfuellen)", label: "Ja (bitte Nachweis beifügen und auch Abschnitt C ausfüllen)" },
                    { value: "nein (weiter mit Abschnitt G.)", label: "Nein (weiter mit Abschnitt G)" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_16_Anerkennungsbescheid"
                        className="radio radio-primary"
                        checked={form.rbtn_16_Anerkennungsbescheid === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_16_Anerkennungsbescheid: opt.value }))}
                      />
                      <span className="label-text whitespace-normal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">17 Bitte wählen Sie Zutreffendes zur Nachqualifizierung aus:</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifuegen)", label: "Die durch die zuständige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen können nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifügen) oder" },
                    { value: "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifuegen)", label: "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifügen) oder" },
                    { value: "die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen weitgehend \nbetriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen", label: "die durch die zuständige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen können weitgehend betriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen:" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="rbtn_17_Nachqualifizierung"
                        className="radio radio-primary"
                        checked={form.rbtn_17_Nachqualifizierung === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_17_Nachqualifizierung: opt.value }))}
                      />
                      <span className="label-text whitespace-normal text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="von (TT.MM.JJJJ)"
                  type="date"
                  value={toInputDate(form.txtf_17_von)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_von: fromInputDate(e.target.value) }))}
                />
                <FormInput
                  label="bis (TT.MM.JJJJ)"
                  type="date"
                  value={toInputDate(form.txtf_17_bis)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_bis: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>

            {/* Section G - Sprachkenntnisse */}
            <div className="divider divider-start font-bold text-base-content/80">
              G. Sprachkenntnisse
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">18 Bitte machen Sie Angaben zu den Sprachkenntnissen der Arbeitnehmerin/des Arbeitnehmers.</span>
                </label>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_18_a}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_18_a: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Die Arbeitnehmerin/Der Arbeitnehmer verfügt über zertifizierte deutsche Sprachkenntnisse des Gemeinsamen Europäischen Referenzrahmens.</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_18_b}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_18_b: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Das Niveau ist nicht bekannt beziehungsweise es liegt kein Sprachzertifikat zu Deutschkenntnissen vor (weiter mit Abschnitt H).</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_18_c}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_18_c: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Die Arbeitnehmerin/Der Arbeitnehmer wird begleitend zu der Beschäftigung weitere deutsche Sprachkenntnisse erwerben.</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2 items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                      checked={form.chbx_18_d}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_18_d: e.target.checked }))}
                    />
                    <span className="label-text text-sm whitespace-normal">Die Qualifizierungsmaßnahme oder Tätigkeit kann mit den nachweislich vorhandenen deutschen Sprachkenntnissen ausgeübt werden.</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">Bitte erläutern Sie die Gründe (gegebenenfalls werden weitere Nachweise zur Glaubhaftmachung verlangt):</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-20"
                  value={form.txtf_18_Sprachkenntnisse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_18_Sprachkenntnisse: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium whitespace-normal">19 Bitte geben Sie das deutsche Sprachniveau an und fügen Sie einen entsprechenden Nachweis bei, falls vorhanden.</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                    <label key={level} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_19_Sprachniveau"
                        className="radio radio-primary radio-sm"
                        checked={form.rbtn_19_Sprachniveau === level}
                        onChange={() => setForm((p) => ({ ...p, rbtn_19_Sprachniveau: level }))}
                      />
                      <span className="label-text whitespace-normal">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section H - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              H. Erklärung und Unterschrift
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="20 Ort"
                  value={form.txtf_20_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_20_Ort: e.target.value }))}
                />
                <FormInput
                  label="21 Datum"
                  type="date"
                  value={toInputDate(form.txtf_21_Datum)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_21_Datum: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
