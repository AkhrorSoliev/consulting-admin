import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

const Q9_OPTIONS = [
  {
    value:
      "Antrag auf Feststellung der Gleichwertigkeit der auslaendischen Berufsqualifikation mit einer inlaendischen Berufsqualifikation (weiter mit 10)",
    label:
      "Antrag auf Feststellung der Gleichwertigkeit der ausländischen Berufsqualifikation mit einer inländischen Berufsqualifikation (weiter mit 10)",
  },
  {
    value:
      "Antrag auf Erteilung einer Berufsausuebungserlaubnis – bei reglementierten Berufen (weiter mit 11)",
    label:
      "Antrag auf Erteilung einer Berufsausübungserlaubnis – bei reglementierten Berufen (weiter mit 11)",
  },
];

/**
 * ZusatzblattA - Section C: Angaben zum Anerkennungsverfahren
 */
export default function SectionsA_Anerkennung({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const setRadio = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>C. Angaben zum Anerkennungsverfahren</SectionDivider>
      <SectionCard>
        <FormInput
          label="4 Name der zuständigen Anerkennungsbehörde"
          value={form.txtf_4_Anerkennungsbehoerde}
          onChange={set("txtf_4_Anerkennungsbehoerde")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="5 Straße" value={form.txtf_5_Strasse} onChange={set("txtf_5_Strasse")} />
          <FormInput label="6 Hausnummer" value={form.txtf_6_Hausnummer} onChange={set("txtf_6_Hausnummer")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="7 Postleitzahl" value={form.txtf_7_PLZ} onChange={set("txtf_7_PLZ")} />
          <FormInput label="8 Ort" value={form.txtf_8_Ort} onChange={set("txtf_8_Ort")} />
        </div>

        <RadioGroup
          name="modal_rbtn_9_AntragAnerkennungsbehoerde"
          label="9 Welcher Antrag wurde bei der zuständigen Anerkennungsbehörde gestellt?"
          options={Q9_OPTIONS}
          value={form.rbtn_9_AntragAnerkennungsbehoerde}
          onChange={setRadio("rbtn_9_AntragAnerkennungsbehoerde")}
        />

        <RadioGroup
          name="modal_rbtn_10_UnterschiedeBerufsqualifikation"
          label="10 Hat die zuständige Behörde festgestellt, dass wesentliche Unterschiede im Vergleich zu einer inländischen Berufsqualifikation bestehen?"
          options={["ja", "nein"]}
          value={form.rbtn_10_UnterschiedeBerufsqualifikation}
          onChange={setRadio("rbtn_10_UnterschiedeBerufsqualifikation")}
        />

        <RadioGroup
          name="modal_rbtn_11_Sprachkenntnisse"
          label="11 Hat die zuständige Anerkennungsstelle festgestellt, dass Ausgleichsmaßnahmen oder weitere Qualifikationen (zum Beispiel Sprachkenntnisse) erforderlich sind? Bitte fügen Sie den Bescheid der zuständigen Anerkennungsbehörde bei."
          options={["ja", "nein"]}
          value={form.rbtn_11_Sprachkenntnisse}
          onChange={setRadio("rbtn_11_Sprachkenntnisse")}
        />

        <RadioGroup
          name="modal_rbtn_12_vollstaendigeAnerkennung"
          label="12 Falls bekannt: Kann nach Einschätzung der Anerkennungsbehörde die vollständige Anerkennung nach erfolgreichem Abschluss der vorgesehenen Qualifizierungsmaßnahme/n erlangt werden? Bitte fügen Sie eine entsprechende Erklärung der zuständigen Stelle bei, falls diese vorliegt."
          options={["ja", "nein"]}
          value={form.rbtn_12_vollstaendigeAnerkennung}
          onChange={setRadio("rbtn_12_vollstaendigeAnerkennung")}
        />
      </SectionCard>
    </>
  );
}
