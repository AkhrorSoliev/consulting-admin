import {
  RadioGroup,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

/**
 * ZusatzblattA - Section D: Betriebliche Qualifizierungsmaßnahme
 * and Section E: Beschäftigung während Anerkennung
 */
export default function SectionsA_QualifizierungDE({ form, setForm }) {
  const setRadio = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>D. Betriebliche Qualifizierungsmaßnahme</SectionDivider>
      <SectionCard>
        <RadioGroup
          name="modal_rbtn_13_betrieblicheQualifizierung"
          label="13 Handelt es sich um eine überwiegend betriebliche Qualifizierung im Rahmen des Anerkennungsverfahrens (mehr als die Hälfte der Qualifizierungsmaßnahme erfolgt im Rahmen einer Beschäftigung in einem Betrieb)? Bitte fügen Sie einen Weiterbildungsplan für die Qualifizierungsmaßnahme bei. Aus dem Weiterbildungsplan muss hervorgehen, in welcher Form, auf welche Art und Weise und/oder mit welchen Methoden die im Bescheid der zuständigen Stelle aufgelisteten Unterschiede ausgeglichen werden sollen."
          options={["ja", "nein"]}
          value={form.rbtn_13_betrieblicheQualifizierung}
          onChange={setRadio("rbtn_13_betrieblicheQualifizierung")}
        />
      </SectionCard>

      <SectionDivider>
        E. Beschäftigung, die zusätzlich zu einer Qualifizierungsmaßnahme ausgeübt wird
      </SectionDivider>
      <SectionCard>
        <RadioGroup
          name="modal_rbtn_14_Betriebsdauer"
          label="14 Bitte machen Sie Angaben zur Beschäftigungsdauer."
          options={[
            {
              value:
                "Die Beschaeftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G)",
              label:
                "Die Beschäftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G).",
            },
            {
              value:
                "Die Beschaeftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschaeftigung waehrend des Anerkennungsverfahrens und der spaeteren Beschaeftigung nach Erlangung der vollstaendigen Anerkennung besteht ein berufsfachlicher Zusammenhang",
              label:
                "Die Beschäftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschäftigung während des Anerkennungsverfahrens und der späteren Beschäftigung nach Erlangung der vollständigen Anerkennung besteht ein berufsfachlicher Zusammenhang.",
            },
          ]}
          value={form.rbtn_14_Betriebsdauer}
          onChange={setRadio("rbtn_14_Betriebsdauer")}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium whitespace-normal">
              Bitte geben Sie die Gründe des berufsfachlichen Zusammenhangs an:
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-24"
            value={form.txtf_14_Gruende_beruflicherZusammenhang}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                txtf_14_Gruende_beruflicherZusammenhang: e.target.value,
              }))
            }
          />
        </div>
      </SectionCard>
    </>
  );
}
