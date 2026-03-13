// Generate soft/pc skills based on provided CV context
export function generateSkills(cv, kind) {
  const lowerIncludes = (text, sub) =>
    String(text || "")
      .toLowerCase()
      .includes(String(sub || "").toLowerCase());

  const existingSoft = cv?.skills?.softSkills || [];
  const existingPc = cv?.skills?.pcSkills || [];

  const softPoolBase = [
    "Teamarbeit",
    "Kommunikationsf\u00E4higkeit",
    "Probleml\u00F6sungsf\u00E4higkeit",
    "Zeitmanagement",
    "Selbstorganisation",
    "Verantwortungsbewusstsein",
    "Flexibilit\u00E4t",
    "Konfliktl\u00F6sung",
    "Stressresistenz",
    "Kundenorientierung",
  ];

  const pcPoolBase = [
    "Microsoft Word",
    "Microsoft Excel",
    "Microsoft PowerPoint",
    "Google Docs",
    "Google Sheets",
    "Google Slides",
    "Microsoft Outlook",
    "Windows",
    "Internetrecherche",
    "Canva",
  ];

  const contextSoft = [];
  const contextPc = [];

  const experience = Array.isArray(cv?.experience) ? cv.experience : [];
  experience.forEach((exp) => {
    if (lowerIncludes(exp.position, "admin")) {
      contextSoft.push("Organisationstalent");
      contextPc.push("Microsoft Excel");
    }
    if (
      lowerIncludes(exp.position, "teacher") ||
      lowerIncludes(exp.position, "o'qit")
    ) {
      contextSoft.push("Pr\u00E4sentationsf\u00E4higkeit");
      contextPc.push("PowerPoint");
    }
    if (Array.isArray(exp.responsibilities)) {
      const joined = exp.responsibilities.join(" ").toLowerCase();
      if (joined.includes("mijoz") || joined.includes("kunde")) {
        contextSoft.push("Kundenkommunikation");
      }
      if (
        joined.includes("hisob") ||
        joined.includes("report") ||
        joined.includes("bericht")
      ) {
        contextPc.push("Google Sheets");
        contextPc.push("Excel (Pivot, Diagramme)");
      }
    }
  });

  const education = Array.isArray(cv?.education) ? cv.education : [];
  education.forEach((edu) => {
    if (
      lowerIncludes(edu.degree, "iqtisod") ||
      lowerIncludes(edu.degree, "wirtschaft")
    ) {
      contextPc.push("Excel (Formeln, Diagramme)");
      contextSoft.push("Analytisches Denken");
    }
    if (
      lowerIncludes(edu.institution, "universit\u00E4t") ||
      lowerIncludes(edu.institution, "universitet")
    ) {
      contextSoft.push("Selbstst\u00E4ndiges Lernen");
    }
  });

  const pickNew = (pool, existing, limit = 4) => {
    const unique = [];
    const have = new Set(existing.map((s) => String(s).toLowerCase()));
    pool.forEach((item) => {
      const key = String(item).toLowerCase();
      if (
        !have.has(key) &&
        !unique.map((u) => String(u).toLowerCase()).includes(key)
      ) {
        unique.push(item);
      }
    });
    return unique.slice(0, limit);
  };

  if (kind === "soft") {
    const pool = [...contextSoft, ...softPoolBase];
    return pickNew(pool, existingSoft, 4);
  } else {
    const pool = [...contextPc, ...pcPoolBase];
    return pickNew(pool, existingPc, 4);
  }
}
