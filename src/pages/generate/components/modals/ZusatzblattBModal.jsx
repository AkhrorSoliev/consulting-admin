import { todayDdMmYyyy } from "./zusatzblatt/modalUtils";
import useZusatzblattForm from "./zusatzblatt/useZusatzblattForm";
import ZusatzblattModalShell from "./zusatzblatt/ZusatzblattModalShell";
import SectionsB_ArtEntsendendes from "./zusatzblatt/SectionsB_ArtEntsendendes";
import SectionsB_Unternehmensgruppe from "./zusatzblatt/SectionsB_Unternehmensgruppe";
import SectionsB_PersonCD from "./zusatzblatt/SectionsB_PersonCD";
import SectionsB_EntgeltErklaerung from "./zusatzblatt/SectionsB_EntgeltErklaerung";

const getInitialForm = (candidateData) => ({
  chbx_1_ICT: false,
  chbx_1_Personalaustausch: false,
  chbx_1_Beschaeftigung: false,
  txtf_2_Firma: "",
  txtf_3_Vorname: "",
  txtf_4_Nachname: "",
  txtf_5_Strasse: "",
  txtf_6_Hausnummer: "",
  txtf_7_PLZ: "",
  txtf_8_Ort: "",
  txtf_9_Land: "",
  rbtn_10_Sitz_des_Unternehmens: "",
  chbx_11_Unternehmen: false,
  chbx_11_Unternehmensgruppe: false,
  chbx_11_Konzern: false,
  rbtn_12_Kapital: "",
  rbtn_13_Stimmrechte: "",
  rbtn_14_Mitglieder: "",
  rbtn_15_Mutterunternehmen: "",
  txtf_16_seit: "",
  txtf_17_Vorname: candidateData?.personalInfo?.name || "",
  txtf_18_Nachname: candidateData?.personalInfo?.lastName || "",
  txtf_19_Strasse: "",
  rbtn_20_Entsendung: "",
  rbtn_21_Arbeitsverhaeltnis: "",
  rbtn_22_Beendigung: "",
  chbx_23_Beschaeftigung: false,
  chbx_23_Verlaengerung: false,
  txtf_23_Neueinreise_ab: "",
  txtf_23_Neueinreise_bis: "",
  txtf_23_Verlaengerung_ab: "",
  txtf_23_Verlaengerung_bis: "",
  rbtn_24_Arbeitnehmer_de: "",
  txtf_25_letztes_Kalenderjahr: "",
  txtf_25_vorletztes_Kalenderjahr: "",
  txtf_26_Grundgehalt: "",
  txtf_27_Tabelle_Z2_S1: "",
  txtf_27_Tabelle_Z2_S2: "",
  txtf_27_Tabelle_Z3_S1: "",
  txtf_27_Tabelle_Z3_S2: "",
  txtf_27_Tabelle_Z4_S1: "",
  txtf_27_Tabelle_Z4_S2: "",
  txtf_27_Tabelle_Z5_S1: "",
  txtf_27_Tabelle_Z5_S2: "",
  txtf_27_Tabelle_Z6_S1: "",
  txtf_27_Tabelle_Z6_S2: "",
  txtf_28_Tabelle_Z2_S1: "",
  txtf_28_Tabelle_Z2_S2: "",
  txtf_28_Tabelle_Z3_S1: "",
  txtf_28_Tabelle_Z3_S2: "",
  txtf_29_Arbeitsentgelt: "",
  txtf_30_Ergaenzug: "",
  txtf_31_Ort: "",
  txtf_32_Datum: todayDdMmYyyy(),
});

export default function ZusatzblattBModal({ open, onClose, candidateData }) {
  const { form, setForm, isDownloading, handleDownloadPdf } =
    useZusatzblattForm({
      open,
      getInitialForm: () => getInitialForm(candidateData),
      defaultsKey: "zusatzblatt_b",
      pdfTemplate:
        "zusatzblatt_b_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
      getFilename: (f) =>
        `Zusatzblatt_B_${f.txtf_18_Nachname || "Dokument"}.pdf`,
      deps: candidateData,
    });

  if (!open) return null;

  return (
    <ZusatzblattModalShell
      title="Zusatzblatt B - ICT / Personalaustausch"
      isDownloading={isDownloading}
      onDownload={handleDownloadPdf}
      onClose={onClose}
    >
      <SectionsB_ArtEntsendendes form={form} setForm={setForm} />
      <SectionsB_Unternehmensgruppe form={form} setForm={setForm} />
      <SectionsB_PersonCD form={form} setForm={setForm} />
      <SectionsB_EntgeltErklaerung form={form} setForm={setForm} />
    </ZusatzblattModalShell>
  );
}
