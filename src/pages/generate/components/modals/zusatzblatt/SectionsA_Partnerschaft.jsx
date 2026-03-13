import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  CheckboxField,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";
import { toInputDate, fromInputDate } from "./modalUtils";

const Q17_OPTIONS = [
  {
    value:
      "Die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifuegen)",
    label:
      "Die durch die zuständige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen können nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifügen) oder",
  },
  {
    value:
      "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifuegen)",
    label:
      "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifügen) oder",
  },
  {
    value:
      "die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen weitgehend \nbetriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen",
    label:
      "die durch die zuständige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen können weitgehend betriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen:",
  },
];

/**
 * ZusatzblattA - Section F: Anerkennungspartnerschaft
 */
export default function SectionsA_Partnerschaft({ form, setForm }) {
  const chk = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));
  const setRadio = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>F. Beschäftigung während der Anerkennungspartnerschaft</SectionDivider>
      <SectionCard>
        <div className="space-y-2">
          <CheckboxField
            label="Während der Anerkennungspartnerschaft soll eine qualifizierte Beschäftigung ausgeübt werden (weiter mit Abschnitt G)."
            checked={form.chbx_15g_Zielberuf}
            onChange={chk("chbx_15g_Zielberuf")}
          />
          <CheckboxField
            label="Während der Anerkennungspartnerschaft kann nur eine nicht qualifizierte Beschäftigung ausgeübt werden, da zur Ausübung der qualifizierten Beschäftigung eine Berufsausübungserlaubnis erforderlich wäre."
            checked={form.chbx_15h_Zielberuf}
            onChange={chk("chbx_15h_Zielberuf")}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">
              15 Bitte wählen Sie Zutreffendes aus und machen Sie Angaben zum Zielberuf:
            </span>
          </label>
          <div className="space-y-2">
            <CheckboxField
              label="Die Arbeitnehmerin/Der Arbeitnehmer hat sich in einer Vereinbarung mit mir als Arbeitgeber verpflichtet, spätestens unverzüglich nach der Einreise die Anerkennung ihrer/seiner im Ausland erworbenen Berufsqualifikation bei der zuständigen Anerkennungsstelle zu beantragen (bitte Nachweis beifügen)."
              checked={form.chbx_15a_Zielberuf}
              onChange={chk("chbx_15a_Zielberuf")}
            />
            <CheckboxField
              label="Ich als Arbeitgeber habe mich in einer Vereinbarung mit der Arbeitnehmerin/dem Arbeitnehmer verpflichtet, der Arbeitnehmerin/dem Arbeitnehmer die von der zuständigen Anerkennungsstelle gegebenenfalls geforderten Qualifizierungsmaßnahmen im Rahmen des Arbeitsverhältnisses zu ermöglichen (bitte Nachweis beifügen)."
              checked={form.chbx_15b_Zielberuf}
              onChange={chk("chbx_15b_Zielberuf")}
            />
            <CheckboxField
              label="Mir ist bekannt, dass die Arbeitnehmerin/der Arbeitnehmer das Anerkennungsverfahren so verfolgen sollte, dass der (Teil-)Anerkennungsbescheid der zuständigen Anerkennungsbehörde spätestens 12 Monate nach Einreise vorliegt."
              checked={form.chbx_15c_Zielberuf}
              onChange={chk("chbx_15c_Zielberuf")}
            />
          </div>
        </div>

        <FormInput
          label="Der geplante Zielberuf nach erfolgreicher Anerkennung der Berufsqualifikation der Arbeitnehmerin/des Arbeitnehmers lautet:"
          value={form.txtf_15_geplanterZielberuf}
          onChange={(e) => setForm((p) => ({ ...p, txtf_15_geplanterZielberuf: e.target.value }))}
        />

        <div className="space-y-2">
          <CheckboxField
            label="Ich als Arbeitgeber bin für eine Ausbildung oder Nachqualifizierung im geplanten Zielberuf geeignet (bitte Nachweise wie zum Beispiel Ausbildungsberechtigung, Meisterbetrieb, letzte in der Lehrlingsrolle eingetragene Ausbildungen des Betriebs oder bereits erfolgreiche Nachqualifizierungen im Rahmen eines Anerkennungsverfahrens beifügen)."
            checked={form.chbx_15d_Zielberuf}
            onChange={chk("chbx_15d_Zielberuf")}
          />
          <CheckboxField
            label="Ich als Arbeitgeber bin eine Pflegeeinrichtung im Sinne des § 72 Sozialgesetzbuch XI (bitte Nachweis beifügen) (weiter mit Abschnitt G)."
            checked={form.chbx_15e_Zielberuf}
            onChange={chk("chbx_15e_Zielberuf")}
          />
          <CheckboxField
            label="Ich als Arbeitgeber und die angebotenen Beschäftigungsbedingungen unterliegen kirchlichem Recht (bitte Nachweis beifügen)."
            checked={form.chbx_15f_Zielberuf}
            onChange={chk("chbx_15f_Zielberuf")}
          />
        </div>

        <RadioGroup
          name="modal_rbtn_16_Anerkennungsbescheid"
          label="16 Liegt bereits ein (Teil-)Anerkennungsbescheid vor?"
          options={[
            { value: "ja - (bitte Nachweis beifuegen und auch Abschnitt C. ausfuellen)", label: "Ja (bitte Nachweis beifügen und auch Abschnitt C ausfüllen)" },
            { value: "nein (weiter mit Abschnitt G.)", label: "Nein (weiter mit Abschnitt G)" },
          ]}
          value={form.rbtn_16_Anerkennungsbescheid}
          onChange={setRadio("rbtn_16_Anerkennungsbescheid")}
        />

        <RadioGroup
          name="modal_rbtn_17_Nachqualifizierung"
          label="17 Bitte wählen Sie Zutreffendes zur Nachqualifizierung aus:"
          options={Q17_OPTIONS}
          value={form.rbtn_17_Nachqualifizierung}
          onChange={setRadio("rbtn_17_Nachqualifizierung")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="von (TT.MM.JJJJ)"
            type="date"
            value={toInputDate(form.txtf_17_von)}
            onChange={(e) => setForm((p) => ({ ...p, txtf_17_von: fromInputDate(e.target.value) }))}
          />
          <FormInput
            label="bis (TT.MM.JJJJ)"
            type="date"
            value={toInputDate(form.txtf_17_bis)}
            onChange={(e) => setForm((p) => ({ ...p, txtf_17_bis: fromInputDate(e.target.value) }))}
          />
        </div>
      </SectionCard>
    </>
  );
}
