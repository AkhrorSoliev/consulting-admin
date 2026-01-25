import { useState, useEffect, useCallback } from "react";
import { FaDownload, FaSave, FaTrash, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import FormInput from "../components/FormInput";
import {
  getFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../utils/fillablePdfDefaults";
import useUserRole from "../hooks/useUserRole";

const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || "https://unsincerely-monarchal-alva.ngrok-free.dev";
const TEMPLATE_NAME = "erklaerung-zum-beschaeftigungsverhaeltnis.pdf";
const DEFAULTS_KEY = "erklaerung_beschaeftigung";

const formatDate = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getFullYear()}`;
};

const toInputDate = (ddMmYyyy) => {
  if (!ddMmYyyy) return "";
  const p = String(ddMmYyyy).split(".");
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : "";
};

const fromInputDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "";
  const p = String(yyyyMmDd).split("-");
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : "";
};

const ERKLAERUNG_OPTIONS = [
  { value: "zur Erteilung eines Aufenthaltstitels zum Zweck der Beschaeftigung", label: "zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung" },
  { value: "zur Zustimmung der Aufnahme einer Beschaeftigung von Personen mit Duldung oder Aufenthaltsgestattung", label: "zur Zustimmung der Aufnahme einer Beschäftigung (Duldung/Aufenthaltsgestattung)" },
  { value: "zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschaeftigung nicht erlaubt", label: "zur Zustimmung zu einer Aufenthaltserlaubnis (Beschäftigung nicht erlaubt)" },
  { value: "zur Erteilung einer Vorabzustimmung der Bundesagentur fuer Arbeit", label: "zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit" },
  { value: "zur Erteilung einer Arbeitserlaubnis der Bundesagentur fuer Arbeit", label: "zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit" },
];

const ANLASS_OPTIONS = [
  { value: "Ersterteilung", label: "Ersterteilung" },
  { value: "Verlaengerung", label: "Verlängerung" },
  { value: "Arbeitgeberwechsel", label: "Arbeitgeberwechsel" },
];

const GESCHLECHT_OPTIONS = [
  { value: "maennlich", label: "männlich" },
  { value: "weiblich", label: "weiblich" },
  { value: "divers", label: "divers" },
];

const JA_NEIN = [
  { value: "ja", label: "Ja" },
  { value: "nein", label: "Nein" },
];

const ARBEITSORT_OPTIONS = [
  { value: "Arbeitsort entspricht dem Arbeitgeber-Sitz", label: "Entspricht dem Arbeitgeber-Sitz" },
  { value: "Arbeitnehmerin oder Arbeitnehmer wird an wechselnden Arbeits-/Einsatzorten beschaeftigt", label: "Wechselnde Arbeits-/Einsatzorte" },
  { value: "Der Arbeitsort befindet sich unter folgender Adresse", label: "Andere Adresse" },
];

const ARBEITSZEIT_OPTIONS = [
  { value: "Vollzeit", label: "Vollzeit" },
  { value: "Teilzeit", label: "Teilzeit" },
  { value: "Geringfuegige Beschaeftigung", label: "Geringfügige Beschäftigung" },
];

const AUSLAND_OPTIONS = [
  { value: "ja - bitte Nachweis vorlegen", label: "Ja (Nachweis vorlegen)" },
  { value: "nein", label: "Nein" },
];

const AUSLAND_TEILWEISE_OPTIONS = [
  { value: "ja - bitte Nachweis vorlegen", label: "Ja (Nachweis vorlegen)" },
  { value: "nein", label: "Nein" },
  { value: "teilweise - bitte Nachweis vorlegen", label: "Teilweise (Nachweis vorlegen)" },
];

const createInitialForm = () => ({
  rbtn_1_Erklaerung: "",
  rbtn_2_Anlass: "",
  txtf_3_Vorname: "",
  txtf_4_Nachname: "",
  txtf_5_Geburtsdatum: "",
  rbtn_6_Geschlecht: "",
  txtf_7_Staatsangehoerigkeit: "",
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
  txtf_58_Datum: formatDate(),
  chbx_zuE_1v4: false,
  chbx_zuE_2v4: false,
  chbx_zuE_3v4: false,
  chbx_zuE_4v4: false,
});

const buildPdfPayload = (form) => {
  const payload = { template: TEMPLATE_NAME, data: { textFields: {}, radioGroups: {}, checkboxes: {} } };
  Object.entries(form).forEach(([key, value]) => {
    if (key.startsWith("txtf_")) payload.data.textFields[key] = value;
    else if (key.startsWith("rbtn_") && value) payload.data.radioGroups[key] = value;
    else if (key.startsWith("chbx_")) payload.data.checkboxes[key] = value;
  });
  return payload;
};

const RadioGroup = ({ name, label, options, value, onChange, prefix = "" }) => (
  <div className="form-control">
    <label className="label"><span className="label-text font-medium">{label}</span></label>
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt.value} className="label cursor-pointer gap-2">
          <input type="radio" name={`${prefix}${name}`} className="radio radio-primary" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span className="label-text">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder = "Bitte wählen..." }) => (
  <div className="form-control">
    <label className="label"><span className="label-text font-medium">{label}</span></label>
    <select className="select select-bordered w-full" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
  <label className="label cursor-pointer justify-start gap-3">
    <input type="checkbox" className="checkbox checkbox-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="label-text">{label}</span>
  </label>
);

const Section = ({ title, children }) => (
  <>
    <div className="divider divider-start font-bold text-base-content/80">{title}</div>
    <div className="bg-base-200/50 rounded-lg p-4 space-y-3">{children}</div>
  </>
);

export default function ErklaerungBeschaeftigung() {
  const [form, setForm] = useState(createInitialForm);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isClearingDefaults, setIsClearingDefaults] = useState(false);
  const [hasDefaults, setHasDefaults] = useState(false);
  const { role } = useUserRole();
  const canManageDefaults = role === "super_admin" || role === "admin";

  const updateField = useCallback((field, value) => setForm((prev) => ({ ...prev, [field]: value })), []);

  useEffect(() => {
    getFillablePdfDefaults(DEFAULTS_KEY)
      .then((defaults) => {
        if (defaults && typeof defaults === "object") {
          setHasDefaults(Object.keys(defaults).some((k) => k !== "updatedAt" && defaults[k]));
          setForm((prev) => {
            const merged = { ...prev };
            Object.keys(defaults).forEach((key) => { if (key in merged && key !== "updatedAt") merged[key] = defaults[key]; });
            return merged;
          });
        }
      })
      .catch((err) => console.error("Failed to load defaults:", err));
  }, []);

  const handleSaveAsDefaults = useCallback(async () => {
    setIsSavingDefaults(true);
    try {
      await saveFillablePdfDefaults(DEFAULTS_KEY, form);
      setHasDefaults(true);
      toast.success("Standardwerte gespeichert");
    } catch (err) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setIsSavingDefaults(false);
    }
  }, [form]);

  const handleClearDefaults = useCallback(async () => {
    if (!window.confirm("Möchten Sie alle Standardwerte für dieses Template löschen?")) return;
    setIsClearingDefaults(true);
    try {
      await clearFillablePdfDefaults(DEFAULTS_KEY);
      setHasDefaults(false);
      setForm((prev) => {
        const reset = {};
        Object.keys(prev).forEach((key) => { reset[key] = key.startsWith("chbx_") ? false : key === "txtf_58_Datum" ? formatDate() : ""; });
        return reset;
      });
      toast.success("Standardwerte gelöscht");
    } catch (err) {
      toast.error(err.message || "Fehler beim Löschen");
    } finally {
      setIsClearingDefaults(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPdfPayload(form)),
      });
      if (!response.ok) throw new Error((await response.json()).error || "PDF generation failed");
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
  }, [form]);

  return (
    <div className="p-2 min-h-screen">
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li><Link to="/settings/documents" className="link flex items-center gap-2"><FaArrowLeft /> Zurück</Link></li>
              <li className="opacity-70">Erklärung zum Beschäftigungsverhältnis</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            {canManageDefaults && (
              <>
                <button type="button" className="btn btn-sm btn-outline btn-secondary" onClick={handleSaveAsDefaults} disabled={isSavingDefaults}>
                  <FaSave className="w-3 h-3" /> {isSavingDefaults ? "Speichern..." : "Als Standard speichern"}
                </button>
                {hasDefaults && (
                  <button type="button" className="btn btn-sm btn-outline btn-error" onClick={handleClearDefaults} disabled={isClearingDefaults}>
                    <FaTrash className="w-3 h-3" /> {isClearingDefaults ? "Löschen..." : "Standard löschen"}
                  </button>
                )}
              </>
            )}
            <button type="button" className="btn btn-sm btn-primary" onClick={handleDownloadPdf} disabled={isDownloading}>
              <FaDownload /> {isDownloading ? "Wird erstellt..." : "PDF Herunterladen"}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16">
        <section className="card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto">
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">Erklärung zum Beschäftigungsverhältnis</h2>
              <p className="text-sm opacity-70 mt-1">Fillable PDF formasi. Ma'lumotlarni to'ldiring va PDF yuklab oling.</p>
            </div>

            <Section title="A. Erklärung">
              <SelectField label="Art der Erklärung" value={form.rbtn_1_Erklaerung} onChange={(v) => updateField("rbtn_1_Erklaerung", v)} options={ERKLAERUNG_OPTIONS} />
              <RadioGroup name="rbtn_2_Anlass" label="Anlass" options={ANLASS_OPTIONS} value={form.rbtn_2_Anlass} onChange={(v) => updateField("rbtn_2_Anlass", v)} />
            </Section>

            <Section title="B. Angaben zur Arbeitnehmerin/zum Arbeitnehmer">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="3. Vorname(n)" value={form.txtf_3_Vorname} onChange={(e) => updateField("txtf_3_Vorname", e.target.value)} />
                <FormInput label="4. Nachname" value={form.txtf_4_Nachname} onChange={(e) => updateField("txtf_4_Nachname", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="5. Geburtsdatum" type="date" value={toInputDate(form.txtf_5_Geburtsdatum)} onChange={(e) => updateField("txtf_5_Geburtsdatum", fromInputDate(e.target.value))} />
                <RadioGroup name="rbtn_6_Geschlecht" label="6. Geschlecht" options={GESCHLECHT_OPTIONS} value={form.rbtn_6_Geschlecht} onChange={(v) => updateField("rbtn_6_Geschlecht", v)} />
              </div>
              <FormInput label="7. Staatsangehörigkeit" value={form.txtf_7_Staatsangehoerigkeit} onChange={(e) => updateField("txtf_7_Staatsangehoerigkeit", e.target.value)} />
              <FormInput label="8. Wohnsitz/Aufenthaltsort" value={form.txtf_8_Wohnsitz} onChange={(e) => updateField("txtf_8_Wohnsitz", e.target.value)} />
              <FormInput label="9. Wohnsitz seit" type="date" value={toInputDate(form.txtf_9_seit)} onChange={(e) => updateField("txtf_9_seit", fromInputDate(e.target.value))} />
            </Section>

            <Section title="C. Angaben zum Arbeitgeber">
              <FormInput label="10. Firma/Name" value={form.txtf_10_Firma} onChange={(e) => updateField("txtf_10_Firma", e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="11. Straße" value={form.txtf_11_Strasse} onChange={(e) => updateField("txtf_11_Strasse", e.target.value)} />
                <FormInput label="12. Hausnummer" value={form.txtf_12_Hausnummer} onChange={(e) => updateField("txtf_12_Hausnummer", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="13. Postleitzahl" value={form.txtf_13_Postleitzahl} onChange={(e) => updateField("txtf_13_Postleitzahl", e.target.value)} />
                <FormInput label="14. Ort" value={form.txtf_14_Ort} onChange={(e) => updateField("txtf_14_Ort", e.target.value)} />
              </div>
              <FormInput label="15. Kontaktperson" value={form.txtf_15_Kontaktperson} onChange={(e) => updateField("txtf_15_Kontaktperson", e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormInput label="16. Telefon" value={form.txtf_16_Telefon} onChange={(e) => updateField("txtf_16_Telefon", e.target.value)} />
                <FormInput label="17. E-Mail" type="email" value={form["txtf_17_E-Mail"]} onChange={(e) => updateField("txtf_17_E-Mail", e.target.value)} />
                <FormInput label="18. Telefax" value={form.txtf_18_Telefax} onChange={(e) => updateField("txtf_18_Telefax", e.target.value)} />
              </div>
              <FormInput label="19. Betriebsnummer" value={form.txtf_19_Betriebsnummer} onChange={(e) => updateField("txtf_19_Betriebsnummer", e.target.value)} />
              <RadioGroup name="rbtn_20_Unternehmen_gegruendet" label="20. Unternehmen in den letzten 5 Jahren gegründet?" options={JA_NEIN} value={form.rbtn_20_Unternehmen_gegruendet} onChange={(v) => updateField("rbtn_20_Unternehmen_gegruendet", v)} />
            </Section>

            <Section title="D. Angaben zur Beschäftigung">
              <FormInput label="21. Beginn der Beschäftigung" type="date" value={toInputDate(form.txtf_21_Beschaeftigungsverhaeltniss)} onChange={(e) => updateField("txtf_21_Beschaeftigungsverhaeltniss", fromInputDate(e.target.value))} />
              <RadioGroup name="rbtn_22_Beschaeftigungsverhaeltniss" label="22. Beschäftigungsverhältnis" options={[{ value: "unbefristet", label: "Unbefristet" }, { value: "befristet", label: "Befristet" }]} value={form.rbtn_22_Beschaeftigungsverhaeltniss} onChange={(v) => updateField("rbtn_22_Beschaeftigungsverhaeltniss", v)} />
              <FormInput label="Befristung bis" type="date" value={toInputDate(form.txtf_22_Beschaeftigungsverhaeltniss)} onChange={(e) => updateField("txtf_22_Beschaeftigungsverhaeltniss", fromInputDate(e.target.value))} />
              <RadioGroup name="rbtn_23_Dritte" label="23. Beschäftigung bei Dritten?" options={JA_NEIN} value={form.rbtn_23_Dritte} onChange={(v) => updateField("rbtn_23_Dritte", v)} />
              <SelectField label="24. Arbeitsort" value={form.rbtn_24_Arbeitsort} onChange={(v) => updateField("rbtn_24_Arbeitsort", v)} options={ARBEITSORT_OPTIONS} />
              <FormInput label="Arbeitsort Adresse" value={form.txtf_24_Arbeitsort_Adresse} onChange={(e) => updateField("txtf_24_Arbeitsort_Adresse", e.target.value)} />
            </Section>

            <Section title="E/F. Angaben zur Qualifikation">
              <FormInput label="25. Berufsbezeichnung" value={form.txtf_25_Berufsbezeichnung} onChange={(e) => updateField("txtf_25_Berufsbezeichnung", e.target.value)} />
              <FormInput label="26. Studiengang" value={form.txtf_26_Studiengang} onChange={(e) => updateField("txtf_26_Studiengang", e.target.value)} />
              <FormInput label="27. Hochschulabschluss" value={form.txtf_27_Hochschulabschluss} onChange={(e) => updateField("txtf_27_Hochschulabschluss", e.target.value)} />
              <RadioGroup name="rbtn_28_Abschluss_Ausland" label="28. Abschluss im Ausland?" options={AUSLAND_OPTIONS} value={form.rbtn_28_Abschluss_Ausland} onChange={(v) => updateField("rbtn_28_Abschluss_Ausland", v)} />
              <FormInput label="29. Anerkennungsnachweis" value={form.txtf_29_Anerkennungsnachweis} onChange={(e) => updateField("txtf_29_Anerkennungsnachweis", e.target.value)} />
              <FormInput label="30. Bezeichnung Berufsausbildung" value={form.txtf_30_Bezeichnung_Berufsausbildung} onChange={(e) => updateField("txtf_30_Bezeichnung_Berufsausbildung", e.target.value)} />
              <FormInput label="31. Berufsausbildung erworben in" value={form.txtf_31_Berufsausbildung_erworben} onChange={(e) => updateField("txtf_31_Berufsausbildung_erworben", e.target.value)} />
              <RadioGroup name="rbtn_32_Ausbildung_Ausland" label="32. Ausbildung im Ausland?" options={AUSLAND_TEILWEISE_OPTIONS} value={form.rbtn_32_Ausbildung_Ausland} onChange={(v) => updateField("rbtn_32_Ausbildung_Ausland", v)} />
              <FormInput label="33. Anerkennungsnachweis" value={form.txtf_33_Anerkennungsnachweis} onChange={(e) => updateField("txtf_33_Anerkennungsnachweis", e.target.value)} />
              <CheckboxField label="34. Keine formale Ausbildung" checked={form.chbx_34_keine_Ausbildung} onChange={(v) => updateField("chbx_34_keine_Ausbildung", v)} />
              <FormInput label="34. Sonstige Qualifikationen" value={form.txtf_34_Qualifikationen} onChange={(e) => updateField("txtf_34_Qualifikationen", e.target.value)} />
              <RadioGroup name="rbtn_35_Berufsausuebungserlaubnis" label="35. Berufsausübungserlaubnis erforderlich?" options={[{ value: "ja", label: "Ja" }, { value: "nein - weiter mit Abschnitt G.", label: "Nein" }]} value={form.rbtn_35_Berufsausuebungserlaubnis} onChange={(v) => updateField("rbtn_35_Berufsausuebungserlaubnis", v)} />
              <FormInput label="36. Erforderliche Qualifikation" value={form.txtf_36_erforderliche_Qualifikation} onChange={(e) => updateField("txtf_36_erforderliche_Qualifikation", e.target.value)} />
            </Section>

            <Section title="G/H. Arbeitszeit">
              <RadioGroup name="rbtn_37_Arbeitszeit" label="37. Arbeitszeit" options={ARBEITSZEIT_OPTIONS} value={form.rbtn_37_Arbeitszeit} onChange={(v) => updateField("rbtn_37_Arbeitszeit", v)} />
              <FormInput label="Arbeitsstunden pro Woche" value={form.txtf_37_Arbeitsstunden_Woche} onChange={(e) => updateField("txtf_37_Arbeitsstunden_Woche", e.target.value)} />
              <RadioGroup name="rbtn_38_Ueberstunden" label="38. Überstunden vorgesehen?" options={[{ value: "ja", label: "Ja" }, { value: "nein - weiter mit Abschnitt I.", label: "Nein" }]} value={form.rbtn_38_Ueberstunden} onChange={(v) => updateField("rbtn_38_Ueberstunden", v)} />
              <FormInput label="39. Überstundenumfang" value={form.txtf_39_Ueberstundenumpfang} onChange={(e) => updateField("txtf_39_Ueberstundenumpfang", e.target.value)} />
              <FormInput label="40. Überstundenausgleich" value={form.txtf_40_Ueberstundenausgleich} onChange={(e) => updateField("txtf_40_Ueberstundenausgleich", e.target.value)} />
            </Section>

            <Section title="I. Urlaub">
              <FormInput label="41. Urlaubsanspruch (Tage/Jahr)" value={form.txtf_41_Urlaubsanpruch} onChange={(e) => updateField("txtf_41_Urlaubsanpruch", e.target.value)} />
            </Section>

            <Section title="J. Entgelt">
              <RadioGroup name="rbtn_42_Arbeitgeber_tarifgebunden" label="42. Arbeitgeber tarifgebunden?" options={[{ value: "ja", label: "Ja" }, { value: "nein - weiter mit 46", label: "Nein" }]} value={form.rbtn_42_Arbeitgeber_tarifgebunden} onChange={(v) => updateField("rbtn_42_Arbeitgeber_tarifgebunden", v)} />
              <RadioGroup name="rbtn_43_tarifliche_Arbeitsbedingungen" label="43. Tarifliche Arbeitsbedingungen?" options={[{ value: "ja", label: "Ja" }, { value: "nein - weiter mit 46", label: "Nein" }]} value={form.rbtn_43_tarifliche_Arbeitsbedingungen} onChange={(v) => updateField("rbtn_43_tarifliche_Arbeitsbedingungen", v)} />
              <FormInput label="44. Tarifvertrag" value={form.txtf_44_Tarifvertrag} onChange={(e) => updateField("txtf_44_Tarifvertrag", e.target.value)} />
              <FormInput label="45. Entgeltgruppe" value={form.txtf_45_Entgeltgruppe} onChange={(e) => updateField("txtf_45_Entgeltgruppe", e.target.value)} />
              <CheckboxField label="46. Arbeitsentgelt" checked={form.chbx_46_Arbeitsentgelt} onChange={(v) => updateField("chbx_46_Arbeitsentgelt", v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="Entgelt pro Stunde (€)" value={form.txtf_46_Entgelt_pro_Stunde} onChange={(e) => updateField("txtf_46_Entgelt_pro_Stunde", e.target.value)} />
                <FormInput label="Entgelt pro Monat (€)" value={form.txtf_46_Entgelt_pro_Monat} onChange={(e) => updateField("txtf_46_Entgelt_pro_Monat", e.target.value)} />
              </div>
              <CheckboxField label="47. Zusätzlich geldwerte Leistungen" checked={form.chbx_47_zusaetzlich_geldwerte_Leistungen} onChange={(v) => updateField("chbx_47_zusaetzlich_geldwerte_Leistungen", v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="48. Art der Leistung" value={form.txtf_48_Art_geldwerten_Leistung} onChange={(e) => updateField("txtf_48_Art_geldwerten_Leistung", e.target.value)} />
                <FormInput label="49. Höhe der Leistung" value={form.txtf_49_Hoehe_geldwerten_Leistung} onChange={(e) => updateField("txtf_49_Hoehe_geldwerten_Leistung", e.target.value)} />
              </div>
              <CheckboxField label="Sonstige/variable Vergütung" checked={form.chbx_47_sonstige_Berechnung} onChange={(v) => updateField("chbx_47_sonstige_Berechnung", v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="50. Art der variablen Vergütung" value={form.txtf_50_Art_variablen_Verguetung} onChange={(e) => updateField("txtf_50_Art_variablen_Verguetung", e.target.value)} />
                <FormInput label="51. Höhe der variablen Vergütung" value={form.txtf_51_Hoehe_variable_Verguetung} onChange={(e) => updateField("txtf_51_Hoehe_variable_Verguetung", e.target.value)} />
              </div>
            </Section>

            <Section title="K. Sozialversicherung">
              <RadioGroup name="rbtn_52_besteht_Versicherungspflicht" label="52. Besteht Versicherungspflicht?" options={[{ value: "ja - weiter mit 54", label: "Ja" }, { value: "nein", label: "Nein" }]} value={form.rbtn_52_besteht_Versicherungspflicht} onChange={(v) => updateField("rbtn_52_besteht_Versicherungspflicht", v)} />
              <FormInput label="53. Begründung" value={form.txtf_53_Begruendung_Versicherungspflicht} onChange={(e) => updateField("txtf_53_Begruendung_Versicherungspflicht", e.target.value)} />
              <RadioGroup name="rbtn_54_Sozialversicherungspflicht_nicht" label="54. Sozialversicherungspflicht besteht nicht?" options={[{ value: "ja - bitte Nachweis vorlegen", label: "Ja (Nachweis vorlegen)" }, { value: "nein - weiter mit Abschnitt L.", label: "Nein" }]} value={form.rbtn_54_Sozialversicherungspflicht_nicht} onChange={(v) => updateField("rbtn_54_Sozialversicherungspflicht_nicht", v)} />
              <FormInput label="55. Form des Nachweises" value={form.txtf_55_Form_Nachweiss} onChange={(e) => updateField("txtf_55_Form_Nachweiss", e.target.value)} />
            </Section>

            <Section title="L. Ergänzungen">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">56. Ergänzungen</span></label>
                <textarea className="textarea textarea-bordered w-full h-24" value={form.txtf_56_Ergaemzungen} onChange={(e) => updateField("txtf_56_Ergaemzungen", e.target.value)} placeholder="Zusätzliche Informationen..." />
              </div>
            </Section>

            <Section title="M. Ort und Datum">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="57. Ort" value={form.txtf_57_Ort} onChange={(e) => updateField("txtf_57_Ort", e.target.value)} />
                <FormInput label="58. Datum" type="date" value={toInputDate(form.txtf_58_Datum)} onChange={(e) => updateField("txtf_58_Datum", fromInputDate(e.target.value))} />
              </div>
            </Section>

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Eslatma</div>
              <div className="opacity-70">Bu forma Germaniya mehnat agentligi uchun to'ldiriladigan rasmiy hujjat. Ma'lumotlarni to'ldiring va PDF yuklab oling.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
