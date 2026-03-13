import FormInput from "../../../components/FormInput";
import { RadioGroup, SelectField, Section } from "./FormControls";
import { toInputDate, fromInputDate } from "../utils/helpers";
import {
  ERKLAERUNG_OPTIONS,
  ANLASS_OPTIONS,
  GESCHLECHT_OPTIONS,
  JA_NEIN,
  ARBEITSORT_OPTIONS,
  AUSLAND_OPTIONS,
  AUSLAND_TEILWEISE_OPTIONS,
} from "../utils/constants";
import { CheckboxField } from "./FormControls";

export default function FormSectionsTop({ form, updateField }) {
  return (
    <>
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
    </>
  );
}
