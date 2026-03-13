import { TEMPLATE_NAME } from "./constants";

export const formatDate = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getFullYear()}`;
};

export const toInputDate = (ddMmYyyy) => {
  if (!ddMmYyyy) return "";
  const p = String(ddMmYyyy).split(".");
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : "";
};

export const fromInputDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "";
  const p = String(yyyyMmDd).split("-");
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : "";
};

export const createInitialForm = () => ({
  rbtn_1_Erklaerung: "",
  rbtn_2_Anlass: "",
  txtf_3_Vorname: "",
  txtf_4_Nachname: "",
  txtf_5_Geburtsdatum: "",
  rbtn_6_Geschlecht: "",
  txtf_7_Staatsangehoerigkeit: "",
  txtf_8_Wohnsitz: "",
  txtf_9_seit: "",
  txtf_10_Firma: "",
  txtf_11_Strasse: "",
  txtf_12_Hausnummer: "",
  txtf_13_Postleitzahl: "",
  txtf_14_Ort: "",
  txtf_15_Kontaktperson: "",
  txtf_16_Telefon: "",
  "txtf_17_E-Mail": "",
  txtf_18_Telefax: "",
  txtf_19_Betriebsnummer: "",
  rbtn_20_Unternehmen_gegruendet: "",
  txtf_21_Beschaeftigungsverhaeltniss: "",
  rbtn_22_Beschaeftigungsverhaeltniss: "",
  txtf_22_Beschaeftigungsverhaeltniss: "",
  rbtn_23_Dritte: "",
  rbtn_24_Arbeitsort: "",
  txtf_24_Arbeitsort_Adresse: "",
  txtf_25_Berufsbezeichnung: "",
  txtf_26_Studiengang: "",
  txtf_27_Hochschulabschluss: "",
  rbtn_28_Abschluss_Ausland: "",
  txtf_29_Anerkennungsnachweis: "",
  txtf_30_Bezeichnung_Berufsausbildung: "",
  txtf_31_Berufsausbildung_erworben: "",
  rbtn_32_Ausbildung_Ausland: "",
  txtf_33_Anerkennungsnachweis: "",
  chbx_34_keine_Ausbildung: false,
  txtf_34_Qualifikationen: "",
  rbtn_35_Berufsausuebungserlaubnis: "",
  txtf_36_erforderliche_Qualifikation: "",
  rbtn_37_Arbeitszeit: "",
  txtf_37_Arbeitsstunden_Woche: "",
  rbtn_38_Ueberstunden: "",
  txtf_39_Ueberstundenumpfang: "",
  txtf_40_Ueberstundenausgleich: "",
  txtf_41_Urlaubsanpruch: "",
  rbtn_42_Arbeitgeber_tarifgebunden: "",
  rbtn_43_tarifliche_Arbeitsbedingungen: "",
  txtf_44_Tarifvertrag: "",
  txtf_45_Entgeltgruppe: "",
  chbx_46_Arbeitsentgelt: false,
  txtf_46_Entgelt_pro_Stunde: "",
  txtf_46_Entgelt_pro_Monat: "",
  chbx_47_zusaetzlich_geldwerte_Leistungen: false,
  txtf_48_Art_geldwerten_Leistung: "",
  txtf_49_Hoehe_geldwerten_Leistung: "",
  chbx_47_sonstige_Berechnung: false,
  txtf_50_Art_variablen_Verguetung: "",
  txtf_51_Hoehe_variable_Verguetung: "",
  rbtn_52_besteht_Versicherungspflicht: "",
  txtf_53_Begruendung_Versicherungspflicht: "",
  rbtn_54_Sozialversicherungspflicht_nicht: "",
  txtf_55_Form_Nachweiss: "",
  txtf_56_Ergaemzungen: "",
  txtf_57_Ort: "",
  txtf_58_Datum: formatDate(),
  chbx_zuE_1v4: false,
  chbx_zuE_2v4: false,
  chbx_zuE_3v4: false,
  chbx_zuE_4v4: false,
});

export const buildPdfPayload = (form) => {
  const payload = {
    template: TEMPLATE_NAME,
    data: { textFields: {}, radioGroups: {}, checkboxes: {} },
  };
  Object.entries(form).forEach(([key, value]) => {
    if (key.startsWith("txtf_")) payload.data.textFields[key] = value;
    else if (key.startsWith("rbtn_") && value)
      payload.data.radioGroups[key] = value;
    else if (key.startsWith("chbx_")) payload.data.checkboxes[key] = value;
  });
  return payload;
};
