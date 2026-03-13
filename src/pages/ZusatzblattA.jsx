/**
 * ZusatzblattA - thin shell that composes sub-components from ./zusatzblatt/.
 */

import useZusatzblattForm from "./zusatzblatt/useZusatzblattForm";
import ZusatzblattLayout from "./zusatzblatt/ZusatzblattLayout";
import { ZUSATZBLATT_A_INITIAL } from "./zusatzblatt/zusatzblattAFields";
import {
  SectionAB,
  SectionCD,
  SectionEF,
  SectionGH,
} from "./zusatzblatt/ZusatzblattASections";

export default function ZusatzblattA() {
  const hookData = useZusatzblattForm({
    templateKey: "zusatzblatt_a",
    pdfTemplate:
      "zusatzblatt_a_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
    initialForm: ZUSATZBLATT_A_INITIAL,
    dateResetKey: "txtf_21_Datum",
    filenameFn: (form) =>
      `Zusatzblatt_A_${form.txtf_2_Nachname || "Dokument"}.pdf`,
  });

  const { form, setForm } = hookData;

  return (
    <ZusatzblattLayout
      title="Zusatzblatt A"
      subtitle="Zusatzblatt A zum Formular Erklärung zum Beschäftigungsverhältnis"
      toolbarTitle="Zusatzblatt A"
      hookData={hookData}
    >
      <SectionAB form={form} setForm={setForm} />
      <SectionCD form={form} setForm={setForm} />
      <SectionEF form={form} setForm={setForm} />
      <SectionGH form={form} setForm={setForm} />
    </ZusatzblattLayout>
  );
}
