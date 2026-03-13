import { useFileHandlers } from "./formCrud/useFileHandlers";
import { useExperienceHandlers } from "./formCrud/useExperienceHandlers";
import { useEducationHandlers } from "./formCrud/useEducationHandlers";
import { useSkillsHandlers } from "./formCrud/useSkillsHandlers";
import { useCounts } from "./formCrud/useCounts";

export function useFormCrud({
  formCv,
  setFormCv,
  isLimitedAdmin,
  selectedDocumentType,
  setSelectedDocumentType,
  setPendingDocumentFiles,
}) {
  const { handlePhotoFileChange, handleDocumentFileChange } = useFileHandlers({
    setFormCv,
    isLimitedAdmin,
    selectedDocumentType,
    setSelectedDocumentType,
    setPendingDocumentFiles,
  });

  const {
    addExperience,
    updateExperience,
    removeExperience,
    addResponsibility,
    removeResponsibility,
  } = useExperienceHandlers({ setFormCv });

  const { addEducation, updateEducation, removeEducation } =
    useEducationHandlers({ setFormCv });

  const {
    addTag,
    removeTag,
    autoAddSkills,
    isGeneratingSoft,
    setIsGeneratingSoft,
    isGeneratingPc,
    setIsGeneratingPc,
    recentlyAdded,
    setRecentlyAdded,
    languageRows,
    addLanguageRow,
    updateLanguageRow,
    removeLanguageRow,
  } = useSkillsHandlers({ formCv, setFormCv, isLimitedAdmin });

  const { experienceCount, educationCount, languagesCount, documentsCount } =
    useCounts({ formCv, languageRows });

  return {
    // Photo / Document
    handlePhotoFileChange,
    handleDocumentFileChange,
    // Experience
    addExperience,
    updateExperience,
    removeExperience,
    addResponsibility,
    removeResponsibility,
    // Education
    addEducation,
    updateEducation,
    removeEducation,
    // Skills
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
    // Counts
    experienceCount,
    educationCount,
    languagesCount,
    documentsCount,
  };
}
