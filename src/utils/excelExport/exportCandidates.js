import * as XLSX from "xlsx";

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
