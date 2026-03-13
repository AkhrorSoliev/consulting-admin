import { PreviewSectionTitle } from "../PreviewParts";

export function buildSkillsBlocks({
  blocks,
  showSkillsSection,
  hasDrivingLicense,
  drivingText,
  hasLanguages,
  formCv,
  hasSoftSkills,
  hasPcSkills,
}) {
  if (!showSkillsSection) return;

  blocks.push({
    id: "skills-title",
    kind: "sectionTitle",
    keepWithNext: true,
    node: (
      <PreviewSectionTitle>Kenntnisse & Fähigkeiten</PreviewSectionTitle>
    ),
  });

  const skillGroups = [];
  if (hasDrivingLicense) skillGroups.push("driving");
  if (hasLanguages) skillGroups.push("lang");
  if (hasSoftSkills) skillGroups.push("soft");
  if (hasPcSkills) skillGroups.push("pc");

  skillGroups.forEach((g, idx) => {
    const gapCls = idx < skillGroups.length - 1 ? "mb-[12pt]" : "";
    if (g === "driving") {
      blocks.push({ id: "skills-driving", kind: "group", node: (
        <div className={`flex flex-col gap-[4pt] ${gapCls}`}>
          <div className="font-bold">Führerschein</div>
          <div className="flex flex-col gap-[3pt] min-w-0">
            <div className="flex flex-row gap-[6pt] min-w-0">
              <span className="shrink-0">•</span>
              <span className="min-w-0 wrap-break-word">{drivingText}</span>
            </div>
          </div>
        </div>
      )});
    } else if (g === "lang") {
      blocks.push({ id: "skills-languages", kind: "group", node: (
        <div className={`flex flex-col gap-[4pt] ${gapCls}`}>
          <div className="font-bold">Sprachen</div>
          <div className="flex flex-col gap-[3pt] min-w-0">
            {Object.entries(formCv.skills.languages).map(([lang, level]) => (
              <div key={lang} className="flex flex-row gap-[6pt] min-w-0">
                <span className="shrink-0">•</span>
                <span className="min-w-0 wrap-break-word">{lang} — {level}</span>
              </div>
            ))}
          </div>
        </div>
      )});
    } else if (g === "soft") {
      blocks.push({ id: "skills-soft", kind: "group", node: (
        <div className={`flex flex-col gap-[4pt] ${gapCls}`}>
          <div className="font-bold">Fähigkeiten</div>
          <div className="flex flex-col gap-[3pt] min-w-0">
            {formCv.skills.softSkills.map((s, i) => (
              <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                <span className="shrink-0">•</span>
                <span className="min-w-0 wrap-break-word">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )});
    } else if (g === "pc") {
      blocks.push({ id: "skills-pc", kind: "group", node: (
        <div className={`flex flex-col gap-[4pt] ${gapCls}`}>
          <div className="font-bold">PC-Kenntnisse</div>
          <div className="flex flex-col gap-[3pt] min-w-0">
            {formCv.skills.pcSkills.map((s, i) => (
              <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                <span className="shrink-0">•</span>
                <span className="min-w-0 wrap-break-word">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )});
    }
  });
}

export function buildDocumentsBlocks({ blocks, showDocuments, formCv }) {
  if (
    !showDocuments ||
    !(formCv.documents?.diplomas?.length > 0 ||
      formCv.documents?.certificates?.length > 0 ||
      formCv.documents?.passport?.length > 0)
  ) {
    return;
  }

  blocks.push({
    id: "docs-title",
    kind: "sectionTitle",
    keepWithNext: true,
    node: <PreviewSectionTitle>Dokumente</PreviewSectionTitle>,
  });

  const docGroups = [];
  if (formCv.documents.passport?.length > 0) docGroups.push("passport");
  if (formCv.documents.diplomas?.length > 0) docGroups.push("diplomas");
  if (formCv.documents.certificates?.length > 0) docGroups.push("certs");

  docGroups.forEach((g, idx) => {
    const gapCls = idx < docGroups.length - 1 ? "mb-[12pt]" : "";
    const label =
      g === "passport" ? "Reisepass" : g === "diplomas" ? "Diplome" : "Zertifikate";
    const urls =
      g === "passport"
        ? formCv.documents.passport
        : g === "diplomas"
          ? formCv.documents.diplomas
          : formCv.documents.certificates;
    blocks.push({
      id: `docs-${g}`,
      kind: "group",
      node: (
        <div className={`flex flex-col gap-[4pt] ${gapCls}`}>
          <div className="font-bold">{label}</div>
          <div className="flex flex-col gap-[3pt] min-w-0">
            {urls.map((url, i) => (
              <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                <span className="shrink-0">•</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline break-all min-w-0"
                >
                  {url}
                </a>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  });
}
