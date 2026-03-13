import FormInput from "../../../components/FormInput";
import { RadioGroup, CheckboxField, Section } from "./FormControls";
import { toInputDate, fromInputDate } from "../utils/helpers";
import { ARBEITSZEIT_OPTIONS } from "../utils/constants";

export default function FormSectionsBottom({ form, updateField }) {
  return (
    <>
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
    </>
  );
}
