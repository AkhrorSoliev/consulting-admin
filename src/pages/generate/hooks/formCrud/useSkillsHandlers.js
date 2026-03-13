import { useState, useMemo } from "react";
import { generateSkills } from "../../../../utils";
import { safeClone } from "../../utils";

export function useSkillsHandlers({ formCv, setFormCv, isLimitedAdmin }) {
  // Skills generation state
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });

  // ── Tag handlers ──────────────────────────────────────────────────

  function addTag(path, value) {
    if (isLimitedAdmin) return;
    if (!value?.trim()) return;
    setFormCv((prev) => {
      const draft = safeClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }

  function removeTag(path, index) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const draft = safeClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }

  async function autoAddSkills(kind) {
    if (isLimitedAdmin) return;
    if (kind === "soft") setIsGeneratingSoft(true);
    else setIsGeneratingPc(true);
    try {
      const generated = generateSkills(formCv, kind);
      if (generated.length) {
        if (kind === "soft") {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              softSkills: [...prev.skills.softSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, soft: generated }));
        } else {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              pcSkills: [...prev.skills.pcSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, pc: generated }));
        }
      } else {
        setRecentlyAdded((p) =>
          kind === "soft" ? { ...p, soft: [] } : { ...p, pc: [] },
        );
      }
    } finally {
      if (kind === "soft") setIsGeneratingSoft(false);
      else setIsGeneratingPc(false);
    }
  }

  // ── Languages handlers ────────────────────────────────────────────

  const languageRows = useMemo(
    () =>
      Object.entries(formCv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [formCv.skills.languages],
  );

  function addLanguageRow() {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }

  function updateLanguageRow(rowIdx, field, value) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let next = [...entries];
      if (field === "name") next[rowIdx] = [value, oldLevel];
      else next[rowIdx] = [oldName, value];
      const nextObj = Object.fromEntries(
        next.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== ""),
        ),
      );
      return { ...prev, skills: { ...prev.skills, languages: nextObj } };
    });
  }

  function removeLanguageRow(rowIdx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx,
      );
      const newLanguages = Object.fromEntries(entries);
      return {
        ...prev,
        skills: { ...prev.skills, languages: newLanguages },
      };
    });
  }

  return {
    // Tags
    addTag,
    removeTag,
    autoAddSkills,
    // Skills state
    isGeneratingSoft,
    setIsGeneratingSoft,
    isGeneratingPc,
    setIsGeneratingPc,
    recentlyAdded,
    setRecentlyAdded,
    // Languages
    languageRows,
    addLanguageRow,
    updateLanguageRow,
    removeLanguageRow,
  };
}
