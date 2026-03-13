import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

/**
 * ZusatzblattC - Section A (Angaben zur Person) + Section B (Fahrerlaubnis)
 */
export default function SectionsC_PersonFahrerlaubnis({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const setRadio = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="1 Vorname" value={form.txtf_1_vorname} onChange={set("txtf_1_vorname")} />
          <FormInput label="2 Nachname" value={form.txtf_2_name} onChange={set("txtf_2_name")} />
        </div>
        <FormInput
          label="3 derzeitiger Wohnsitz oder gewöhnlicher Aufenthaltsort"
          value={form.txtf_3_wohnsitz}
          onChange={set("txtf_3_wohnsitz")}
        />
      </SectionCard>

      <SectionDivider>B. Angaben zur Fahrerlaubnis</SectionDivider>
      <SectionCard>
        <RadioGroup
          name="modal_rbtn_4_fahrerlaubnis"
          label="4 Ist der/die Arbeitnehmer/in im Besitz der für die jeweilige Beschäftigung als Berufskraftfahrer/in im Güterkraftverkehr oder Personenverkehr mit Kraftomnibussen erforderlichen EU- oder EWR-Fahrerlaubnis der Klassen C1, C1E, C, CE, D1, D1E, D oder DE?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein (weiter mit Ziffer 8)" },
          ]}
          value={form.rbtn_4_fahrerlaubnis}
          onChange={setRadio("rbtn_4_fahrerlaubnis")}
        />

        <FormInput
          label="5 Wenn ja, bitte Staat angeben, in dem die EU- oder EWR-Fahrerlaubnis ausgestellt wurde."
          value={form.rbtn_5_fahrerlaubnis_ausgestellt}
          onChange={set("rbtn_5_fahrerlaubnis_ausgestellt")}
        />

        <RadioGroup
          name="modal_rbtn_6_fahrerlaubnis_schluesselzahl"
          label="6 Ist die EU- oder EWR-Fahrerlaubnis mit der Schlüsselzahl 70 versehen?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein (weiter mit Abschnitt C)" },
          ]}
          value={form.rbtn_6_fahrerlaubnis_schluesselzahl}
          onChange={setRadio("rbtn_6_fahrerlaubnis_schluesselzahl")}
        />

        <RadioGroup
          name="modal_rbtn_7_fahrerlaubnis_erworben"
          label="7 Wenn ja, ist der Drittstaat, in dem die Fahrerlaubnis erstmalig erworben wurde, in Anlage 11 der Fahrerlaubnisverordnung aufgeführt und kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?"
          options={[
            { value: "ja", label: "Ja (weiter mit Abschnitt C)" },
            { value: "nein", label: "Nein (weiter mit Abschnitt C)" },
          ]}
          value={form.rbtn_7_fahrerlaubnis_erworben}
          onChange={setRadio("rbtn_7_fahrerlaubnis_erworben")}
        />

        <RadioGroup
          name="modal_rbtn_8_fahrerlaubnis_drittstaat"
          label="8 Ist der/die Arbeitnehmer/in im Besitz einer Fahrerlaubnis für den Güterverkehr oder für den Personenverkehr mit Kraftomnibussen aus einem Drittstaat?"
          options={[
            { value: "ja", label: "Ja (bitte Nachweis beifügen)" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_8_fahrerlaubnis_drittstaat}
          onChange={setRadio("rbtn_8_fahrerlaubnis_drittstaat")}
        />

        <RadioGroup
          name="modal_rbtn_9_fahrerlaubnis_erteilt"
          label="9 Wenn ja, wurde die Fahrerlaubnis von einem in Anlage 11 der Fahrerlaubnisverordnung aufgeführten Staaten erteilt und kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_9_fahrerlaubnis_erteilt}
          onChange={setRadio("rbtn_9_fahrerlaubnis_erteilt")}
        />
      </SectionCard>
    </>
  );
}
