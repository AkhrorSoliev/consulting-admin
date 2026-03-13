import { FaGraduationCap } from "react-icons/fa";
import EducationSection from "../../../components/EducationSection";
import RequiredLabel from "../../../components/RequiredLabel";

/**
 * Step 2 – Education (Ausbildung).
 *
 * Props:
 *   cv, updateEducation, showEducationWarning, educationErrors,
 *   noCollege, setNoCollege, noUniversity, setNoUniversity,
 *   REQUIRED_STAR_CLASS
 */
export default function EducationStep({
  cv,
  updateEducation,
  showEducationWarning,
  educationErrors,
  noCollege,
  setNoCollege,
  noUniversity,
  setNoUniversity,
  REQUIRED_STAR_CLASS,
}) {
  return (
    <>
      <div className="divider mt-0">
        <span className="mx-auto inline-flex items-center gap-2">
          <FaGraduationCap className="opacity-70" aria-hidden="true" />
          <RequiredLabel className={REQUIRED_STAR_CLASS}>
            Ausbildung
          </RequiredLabel>
        </span>
      </div>
      <EducationSection
        education={cv.education}
        onUpdateEducation={updateEducation}
        showRequiredWarning={showEducationWarning}
        errors={educationErrors}
        noCollege={noCollege}
        setNoCollege={setNoCollege}
        noUniversity={noUniversity}
        setNoUniversity={setNoUniversity}
      />
    </>
  );
}
