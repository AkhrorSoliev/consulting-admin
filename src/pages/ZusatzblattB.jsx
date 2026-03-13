/**
 * ZusatzblattB - thin shell that composes sub-components from ./zusatzblatt/.
 */

import useZusatzblattForm from "./zusatzblatt/useZusatzblattForm";
import ZusatzblattLayout from "./zusatzblatt/ZusatzblattLayout";
import { ZUSATZBLATT_B_INITIAL } from "./zusatzblatt/zusatzblattBFields";
import {
  SectionArtAndUnternehmen,
  SectionUnternehmensgruppe,
  SectionArbeitnehmerUndDauer,
  SectionPersonalaustauschUndEntgelt,
} from "./zusatzblatt/ZusatzblattBSections";
import SectionEntgeltUndErklaerung from "./zusatzblatt/ZusatzblattBEntgelt";

export default function ZusatzblattB() {
  const hookData = useZusatzblattForm({
    templateKey: "zusatzblatt_b",
    pdfTemplate:
      "zusatzblatt_b_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
    initialForm: ZUSATZBLATT_B_INITIAL,
    dateResetKey: "txtf_31_Datum",
    filenameFn: (form) =>
      `Zusatzblatt_B_${form.txtf_4_Nachname || "Dokument"}.pdf`,
  });

  const { form, setForm } = hookData;

  return (
    <ZusatzblattLayout
      title="Zusatzblatt B"
      subtitle="Zusatzblatt B zum Formular Erklärung zum Beschäftigungsverhältnis"
      toolbarTitle="Zusatzblatt B"
      hookData={hookData}
    >
      <SectionArtAndUnternehmen form={form} setForm={setForm} />
      <SectionUnternehmensgruppe form={form} setForm={setForm} />
      <SectionArbeitnehmerUndDauer form={form} setForm={setForm} />
      <SectionPersonalaustauschUndEntgelt form={form} setForm={setForm} />
      <SectionEntgeltUndErklaerung form={form} setForm={setForm} />
    </ZusatzblattLayout>
  );
}
