/**
 * ZusatzblattC - thin shell that composes sub-components from ./zusatzblatt/.
 */

import useZusatzblattForm from "./zusatzblatt/useZusatzblattForm";
import ZusatzblattLayout from "./zusatzblatt/ZusatzblattLayout";
import { ZUSATZBLATT_C_INITIAL } from "./zusatzblatt/zusatzblattCFields";
import {
  SectionPersonUndFahrerlaubnis,
  SectionGrundqualifikation,
  SectionErwerbUndUnterschrift,
} from "./zusatzblatt/ZusatzblattCSections";

export default function ZusatzblattC() {
  const hookData = useZusatzblattForm({
    templateKey: "zusatzblatt_c",
    pdfTemplate:
      "zusatzblatt_c_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
    initialForm: ZUSATZBLATT_C_INITIAL,
    dateResetKey: "txtf_15_datum",
    filenameFn: (form) =>
      `Zusatzblatt_C_${form.txtf_2_name || "Dokument"}.pdf`,
  });

  const { form, setForm } = hookData;

  return (
    <ZusatzblattLayout
      title="Zusatzblatt C"
      subtitle="Zusatzblatt C zum Formular Erklärung zum Beschäftigungsverhältnis"
      toolbarTitle="Zusatzblatt C"
      hookData={hookData}
    >
      <SectionPersonUndFahrerlaubnis form={form} setForm={setForm} />
      <SectionGrundqualifikation form={form} setForm={setForm} />
      <SectionErwerbUndUnterschrift form={form} setForm={setForm} />
    </ZusatzblattLayout>
  );
}
