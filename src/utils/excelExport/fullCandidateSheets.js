import * as XLSX from "xlsx";
import { formatTimestamp, calculateAge } from "./helpers";

/**
 * Build the main candidates sheet (Sheet 1) and append to workbook.
 * @param {Object} workbook - XLSX workbook
 * @param {Array} candidates - candidate documents
 */
export function appendMainSheet(workbook, candidates) {
  const mainRows = candidates.map((doc, index) => {
    const pd = doc.persoenlicheDaten || {};
    const faehigkeiten = doc.faehigkeiten || {};
    const sprachen = faehigkeiten.sprachen || {};
    const documents = doc.documents || {};
    const emailMeta = doc.emailMeta || {};
    const status = doc.status || {};
    const stageMeta = doc.stageMeta || {};

    const langEntries = Object.entries(sprachen)
      .filter(([, level]) => level)
      .map(([lang, level]) => `${lang}: ${level}`)
      .join("; ");

    const softSkills = Array.isArray(faehigkeiten.softSkills)
      ? faehigkeiten.softSkills.join(", ")
      : "";

    const pcSkills = Array.isArray(faehigkeiten.pcKenntnisse)
      ? faehigkeiten.pcKenntnisse.join(", ")
      : "";

    const hasCert = Array.isArray(documents.certificates) && documents.certificates.length > 0;
    const hasDiploma = Array.isArray(documents.diplomas) && documents.diplomas.length > 0;
    const hasPassport = Array.isArray(documents.passport) && documents.passport.length > 0;

    const certDetails = Array.isArray(documents.certificatesDetailed)
      ? documents.certificatesDetailed.map(c => `${c.type || ""} ${c.level || ""}`.trim()).filter(Boolean).join("; ")
      : "";

    const statusValue = typeof status === "string" ? status : (status.value || "");

    const stageDecisions = ["stage_1", "stage_2", "stage_2_result", "stage_3", "stage_4"]
      .map(s => {
        const decision = stageMeta[s]?.decision;
        if (decision) return `${s}: ${decision}`;
        return null;
      })
      .filter(Boolean)
      .join("; ");

    const age = calculateAge(pd.geburtsdatum);

    return {
      "#": index + 1,
      "Typ": doc.candidateType || "Aktiv",
      "Berufsfeld": doc.major || "",
      "Vorname": pd.name || "",
      "Nachname": pd.nachname || "",
      "Geschlecht": pd.geschlecht || "",
      "Geburtsdatum": pd.geburtsdatum || "",
      "Alter": age ?? "",
      "Geburtsort": pd.geburtsort || "",
      "Telefon": pd.telefon || "",
      "E-Mail": pd.email || "",
      "Adresse": pd.adresse || "",
      "Region": pd.region || "",
      "Familienstand": pd.familienstand || "",
      "Kinder": pd.kinder || (pd.keineKinder ? "Keine" : ""),
      "Führerschein": pd.fuehrerschein ? "Ja" : "Nein",
      "Führerschein Typ": pd.fuehrerscheinTyp || "",
      "Reisepass Nr.": pd.reisepassNummer || "",
      "Sprachen": langEntries,
      "Soft Skills": softSkills,
      "PC-Kenntnisse": pcSkills,
      "Zertifikate vorhanden": hasCert ? "Ja" : "Nein",
      "Zertifikat Details": certDetails,
      "Diplom vorhanden": hasDiploma ? "Ja" : "Nein",
      "Reisepass vorhanden": hasPassport ? "Ja" : "Nein",
      "Kein Sprachzertifikat": documents.noLanguageCertificate ? "Ja" : "Nein",
      "Status": statusValue,
      "Status aktualisiert": formatTimestamp(status.updatedAt),
      "Stufen-Entscheidungen": stageDecisions,
      "E-Mails gesendet": emailMeta.count || 0,
      "Letzte E-Mail": formatTimestamp(emailMeta.lastSentAt),
      "Lead": doc.lead || "",
      "Telegram ID": doc.telegramId || "",
      "Dokumente bereit": doc.documentReady ? "Ja" : "Nein",
      "Reaktion": doc.reaction || "",
      "Erstellt am": formatTimestamp(doc.createdAt),
      "Firestore ID": doc.id || "",
    };
  });

  const mainSheet = XLSX.utils.json_to_sheet(mainRows);
  mainSheet["!cols"] = [
    { wch: 5 },   // #
    { wch: 12 },  // Typ
    { wch: 25 },  // Berufsfeld
    { wch: 15 },  // Vorname
    { wch: 15 },  // Nachname
    { wch: 12 },  // Geschlecht
    { wch: 12 },  // Geburtsdatum
    { wch: 6 },   // Alter
    { wch: 20 },  // Geburtsort
    { wch: 18 },  // Telefon
    { wch: 30 },  // E-Mail
    { wch: 40 },  // Adresse
    { wch: 20 },  // Region
    { wch: 15 },  // Familienstand
    { wch: 10 },  // Kinder
    { wch: 12 },  // Führerschein
    { wch: 15 },  // Führerschein Typ
    { wch: 15 },  // Reisepass Nr.
    { wch: 40 },  // Sprachen
    { wch: 40 },  // Soft Skills
    { wch: 40 },  // PC-Kenntnisse
    { wch: 18 },  // Zertifikate vorhanden
    { wch: 30 },  // Zertifikat Details
    { wch: 16 },  // Diplom vorhanden
    { wch: 18 },  // Reisepass vorhanden
    { wch: 20 },  // Kein Sprachzertifikat
    { wch: 15 },  // Status
    { wch: 18 },  // Status aktualisiert
    { wch: 40 },  // Stufen-Entscheidungen
    { wch: 15 },  // E-Mails gesendet
    { wch: 18 },  // Letzte E-Mail
    { wch: 20 },  // Lead
    { wch: 15 },  // Telegram ID
    { wch: 15 },  // Dokumente bereit
    { wch: 12 },  // Reaktion
    { wch: 18 },  // Erstellt am
    { wch: 25 },  // Firestore ID
  ];
  XLSX.utils.book_append_sheet(workbook, mainSheet, "Kandidaten");
}
