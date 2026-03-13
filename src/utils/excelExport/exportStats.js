import * as XLSX from "xlsx";
import { calculateAvgAge } from "./helpers";

/**
 * Export dashboard statistics to Excel file
 * @param {Object} statsDoc - Statistics document from Firestore
 * @param {string} kind - "live" or "allTime"
 * @param {string} [filename] - Optional custom filename
 */
export function exportStatsToExcel(statsDoc, kind = "live", filename) {
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
