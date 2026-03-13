import * as XLSX from "xlsx";

/**
 * Build the experience sheet (Sheet 2) and append to workbook.
 * @param {Object} workbook - XLSX workbook
 * @param {Array} candidates - candidate documents
 */
export function appendExperienceSheet(workbook, candidates) {
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
      berufserfahrung.forEach((exp) => {
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
}

/**
 * Build the education sheet (Sheet 3) and append to workbook.
 * @param {Object} workbook - XLSX workbook
 * @param {Array} candidates - candidate documents
 */
export function appendEducationSheet(workbook, candidates) {
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
}
