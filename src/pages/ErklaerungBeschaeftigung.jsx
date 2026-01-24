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

export default function ErklaerungBeschaeftigung() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);
  const { role } = useUserRole();
  const canManageDefaults = role === "super_admin" || role === "admin";

  // Form state matching EXACT PDF field names from analyze output
  const [form, setForm] = useState({
    // Section A - Erklärung
    rbtn_1_Erklaerung: "",
    rbtn_2_Anlass: "",

    // Section B - Angaben zur Arbeitnehmerin/zum Arbeitnehmer
    txtf_3_Vorname: "",
    txtf_4_Nachname: "",
    txtf_5_Geburtsdatum: "",
    rbtn_6_Geschlecht: "",
    txtf_7_Staatsangehoerigkeit: "",
    txtf_8_Wohnsitz: "",
    txtf_9_seit: "",

    // Section C - Angaben zum Arbeitgeber
    txtf_10_Firma: "",
    txtf_11_Strasse: "",
    txtf_12_Hausnummer: "",
    txtf_13_Postleitzahl: "",
    txtf_14_Ort: "",
    txtf_15_Kontaktperson: "",
    txtf_16_Telefon: "",
    "txtf_17_E-Mail": "",
    txtf_18_Telefax: "",
    txtf_19_Betriebsnummer: "",
    rbtn_20_Unternehmen_gegruendet: "",

    // Section D - Beschäftigungsverhältnis
    txtf_21_Beschaeftigungsverhaeltniss: "",
    rbtn_22_Beschaeftigungsverhaeltniss: "",
    txtf_22_Beschaeftigungsverhaeltniss: "",
    rbtn_23_Dritte: "",
    rbtn_24_Arbeitsort: "",
    txtf_24_Arbeitsort_Adresse: "",

    // Section E - Qualifikation
    txtf_25_Berufsbezeichnung: "",
    txtf_26_Studiengang: "",
    txtf_27_Hochschulabschluss: "",
    rbtn_28_Abschluss_Ausland: "",
    txtf_29_Anerkennungsnachweis: "",
    txtf_30_Bezeichnung_Berufsausbildung: "",
    txtf_31_Berufsausbildung_erworben: "",
    rbtn_32_Ausbildung_Ausland: "",
    txtf_33_Anerkennungsnachweis: "",
    chbx_34_keine_Ausbildung: false,
    txtf_34_Qualifikationen: "",
    rbtn_35_Berufsausuebungserlaubnis: "",
    txtf_36_erforderliche_Qualifikation: "",

    // Section G - Arbeitszeit
    rbtn_37_Arbeitszeit: "",
    txtf_37_Arbeitsstunden_Woche: "",
    rbtn_38_Ueberstunden: "",
    txtf_39_Ueberstundenumpfang: "",
    txtf_40_Ueberstundenausgleich: "",

    // Section I - Urlaub
    txtf_41_Urlaubsanpruch: "",

    // Section J - Entgelt
    rbtn_42_Arbeitgeber_tarifgebunden: "",
    rbtn_43_tarifliche_Arbeitsbedingungen: "",
    txtf_44_Tarifvertrag: "",
    txtf_45_Entgeltgruppe: "",
    chbx_46_Arbeitsentgelt: false,
    txtf_46_Entgelt_pro_Stunde: "",
    txtf_46_Entgelt_pro_Monat: "",
    chbx_47_zusaetzlich_geldwerte_Leistungen: false,
    txtf_48_Art_geldwerten_Leistung: "",
    txtf_49_Hoehe_geldwerten_Leistung: "",
    chbx_47_sonstige_Berechnung: false,
    txtf_50_Art_variablen_Verguetung: "",
    txtf_51_Hoehe_variable_Verguetung: "",

    // Section K - Sozialversicherung
    rbtn_52_besteht_Versicherungspflicht: "",
    txtf_53_Begruendung_Versicherungspflicht: "",
    rbtn_54_Sozialversicherungspflicht_nicht: "",
    txtf_55_Form_Nachweiss: "",

    // Section L - Ergänzungen
    txtf_56_Ergaemzungen: "",

    // Section M - Unterschrift
    txtf_57_Ort: "",
    txtf_58_Datum: todayDdMmYyyy(),

    // Zusatzblatt checkboxes
    chbx_zuE_1v4: false,
    chbx_zuE_2v4: false,
    chbx_zuE_3v4: false,
    chbx_zuE_4v4: false,
  });

  useEffect(() => {
    getFillablePdfDefaults("erklaerung_beschaeftigung")
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
      await saveFillablePdfDefaults("erklaerung_beschaeftigung", form);
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
      await clearFillablePdfDefaults("erklaerung_beschaeftigung");
      setHasDefaults(false);
      // Reset form to initial empty values
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => {
          if (key.startsWith("chbx_")) {
            reset[key] = false;
          } else if (key === "txtf_58_Datum") {
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
        template: "erklaerung-zum-beschaeftigungsverhaeltnis.pdf",
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
      link.download = `Erklaerung_Beschaeftigung_${form.txtf_4_Nachname || "Dokument"}.pdf`;
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

  const formCard =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto";

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
              <li className="opacity-70">Erklärung zum Beschäftigungsverhältnis</li>
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
                Erklärung zum Beschäftigungsverhältnis
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Fillable PDF formasi. Ma'lumotlarni to'ldiring va PDF yuklab oling.
              </p>
            </div>

            {/* Section A - Erklärung */}
            <div className="divider divider-start font-bold text-base-content/80">
              A. Erklärung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Art der Erklärung</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={form.rbtn_1_Erklaerung}
                  onChange={(e) => setForm((p) => ({ ...p, rbtn_1_Erklaerung: e.target.value }))}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="zur Erteilung eines Aufenthaltstitels zum Zweck der Beschaeftigung">
                    zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung
                  </option>
                  <option value="zur Zustimmung der Aufnahme einer Beschaeftigung von Personen mit Duldung oder Aufenthaltsgestattung">
                    zur Zustimmung der Aufnahme einer Beschäftigung von Personen mit Duldung oder Aufenthaltsgestattung
                  </option>
                  <option value="zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschaeftigung nicht erlaubt">
                    zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschäftigung nicht erlaubt
                  </option>
                  <option value="zur Erteilung einer Vorabzustimmung der Bundesagentur fuer Arbeit">
                    zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit
                  </option>
                  <option value="zur Erteilung einer Arbeitserlaubnis der Bundesagentur fuer Arbeit">
                    zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit
                  </option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Anlass</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {["Ersterteilung", "Verlaengerung", "Arbeitgeberwechsel"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_2_Anlass"
                        className="radio radio-primary"
                        checked={form.rbtn_2_Anlass === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_2_Anlass: opt }))}
                      />
                      <span className="label-text">{opt === "Verlaengerung" ? "Verlängerung" : opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section B - Angaben zur Arbeitnehmerin/zum Arbeitnehmer */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zur Arbeitnehmerin/zum Arbeitnehmer
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="3. Vorname(n)"
                  value={form.txtf_3_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_3_Vorname: e.target.value }))}
                />
                <FormInput
                  label="4. Nachname"
                  value={form.txtf_4_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_4_Nachname: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="5. Geburtsdatum (TT.MM.JJJJ)"
                  type="date"
                  value={toInputDate(form.txtf_5_Geburtsdatum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_5_Geburtsdatum: fromInputDate(e.target.value) }))
                  }
                />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">6. Geschlecht</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["maennlich", "weiblich", "divers"].map((opt) => (
                      <label key={opt} className="label cursor-pointer gap-2">
                        <input
                          type="radio"
                          name="rbtn_6_Geschlecht"
                          className="radio radio-primary radio-sm"
                          checked={form.rbtn_6_Geschlecht === opt}
                          onChange={() => setForm((p) => ({ ...p, rbtn_6_Geschlecht: opt }))}
                        />
                        <span className="label-text text-sm">
                          {opt === "maennlich" ? "männlich" : opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <FormInput
                label="7. Staatsangehörigkeit"
                value={form.txtf_7_Staatsangehoerigkeit}
                onChange={(e) => setForm((p) => ({ ...p, txtf_7_Staatsangehoerigkeit: e.target.value }))}
              />

              <FormInput
                label="8. Derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort"
                value={form.txtf_8_Wohnsitz}
                onChange={(e) => setForm((p) => ({ ...p, txtf_8_Wohnsitz: e.target.value }))}
              />

              <FormInput
                label="9. Seit wann besteht der Wohnsitz? (TT.MM.JJJJ)"
                type="date"
                value={toInputDate(form.txtf_9_seit)}
                onChange={(e) =>
                  setForm((p) => ({ ...p, txtf_9_seit: fromInputDate(e.target.value) }))
                }
              />
            </div>

            {/* Section C - Angaben zum Arbeitgeber */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zum Arbeitgeber
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="10. Firma/Name"
                value={form.txtf_10_Firma}
                onChange={(e) => setForm((p) => ({ ...p, txtf_10_Firma: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="11. Straße"
                  value={form.txtf_11_Strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_11_Strasse: e.target.value }))}
                />
                <FormInput
                  label="12. Hausnummer"
                  value={form.txtf_12_Hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_12_Hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="13. Postleitzahl"
                  value={form.txtf_13_Postleitzahl}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_13_Postleitzahl: e.target.value }))}
                />
                <FormInput
                  label="14. Ort"
                  value={form.txtf_14_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_14_Ort: e.target.value }))}
                />
              </div>
              <FormInput
                label="15. Kontaktperson"
                value={form.txtf_15_Kontaktperson}
                onChange={(e) => setForm((p) => ({ ...p, txtf_15_Kontaktperson: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormInput
                  label="16. Telefon"
                  value={form.txtf_16_Telefon}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_16_Telefon: e.target.value }))}
                />
                <FormInput
                  label="17. E-Mail"
                  type="email"
                  value={form["txtf_17_E-Mail"]}
                  onChange={(e) => setForm((p) => ({ ...p, "txtf_17_E-Mail": e.target.value }))}
                />
                <FormInput
                  label="18. Telefax"
                  value={form.txtf_18_Telefax}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_18_Telefax: e.target.value }))}
                />
              </div>
              <FormInput
                label="19. Betriebsnummer"
                value={form.txtf_19_Betriebsnummer}
                onChange={(e) => setForm((p) => ({ ...p, txtf_19_Betriebsnummer: e.target.value }))}
              />
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">20. Wurde das Unternehmen in den letzten 5 Jahren gegründet?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_20_Unternehmen_gegruendet"
                        className="radio radio-primary"
                        checked={form.rbtn_20_Unternehmen_gegruendet === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_20_Unternehmen_gegruendet: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section D - Beschäftigungsverhältnis */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Angaben zur Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="21. Beginn der Beschäftigung (TT.MM.JJJJ)"
                type="date"
                value={toInputDate(form.txtf_21_Beschaeftigungsverhaeltniss)}
                onChange={(e) =>
                  setForm((p) => ({ ...p, txtf_21_Beschaeftigungsverhaeltniss: fromInputDate(e.target.value) }))
                }
              />
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">22. Beschäftigungsverhältnis</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {["unbefristet", "befristet"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_22_Beschaeftigungsverhaeltniss"
                        className="radio radio-primary"
                        checked={form.rbtn_22_Beschaeftigungsverhaeltniss === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_22_Beschaeftigungsverhaeltniss: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.rbtn_22_Beschaeftigungsverhaeltniss === "befristet" && (
                <FormInput
                  label="Befristung bis (TT.MM.JJJJ)"
                  type="date"
                  value={toInputDate(form.txtf_22_Beschaeftigungsverhaeltniss)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_22_Beschaeftigungsverhaeltniss: fromInputDate(e.target.value) }))
                  }
                />
              )}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">23. Beschäftigung bei Dritten?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_23_Dritte"
                        className="radio radio-primary"
                        checked={form.rbtn_23_Dritte === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_23_Dritte: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">24. Arbeitsort</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={form.rbtn_24_Arbeitsort}
                  onChange={(e) => setForm((p) => ({ ...p, rbtn_24_Arbeitsort: e.target.value }))}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="Arbeitsort entspricht dem Arbeitgeber-Sitz">
                    Arbeitsort entspricht dem Arbeitgeber-Sitz
                  </option>
                  <option value="Arbeitnehmerin oder Arbeitnehmer wird an wechselnden Arbeits-/Einsatzorten beschaeftigt">
                    Wechselnde Arbeits-/Einsatzorte
                  </option>
                  <option value="Der Arbeitsort befindet sich unter folgender Adresse">
                    Andere Adresse
                  </option>
                </select>
              </div>
              {form.rbtn_24_Arbeitsort === "Der Arbeitsort befindet sich unter folgender Adresse" && (
                <FormInput
                  label="Arbeitsort Adresse"
                  value={form.txtf_24_Arbeitsort_Adresse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_24_Arbeitsort_Adresse: e.target.value }))}
                />
              )}
            </div>

            {/* Section E/F - Qualifikation */}
            <div className="divider divider-start font-bold text-base-content/80">
              E/F. Angaben zur Qualifikation
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="25. Berufsbezeichnung der Tätigkeit"
                value={form.txtf_25_Berufsbezeichnung}
                onChange={(e) => setForm((p) => ({ ...p, txtf_25_Berufsbezeichnung: e.target.value }))}
              />
              <FormInput
                label="26. Studiengang"
                value={form.txtf_26_Studiengang}
                onChange={(e) => setForm((p) => ({ ...p, txtf_26_Studiengang: e.target.value }))}
              />
              <FormInput
                label="27. Hochschulabschluss"
                value={form.txtf_27_Hochschulabschluss}
                onChange={(e) => setForm((p) => ({ ...p, txtf_27_Hochschulabschluss: e.target.value }))}
              />
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">28. Abschluss im Ausland erworben?</span>
                </label>
                <div className="flex gap-4">
                  {["ja - bitte Nachweis vorlegen", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_28_Abschluss_Ausland"
                        className="radio radio-primary"
                        checked={form.rbtn_28_Abschluss_Ausland === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_28_Abschluss_Ausland: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FormInput
                label="29. Anerkennungsnachweis"
                value={form.txtf_29_Anerkennungsnachweis}
                onChange={(e) => setForm((p) => ({ ...p, txtf_29_Anerkennungsnachweis: e.target.value }))}
              />
              <FormInput
                label="30. Bezeichnung der Berufsausbildung"
                value={form.txtf_30_Bezeichnung_Berufsausbildung}
                onChange={(e) => setForm((p) => ({ ...p, txtf_30_Bezeichnung_Berufsausbildung: e.target.value }))}
              />
              <FormInput
                label="31. Berufsausbildung erworben in"
                value={form.txtf_31_Berufsausbildung_erworben}
                onChange={(e) => setForm((p) => ({ ...p, txtf_31_Berufsausbildung_erworben: e.target.value }))}
              />
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">32. Ausbildung im Ausland?</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {["ja - bitte Nachweis vorlegen", "nein", "teilweise - bitte Nachweis vorlegen"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_32_Ausbildung_Ausland"
                        className="radio radio-primary"
                        checked={form.rbtn_32_Ausbildung_Ausland === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_32_Ausbildung_Ausland: opt }))}
                      />
                      <span className="label-text text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FormInput
                label="33. Anerkennungsnachweis"
                value={form.txtf_33_Anerkennungsnachweis}
                onChange={(e) => setForm((p) => ({ ...p, txtf_33_Anerkennungsnachweis: e.target.value }))}
              />
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_34_keine_Ausbildung}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_34_keine_Ausbildung: e.target.checked }))}
                />
                <span className="label-text">34. Keine formale Ausbildung</span>
              </label>
              <FormInput
                label="34. Sonstige Qualifikationen"
                value={form.txtf_34_Qualifikationen}
                onChange={(e) => setForm((p) => ({ ...p, txtf_34_Qualifikationen: e.target.value }))}
              />
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">35. Berufsausübungserlaubnis erforderlich?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein - weiter mit Abschnitt G."].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_35_Berufsausuebungserlaubnis"
                        className="radio radio-primary"
                        checked={form.rbtn_35_Berufsausuebungserlaubnis === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_35_Berufsausuebungserlaubnis: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FormInput
                label="36. Erforderliche Qualifikation"
                value={form.txtf_36_erforderliche_Qualifikation}
                onChange={(e) => setForm((p) => ({ ...p, txtf_36_erforderliche_Qualifikation: e.target.value }))}
              />
            </div>

            {/* Section G/H - Arbeitszeit */}
            <div className="divider divider-start font-bold text-base-content/80">
              G/H. Arbeitszeit
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">37. Arbeitszeit</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {["Vollzeit", "Teilzeit", "Geringfuegige Beschaeftigung"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_37_Arbeitszeit"
                        className="radio radio-primary"
                        checked={form.rbtn_37_Arbeitszeit === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_37_Arbeitszeit: opt }))}
                      />
                      <span className="label-text">
                        {opt === "Geringfuegige Beschaeftigung" ? "Geringfügige Beschäftigung" : opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <FormInput
                label="Arbeitsstunden pro Woche"
                value={form.txtf_37_Arbeitsstunden_Woche}
                onChange={(e) => setForm((p) => ({ ...p, txtf_37_Arbeitsstunden_Woche: e.target.value }))}
              />
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">38. Überstunden vorgesehen?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein - weiter mit Abschnitt I."].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_38_Ueberstunden"
                        className="radio radio-primary"
                        checked={form.rbtn_38_Ueberstunden === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_38_Ueberstunden: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.rbtn_38_Ueberstunden === "ja" && (
                <>
                  <FormInput
                    label="39. Überstundenumfang"
                    value={form.txtf_39_Ueberstundenumpfang}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_39_Ueberstundenumpfang: e.target.value }))}
                  />
                  <FormInput
                    label="40. Überstundenausgleich"
                    value={form.txtf_40_Ueberstundenausgleich}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_40_Ueberstundenausgleich: e.target.value }))}
                  />
                </>
              )}
            </div>

            {/* Section I - Urlaub */}
            <div className="divider divider-start font-bold text-base-content/80">
              I. Urlaub
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="41. Urlaubsanspruch (Tage pro Jahr)"
                value={form.txtf_41_Urlaubsanpruch}
                onChange={(e) => setForm((p) => ({ ...p, txtf_41_Urlaubsanpruch: e.target.value }))}
              />
            </div>

            {/* Section J - Entgelt */}
            <div className="divider divider-start font-bold text-base-content/80">
              J. Entgelt
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">42. Ist der Arbeitgeber tarifgebunden?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein - weiter mit 46"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_42_Arbeitgeber_tarifgebunden"
                        className="radio radio-primary"
                        checked={form.rbtn_42_Arbeitgeber_tarifgebunden === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_42_Arbeitgeber_tarifgebunden: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.rbtn_42_Arbeitgeber_tarifgebunden === "ja" && (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">43. Gelten tarifliche Arbeitsbedingungen?</span>
                    </label>
                    <div className="flex gap-4">
                      {["ja", "nein - weiter mit 46"].map((opt) => (
                        <label key={opt} className="label cursor-pointer gap-2">
                          <input
                            type="radio"
                            name="rbtn_43_tarifliche_Arbeitsbedingungen"
                            className="radio radio-primary"
                            checked={form.rbtn_43_tarifliche_Arbeitsbedingungen === opt}
                            onChange={() => setForm((p) => ({ ...p, rbtn_43_tarifliche_Arbeitsbedingungen: opt }))}
                          />
                          <span className="label-text">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <FormInput
                    label="44. Tarifvertrag"
                    value={form.txtf_44_Tarifvertrag}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_44_Tarifvertrag: e.target.value }))}
                  />
                  <FormInput
                    label="45. Entgeltgruppe"
                    value={form.txtf_45_Entgeltgruppe}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_45_Entgeltgruppe: e.target.value }))}
                  />
                </>
              )}
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_46_Arbeitsentgelt}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_46_Arbeitsentgelt: e.target.checked }))}
                />
                <span className="label-text">46. Arbeitsentgelt</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Entgelt pro Stunde (€)"
                  value={form.txtf_46_Entgelt_pro_Stunde}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_46_Entgelt_pro_Stunde: e.target.value }))}
                />
                <FormInput
                  label="Entgelt pro Monat (€)"
                  value={form.txtf_46_Entgelt_pro_Monat}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_46_Entgelt_pro_Monat: e.target.value }))}
                />
              </div>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_47_zusaetzlich_geldwerte_Leistungen}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_47_zusaetzlich_geldwerte_Leistungen: e.target.checked }))}
                />
                <span className="label-text">47. Zusätzlich geldwerte Leistungen</span>
              </label>
              {form.chbx_47_zusaetzlich_geldwerte_Leistungen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput
                    label="48. Art der geldwerten Leistung"
                    value={form.txtf_48_Art_geldwerten_Leistung}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_48_Art_geldwerten_Leistung: e.target.value }))}
                  />
                  <FormInput
                    label="49. Höhe der geldwerten Leistung"
                    value={form.txtf_49_Hoehe_geldwerten_Leistung}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_49_Hoehe_geldwerten_Leistung: e.target.value }))}
                  />
                </div>
              )}
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_47_sonstige_Berechnung}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_47_sonstige_Berechnung: e.target.checked }))}
                />
                <span className="label-text">Sonstige/variable Vergütung</span>
              </label>
              {form.chbx_47_sonstige_Berechnung && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput
                    label="50. Art der variablen Vergütung"
                    value={form.txtf_50_Art_variablen_Verguetung}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_50_Art_variablen_Verguetung: e.target.value }))}
                  />
                  <FormInput
                    label="51. Höhe der variablen Vergütung"
                    value={form.txtf_51_Hoehe_variable_Verguetung}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_51_Hoehe_variable_Verguetung: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Section K - Sozialversicherung */}
            <div className="divider divider-start font-bold text-base-content/80">
              K. Sozialversicherung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">52. Besteht Versicherungspflicht?</span>
                </label>
                <div className="flex gap-4">
                  {["ja - weiter mit 54", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_52_besteht_Versicherungspflicht"
                        className="radio radio-primary"
                        checked={form.rbtn_52_besteht_Versicherungspflicht === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_52_besteht_Versicherungspflicht: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.rbtn_52_besteht_Versicherungspflicht === "nein" && (
                <FormInput
                  label="53. Begründung"
                  value={form.txtf_53_Begruendung_Versicherungspflicht}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_53_Begruendung_Versicherungspflicht: e.target.value }))}
                />
              )}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">54. Sozialversicherungspflicht besteht nicht?</span>
                </label>
                <div className="flex gap-4">
                  {["ja - bitte Nachweis vorlegen", "nein - weiter mit Abschnitt L."].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_54_Sozialversicherungspflicht_nicht"
                        className="radio radio-primary"
                        checked={form.rbtn_54_Sozialversicherungspflicht_nicht === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_54_Sozialversicherungspflicht_nicht: opt }))}
                      />
                      <span className="label-text text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FormInput
                label="55. Form des Nachweises"
                value={form.txtf_55_Form_Nachweiss}
                onChange={(e) => setForm((p) => ({ ...p, txtf_55_Form_Nachweiss: e.target.value }))}
              />
            </div>

            {/* Section L - Ergänzungen */}
            <div className="divider divider-start font-bold text-base-content/80">
              L. Ergänzungen
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">56. Ergänzungen</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={form.txtf_56_Ergaemzungen}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_56_Ergaemzungen: e.target.value }))}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            {/* Section M - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              M. Ort und Datum
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="57. Ort"
                  value={form.txtf_57_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_57_Ort: e.target.value }))}
                />
                <FormInput
                  label="58. Datum"
                  type="date"
                  value={toInputDate(form.txtf_58_Datum)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, txtf_58_Datum: fromInputDate(e.target.value) }))
                  }
                />
              </div>
            </div>

            {/* Zusatzblatt checkboxes */}
            <div className="divider divider-start font-bold text-base-content/80">
              Zusatzblätter
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
              <p className="text-sm opacity-70 mb-3">
                Wählen Sie die benötigten Zusatzblätter aus:
              </p>
              {[
                { key: "chbx_zuE_1v4", label: "Zusatzblatt A" },
                { key: "chbx_zuE_2v4", label: "Zusatzblatt B" },
                { key: "chbx_zuE_3v4", label: "Zusatzblatt C" },
                { key: "chbx_zuE_4v4", label: "Zusatzblatt D" },
              ].map(({ key, label }) => (
                <label key={key} className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  />
                  <span className="label-text">{label}</span>
                </label>
              ))}
            </div>

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Eslatma</div>
              <div className="opacity-70">
                Bu forma Germaniya mehnat agentligi uchun to'ldiriladigan rasmiy hujjat.
                Ma'lumotlarni to'ldiring va PDF yuklab oling. Backend server localhost:3001 da ishlashi kerak.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
