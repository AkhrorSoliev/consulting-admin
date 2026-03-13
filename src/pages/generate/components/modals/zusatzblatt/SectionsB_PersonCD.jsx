import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  CheckboxField,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";
import { toInputDate, fromInputDate } from "./modalUtils";

const QUESTIONS_20_22 = [
  {
    field: "20_Entsendung",
    label:
      "20 Die Möglichkeit und die Bedingungen für eine Entsendung/einen Transfer/Personalaustausch sind im Arbeitsvertrag, einer Entsendungsvereinbarung oder einem Abordnungsschreiben geregelt (bitte Nachweis beifügen):",
  },
  {
    field: "21_Arbeitsverhaeltnis",
    label:
      "21 Das Arbeitsverhältnis mit dem ausländischen Unternehmen/Unternehmensteil besteht für die Dauer der Entsendung/des Transfers/des Personalaustauschs fort:",
  },
  {
    field: "22_Beendigung",
    label:
      "22 Nach Beendigung der Entsendung/des Transfers/des Personalaustauschs kann die ausländische Arbeitnehmerin/der ausländische Arbeitnehmer in eine Niederlassung des Unternehmens beziehungsweise der Unternehmensgruppe mit Sitz im außereuropäischen Ausland zurückkehren:",
  },
];

/**
 * ZusatzblattB - Section C (Angaben zur Person) + Section D (Dauer der Beschäftigung)
 */
export default function SectionsB_PersonCD({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      <SectionDivider>
        C. Angaben zur ausländischen Arbeitnehmerin/zum ausländischen
        Arbeitnehmer
      </SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">
              16 Die ausländische Arbeitnehmerin/Der ausländische Arbeitnehmer
              ist in dem unter A bezeichneten Unternehmen/Unternehmensteil
              beschäftigt
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="label-text">seit (TT.MM.JJJJ)</span>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={toInputDate(form.txtf_16_seit)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  txtf_16_seit: fromInputDate(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="17 Vorname" value={form.txtf_17_Vorname} onChange={set("txtf_17_Vorname")} />
          <FormInput label="18 Nachname" value={form.txtf_18_Nachname} onChange={set("txtf_18_Nachname")} />
        </div>
        <FormInput
          label="19 derzeitiger Wohnort/Aufenthaltsort"
          value={form.txtf_19_Strasse}
          onChange={set("txtf_19_Strasse")}
        />

        {QUESTIONS_20_22.map(({ field, label }) => (
          <RadioGroup
            key={field}
            name={`modal_rbtn_${field}`}
            label={label}
            options={[
              { value: "ja", label: "Ja" },
              { value: "nein", label: "Nein" },
            ]}
            value={form[`rbtn_${field}`]}
            onChange={(v) => setForm((p) => ({ ...p, [`rbtn_${field}`]: v }))}
          />
        ))}
      </SectionCard>

      <SectionDivider>D. Angaben zur Dauer der Beschäftigung</SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">
              23 Dauer der Beschäftigung in Deutschland:
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CheckboxField
            label="Neueinreise"
            checked={form.chbx_23_Beschaeftigung}
            onChange={(v) => setForm((p) => ({ ...p, chbx_23_Beschaeftigung: v }))}
          />
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">ab (TT.MM.JJJJ)</span>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={toInputDate(form.txtf_23_Neueinreise_ab)}
              onChange={(e) =>
                setForm((p) => ({ ...p, txtf_23_Neueinreise_ab: fromInputDate(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">bis voraussichtlich (TT.MM.JJJJ)</span>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={toInputDate(form.txtf_23_Neueinreise_bis)}
              onChange={(e) =>
                setForm((p) => ({ ...p, txtf_23_Neueinreise_bis: fromInputDate(e.target.value) }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CheckboxField
            label="Verlängerung"
            checked={form.chbx_23_Verlaengerung}
            onChange={(v) => setForm((p) => ({ ...p, chbx_23_Verlaengerung: v }))}
          />
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">ab (TT.MM.JJJJ)</span>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={toInputDate(form.txtf_23_Verlaengerung_ab)}
              onChange={(e) =>
                setForm((p) => ({ ...p, txtf_23_Verlaengerung_ab: fromInputDate(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">bis voraussichtlich (TT.MM.JJJJ)</span>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={toInputDate(form.txtf_23_Verlaengerung_bis)}
              onChange={(e) =>
                setForm((p) => ({ ...p, txtf_23_Verlaengerung_bis: fromInputDate(e.target.value) }))
              }
            />
          </div>
        </div>
      </SectionCard>
    </>
  );
}
