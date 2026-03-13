import { todayDdMmYyyy } from "./dateUtils";

export const ZUSATZBLATT_C_INITIAL = {
  // Section A - Angaben zur Person
  txtf_1_vorname: "",
  txtf_2_name: "",
  txtf_3_wohnsitz: "",

  // Section B - Fahrerlaubnis
  rbtn_4_fahrerlaubnis: "",
  rbtn_5_fahrerlaubnis_ausgestellt: "",
  rbtn_6_fahrerlaubnis_schluesselzahl: "",
  rbtn_7_fahrerlaubnis_erworben: "",
  rbtn_8_fahrerlaubnis_drittstaat: "",
  rbtn_9_fahrerlaubnis_erteilt: "",

  // Section C - Grundqualifikation
  rbtn_10_fahrerqualifizierungsnachweis: "",
  rbtn_11_fuehrerschein: "",
  rbtn_12_fahrerbescheinigung: "",
  txtf_13_grundqualifikationsstaat: "",
  rbtn_14_grundqualifiziert: "",

  // Section D - Erwerb Fahrerlaubnis
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

  // Section - Sprachkurs
  txtf_21_erwerb_sprachkurs_wochen: "",
  txtf_21_erwerb_sprachkurs_monat: "",
  txtf_22_erwerb_sprachkurs_wochenstunden: "",
  txtf_23_erwerb_sprachkurs_freigestellt: "",

  // Section - Zeitlicher Ablauf
  rbtn_24_zeitlicher_ablauf: "",
  txtf_25_erwerb_begruendung: "",

  // Section E - Unterschrift
  txtf_26_erklarung_ort: "",
  txtf_27_erklarung_datum: todayDdMmYyyy(),
};

export const FAHRERLAUBNIS_QUESTIONS = [
  {
    name: "rbtn_4_fahrerlaubnis",
    label: "4 Ist der/die Arbeitnehmer/in im Besitz der für die jeweilige Beschäftigung als Berufskraftfahrer/in im Güterkraftverkehr oder Personenverkehr mit Kraftomnibussen erforderlichen EU- oder EWR-Fahrerlaubnis der Klassen C1, C1E, C, CE, D1, D1E, D oder DE?",
    options: [
      { value: "ja", label: "Ja" },
      { value: "nein", label: "Nein (weiter mit Ziffer 8)" },
    ],
  },
  {
    name: "rbtn_6_fahrerlaubnis_schluesselzahl",
    label: "6 Ist die EU- oder EWR-Fahrerlaubnis mit der Schlüsselzahl 70 versehen?",
    options: [
      { value: "ja", label: "Ja" },
      { value: "nein", label: "Nein (weiter mit Abschnitt C)" },
    ],
  },
  {
    name: "rbtn_8_fahrerlaubnis_drittstaat",
    label: "8 Ist der/die Arbeitnehmer/in im Besitz einer Fahrerlaubnis für den Güterverkehr oder für den Personenverkehr mit Kraftomnibussen aus einem Drittstaat?",
    options: [
      { value: "ja", label: "Ja (bitte Nachweis beifügen)" },
      { value: "nein", label: "Nein" },
    ],
  },
  {
    name: "rbtn_9_fahrerlaubnis_erteilt",
    label: "9 Wenn ja, wurde die Fahrerlaubnis von einem in Anlage 11 der Fahrerlaubnisverordnung aufgeführten Staaten erteilt und kann in der relevanten Fahrerlaubnisklasse prüfungsfrei umgeschrieben werden?",
    options: [
      { value: "ja", label: "Ja" },
      { value: "nein", label: "Nein" },
    ],
  },
];

export const GRUNDQUALIFIKATION_QUESTIONS = [
  {
    name: "rbtn_10_fahrerqualifizierungsnachweis",
    label: "10 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch einen Fahrerqualifizierungsnachweis aus einem EU-Mitgliedstaat oder EWR-Vertragsstaat oder der Schweiz?",
  },
  {
    name: "rbtn_11_fuehrerschein",
    label: "11 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch einen Führerschein aus einem EU-Mitgliedstaat oder EWR-Vertragsstaat oder der Schweiz, in den die Schlüsselzahl 95 eingetragen ist?",
  },
  {
    name: "rbtn_12_fahrerbescheinigung",
    label: "12 Verfügt der/die Arbeitnehmer/in über eine Grundqualifikation oder beschleunigte Grundqualifikation, die nachgewiesen wurde durch eine Fahrerbescheinigung nach Artikel 5 Absatz 1 der Verordnung (EG) Nummer 1072/2009?",
  },
  {
    name: "rbtn_14_grundqualifiziert",
    label: "14 Falls keiner der unter Ziffer 10 bis 12 genannten Nachweise vorgelegt werden kann: Gilt der Bewerber durch die Besitzstandsregelung des § 4 BKrFQG als grundqualifiziert?",
  },
];

export function buildZusatzblattCPayload(form, pdfTemplate) {
  const payload = {
    template: pdfTemplate,
    data: { textFields: {}, radioGroups: {}, checkboxes: {} },
  };
  Object.entries(form).forEach(([key, value]) => {
    if (key.startsWith("txtf_")) {
      payload.data.textFields[key] = value;
    } else if (key === "rbtn_5_fahrerlaubnis_ausgestellt") {
      payload.data.textFields[key] = value;
    } else if (key.startsWith("rbtn_") && value) {
      payload.data.radioGroups[key] = value;
    } else if (key.startsWith("chbx_")) {
      payload.data.checkboxes[key] = value;
    }
  });
  return payload;
}
