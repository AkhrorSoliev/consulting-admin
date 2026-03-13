import { todayDdMmYyyy } from "./dateUtils";

export const ZUSATZBLATT_A_INITIAL = {
  // Section A - Angaben zur Person
  txtf_1_Vorname: "",
  txtf_2_Nachname: "",
  txtf_3_Wohnsitz: "",

  // Section B - Art der Beschäftigung
  rbtn_B_ArtBeschaeftigung: "",

  // Section C - Anerkennungsbehörde
  txtf_4_Anerkennungsbehoerde: "",
  txtf_5_Strasse: "",
  txtf_6_Hausnummer: "",
  txtf_7_PLZ: "",
  txtf_8_Ort: "",

  // Section D - Antrag
  rbtn_9_AntragAnerkennungsbehoerde: "",
  rbtn_10_UnterschiedeBerufsqualifikation: "",
  rbtn_11_Sprachkenntnisse: "",
  rbtn_12_vollstaendigeAnerkennung: "",
  rbtn_13_betrieblicheQualifizierung: "",

  // Section E
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

  // Section F
  rbtn_16_Anerkennungsbescheid: "",
  rbtn_17_Nachqualifizierung: "",
  txtf_17_von: "",
  txtf_17_bis: "",

  // Section G
  txtf_18_Sprachkenntnisse: "",
  chbx_18_a: false,
  chbx_18_b: false,
  chbx_18_c: false,
  chbx_18_d: false,
  rbtn_19_Sprachniveau: "",

  // Section H
  txtf_20_Ort: "",
  txtf_21_Datum: todayDdMmYyyy(),
};

export const ART_BESCHAEFTIGUNG_OPTIONS = [
  {
    value: "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist \n(bitte die Abschnitte C, D, G und H ausfuellen)",
    label: "Betriebliche Qualifizierung, die im Rahmen des Anerkennungsverfahrens erforderlich ist (bitte die Abschnitte C, D, G und H ausfüllen)",
  },
  {
    value: "Beschaeftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeuebt wird \n(bitte die Abschnitte C, E, G und H ausfuellen)",
    label: "Beschäftigung, die neben einer Qualifizierung im Rahmen des Anerkennungsverfahrens ausgeübt wird (bitte die Abschnitte C, E, G und H ausfüllen)",
  },
  {
    value: "Beschaeftigung waehrend der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfuellen)",
    label: "Beschäftigung während der Anerkennungspartnerschaft (bitte die Abschnitte F, G und H ausfüllen)",
  },
];

export const ANTRAG_OPTIONS = [
  {
    value: "Antrag auf Feststellung der Gleichwertigkeit der auslaendischen Berufsqualifikation mit einer inlaendischen Berufsqualifikation (weiter mit 10)",
    label: "Antrag auf Feststellung der Gleichwertigkeit der ausländischen Berufsqualifikation mit einer inländischen Berufsqualifikation (weiter mit 10)",
  },
  {
    value: "Antrag auf Erteilung einer Berufsausuebungserlaubnis – bei reglementierten Berufen (weiter mit 11)",
    label: "Antrag auf Erteilung einer Berufsausübungserlaubnis – bei reglementierten Berufen (weiter mit 11)",
  },
];

export const BETRIEBSDAUER_OPTIONS = [
  {
    value: "Die Beschaeftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G)",
    label: "Die Beschäftigung dauert bis zu 20 Stunden pro Woche (weiter mit Abschnitt G).",
  },
  {
    value: "Die Beschaeftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschaeftigung waehrend des Anerkennungsverfahrens und der spaeteren Beschaeftigung nach Erlangung der vollstaendigen Anerkennung besteht ein berufsfachlicher Zusammenhang",
    label: "Die Beschäftigung dauert mehr als 20 Stunden pro Woche und zwischen der Beschäftigung während des Anerkennungsverfahrens und der späteren Beschäftigung nach Erlangung der vollständigen Anerkennung besteht ein berufsfachlicher Zusammenhang.",
  },
];

export const ANERKENNUNGSBESCHEID_OPTIONS = [
  {
    value: "ja - (bitte Nachweis beifuegen und auch Abschnitt C. ausfuellen)",
    label: "Ja (bitte Nachweis beifügen und auch Abschnitt C ausfüllen)",
  },
  {
    value: "nein (weiter mit Abschnitt G.)",
    label: "Nein (weiter mit Abschnitt G)",
  },
];

export const NACHQUALIFIZIERUNG_OPTIONS = [
  {
    value: "Die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifuegen)",
    label: "Die durch die zuständige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen können nicht weitgehend betriebsintern angeboten werden (bitte Weiterbildungsplan beifügen) oder",
  },
  {
    value: "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifuegen)",
    label: "es ist neben der betrieblichen Nachqualifizierung auch eine theoretische Nachqualifizierung notwendig (bitte Weiterbildungsplan beifügen) oder",
  },
  {
    value: "die durch die zustaendige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen koennen weitgehend \nbetriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen",
    label: "die durch die zuständige Anerkennungsstelle als erforderlich festgestellten Nachqualifizierungen können weitgehend betriebsintern angeboten werden und die Nachqualifizierung wird voraussichtlich folgenden Zeitraum in Anspruch nehmen:",
  },
];
