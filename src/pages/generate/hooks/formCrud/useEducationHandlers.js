import { sortTimelineItemsDesc } from "../../../../utils";

export function useEducationHandlers({ setFormCv }) {
  function addEducation() {
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.education) ? prev.education : []),
        { startDate: "", endDate: "", institution: "", degree: "" },
      ];
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }

  function updateEducation(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }

  function removeEducation(idx) {
    setFormCv((prev) => {
      const next = prev.education.filter((_, i) => i !== idx);
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }

  return { addEducation, updateEducation, removeEducation };
}
