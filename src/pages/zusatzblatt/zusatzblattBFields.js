import { todayDdMmYyyy } from "./dateUtils";

export const ZUSATZBLATT_B_INITIAL = {
  // Section A - Art der Beschäftigung
  chbx_1_ICT: false,
  chbx_1_Personalaustausch: false,
  chbx_1_Beschaeftigung: false,

  // Section B - Aufnehmendes Unternehmen
  txtf_2_Firma: "",
  txtf_3_Vorname: "",
  txtf_4_Nachname: "",
  txtf_5_Strasse: "",
  txtf_6_Hausnummer: "",
  txtf_7_PLZ: "",
  txtf_8_Ort: "",
  txtf_9_Land: "",
  rbtn_10_Sitz_des_Unternehmens: "",

  // Section C - Unternehmensverbund
  chbx_11_Unternehmen: false,
  chbx_11_Unternehmensgruppe: false,
  chbx_11_Konzern: false,
  rbtn_12_Kapital: "",
  rbtn_13_Stimmrechte: "",
  rbtn_14_Mitglieder: "",
  rbtn_15_Mutterunternehmen: "",
  txtf_16_seit: "",

  // Section D - Entsendende Person
  txtf_17_Vorname: "",
  txtf_18_Nachname: "",
  txtf_19_Strasse: "",
  rbtn_20_Entsendung: "",
  rbtn_21_Arbeitsverhaeltnis: "",
  rbtn_22_Beendigung: "",

  // Section D - Beschäftigungszeitraum
  chbx_23_Beschaeftigung: false,
  chbx_23_Verlaengerung: false,
  txtf_23_Neueinreise_ab: "",
  txtf_23_Neueinreise_bis: "",
  txtf_23_Verlaengerung_ab: "",
  txtf_23_Verlaengerung_bis: "",
  rbtn_24_Arbeitnehmer_de: "",
  txtf_25_letztes_Kalenderjahr: "",
  txtf_25_vorletztes_Kalenderjahr: "",

  // Section F - Arbeitsentgelt
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

  // Section G - Ergänzungen
  txtf_30_Ergaenzug: "",

  // Section H - Unterschrift
  txtf_31_Ort: "",
  txtf_32_Datum: todayDdMmYyyy(),
};

export const SITZ_OPTIONS = [
  { value: "ausserhalb der Europaeischen Union", label: "außerhalb der Europäischen Union" },
  { value: "innerhalb der Europaeischen Union", label: "innerhalb der Europäischen Union" },
];

export const UNTERNEHMENSGRUPPE_FIELDS = [
  { field: "12_Kapital", label: "12 Ein Unternehmen besitzt die Mehrheit des Kapitals (mehr als 50 %) des anderen Unternehmens beziehungsweise der anderen Unternehmen:" },
  { field: "13_Stimmrechte", label: "13 Ein Unternehmen besitzt die Mehrheit der Stimmrechte (mehr als 50 %) des anderen Unternehmens beziehungsweise der anderen Unternehmen:" },
  { field: "14_Mitglieder", label: "14 Ein Unternehmen darf die Mehrheit der Mitglieder des Verwaltungs-, Leitungs- oder Aufsichtsorgans (mehr als 50 %) stellen:" },
  { field: "15_Mutterunternehmen", label: "15 Die Unternehmen beziehungsweise die Unternehmensteile stehen unter der Leitung desselben Mutterunternehmens:" },
];

export const ENTSENDUNG_FIELDS = [
  { field: "20_Entsendung", label: "20 Die Möglichkeit und die Bedingungen für eine Entsendung/einen Transfer/Personalaustausch sind im Arbeitsvertrag, einer Entsendungsvereinbarung oder einem Abordnungsschreiben geregelt (bitte Nachweis beifügen):" },
  { field: "21_Arbeitsverhaeltnis", label: "21 Das Arbeitsverhältnis mit dem ausländischen Unternehmen/Unternehmensteil besteht für die Dauer der Entsendung/des Transfers/des Personalaustauschs fort:" },
  { field: "22_Beendigung", label: "22 Nach Beendigung der Entsendung/des Transfers/des Personalaustauschs kann die ausländische Arbeitnehmerin/der ausländische Arbeitnehmer in eine Niederlassung des Unternehmens beziehungsweise der Unternehmensgruppe mit Sitz im außereuropäischen Ausland zurückkehren:" },
];
