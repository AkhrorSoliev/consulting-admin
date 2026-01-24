import { useState, useEffect } from "react";
import { FaDownload, FaInfoCircle, FaSave, FaTrash } from "react-icons/fa";
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

export default function ZusatzblattC() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);
  const { role } = useUserRole();
  const canManageDefaults = role === "super_admin" || role === "admin";

  const [form, setForm] = useState({
    // Section A - Angaben zur Person
    txtf_1_vorname: "",
    txtf_2_name: "",
    txtf_3_wohnsitz: "",

    // Section B - Fahrerlaubnis
    rbtn_4_fahrerlaubnis: "",
    rbtn_5_fahrerlaubnis_ausgestellt: "",
    rbtn_6_fahrerlaubnis_schluesselzahl: "",
    rbtn_7_fahrerlaubnis_erworben: "",
    rbtn_8_fahrerlaubnis_drittstaat: "",
    rbtn_9_fahrerlaubnis_erteilt: "",

    // Section C - Grundqualifikation
    rbtn_10_fahrerqualifizierungsnachweis: "",
    rbtn_11_fuehrerschein: "",
    rbtn_12_fahrerbescheinigung: "",
    txtf_13_grundqualifikationsstaat: "",
    rbtn_14_grundqualifiziert: "",

    // Section D - Erwerb Fahrerlaubnis
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

    // Section - Sprachkurs
    chbx_erwerb_fahrerlaubnis_2: false,
    txtf_21_erwerb_sprachkurs_wochen: "",
    txtf_21_erwerb_sprachkurs_monat: "",
    txtf_22_erwerb_sprachkurs_wochenstunden: "",
    txtf_23_erwerb_sprachkurs_freigestellt: "",

    // Section - Zeitlicher Ablauf
    rbtn_24_zeitlicher_ablauf: "",
    chbx_erwerb_fahrerlaubnis_3: false,
    txtf_25_erwerb_begruendung: "",

    // Section E - Unterschrift
    txtf_26_erklarung_ort: "",
    txtf_27_erklarung_datum: todayDdMmYyyy(),
  });

  useEffect(() => {
    getFillablePdfDefaults("zusatzblatt_c")
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
      await saveFillablePdfDefaults("zusatzblatt_c", form);
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
      await clearFillablePdfDefaults("zusatzblatt_c");
      setHasDefaults(false);
      // Reset form to initial empty values
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => {
          if (key.startsWith("chbx_")) {
            reset[key] = false;
          } else if (key === "txtf_27_erklarung_datum") {
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
          // This field is named rbtn_ but is actually a text field in the PDF
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
              <li className="opacity-70">Zusatzblatt C</li>
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
                Zusatzblatt C - Berufskraftfahrer
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Zusatzblatt für Beschäftigung als Berufskraftfahrerin/Berufskraftfahrer
              </p>
            </div>

            {/* Section A - Angaben zur Arbeitnehmerin/zum Arbeitnehmer */}
            <div className="divider divider-start font-bold text-base-content/80">
              A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="1 Vorname"
                  value={form.txtf_1_vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_1_vorname: e.target.value }))}
                />
                <FormInput
                  label="2 Nachname"
                  value={form.txtf_2_name}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_2_name: e.target.value }))}
                />
              </div>
              <FormInput
                label="3 derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort"
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
                    4 Ist der/die Arbeitnehmer/in im Besitz der für die jeweilige Beschäftigung als Berufskraftfahrer/in im Güterkraftverkehr oder Personenverkehr mit Kraftomnibussen erforderlichen EU- oder EWR-Fahrerlaubnis der Klassen C1, C1E, C, CE, D1, D1E, D oder DE?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_4_fahrerlaubnis"
                      className="radio radio-primary"
                      checked={form.rbtn_4_fahrerlaubnis === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_4_fahrerlaubnis: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_4_fahrerlaubnis"
                      className="radio radio-primary"
                      checked={form.rbtn_4_fahrerlaubnis === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_4_fahrerlaubnis: "nein" }))}
                    />
                    <span className="label-text">Nein (weiter mit Ziffer 8)</span>
                  </label>
                </div>
              </div>

              <FormInput
                label="5 Wenn ja, bitte Staat angeben, in dem die EU- oder EWR-Fahrerlaubnis ausgestellt wurde."
                value={form.rbtn_5_fahrerlaubnis_ausgestellt}
                onChange={(e) => setForm((p) => ({ ...p, rbtn_5_fahrerlaubnis_ausgestellt: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    6 Ist die EU- oder EWR-Fahrerlaubnis mit der Schlüsselzahl 70 versehen?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_6_fahrerlaubnis_schluesselzahl"
                      className="radio radio-primary"
                      checked={form.rbtn_6_fahrerlaubnis_schluesselzahl === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_6_fahrerlaubnis_schluesselzahl: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_6_fahrerlaubnis_schluesselzahl"
                      className="radio radio-primary"
                      checked={form.rbtn_6_fahrerlaubnis_schluesselzahl === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_6_fahrerlaubnis_schluesselzahl: "nein" }))}
                    />
                    <span className="label-text">Nein (weiter mit Abschnitt C)</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    7 Wenn ja, ist der Drittstaat, in dem die Fahrerlaubnis erstmalig erworben wurde, in Anlage 11 der Fahrerlaubnisverordnung – <a href="https://www.gesetze-im-internet.de/fev_2010/anlage_11.html" target="_blank" rel="noopener noreferrer" className="link link-primary break-all">Anlage 11 FeV</a> – aufgeführt <strong>und</strong> kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_7_fahrerlaubnis_erworben"
                      className="radio radio-primary"
                      checked={form.rbtn_7_fahrerlaubnis_erworben === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_7_fahrerlaubnis_erworben: "ja" }))}
                    />
                    <span className="label-text">Ja (weiter mit Abschnitt C)</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_7_fahrerlaubnis_erworben"
                      className="radio radio-primary"
                      checked={form.rbtn_7_fahrerlaubnis_erworben === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_7_fahrerlaubnis_erworben: "nein" }))}
                    />
                    <span className="label-text">Nein (weiter mit Abschnitt C)</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    8 Ist der/die Arbeitnehmer/in im Besitz einer Fahrerlaubnis für den Güterverkehr oder für den Personenverkehr mit Kraftomnibussen aus einem Drittstaat?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_8_fahrerlaubnis_drittstaat"
                      className="radio radio-primary"
                      checked={form.rbtn_8_fahrerlaubnis_drittstaat === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_8_fahrerlaubnis_drittstaat: "ja" }))}
                    />
                    <span className="label-text">Ja (bitte Nachweis beifügen)</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_8_fahrerlaubnis_drittstaat"
                      className="radio radio-primary"
                      checked={form.rbtn_8_fahrerlaubnis_drittstaat === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_8_fahrerlaubnis_drittstaat: "nein" }))}
                    />
                    <span className="label-text">Nein</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    9 Wenn ja, wurde die Fahrerlaubnis von einem in Anlage 11 der Fahrerlaubnisverordnung – <a href="https://www.gesetze-im-internet.de/fev_2010/anlage_11.html" target="_blank" rel="noopener noreferrer" className="link link-primary break-all">Anlage 11 FeV</a> – aufgeführten Staaten erteilt <strong>und</strong> kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_9_fahrerlaubnis_erteilt"
                      className="radio radio-primary"
                      checked={form.rbtn_9_fahrerlaubnis_erteilt === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_9_fahrerlaubnis_erteilt: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_9_fahrerlaubnis_erteilt"
                      className="radio radio-primary"
                      checked={form.rbtn_9_fahrerlaubnis_erteilt === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_9_fahrerlaubnis_erteilt: "nein" }))}
                    />
                    <span className="label-text">Nein</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section C - Angaben zur Grundqualifikation oder beschleunigten Grundqualifikation */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zur Grundqualifikation oder beschleunigten Grundqualifikation
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    10 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch einen Fahrerqualifizierungsnachweis aus einem EU-Mitgliedstaat oder EWR-Vertragsstaat oder der Schweiz (§ 7 Absatz 2 Nummer 1 Berufskraftfahrerqualifikationsgesetz – BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__7.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 7 BKrFQG</a>)?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_10_fahrerqualifizierungsnachweis"
                      className="radio radio-primary"
                      checked={form.rbtn_10_fahrerqualifizierungsnachweis === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_10_fahrerqualifizierungsnachweis: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_10_fahrerqualifizierungsnachweis"
                      className="radio radio-primary"
                      checked={form.rbtn_10_fahrerqualifizierungsnachweis === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_10_fahrerqualifizierungsnachweis: "nein" }))}
                    />
                    <span className="label-text">Nein</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    11 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch einen Führerschein aus einem EU-Mitgliedstaat oder EWR-Vertragsstaat oder der Schweiz, in den die Schlüsselzahl 95 eingetragen ist (§ 7 Absatz 2 Nummer 2 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__7.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 7 BKrFQG</a>)?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_11_fuehrerschein"
                      className="radio radio-primary"
                      checked={form.rbtn_11_fuehrerschein === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_11_fuehrerschein: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_11_fuehrerschein"
                      className="radio radio-primary"
                      checked={form.rbtn_11_fuehrerschein === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_11_fuehrerschein: "nein" }))}
                    />
                    <span className="label-text">Nein</span>
                  </label>
                </div>
              </div>

              <p className="text-sm opacity-70">oder</p>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    12 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch eine Fahrerbescheinigung nach Artikel 5 Absatz 1 der Verordnung (EG) Nummer 1072/2009 (§ 7 Absatz 3 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__7.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 7 BKrFQG</a>)?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_12_fahrerbescheinigung"
                      className="radio radio-primary"
                      checked={form.rbtn_12_fahrerbescheinigung === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_12_fahrerbescheinigung: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_12_fahrerbescheinigung"
                      className="radio radio-primary"
                      checked={form.rbtn_12_fahrerbescheinigung === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_12_fahrerbescheinigung: "nein" }))}
                    />
                    <span className="label-text">Nein</span>
                  </label>
                </div>
              </div>

              <FormInput
                label='13 Nur zu beantworten, wenn Ziffer 10, 11 oder 12 mit "Ja" beantwortet wurde: Bitte Staat angeben, in dem die Grundqualifikation oder beschleunigte Grundqualifikation erworben wurde.'
                value={form.txtf_13_grundqualifikationsstaat}
                onChange={(e) => setForm((p) => ({ ...p, txtf_13_grundqualifikationsstaat: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    14 Falls keiner der unter Ziffer 10 bis 12 genannten Nachweise vorgelegt werden kann: Gilt der Bewerber durch die Besitzstandsregelung des § 4 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 4 BKrFQG</a> – als grundqualifiziert?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_14_grundqualifiziert"
                      className="radio radio-primary"
                      checked={form.rbtn_14_grundqualifiziert === "ja"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_14_grundqualifiziert: "ja" }))}
                    />
                    <span className="label-text">Ja</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_14_grundqualifiziert"
                      className="radio radio-primary"
                      checked={form.rbtn_14_grundqualifiziert === "nein"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_14_grundqualifiziert: "nein" }))}
                    />
                    <span className="label-text">Nein</span>
                  </label>
                </div>
              </div>

              {/* Hinweis Box */}
              <div className="alert alert-info">
                <FaInfoCircle className="text-lg" />
                <div className="text-sm">
                  <strong>Hinweis</strong> Für die Besitzstandsregelung ist eine Weiterbildung von 35 Stunden erforderlich, wenn sie nicht bereits in den letzten fünf Jahren während einer früheren Beschäftigung in einem EU-/EWR-Staat oder der Schweiz absolviert wurde (§ 4 Satz 2 in Verbindung mit § 5 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 4 BKrFQG</a> und <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__5.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 5 BKrFQG</a>). Eine Arbeitsgenehmigung für den Staat, in dem die Weiterbildung absolviert wurde, ist alternativ zur Beschäftigung zulässig.
                </div>
              </div>
            </div>

            {/* Section D - Erwerb von deutscher Fahrerlaubnis und/oder Grundqualifikation */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Erwerb von deutscher Fahrerlaubnis und/oder Grundqualifikation oder beschleunigter Grundqualifikation
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_erwerb_fahrerlaubnis_1}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_erwerb_fahrerlaubnis_1: e.target.checked }))}
                />
                <span className="label-text text-sm break-words whitespace-normal">
                  Die Teilnahme an dem/den Kurs(en) beziehungsweise Prüfungen zum Erwerb der deutschen Fahrerlaubnis und/oder der Grundqualifikation oder beschleunigten Grundqualifikation und/oder bei Besitzstand nach § 4 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary break-all">Link</a> – der Weiterbildung ist erforderlich und geplant.
                </span>
              </label>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    15 Die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis ist für folgenden Zeitraum ab Beschäftigungsaufnahme geplant:
                  </span>
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <FormInput
                    label="Wochen"
                    value={form.txtf_15_erwerb_kurs_wochen}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_15_erwerb_kurs_wochen: e.target.value }))}
                    className="w-24"
                  />
                  <span className="text-sm">oder Monate</span>
                  <FormInput
                    label="Monate"
                    value={form.txtf_15_erwerb_kurs_monat}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_15_erwerb_kurs_monat: e.target.value }))}
                    className="w-24"
                  />
                </div>
              </div>

              <FormInput
                label="16 Wie viele Wochenstunden wird die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis in Anspruch nehmen?"
                value={form.txtf_16_erwerb_kurs_wochenstunden}
                onChange={(e) => setForm((p) => ({ ...p, txtf_16_erwerb_kurs_wochenstunden: e.target.value }))}
              />

              <FormInput
                label="17 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis freigestellt?"
                value={form.txtf_17_erwerb_kurs_freigestellt}
                onChange={(e) => setForm((p) => ({ ...p, txtf_17_erwerb_kurs_freigestellt: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    18 Die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 4 BKrFQG</a> – der Weiterbildung ist für folgenden Zeitraum ab Beschäftigungsaufnahme geplant:
                  </span>
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <FormInput
                    label="Wochen"
                    value={form.txtf_18_beschaeftigungsaufnahme_kurs_wochen}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_18_beschaeftigungsaufnahme_kurs_wochen: e.target.value }))}
                    className="w-24"
                  />
                  <span className="text-sm">oder Monate</span>
                  <FormInput
                    label="Monate"
                    value={form.txtf_18_beschaeftigungsaufnahme_kurs_monat}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_18_beschaeftigungsaufnahme_kurs_monat: e.target.value }))}
                    className="w-24"
                  />
                </div>
              </div>

              <FormInput
                label="19 Wie viele Wochenstunden wird die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – der Weiterbildung in Anspruch nehmen?"
                value={form.txtf_19_weiterbildung_kurs_wochenstunden}
                onChange={(e) => setForm((p) => ({ ...p, txtf_19_weiterbildung_kurs_wochenstunden: e.target.value }))}
              />

              <FormInput
                label="20 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – der Weiterbildung freigestellt?"
                value={form.txtf_20_weiterbildung_kurs_freigestellt}
                onChange={(e) => setForm((p) => ({ ...p, txtf_20_weiterbildung_kurs_freigestellt: e.target.value }))}
              />

              {/* Sprachkurs Section */}
              <label className="label cursor-pointer justify-start gap-3 mt-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_erwerb_fahrerlaubnis_2}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_erwerb_fahrerlaubnis_2: e.target.checked }))}
                />
                <span className="label-text text-sm whitespace-normal">
                  Für die oben aufgeführte Kurs- beziehungsweise Prüfungsteilnahme ist der Besuch eines Sprachkurses in Deutschland erforderlich und geplant.
                </span>
              </label>

              {/* Hinweis Box */}
              <div className="alert alert-info">
                <FaInfoCircle className="text-lg" />
                <div className="text-sm">
                  <strong>Hinweis</strong> Die Prüfungsfragen zum Erwerb der beschleunigten Grundqualifikation in Deutsch sind an das Sprachniveau B1 angelehnt.
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    21 Die Teilnahme am Sprachkurs ist für folgenden Zeitraum ab Beschäftigungsaufnahme geplant:
                  </span>
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <FormInput
                    label="Wochen"
                    value={form.txtf_21_erwerb_sprachkurs_wochen}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_21_erwerb_sprachkurs_wochen: e.target.value }))}
                    className="w-24"
                  />
                  <span className="text-sm">oder Monate</span>
                  <FormInput
                    label="Monate"
                    value={form.txtf_21_erwerb_sprachkurs_monat}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_21_erwerb_sprachkurs_monat: e.target.value }))}
                    className="w-24"
                  />
                </div>
              </div>

              <FormInput
                label="22 Wie viele Wochenstunden wird die Teilnahme am Sprachkurs in Anspruch nehmen?"
                value={form.txtf_22_erwerb_sprachkurs_wochenstunden}
                onChange={(e) => setForm((p) => ({ ...p, txtf_22_erwerb_sprachkurs_wochenstunden: e.target.value }))}
              />

              <FormInput
                label="23 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Teilnahme am Sprachkurs freigestellt?"
                value={form.txtf_23_erwerb_sprachkurs_freigestellt}
                onChange={(e) => setForm((p) => ({ ...p, txtf_23_erwerb_sprachkurs_freigestellt: e.target.value }))}
              />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-sm break-words whitespace-normal">
                    24 Erfolgt der Beginn der angegebenen Kurs- beziehungsweise Prüfungsteilnahmen zum Erwerb der deutschen Fahrerlaubnis und/oder der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG – <a href="https://www.gesetze-im-internet.de/bkrfqg_2020/__4.html" target="_blank" rel="noopener noreferrer" className="link link-primary">§ 4 BKrFQG</a> – der Weiterbildung und/oder des angestrebten Sprachniveaus parallel oder aufeinanderfolgend?
                  </span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_24_zeitlicher_ablauf"
                      className="radio radio-primary"
                      checked={form.rbtn_24_zeitlicher_ablauf === "parallel"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_24_zeitlicher_ablauf: "parallel" }))}
                    />
                    <span className="label-text">parallel</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="rbtn_24_zeitlicher_ablauf"
                      className="radio radio-primary"
                      checked={form.rbtn_24_zeitlicher_ablauf === "aufeinanderfolgend"}
                      onChange={() => setForm((p) => ({ ...p, rbtn_24_zeitlicher_ablauf: "aufeinanderfolgend" }))}
                    />
                    <span className="label-text">aufeinanderfolgend (nach Abschluss eines Kurses beginnt der nächste)</span>
                  </label>
                </div>
              </div>

              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_erwerb_fahrerlaubnis_3}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_erwerb_fahrerlaubnis_3: e.target.checked }))}
                />
                <span className="label-text text-sm">
                  Keine der genannten Konstellationen trifft zu.
                </span>
              </label>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">25 Begründung</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-32"
                  value={form.txtf_25_erwerb_begruendung}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_25_erwerb_begruendung: e.target.value }))}
                />
              </div>
            </div>

            {/* Section E - Erklärung und Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Erklärung und Unterschrift
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <p className="text-sm opacity-70">
                Die Richtigkeit der Angaben wird durch Datum und Unterschrift bestätigt. Der Arbeitsvertrag verpflichtet zur Teilnahme an Maßnahmen zur Erlangung der oben genannten Weiterbildungen und Qualifikationen.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="26 Ort"
                  value={form.txtf_26_erklarung_ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_26_erklarung_ort: e.target.value }))}
                />
                <FormInput
                  label="27 Datum"
                  type="date"
                  value={toInputDate(form.txtf_27_erklarung_datum)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_27_erklarung_datum: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
