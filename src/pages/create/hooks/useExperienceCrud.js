import { useCallback } from "react";
import { sortTimelineItemsDesc } from "../../../utils";

/**
 * Experience CRUD operations: add, update, remove experiences and responsibilities.
 * Also includes education update.
 */
export default function useExperienceCrud({
  setCv,
  setShowEducationWarning,
  setEducationErrors,
}) {
  const addExperience = useCallback(() => {
    setCv((prev) => ({
      ...prev,
      experience: sortTimelineItemsDesc([
        ...prev.experience,
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ]),
    }));
  }, [setCv]);

  const updateExperience = useCallback(
    (idx, field, value) => {
      setCv((prev) => {
        const next = [...prev.experience];
        next[idx] = { ...next[idx], [field]: value };
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });
    },
    [setCv],
  );

  const removeExperience = useCallback(
    (idx) => {
      setCv((prev) => {
        const next = prev.experience.filter((_, i) => i !== idx);
        return { ...prev, experience: sortTimelineItemsDesc(next) };
      });
    },
    [setCv],
  );

  const addResponsibility = useCallback(
    (expIdx, text) => {
      if (!text?.trim()) return;
      setCv((prev) => {
        const next = [...prev.experience];
        const resp = [...next[expIdx].responsibilities, text.trim()];
        next[expIdx] = { ...next[expIdx], responsibilities: resp };
        return { ...prev, experience: next };
      });
    },
    [setCv],
  );

  const removeResponsibility = useCallback(
    (expIdx, respIdx) => {
      setCv((prev) => {
        const next = [...prev.experience];
        const resp = next[expIdx].responsibilities.filter(
          (_, i) => i !== respIdx,
        );
        next[expIdx] = { ...next[expIdx], responsibilities: resp };
        return { ...prev, experience: next };
      });
    },
    [setCv],
  );

  const updateEducation = useCallback(
    (type, field, value) => {
      setShowEducationWarning(false);
      setEducationErrors({});
      setCv((prev) => ({
        ...prev,
        education: {
          ...prev.education,
          [type]: {
            ...prev.education[type],
            [field]: value,
          },
        },
      }));
    },
    [setCv, setShowEducationWarning, setEducationErrors],
  );

  return {
    addExperience,
    updateExperience,
    removeExperience,
    addResponsibility,
    removeResponsibility,
    updateEducation,
  };
}
