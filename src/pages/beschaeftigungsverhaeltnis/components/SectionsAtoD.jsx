import FormInput from "../../../components/FormInput";
import { RadioGroup, SelectField, Section } from "./FormElements";
import { toInputDate, fromInputDate } from "../utils/helpers";
import {
  ERKLAERUNG_OPTIONS,
  ANLASS_OPTIONS,
  GESCHLECHT_OPTIONS,
  JA_NEIN,
  ARBEITSORT_OPTIONS,
} from "../utils/constants";

export default function SectionsAtoD({ form, updateField }) {
  return (
    <>
      <Section title="A. Erklärung">
        <SelectField
          label="Art der Erklärung"
          value={form.rbtn_1_Erklaerung}
          onChange={(v) => updateField("rbtn_1_Erklaerung", v)}
          options={ERKLAERUNG_OPTIONS}
          numeric
        />
        <RadioGroup
          name="rbtn_2_Anlass"
          label="Anlass"
          options={ANLASS_OPTIONS}
          value={form.rbtn_2_Anlass}
          onChange={(v) => updateField("rbtn_2_Anlass", v)}
        />
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
        <RadioGroup name="rbtn_22_Beschaeftigungsverhaeltniss" label="22. Beschäftigungsverhältnis" options={[{ value: 0, label: "Unbefristet" }, { value: 1, label: "Befristet" }]} value={form.rbtn_22_Beschaeftigungsverhaeltniss} onChange={(v) => updateField("rbtn_22_Beschaeftigungsverhaeltniss", v)} />
        <FormInput label="Befristung bis" type="date" value={toInputDate(form.txtf_22_Beschaeftigungsverhaeltniss)} onChange={(e) => updateField("txtf_22_Beschaeftigungsverhaeltniss", fromInputDate(e.target.value))} />
        <RadioGroup name="rbtn_23_Dritte" label="23. Beschäftigung bei Dritten?" options={JA_NEIN} value={form.rbtn_23_Dritte} onChange={(v) => updateField("rbtn_23_Dritte", v)} />
        <SelectField label="24. Arbeitsort" value={form.rbtn_24_Arbeitsort} onChange={(v) => updateField("rbtn_24_Arbeitsort", v)} options={ARBEITSORT_OPTIONS} numeric />
        <FormInput label="Arbeitsort Adresse" value={form.txtf_24_Arbeitsort_Adresse} onChange={(e) => updateField("txtf_24_Arbeitsort_Adresse", e.target.value)} />
      </Section>
    </>
  );
}
