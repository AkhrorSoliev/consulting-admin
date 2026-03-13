import { RadioGroup, SectionCard } from "../../../../zusatzblatt/FormFields";

const ART_OPTIONS = [
  {
    value:
      "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist \n(bitte die Abschnitte C, D, G und H ausfuellen)",
    label:
      "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist (bitte die Abschnitte C, D, G und H ausfüllen)",
  },
  {
    value:
      "Beschaeftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeuebt wird \n(bitte die Abschnitte C, E, G und H ausfuellen)",
    label:
      "Beschäftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeübt wird (bitte die Abschnitte C, E, G und H ausfüllen)",
  },
  {
    value:
      "Beschaeftigung waehrend der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfuellen)",
    label:
      "Beschäftigung während der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfüllen)",
  },
];

/**
 * ZusatzblattA - Section B: Art der Beschäftigung
 */
export default function SectionsA_ArtBeschaeftigung({ form, setForm }) {
  return (
    <SectionCard>
      <RadioGroup
        name="modal_rbtn_B_ArtBeschaeftigung"
        label='B. Um welche Art der Beschäftigung beziehungsweise Qualifizierung handelt es sich im Formular „Erklärung zum Beschäftigungsverhältnis"?'
        options={ART_OPTIONS}
        value={form.rbtn_B_ArtBeschaeftigung}
        onChange={(v) => setForm((p) => ({ ...p, rbtn_B_ArtBeschaeftigung: v }))}
      />
    </SectionCard>
  );
}
