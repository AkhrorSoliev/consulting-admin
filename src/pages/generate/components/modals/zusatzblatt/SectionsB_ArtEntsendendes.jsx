import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  CheckboxField,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

/**
 * ZusatzblattB - Section 1 (Art der Beschäftigung) + Section A (Entsendendes Unternehmen)
 */
export default function SectionsB_ArtEntsendendes({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const chk = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      {/* Section 1 */}
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">
              1 Bei der Beschäftigung im Formular &quot;Erklärung zum
              Beschäftigungsverhältnis&quot; handelt es sich um eine
              Beschäftigung
            </span>
          </label>
          <div className="space-y-2">
            <CheckboxField
              label="für einen Intra Corporate Transferee (ICT) (nur Führungskräfte, Spezialisten und Trainees)"
              checked={form.chbx_1_ICT}
              onChange={chk("chbx_1_ICT")}
            />
            <CheckboxField
              label="im Rahmen eines internationalen Personalaustauschs"
              checked={form.chbx_1_Personalaustausch}
              onChange={chk("chbx_1_Personalaustausch")}
            />
            <CheckboxField
              label="sonstige vorübergehende Beschäftigung/Transfers/Entsendung"
              checked={form.chbx_1_Beschaeftigung}
              onChange={chk("chbx_1_Beschaeftigung")}
            />
          </div>
        </div>
      </SectionCard>

      {/* Section A */}
      <SectionDivider>
        A. Entsendendes und/oder abordnendes Unternehmen/entsendender und/oder
        abordnender Unternehmensteil im Ausland
      </SectionDivider>
      <SectionCard>
        <FormInput label="2 Firma" value={form.txtf_2_Firma} onChange={set("txtf_2_Firma")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="3 Vorname Kontaktperson" value={form.txtf_3_Vorname} onChange={set("txtf_3_Vorname")} />
          <FormInput label="4 Nachname Kontaktperson" value={form.txtf_4_Nachname} onChange={set("txtf_4_Nachname")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="5 Straße" value={form.txtf_5_Strasse} onChange={set("txtf_5_Strasse")} />
          <FormInput label="6 Hausnummer" value={form.txtf_6_Hausnummer} onChange={set("txtf_6_Hausnummer")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormInput label="7 Postleitzahl" value={form.txtf_7_PLZ} onChange={set("txtf_7_PLZ")} />
          <FormInput label="8 Ort" value={form.txtf_8_Ort} onChange={set("txtf_8_Ort")} />
          <FormInput label="9 Land" value={form.txtf_9_Land} onChange={set("txtf_9_Land")} />
        </div>
        <RadioGroup
          name="modal_rbtn_10_Sitz_des_Unternehmens"
          label="10 Das Unternehmen oder der Unternehmensteil hat seinen Sitz:"
          options={[
            { value: "ausserhalb der Europaeischen Union", label: "außerhalb der Europäischen Union" },
            { value: "innerhalb der Europaeischen Union", label: "innerhalb der Europäischen Union" },
          ]}
          value={form.rbtn_10_Sitz_des_Unternehmens}
          onChange={(v) => setForm((p) => ({ ...p, rbtn_10_Sitz_des_Unternehmens: v }))}
        />
      </SectionCard>
    </>
  );
}
