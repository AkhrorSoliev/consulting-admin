import { FaInfoCircle } from "react-icons/fa";
import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

/**
 * ZusatzblattC - Section C: Grundqualifikation oder beschleunigte Grundqualifikation
 */
export default function SectionsC_Grundqualifikation({ form, setForm }) {
  const setRadio = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>
        C. Angaben zur Grundqualifikation oder beschleunigten Grundqualifikation
      </SectionDivider>
      <SectionCard>
        <RadioGroup
          name="modal_rbtn_10_fahrerqualifizierungsnachweis"
          label="10 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch einen Fahrerqualifizierungsnachweis aus einem EU-Mitgliedstaat oder EWR-Vertragsstaat oder der Schweiz?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_10_fahrerqualifizierungsnachweis}
          onChange={setRadio("rbtn_10_fahrerqualifizierungsnachweis")}
        />

        <RadioGroup
          name="modal_rbtn_11_fuehrerschein"
          label="11 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch einen Führerschein aus einem EU-Mitgliedstaat oder EWR-Vertragsstaat oder der Schweiz, in den die Schlüsselzahl 95 eingetragen ist?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_11_fuehrerschein}
          onChange={setRadio("rbtn_11_fuehrerschein")}
        />

        <p className="text-sm opacity-70">oder</p>

        <RadioGroup
          name="modal_rbtn_12_fahrerbescheinigung"
          label="12 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch eine Fahrerbescheinigung nach Artikel 5 Absatz 1 der Verordnung (EG) Nummer 1072/2009?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_12_fahrerbescheinigung}
          onChange={setRadio("rbtn_12_fahrerbescheinigung")}
        />

        <FormInput
          label='13 Nur zu beantworten, wenn Ziffer 10, 11 oder 12 mit "Ja" beantwortet wurde: Bitte Staat angeben, in dem die Grundqualifikation oder beschleunigte Grundqualifikation erworben wurde.'
          value={form.txtf_13_grundqualifikationsstaat}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              txtf_13_grundqualifikationsstaat: e.target.value,
            }))
          }
        />

        <RadioGroup
          name="modal_rbtn_14_grundqualifiziert"
          label="14 Falls keiner der unter Ziffer 10 bis 12 genannten Nachweise vorgelegt werden kann: Gilt der Bewerber durch die Besitzstandsregelung des § 4 BKrFQG als grundqualifiziert?"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_14_grundqualifiziert}
          onChange={setRadio("rbtn_14_grundqualifiziert")}
        />

        <div className="alert alert-info">
          <FaInfoCircle className="text-lg" />
          <div className="text-sm">
            <strong>Hinweis</strong> Für die Besitzstandsregelung ist eine
            Weiterbildung von 35 Stunden erforderlich, wenn sie nicht bereits in
            den letzten fünf Jahren während einer früheren Beschäftigung in
            einem EU-/EWR-Staat oder der Schweiz absolviert wurde.
          </div>
        </div>
      </SectionCard>
    </>
  );
}
