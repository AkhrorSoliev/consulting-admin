import { useCallback } from "react";

/**
 * Handles CRUD operations for personal info, experience, and education.
 */
export function useCrudHandlers(formCv, setFormCv, isLimitedAdmin) {
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

  return {
    handlePersonalInfoChange,
    handleExperienceChange,
    handleEducationChange,
    handleAddExperience,
    handleRemoveExperience,
    handleAddEducation,
    handleRemoveEducation,
  };
}
