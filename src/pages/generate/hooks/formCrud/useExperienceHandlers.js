import { sortTimelineItemsDesc } from "../../../../utils";

export function useExperienceHandlers({ setFormCv }) {
  function addExperience() {
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.experience) ? prev.experience : []),
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ];
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }

  function updateExperience(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }

  function removeExperience(idx) {
    setFormCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }

  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  function removeResponsibility(expIdx, respIdx) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx,
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  return {
    addExperience,
    updateExperience,
    removeExperience,
    addResponsibility,
    removeResponsibility,
  };
}
