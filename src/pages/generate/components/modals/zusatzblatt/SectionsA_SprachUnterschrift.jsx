import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  CheckboxField,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";
import { toInputDate, fromInputDate } from "./modalUtils";

/**
 * ZusatzblattA - Section G: Sprachkenntnisse + Section H: Unterschrift
 */
export default function SectionsA_SprachUnterschrift({ form, setForm }) {
  const chk = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>G. Sprachkenntnisse</SectionDivider>
      <SectionCard>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">
              18 Bitte machen Sie Angaben zu den Sprachkenntnissen der
              Arbeitnehmerin/des Arbeitnehmers.
            </span>
          </label>
          <div className="space-y-2">
            <CheckboxField
              label="Die Arbeitnehmerin/Der Arbeitnehmer verfügt über zertifizierte deutsche Sprachkenntnisse des Gemeinsamen Europäischen Referenzrahmens."
              checked={form.chbx_18_a}
              onChange={chk("chbx_18_a")}
            />
            <CheckboxField
              label="Das Niveau ist nicht bekannt beziehungsweise es liegt kein Sprachzertifikat zu Deutschkenntnissen vor (weiter mit Abschnitt H)."
              checked={form.chbx_18_b}
              onChange={chk("chbx_18_b")}
            />
            <CheckboxField
              label="Die Arbeitnehmerin/Der Arbeitnehmer wird begleitend zu der Beschäftigung weitere deutsche Sprachkenntnisse erwerben."
              checked={form.chbx_18_c}
              onChange={chk("chbx_18_c")}
            />
            <CheckboxField
              label="Die Qualifizierungsmaßnahme oder Tätigkeit kann mit den nachweislich vorhandenen deutschen Sprachkenntnissen ausgeübt werden."
              checked={form.chbx_18_d}
              onChange={chk("chbx_18_d")}
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">
              Bitte erläutern Sie die Gründe (gegebenenfalls werden weitere
              Nachweise zur Glaubhaftmachung verlangt):
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-20"
            value={form.txtf_18_Sprachkenntnisse}
            onChange={(e) =>
              setForm((p) => ({ ...p, txtf_18_Sprachkenntnisse: e.target.value }))
            }
          />
        </div>

        <RadioGroup
          name="modal_rbtn_19_Sprachniveau"
          label="19 Bitte geben Sie das deutsche Sprachniveau an und fügen Sie einen entsprechenden Nachweis bei, falls vorhanden."
          options={["A1", "A2", "B1", "B2", "C1", "C2"]}
          value={form.rbtn_19_Sprachniveau}
          onChange={(v) => setForm((p) => ({ ...p, rbtn_19_Sprachniveau: v }))}
        />
      </SectionCard>

      <SectionDivider>H. Erklärung und Unterschrift</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="20 Ort"
            value={form.txtf_20_Ort}
            onChange={(e) => setForm((p) => ({ ...p, txtf_20_Ort: e.target.value }))}
          />
          <FormInput
            label="21 Datum"
            type="date"
            value={toInputDate(form.txtf_21_Datum)}
            onChange={(e) =>
              setForm((p) => ({ ...p, txtf_21_Datum: fromInputDate(e.target.value) }))
            }
          />
        </div>
      </SectionCard>
    </>
  );
}
