import {
  RadioGroup,
  CheckboxField,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

const QUESTIONS_12_15 = [
  {
    field: "12_Kapital",
    label:
      "12 Ein Unternehmen besitzt die Mehrheit des Kapitals (mehr als 50 %) des anderen Unternehmens beziehungsweise der anderen Unternehmen:",
  },
  {
    field: "13_Stimmrechte",
    label:
      "13 Ein Unternehmen besitzt die Mehrheit der Stimmrechte (mehr als 50 %) des anderen Unternehmens beziehungsweise der anderen Unternehmen:",
  },
  {
    field: "14_Mitglieder",
    label:
      "14 Ein Unternehmen darf die Mehrheit der Mitglieder des Verwaltungs-, Leitungs- oder Aufsichtsorgans (mehr als 50 %) stellen:",
  },
  {
    field: "15_Mutterunternehmen",
    label:
      "15 Die Unternehmen beziehungsweise die Unternehmensteile stehen unter der Leitung desselben Mutterunternehmens:",
  },
];

/**
 * ZusatzblattB - Section B: Unternehmensgruppe
 */
export default function SectionsB_Unternehmensgruppe({ form, setForm }) {
  const chk = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>
        B. Unternehmensgruppe, international tätiges Unternehmen
      </SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">
              11 Das Unternehmen/Der Unternehmensteil in Deutschland und das
              Unternehmen/der Unternehmensteil im Ausland gehören:
            </span>
          </label>
          <div className="flex flex-wrap gap-4">
            <CheckboxField
              label="zum gleichen Unternehmen"
              checked={form.chbx_11_Unternehmen}
              onChange={chk("chbx_11_Unternehmen")}
            />
            <CheckboxField
              label="zur gleichen Unternehmensgruppe"
              checked={form.chbx_11_Unternehmensgruppe}
              onChange={chk("chbx_11_Unternehmensgruppe")}
            />
            <CheckboxField
              label="zum gleichen Konzern"
              checked={form.chbx_11_Konzern}
              onChange={chk("chbx_11_Konzern")}
            />
          </div>
        </div>

        {QUESTIONS_12_15.map(({ field, label }) => (
          <RadioGroup
            key={field}
            name={`modal_rbtn_${field}`}
            label={label}
            options={["ja", "nein"]}
            value={form[`rbtn_${field}`]}
            onChange={(v) => setForm((p) => ({ ...p, [`rbtn_${field}`]: v }))}
          />
        ))}
      </SectionCard>
    </>
  );
}
