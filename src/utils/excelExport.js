import * as XLSX from "xlsx";

/**
 * Export dashboard statistics to Excel file
 * @param {Object} statsDoc - Statistics document from Firestore
 * @param {string} kind - "live" or "allTime"
 * @param {string} [filename] - Optional custom filename
 */
export function exportStatsToExcel(statsDoc, kind = "live", filename) {
  console.log("exportStatsToExcel called with:", { statsDoc, kind });
  
  if (!statsDoc) {
    throw new Error("Keine Statistikdaten zum Exportieren vorhanden.");
  }

  const workbook = XLSX.utils.book_new();
  const kindLabel = kind === "allTime" ? "Historisch" : "Live";

  // 1. Overview Sheet
  const overviewRows = [
    { "Kategorie": "Nutzer Gesamt", "Wert": statsDoc?.totals?.candidates ?? 0 },
    { "Kategorie": "Sammlungen", "Wert": statsDoc?.totals?.directions ?? 0 },
    { "Kategorie": "Durchschnittsalter", "Wert": calculateAvgAge(statsDoc) ?? "-" },
    { "Kategorie": "Mit Diplom", "Wert": statsDoc?.attachments?.diplomas?.candidates?.has ?? 0 },
    { "Kategorie": "Ohne Diplom", "Wert": statsDoc?.attachments?.diplomas?.candidates?.none ?? 0 },
    { "Kategorie": "Mit Zertifikat", "Wert": statsDoc?.attachments?.languageCertificates?.candidates?.has ?? 0 },
    { "Kategorie": "Ohne Zertifikat", "Wert": statsDoc?.attachments?.languageCertificates?.candidates?.none ?? 0 },
  ];
  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows);
  overviewSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Übersicht");

  // 2. By Major (Berufsfeld)
  const byMajor = statsDoc?.totals?.byMajor || {};
  const majorRows = Object.entries(byMajor)
    .map(([name, count]) => ({ "Berufsfeld": name, "Anzahl": Number(count) || 0 }))
    .sort((a, b) => b.Anzahl - a.Anzahl);
  if (majorRows.length > 0) {
    const majorSheet = XLSX.utils.json_to_sheet(majorRows);
    majorSheet["!cols"] = [{ wch: 35 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, majorSheet, "Berufsfelder");
  }

  // 3. By Lead
  const byLead = statsDoc?.totals?.byLead || {};
  const leadRows = Object.entries(byLead)
    .map(([name, count]) => ({ "Lead": name, "Anzahl": Number(count) || 0 }))
    .filter((x) => x.Anzahl > 0)
    .sort((a, b) => b.Anzahl - a.Anzahl);
  if (leadRows.length > 0) {
    const leadSheet = XLSX.utils.json_to_sheet(leadRows);
    leadSheet["!cols"] = [{ wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, leadSheet, "Leads");
  }

  // 4. Age Buckets
  const ageBuckets = statsDoc?.demographics?.ageBuckets || {};
  const ageRows = ["18-24", "25-34", "35-44", "45-54", "55+"].map((bucket) => ({
    "Altersgruppe": bucket,
    "Anzahl": Number(ageBuckets[bucket]) || 0,
  }));
  const ageSheet = XLSX.utils.json_to_sheet(ageRows);
  ageSheet["!cols"] = [{ wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, ageSheet, "Altersgruppen");

  // 5. Gender
  const gender = statsDoc?.demographics?.gender || {};
  const genderRows = [
    { "Geschlecht": "Männlich", "Anzahl": Number(gender.male) || 0 },
    { "Geschlecht": "Weiblich", "Anzahl": Number(gender.female) || 0 },
    { "Geschlecht": "Unbekannt", "Anzahl": Number(gender.unknown) || 0 },
  ];
  const genderSheet = XLSX.utils.json_to_sheet(genderRows);
  genderSheet["!cols"] = [{ wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, genderSheet, "Geschlecht");

  // 6. Language Levels
  const langLevels = statsDoc?.skills?.languageLevels || {};
  const levelRows = ["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => ({
    "Sprachniveau": level,
    "Anzahl": Number(langLevels[level]) || 0,
  }));
  const levelSheet = XLSX.utils.json_to_sheet(levelRows);
  levelSheet["!cols"] = [{ wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, levelSheet, "Sprachniveaus");

  // 7. Experience Buckets
  const expBuckets = statsDoc?.career?.experienceBuckets || {};
  const expRows = ["0-1 Jahr", "1-3 Jahre", "3-5 Jahre", "5+ Jahre"].map((bucket) => ({
    "Erfahrung": bucket,
    "Anzahl": Number(expBuckets[bucket]) || 0,
  }));
  const expSheet = XLSX.utils.json_to_sheet(expRows);
  expSheet["!cols"] = [{ wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, expSheet, "Berufserfahrung");

  // 8. Regions
  const byRegion = statsDoc?.regions?.byRegion || {};
  const regionRows = Object.entries(byRegion)
    .map(([region, count]) => ({ "Region": region, "Anzahl": Number(count) || 0 }))
    .filter((x) => x.Anzahl > 0)
    .sort((a, b) => b.Anzahl - a.Anzahl);
  if (regionRows.length > 0) {
    const regionSheet = XLSX.utils.json_to_sheet(regionRows);
    regionSheet["!cols"] = [{ wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, regionSheet, "Regionen");
  }

  // 9. Marital Status
  const marital = statsDoc?.demographics?.marital || {};
  const maritalRows = [
    { "Familienstand": "Ledig", "Anzahl": Number(marital.single) || 0 },
    { "Familienstand": "Verheiratet", "Anzahl": Number(marital.married) || 0 },
  ];
  const maritalSheet = XLSX.utils.json_to_sheet(maritalRows);
  maritalSheet["!cols"] = [{ wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, maritalSheet, "Familienstand");

  const date = new Date().toISOString().split("T")[0];
  const exportFilename = filename || `Statistik_${kindLabel}_${date}.xlsx`;

  XLSX.writeFile(workbook, exportFilename);
}

function calculateAvgAge(statsDoc) {
  const cnt = Number(statsDoc?.demographics?.age?.count) || 0;
  const sum = Number(statsDoc?.demographics?.age?.sum) || 0;
  if (cnt <= 0) return null;
  return Math.round((sum / cnt) * 10) / 10;
}

/**
 * Export candidates data to Excel file
 * @param {Array} candidates - Array of candidate objects
 * @param {string} majorTitle - Title of the major/berufsfeld
 * @param {string} [filename] - Optional custom filename
 */
export function exportCandidatesToExcel(candidates, majorTitle, filename) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("Keine Kandidaten zum Exportieren vorhanden.");
  }

  const rows = candidates.map((c, index) => ({
    "#": index + 1,
    "Name": c.name || "",
    "Alter": c.age ?? "",
    "Telefon": c.phone || "",
    "E-Mail": c.email || "",
    "Familienstand": c.maritalStatus || "",
    "Zertifikat": c.hasCertificate ? "Ja" : "Nein",
    "Erfahrung": c.hasExperience ? "Ja" : "Nein",
    "Führerschein": c.hasDrivingLicense ? "Ja" : "Nein",
    "Sprachniveaus": Array.isArray(c.langLevels) ? c.langLevels.join(", ") : "",
    "Status": c.statusLabel || "",
    "E-Mails gesendet": c.emailSentCount || 0,
    "Kommentar": c.hasComment ? "Ja" : "Nein",
    "Telegram": c.telegramId ? "Ja" : "Nein",
    "Lead": c.lead || "",
    "Dokumente bereit": c.documentReady ? "Ja" : "Nein",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 8 },   // Alter
    { wch: 18 },  // Telefon
    { wch: 30 },  // E-Mail
    { wch: 15 },  // Familienstand
    { wch: 12 },  // Zertifikat
    { wch: 12 },  // Erfahrung
    { wch: 14 },  // Führerschein
    { wch: 15 },  // Sprachniveaus
    { wch: 20 },  // Status
    { wch: 15 },  // E-Mails gesendet
    { wch: 12 },  // Kommentar
    { wch: 10 },  // Telegram
    { wch: 20 },  // Lead
    { wch: 15 },  // Dokumente bereit
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kandidaten");

  const safeTitle = String(majorTitle || "Kandidaten")
    .replace(/[\\/:*?"<>|]/g, "_")
    .substring(0, 50);
  const date = new Date().toISOString().split("T")[0];
  const exportFilename = filename || `${safeTitle}_${date}.xlsx`;

  XLSX.writeFile(workbook, exportFilename);
}

/**
 * Export full candidate data with all details to Excel (all data from Generate.jsx)
 * @param {Array} candidates - Array of full candidate documents from Firestore
 * @param {string} majorTitle - Title of the major/berufsfeld
 * @param {string} [filename] - Optional custom filename
 */
export function exportFullCandidatesToExcel(candidates, majorTitle, filename) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("Keine Kandidaten zum Exportieren vorhanden.");
  }

  const workbook = XLSX.utils.book_new();

  // ========== SHEET 1: Asosiy ma'lumotlar ==========
  const mainRows = candidates.map((doc, index) => {
    const pd = doc.persoenlicheDaten || {};
    const faehigkeiten = doc.faehigkeiten || {};
    const sprachen = faehigkeiten.sprachen || {};
    const documents = doc.documents || {};
    const berufserfahrung = Array.isArray(doc.berufserfahrung) ? doc.berufserfahrung : [];
    const ausbildung = Array.isArray(doc.ausbildung) ? doc.ausbildung : [];
    const emailMeta = doc.emailMeta || {};
    const status = doc.status || {};
    const stageMeta = doc.stageMeta || {};

    // Extract language levels
    const langEntries = Object.entries(sprachen)
      .filter(([, level]) => level)
      .map(([lang, level]) => `${lang}: ${level}`)
      .join("; ");

    // Soft skills
    const softSkills = Array.isArray(faehigkeiten.softSkills) 
      ? faehigkeiten.softSkills.join(", ") 
      : "";

    // PC skills
    const pcSkills = Array.isArray(faehigkeiten.pcKenntnisse) 
      ? faehigkeiten.pcKenntnisse.join(", ") 
      : "";

    // Check certificates
    const hasCert = Array.isArray(documents.certificates) && documents.certificates.length > 0;
    const hasDiploma = Array.isArray(documents.diplomas) && documents.diplomas.length > 0;
    const hasPassport = Array.isArray(documents.passport) && documents.passport.length > 0;

    // Certificate details
    const certDetails = Array.isArray(documents.certificatesDetailed)
      ? documents.certificatesDetailed.map(c => `${c.type || ""} ${c.level || ""}`.trim()).filter(Boolean).join("; ")
      : "";

    // Status value
    const statusValue = typeof status === "string" ? status : (status.value || "");

    // Stage decisions
    const stageDecisions = ["stage_1", "stage_2", "stage_2_result", "stage_3", "stage_4"]
      .map(s => {
        const decision = stageMeta[s]?.decision;
        if (decision) return `${s}: ${decision}`;
        return null;
      })
      .filter(Boolean)
      .join("; ");

    // Calculate age
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

  // ========== SHEET 2: Berufserfahrung ==========
  const expRows = [];
  candidates.forEach((doc, docIndex) => {
    const pd = doc.persoenlicheDaten || {};
    const fullName = `${pd.name || ""} ${pd.nachname || ""}`.trim();
    const berufserfahrung = Array.isArray(doc.berufserfahrung) ? doc.berufserfahrung : [];
    
    if (berufserfahrung.length === 0) {
      expRows.push({
        "#": docIndex + 1,
        "Kandidat": fullName,
        "Position": "",
        "Firma": "",
        "Ort": "",
        "Beginn": "",
        "Ende": "",
        "Aufgaben": "",
      });
    } else {
      berufserfahrung.forEach((exp, expIndex) => {
        const aufgaben = Array.isArray(exp.aufgaben) ? exp.aufgaben.join("; ") : "";
        expRows.push({
          "#": docIndex + 1,
          "Kandidat": fullName,
          "Position": exp.position || "",
          "Firma": exp.firma || "",
          "Ort": exp.ort || "",
          "Beginn": exp.beginn || "",
          "Ende": exp.ende || "",
          "Aufgaben": aufgaben,
        });
      });
    }
  });

  const expSheet = XLSX.utils.json_to_sheet(expRows);
  expSheet["!cols"] = [
    { wch: 5 },   // #
    { wch: 25 },  // Kandidat
    { wch: 25 },  // Position
    { wch: 25 },  // Firma
    { wch: 20 },  // Ort
    { wch: 12 },  // Beginn
    { wch: 12 },  // Ende
    { wch: 60 },  // Aufgaben
  ];
  XLSX.utils.book_append_sheet(workbook, expSheet, "Berufserfahrung");

  // ========== SHEET 3: Ausbildung ==========
  const eduRows = [];
  candidates.forEach((doc, docIndex) => {
    const pd = doc.persoenlicheDaten || {};
    const fullName = `${pd.name || ""} ${pd.nachname || ""}`.trim();
    const ausbildung = Array.isArray(doc.ausbildung) ? doc.ausbildung : [];
    
    if (ausbildung.length === 0) {
      eduRows.push({
        "#": docIndex + 1,
        "Kandidat": fullName,
        "Institution": "",
        "Abschluss": "",
        "Beginn": "",
        "Ende": "",
      });
    } else {
      ausbildung.forEach((edu) => {
        eduRows.push({
          "#": docIndex + 1,
          "Kandidat": fullName,
          "Institution": edu.institution || "",
          "Abschluss": edu.abschluss || "",
          "Beginn": edu.beginn || "",
          "Ende": edu.ende || "",
        });
      });
    }
  });

  const eduSheet = XLSX.utils.json_to_sheet(eduRows);
  eduSheet["!cols"] = [
    { wch: 5 },   // #
    { wch: 25 },  // Kandidat
    { wch: 40 },  // Institution
    { wch: 30 },  // Abschluss
    { wch: 12 },  // Beginn
    { wch: 12 },  // Ende
  ];
  XLSX.utils.book_append_sheet(workbook, eduSheet, "Ausbildung");

  const safeTitle = String(majorTitle || "Kandidaten")
    .replace(/[\\/:*?"<>|]/g, "_")
    .substring(0, 50);
  const date = new Date().toISOString().split("T")[0];
  const exportFilename = filename || `${safeTitle}_vollstaendig_${date}.xlsx`;

  XLSX.writeFile(workbook, exportFilename);
}

function formatTimestamp(value) {
  if (!value) return "";
  try {
    let date;
    if (typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "object" && typeof value.toDate === "function") {
      date = value.toDate();
    } else if (typeof value === "object" && typeof value.seconds === "number") {
      date = new Date(value.seconds * 1000);
    } else {
      return "";
    }
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

function calculateAge(geburtsdatum) {
  if (!geburtsdatum || typeof geburtsdatum !== "string") return null;
  const m = geburtsdatum.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const birth = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 1 || age > 120) return null;
  return age;
}
