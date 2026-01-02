import { useCallback } from "react";
import { generateSkills } from "../../../utils";
import toast from "react-hot-toast";

export function useFormHandlers(
  formCv,
  setFormCv,
  setRecentlyAdded,
  isLimitedAdmin
) {
  const handlePersonalInfoChange = useCallback(
    (field, value) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value },
      }));
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleExperienceChange = useCallback(
    (index, field, value) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => {
        const updated = [...prev.experience];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, experience: updated };
      });
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleEducationChange = useCallback(
    (index, field, value) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => {
        const updated = [...prev.education];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, education: updated };
      });
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleAddExperience = useCallback(() => {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ],
    }));
  }, [isLimitedAdmin, setFormCv]);

  const handleRemoveExperience = useCallback(
    (index) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index),
      }));
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleAddEducation = useCallback(() => {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { startDate: "", endDate: "", institution: "", degree: "" },
      ],
    }));
  }, [isLimitedAdmin, setFormCv]);

  const handleRemoveEducation = useCallback(
    (index) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }));
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleGenerateSoftSkills = useCallback(
    async (setIsGeneratingSoft) => {
      if (isLimitedAdmin) return;
      setIsGeneratingSoft(true);
      try {
        const exp = formCv.experience || [];
        const edu = formCv.education || [];
        const generated = await generateSkills(exp, edu, "soft");
        const existing = new Set(formCv.skills.softSkills || []);
        const newSkills = generated.filter((s) => !existing.has(s));
        if (newSkills.length === 0) {
          toast.success("Barcha soft skills allaqachon mavjud.");
          return;
        }
        setFormCv((prev) => ({
          ...prev,
          skills: {
            ...prev.skills,
            softSkills: [...(prev.skills.softSkills || []), ...newSkills],
          },
        }));
        setRecentlyAdded((prev) => ({ ...prev, soft: newSkills }));
        toast.success(`${newSkills.length} ta yangi soft skill qo'shildi.`);
        setTimeout(() => {
          setRecentlyAdded((prev) => ({ ...prev, soft: [] }));
        }, 3000);
      } catch (error) {
        toast.error("Soft skills yaratishda xatolik.");
      } finally {
        setIsGeneratingSoft(false);
      }
    },
    [isLimitedAdmin, formCv, setFormCv, setRecentlyAdded]
  );

  const handleGeneratePcSkills = useCallback(
    async (setIsGeneratingPc) => {
      if (isLimitedAdmin) return;
      setIsGeneratingPc(true);
      try {
        const exp = formCv.experience || [];
        const edu = formCv.education || [];
        const generated = await generateSkills(exp, edu, "pc");
        const existing = new Set(formCv.skills.pcSkills || []);
        const newSkills = generated.filter((s) => !existing.has(s));
        if (newSkills.length === 0) {
          toast.success("Barcha PC skills allaqachon mavjud.");
          return;
        }
        setFormCv((prev) => ({
          ...prev,
          skills: {
            ...prev.skills,
            pcSkills: [...(prev.skills.pcSkills || []), ...newSkills],
          },
        }));
        setRecentlyAdded((prev) => ({ ...prev, pc: newSkills }));
        toast.success(`${newSkills.length} ta yangi PC skill qo'shildi.`);
        setTimeout(() => {
          setRecentlyAdded((prev) => ({ ...prev, pc: [] }));
        }, 3000);
      } catch (error) {
        toast.error("PC skills yaratishda xatolik.");
      } finally {
        setIsGeneratingPc(false);
      }
    },
    [isLimitedAdmin, formCv, setFormCv, setRecentlyAdded]
  );

  const handleSoftSkillsChange = useCallback(
    (newSkills) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => ({
        ...prev,
        skills: { ...prev.skills, softSkills: newSkills },
      }));
    },
    [isLimitedAdmin, setFormCv]
  );

  const handlePcSkillsChange = useCallback(
    (newSkills) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => ({
        ...prev,
        skills: { ...prev.skills, pcSkills: newSkills },
      }));
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleLanguageChange = useCallback(
    (rowIdx, field, value) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => {
        const entries = Object.entries(prev.skills.languages);
        const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
        let next = [...entries];
        if (field === "name") next[rowIdx] = [value, oldLevel];
        else next[rowIdx] = [oldName, value];
        return {
          ...prev,
          skills: { ...prev.skills, languages: Object.fromEntries(next) },
        };
      });
    },
    [isLimitedAdmin, setFormCv]
  );

  const handleAddLanguage = useCallback(() => {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const newEntries = [...entries, ["", "A1"]];
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(newEntries) },
      };
    });
  }, [isLimitedAdmin, setFormCv]);

  const handleRemoveLanguage = useCallback(
    (rowIdx) => {
      if (isLimitedAdmin) return;
      setFormCv((prev) => {
        const entries = Object.entries(prev.skills.languages);
        const filtered = entries.filter((_, i) => i !== rowIdx);
        return {
          ...prev,
          skills: { ...prev.skills, languages: Object.fromEntries(filtered) },
        };
      });
    },
    [isLimitedAdmin, setFormCv]
  );

  return {
    handlePersonalInfoChange,
    handleExperienceChange,
    handleEducationChange,
    handleAddExperience,
    handleRemoveExperience,
    handleAddEducation,
    handleRemoveEducation,
    handleGenerateSoftSkills,
    handleGeneratePcSkills,
    handleSoftSkillsChange,
    handlePcSkillsChange,
    handleLanguageChange,
    handleAddLanguage,
    handleRemoveLanguage,
  };
}
