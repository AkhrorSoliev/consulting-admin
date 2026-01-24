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

function mapGenderToForm(gender) {
  if (!gender) return "";
  const g = String(gender).toLowerCase().trim();
  if (g === "männlich" || g === "male" || g === "m") return "maennlich";
  if (g === "weiblich" || g === "female" || g === "w" || g === "f") return "weiblich";
  if (g === "divers") return "divers";
  return "";
}

export default function ErklaerungBeschaeftigungModal({ open, onClose, candidateData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitialForm = () => ({
    rbtn_1_Erklaerung: "",
    rbtn_2_Anlass: "",
    txtf_3_Vorname: candidateData?.personalInfo?.name || "",
    txtf_4_Nachname: candidateData?.personalInfo?.lastName || "",
    txtf_5_Geburtsdatum: candidateData?.personalInfo?.birthDate || "",
    rbtn_6_Geschlecht: mapGenderToForm(candidateData?.personalInfo?.gender),
    txtf_7_Staatsangehoerigkeit: candidateData?.personalInfo?.nationality || "usbekisch",
    txtf_8_Wohnsitz: "",
    txtf_9_seit: "",
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
    txtf_21_Beschaeftigungsverhaeltniss: "",
    rbtn_22_Beschaeftigungsverhaeltniss: "",
    txtf_22_Beschaeftigungsverhaeltniss: "",
    rbtn_23_Dritte: "",
    rbtn_24_Arbeitsort: "",
    txtf_24_Arbeitsort_Adresse: "",
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
    rbtn_37_Arbeitszeit: "",
    txtf_37_Arbeitsstunden_Woche: "",
    rbtn_38_Ueberstunden: "",
    txtf_39_Ueberstundenumpfang: "",
    txtf_40_Ueberstundenausgleich: "",
    txtf_41_Urlaubsanpruch: "",
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
    rbtn_52_besteht_Versicherungspflicht: "",
    txtf_53_Begruendung_Versicherungspflicht: "",
    rbtn_54_Sozialversicherungspflicht_nicht: "",
    txtf_55_Form_Nachweiss: "",
    txtf_56_Ergaemzungen: "",
    txtf_57_Ort: "",
    txtf_58_Datum: todayDdMmYyyy(),
    chbx_zuE_1v4: false,
    chbx_zuE_2v4: false,
    chbx_zuE_3v4: false,
    chbx_zuE_4v4: false,
  });

  const [form, setForm] = useState(getInitialForm);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (open) {
      const baseForm = getInitialForm();
      setForm(baseForm);
      setLoadingDefaults(true);
      getFillablePdfDefaults("erklaerung_beschaeftigung")
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
              <h3 className="text-lg font-bold">Erklärung zum Beschäftigungsverhältnis</h3>
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
                        name="modal_rbtn_2_Anlass"
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
                          name="modal_rbtn_6_Geschlecht"
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
                        name="modal_rbtn_20_Unternehmen_gegruendet"
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
                        name="modal_rbtn_22_Beschaeftigungsverhaeltniss"
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
            </div>

            {/* Section M - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              M. Unterschrift
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

          </div>
        </div>
      </div>
    </div>
  );
}
