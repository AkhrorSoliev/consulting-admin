import CollapsibleSection from "../../../components/CollapsibleSection";
import ExperienceSection from "../../../components/ExperienceSection";

export default function ExperienceSectionCard({
  experienceCount,
  formCv,
  addExperience,
  updateExperience,
  removeExperience,
  addResponsibility,
  removeResponsibility,
  handleCorrectExperience,
  correctingExperienceIndex,
  aufgabenOnlyMode,
  toggleAufgabenOnlyMode,
  undoExperience,
  redoExperience,
  canUndoExperience,
  canRedoExperience,
}) {
  return (
    <CollapsibleSection title="Berufserfahrung" count={experienceCount} defaultOpen={false}>
      <ExperienceSection
        experience={formCv.experience}
        onAddExperience={addExperience}
        onUpdateExperience={updateExperience}
        onRemoveExperience={removeExperience}
        onAddResponsibility={addResponsibility}
        onRemoveResponsibility={removeResponsibility}
        onCorrectExperience={handleCorrectExperience}
        correctingIndex={correctingExperienceIndex}
        aufgabenOnlyMode={aufgabenOnlyMode}
        onToggleAufgabenOnly={toggleAufgabenOnlyMode}
        onUndoExperience={undoExperience}
        onRedoExperience={redoExperience}
        canUndo={canUndoExperience}
        canRedo={canRedoExperience}
      />
    </CollapsibleSection>
  );
}
