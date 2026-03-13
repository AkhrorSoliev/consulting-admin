import { useState, useEffect } from "react";
import CollapsibleSection from "./CollapsibleSection";
import ExperienceItemToolbar from "./experienceSection/ExperienceItemToolbar";
import ExperienceItemForm from "./experienceSection/ExperienceItemForm";

function ExperienceSection({
  experience,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  onAddResponsibility,
  onRemoveResponsibility,
  showRequiredWarning = false,
  errors = [],
  renderItemActions,
  onCorrectExperience,
  correctingIndex,
  aufgabenOnlyMode = {},
  onToggleAufgabenOnly,
  onUndoExperience,
  onRedoExperience,
  canUndo,
  canRedo,
}) {
  const [openIndex, setOpenIndex] = useState(experience.length - 1);

  // When a new experience is added, open the last one
  useEffect(() => {
    setOpenIndex(experience.length - 1);
  }, [experience.length]);

  // Check if current experience is filled
  const isExperienceFilled = (exp) => {
    return (
      exp.startDate &&
      exp.endDate &&
      exp.position &&
      exp.company &&
      exp.location &&
      exp.responsibilities.length > 0
    );
  };

  // Check if experience is completely empty
  const isExperienceEmpty = (exp) => {
    return (
      !exp.startDate &&
      !exp.endDate &&
      !exp.position &&
      !exp.company &&
      !exp.location &&
      exp.responsibilities.length === 0
    );
  };

  // Check if experience is partially filled (some fields filled, but not all)
  const isExperiencePartiallyFilled = (exp) => {
    return !isExperienceFilled(exp) && !isExperienceEmpty(exp);
  };

  const canAddNew = () => {
    if (experience.length === 0) return true;
    const lastExp = experience[experience.length - 1];
    return isExperienceFilled(lastExp);
  };

  const handleAddExperience = () => {
    if (canAddNew()) {
      onAddExperience();
      // Set the next index to be open immediately
      setTimeout(() => {
        setOpenIndex(experience.length);
      }, 0);
    }
  };

  const handleToggle = (idx, newOpen) => {
    // If opening this item, set it as the open index
    // If closing, set -1 (no item open)
    if (newOpen) {
      setOpenIndex(idx);
    } else {
      setOpenIndex(-1);
    }
  };

  return (
    <div className="space-y-3">
      {experience.length === 0 && (
        <div className="alert alert-info text-sm">
          <div>
            <div className="font-medium">Optional</div>
            <div className="opacity-80">
              Wenn Sie keine Berufserfahrung haben, können Sie diesen Schritt
              überspringen. Wenn Sie Einträge hinzufügen, füllen Sie bitte alle
              Felder vollständig aus.
            </div>
          </div>
        </div>
      )}
      {experience.map((exp, idx) => {
        return (
          <CollapsibleSection
            key={idx}
            title={`Berufserfahrung #${idx + 1}`}
            isOpen={idx === openIndex}
            onToggle={(newOpen) => handleToggle(idx, newOpen)}
            className="shadow-sm border-base-200"
            contentClassName="space-y-3"
          >
            <ExperienceItemToolbar
              idx={idx}
              exp={exp}
              renderItemActions={renderItemActions}
              onCorrectExperience={onCorrectExperience}
              correctingIndex={correctingIndex}
              aufgabenOnlyMode={aufgabenOnlyMode}
              onToggleAufgabenOnly={onToggleAufgabenOnly}
              onUndoExperience={onUndoExperience}
              onRedoExperience={onRedoExperience}
              canUndo={canUndo}
              canRedo={canRedo}
              onRemoveExperience={onRemoveExperience}
            />
            <ExperienceItemForm
              idx={idx}
              exp={exp}
              errors={errors}
              onUpdateExperience={onUpdateExperience}
              onAddResponsibility={onAddResponsibility}
              onRemoveResponsibility={onRemoveResponsibility}
            />
          </CollapsibleSection>
        );
      })}
      <button
        type="button"
        className={`btn btn-outline btn-sm ${
          showRequiredWarning ? "btn-error border-error/60 text-error" : ""
        } ${!canAddNew() ? "btn-disabled opacity-50" : ""}`}
        onClick={handleAddExperience}
        disabled={!canAddNew()}
      >
        + Berufserfahrung hinzufügen
      </button>
      {experience.length > 0 &&
        isExperiencePartiallyFilled(experience[experience.length - 1]) && (
          <div className="mt-2 alert alert-warning text-sm">
            Bitte füllen Sie alle Felder der aktuellen Berufserfahrung aus,
            bevor Sie eine neue hinzufügen.
          </div>
        )}
      {showRequiredWarning ? (
        <div className="mt-2 alert alert-warning text-sm">
          Bitte füllen Sie alle Felder in jeder Berufserfahrung aus oder
          entfernen Sie unvollständige Einträge.
        </div>
      ) : null}
    </div>
  );
}

export default ExperienceSection;
