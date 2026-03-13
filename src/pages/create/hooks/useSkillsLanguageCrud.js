import { useCallback } from "react";
import { generateSkills } from "../../../utils";

/**
 * Utility: deep-clone plain JSON-like data (no File objects).
 */
function safeClone(value, fallback = null) {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
  } catch {
    // ignore and fall back to JSON
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

/**
 * Skills (soft/PC) and language CRUD operations.
 */
export default function useSkillsLanguageCrud({
  cv,
  setCv,
  setIsGeneratingSoft,
  setIsGeneratingPc,
  setRecentlyAdded,
}) {
  const addTag = useCallback(
    (path, value) => {
      if (!value?.trim()) return;
      setCv((prev) => {
        const draft = safeClone(prev, null);
        if (!draft) return prev;
        let target = draft;
        for (let i = 0; i < path.length - 1; i++) {
          target = target[path[i]];
        }
        const key = path[path.length - 1];
        target[key] = [...target[key], value.trim()];
        return draft;
      });
    },
    [setCv],
  );

  const addTags = useCallback(
    (path, values) => {
      if (!Array.isArray(values) || !values.length) return;
      setCv((prev) => {
        const draft = safeClone(prev, null);
        if (!draft) return prev;
        let target = draft;
        for (let i = 0; i < path.length - 1; i++) {
          target = target[path[i]];
        }
        const key = path[path.length - 1];
        const existing = Array.isArray(target[key]) ? target[key] : [];
        const nextSet = new Set(existing);
        values.forEach((v) => {
          const trimmed = String(v || "").trim();
          if (trimmed) nextSet.add(trimmed);
        });
        target[key] = Array.from(nextSet);
        return draft;
      });
    },
    [setCv],
  );

  const removeTag = useCallback(
    (path, index) => {
      setCv((prev) => {
        const draft = safeClone(prev, null);
        if (!draft) return prev;
        let target = draft;
        for (let i = 0; i < path.length - 1; i++) {
          target = target[path[i]];
        }
        const key = path[path.length - 1];
        target[key] = target[key].filter((_, i) => i !== index);
        return draft;
      });
    },
    [setCv],
  );

  const autoAddSkills = useCallback(
    async (kind) => {
      if (kind === "soft") {
        setIsGeneratingSoft(true);
      } else {
        setIsGeneratingPc(true);
      }
      try {
        const generated = generateSkills(cv, kind);
        if (generated.length) {
          if (kind === "soft") {
            addTags(["skills", "softSkills"], generated);
            setRecentlyAdded((prev) => ({ ...prev, soft: generated }));
          } else {
            addTags(["skills", "pcSkills"], generated);
            setRecentlyAdded((prev) => ({ ...prev, pc: generated }));
          }
        } else {
          if (kind === "soft") {
            setRecentlyAdded((prev) => ({ ...prev, soft: [] }));
          } else {
            setRecentlyAdded((prev) => ({ ...prev, pc: [] }));
          }
        }
      } finally {
        if (kind === "soft") {
          setIsGeneratingSoft(false);
        } else {
          setIsGeneratingPc(false);
        }
      }
    },
    [cv, addTags, setIsGeneratingSoft, setIsGeneratingPc, setRecentlyAdded],
  );

  const addLanguageRow = useCallback(() => {
    setCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }, [setCv]);

  const updateLanguageRow = useCallback(
    (rowIdx, field, value) => {
      setCv((prev) => {
        const entries = Object.entries(prev.skills.languages);
        const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
        let nextEntries = [...entries];
        if (field === "name") {
          nextEntries[rowIdx] = [value, oldLevel];
        } else {
          nextEntries[rowIdx] = [oldName, value];
        }
        const nextObj = Object.fromEntries(
          nextEntries.filter(
            ([k]) =>
              k !== "" || (k === "" && field === "name" && value !== ""),
          ),
        );
        return {
          ...prev,
          skills: { ...prev.skills, languages: nextObj },
        };
      });
    },
    [setCv],
  );

  const removeLanguageRow = useCallback(
    (rowIdx) => {
      setCv((prev) => {
        const entries = Object.entries(prev.skills.languages).filter(
          (_, i) => i !== rowIdx,
        );
        return {
          ...prev,
          skills: { ...prev.skills, languages: Object.fromEntries(entries) },
        };
      });
    },
    [setCv],
  );

  return {
    addTag,
    addTags,
    removeTag,
    autoAddSkills,
    addLanguageRow,
    updateLanguageRow,
    removeLanguageRow,
  };
}
