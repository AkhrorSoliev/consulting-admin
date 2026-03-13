import { FaBriefcase } from "react-icons/fa";
import ExperienceSection from "../../../components/ExperienceSection";

/**
 * Step 1 – Experience (Berufserfahrung).
 *
 * Props:
 *   cv, addExperience, updateExperience, removeExperience,
 *   addResponsibility, removeResponsibility,
 *   showExperienceWarning, experienceErrors
 */
export default function ExperienceStep({
  cv,
  addExperience,
  updateExperience,
  removeExperience,
  addResponsibility,
  removeResponsibility,
  showExperienceWarning,
  experienceErrors,
}) {
  return (
    <>
      <div className="divider mt-0">
        <span className="mx-auto inline-flex items-center gap-2">
          <FaBriefcase className="opacity-70" aria-hidden="true" />
          <span>Berufserfahrung</span>
        </span>
      </div>
      <ExperienceSection
        experience={cv.experience}
        onAddExperience={addExperience}
        onUpdateExperience={updateExperience}
        onRemoveExperience={removeExperience}
        onAddResponsibility={addResponsibility}
        onRemoveResponsibility={removeResponsibility}
        showRequiredWarning={showExperienceWarning}
        errors={experienceErrors}
      />
    </>
  );
}
