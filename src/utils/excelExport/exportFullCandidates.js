import * as XLSX from "xlsx";
import { appendMainSheet } from "./fullCandidateSheets";
import { appendExperienceSheet, appendEducationSheet } from "./fullCandidateDetailSheets";

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

  // Sheet 1: Main candidate data
  appendMainSheet(workbook, candidates);

  // Sheet 2: Work experience
  appendExperienceSheet(workbook, candidates);

  // Sheet 3: Education
  appendEducationSheet(workbook, candidates);

  const safeTitle = String(majorTitle || "Kandidaten")
    .replace(/[\\/:*?"<>|]/g, "_")
    .substring(0, 50);
  const date = new Date().toISOString().split("T")[0];
  const exportFilename = filename || `${safeTitle}_vollstaendig_${date}.xlsx`;

  XLSX.writeFile(workbook, exportFilename);
}
