import { todayDdMmYyyy } from "./zusatzblatt/modalUtils";
import useZusatzblattForm from "./zusatzblatt/useZusatzblattForm";
import ZusatzblattModalShell from "./zusatzblatt/ZusatzblattModalShell";
import SectionsA_Person from "./zusatzblatt/SectionsA_Person";
import SectionsA_ArtBeschaeftigung from "./zusatzblatt/SectionsA_ArtBeschaeftigung";
import SectionsA_Anerkennung from "./zusatzblatt/SectionsA_Anerkennung";
import SectionsA_QualifizierungDE from "./zusatzblatt/SectionsA_QualifizierungDE";
import SectionsA_Partnerschaft from "./zusatzblatt/SectionsA_Partnerschaft";
import SectionsA_SprachUnterschrift from "./zusatzblatt/SectionsA_SprachUnterschrift";

const getInitialForm = (candidateData) => ({
  txtf_1_Vorname: candidateData?.personalInfo?.name || "",
  txtf_2_Nachname: candidateData?.personalInfo?.lastName || "",
  txtf_3_Wohnsitz: "",
  rbtn_B_ArtBeschaeftigung: "",
  txtf_4_Anerkennungsbehoerde: "",
  txtf_5_Strasse: "",
  txtf_6_Hausnummer: "",
  txtf_7_PLZ: "",
  txtf_8_Ort: "",
  rbtn_9_AntragAnerkennungsbehoerde: "",
  rbtn_10_UnterschiedeBerufsqualifikation: "",
  rbtn_11_Sprachkenntnisse: "",
  rbtn_12_vollstaendigeAnerkennung: "",
  rbtn_13_betrieblicheQualifizierung: "",
  rbtn_14_Betriebsdauer: "",
  txtf_14_Gruende_beruflicherZusammenhang: "",
  txtf_15_geplanterZielberuf: "",
  chbx_15a_Zielberuf: false,
  chbx_15b_Zielberuf: false,
  chbx_15c_Zielberuf: false,
  chbx_15d_Zielberuf: false,
  chbx_15e_Zielberuf: false,
  chbx_15f_Zielberuf: false,
  chbx_15g_Zielberuf: false,
  chbx_15h_Zielberuf: false,
  rbtn_16_Anerkennungsbescheid: "",
  rbtn_17_Nachqualifizierung: "",
  txtf_17_von: "",
  txtf_17_bis: "",
  txtf_18_Sprachkenntnisse: "",
  chbx_18_a: false,
  chbx_18_b: false,
  chbx_18_c: false,
  chbx_18_d: false,
  rbtn_19_Sprachniveau: "",
  txtf_20_Ort: "",
  txtf_21_Datum: todayDdMmYyyy(),
});

export default function ZusatzblattAModal({ open, onClose, candidateData }) {
  const { form, setForm, isDownloading, handleDownloadPdf } =
    useZusatzblattForm({
      open,
      getInitialForm: () => getInitialForm(candidateData),
      defaultsKey: "zusatzblatt_a",
      pdfTemplate:
        "zusatzblatt_a_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
      getFilename: (f) => `Zusatzblatt_A_${f.txtf_2_Nachname || "Dokument"}.pdf`,
      deps: candidateData,
    });

  if (!open) return null;

  return (
    <ZusatzblattModalShell
      title="Zusatzblatt A - Anerkennungsverfahren"
      isDownloading={isDownloading}
      onDownload={handleDownloadPdf}
      onClose={onClose}
    >
      <SectionsA_Person form={form} setForm={setForm} />
      <SectionsA_ArtBeschaeftigung form={form} setForm={setForm} />
      <SectionsA_Anerkennung form={form} setForm={setForm} />
      <SectionsA_QualifizierungDE form={form} setForm={setForm} />
      <SectionsA_Partnerschaft form={form} setForm={setForm} />
      <SectionsA_SprachUnterschrift form={form} setForm={setForm} />
    </ZusatzblattModalShell>
  );
}
