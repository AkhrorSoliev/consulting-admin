import FormInput from "../../../../components/FormInput";
import { SectionDivider, SectionCard } from "../../../zusatzblatt/FormFields";
import { todayDdMmYyyy, toInputDate, fromInputDate } from "./zusatzblatt/modalUtils";
import useZusatzblattForm from "./zusatzblatt/useZusatzblattForm";
import ZusatzblattModalShell from "./zusatzblatt/ZusatzblattModalShell";
import SectionsC_PersonFahrerlaubnis from "./zusatzblatt/SectionsC_PersonFahrerlaubnis";
import SectionsC_Grundqualifikation from "./zusatzblatt/SectionsC_Grundqualifikation";
import SectionsC_Erwerb from "./zusatzblatt/SectionsC_Erwerb";

const getInitialForm = (candidateData) => ({
  txtf_1_vorname: candidateData?.personalInfo?.name || "",
  txtf_2_name: candidateData?.personalInfo?.lastName || "",
  txtf_3_wohnsitz: "",
  rbtn_4_fahrerlaubnis: "",
  rbtn_5_fahrerlaubnis_ausgestellt: "",
  rbtn_6_fahrerlaubnis_schluesselzahl: "",
  rbtn_7_fahrerlaubnis_erworben: "",
  rbtn_8_fahrerlaubnis_drittstaat: "",
  rbtn_9_fahrerlaubnis_erteilt: "",
  rbtn_10_fahrerqualifizierungsnachweis: "",
  rbtn_11_fuehrerschein: "",
  rbtn_12_fahrerbescheinigung: "",
  txtf_13_grundqualifikationsstaat: "",
  rbtn_14_grundqualifiziert: "",
  chbx_erwerb_fahrerlaubnis_1: false,
  chbx_erwerb_fahrerlaubnis_2: false,
  chbx_erwerb_fahrerlaubnis_3: false,
  txtf_15_erwerb_kurs_wochen: "",
  txtf_15_erwerb_kurs_monat: "",
  txtf_16_erwerb_kurs_wochenstunden: "",
  txtf_17_erwerb_kurs_freigestellt: "",
  txtf_18_beschaeftigungsaufnahme_kurs_wochen: "",
  txtf_18_beschaeftigungsaufnahme_kurs_monat: "",
  txtf_19_weiterbildung_kurs_wochenstunden: "",
  txtf_20_weiterbildung_kurs_freigestellt: "",
  txtf_21_erwerb_sprachkurs_wochen: "",
  txtf_21_erwerb_sprachkurs_monat: "",
  txtf_22_erwerb_sprachkurs_wochenstunden: "",
  txtf_23_erwerb_sprachkurs_freigestellt: "",
  rbtn_24_zeitlicher_ablauf: "",
  txtf_25_erwerb_begruendung: "",
  txtf_26_erklarung_ort: "",
  txtf_27_erklarung_datum: todayDdMmYyyy(),
});

export default function ZusatzblattCModal({ open, onClose, candidateData }) {
  const { form, setForm, isDownloading, handleDownloadPdf } =
    useZusatzblattForm({
      open,
      getInitialForm: () => getInitialForm(candidateData),
      defaultsKey: "zusatzblatt_c",
      pdfTemplate:
        "zusatzblatt_c_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
      getFilename: (f) => `Zusatzblatt_C_${f.txtf_2_name || "Dokument"}.pdf`,
      textFieldOverrides: ["rbtn_5_fahrerlaubnis_ausgestellt"],
      deps: candidateData,
    });

  if (!open) return null;

  return (
    <ZusatzblattModalShell
      title="Zusatzblatt C - Berufskraftfahrer"
      isDownloading={isDownloading}
      onDownload={handleDownloadPdf}
      onClose={onClose}
    >
      <SectionsC_PersonFahrerlaubnis form={form} setForm={setForm} />
      <SectionsC_Grundqualifikation form={form} setForm={setForm} />
      <SectionsC_Erwerb form={form} setForm={setForm} />

      {/* Section E - Erklärung und Unterschrift (small, inline) */}
      <SectionDivider>E. Erklärung und Unterschrift</SectionDivider>
      <SectionCard>
        <p className="text-sm opacity-70">
          Die Richtigkeit der Angaben wird durch Datum und Unterschrift
          bestätigt. Der Arbeitsvertrag verpflichtet zur Teilnahme an Maßnahmen
          zur Erlangung der oben genannten Weiterbildungen und Qualifikationen.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="26 Ort"
            value={form.txtf_26_erklarung_ort}
            onChange={(e) =>
              setForm((p) => ({ ...p, txtf_26_erklarung_ort: e.target.value }))
            }
          />
          <FormInput
            label="27 Datum"
            type="date"
            value={toInputDate(form.txtf_27_erklarung_datum)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                txtf_27_erklarung_datum: fromInputDate(e.target.value),
              }))
            }
          />
        </div>
      </SectionCard>
    </ZusatzblattModalShell>
  );
}
