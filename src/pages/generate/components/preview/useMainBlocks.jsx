import { useMemo } from "react";
import { PreviewInfoRow, PreviewSectionTitle } from "../PreviewParts";
import { buildSkillsBlocks, buildDocumentsBlocks } from "./blockBuilders";

export default function useMainBlocks({
  formCv,
  fullName,
  address,
  birthDate,
  birthPlace,
  maritalStatus,
  childrenText,
  phone,
  email,
  photo,
  onPhotoClick,
  sortedExperience,
  educationArray,
  sortedEducation,
  showSkillsSection,
  hasDrivingLicense,
  drivingText,
  hasLanguages,
  hasSoftSkills,
  hasPcSkills,
  showDocuments,
}) {
  return useMemo(() => {
    const blocks = [];

    // Header
    blocks.push({
      id: "header",
      kind: "header",
      keepWithNext: true,
      node: (
        <div className="mb-[18pt]">
          <h1 className="text-[24pt] font-bold leading-tight">{fullName}</h1>
          <div className="h-[2pt] bg-base-content/80 mt-[17pt] mb-[12pt] w-full" />
          <div className="flex flex-row gap-[22pt] min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-[6pt] mt-1">
                <PreviewInfoRow label="Name" value={fullName} />
                <PreviewInfoRow label="Anschrift" value={address} />
                <PreviewInfoRow label="Geburtsdatum" value={birthDate} />
                <PreviewInfoRow label="Geburtsort" value={birthPlace || "—"} />
                <PreviewInfoRow label="Familienstand" value={maritalStatus} />
                <PreviewInfoRow label="Kinder" value={childrenText} />
                <PreviewInfoRow label="Tel" value={phone} />
                <PreviewInfoRow label="E-Mail" value={email} />
              </div>
            </div>
            <div className="shrink-0">
              {photo ? (
                <img
                  src={photo}
                  alt="Foto"
                  role="button"
                  tabIndex={0}
                  onClick={onPhotoClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPhotoClick();
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-[128pt] h-[160pt] object-cover border border-base-300 rounded-[8pt] cursor-zoom-in transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                />
              ) : (
                <div className="w-[128pt] h-[160pt] border border-base-300 rounded-[8pt] flex items-center justify-center bg-base-200 text-base-content/50 text-xs">
                  Foto
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    });

    // Experience
    if (sortedExperience.length > 0) {
      blocks.push({
        id: "experience-title",
        kind: "sectionTitle",
        keepWithNext: true,
        node: <PreviewSectionTitle>Berufliche Laufbahn</PreviewSectionTitle>,
      });
      sortedExperience.forEach((exp, i) => {
        const addGap = i < sortedExperience.length - 1;
        blocks.push({
          id: `experience-${i}`,
          kind: "row",
          node: (
            <div className={`flex flex-row gap-[10pt] min-w-0 ${addGap ? "mb-[10pt]" : ""}`}>
              <div className="w-[140pt] shrink-0 font-bold text-base-content/70">
                {(exp.startDate || "—") + " – " + (exp.endDate || "heute")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold wrap-break-word">
                  {exp.position || "—"}
                  {exp.location ? `, ${exp.location}` : ""}
                </div>
                {exp.company && (
                  <div className="italic text-base-content/70">{exp.company}</div>
                )}
                {Array.isArray(exp.responsibilities) &&
                  exp.responsibilities.length > 0 && (
                    <div className="mt-[4pt]">
                      {exp.responsibilities.map((r, ri) => (
                        <div key={ri} className="flex flex-row gap-[6pt] min-w-0">
                          <span className="shrink-0">•</span>
                          <span className="min-w-0 wrap-break-word">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ),
        });
      });
    }

    // Education
    if (educationArray.length > 0) {
      blocks.push({
        id: "education-title",
        kind: "sectionTitle",
        keepWithNext: true,
        node: <PreviewSectionTitle>Ausbildung</PreviewSectionTitle>,
      });
      sortedEducation.forEach((edu, i) => {
        const addGap = i < sortedEducation.length - 1;
        blocks.push({
          id: `education-${i}`,
          kind: "row",
          node: (
            <div className={`flex flex-row gap-[10pt] min-w-0 ${addGap ? "mb-[10pt]" : ""}`}>
              <div className="w-[140pt] shrink-0 font-bold text-base-content/70">
                {(edu.startDate || "—") + " – " + (edu.endDate || "—")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="wrap-break-word">{edu.institution || "—"}</div>
                <div className="italic text-base-content/70">
                  Abschluss: {edu.degree || "—"}
                </div>
              </div>
            </div>
          ),
        });
      });
    }

    buildSkillsBlocks({
      blocks,
      showSkillsSection,
      hasDrivingLicense,
      drivingText,
      hasLanguages,
      formCv,
      hasSoftSkills,
      hasPcSkills,
    });

    buildDocumentsBlocks({ blocks, showDocuments, formCv });

    return blocks;
  }, [
    address, birthDate, birthPlace, childrenText, drivingText, email,
    formCv, fullName, hasDrivingLicense, hasLanguages, hasPcSkills,
    hasSoftSkills, maritalStatus, phone, photo, showDocuments,
    showSkillsSection, sortedEducation, sortedExperience, educationArray,
    onPhotoClick,
  ]);
}
