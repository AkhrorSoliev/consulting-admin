import FormInput from "../../../../../components/FormInput";
import {
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

/**
 * ZusatzblattA - Section A: Angaben zur Person
 */
export default function SectionsA_Person({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      <SectionDivider>A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="1 Vorname" value={form.txtf_1_Vorname} onChange={set("txtf_1_Vorname")} />
          <FormInput label="2 Nachname" value={form.txtf_2_Nachname} onChange={set("txtf_2_Nachname")} />
        </div>
        <FormInput
          label="3 derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort"
          value={form.txtf_3_Wohnsitz}
          onChange={set("txtf_3_Wohnsitz")}
        />
      </SectionCard>
    </>
  );
}
