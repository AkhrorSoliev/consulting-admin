import { useState, useEffect } from "react";
import FormInput from "./FormInput";
import TagInput from "./TagInput";
import CollapsibleSection from "./CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../utils";
import { Trash2 } from "lucide-react";

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
  const fieldInput = "input input-bordered w-full";

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 mb-3">
              {typeof renderItemActions === "function"
                ? renderItemActions(idx, exp)
                : null}

              {typeof onCorrectExperience === "function" && (
                <div className="flex items-center gap-2 relative">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={aufgabenOnlyMode[idx] || false}
                      onChange={() => onToggleAufgabenOnly?.(idx)}
                      disabled={correctingIndex === idx}
                      title={
                        aufgabenOnlyMode[idx]
                          ? "Korrigiert nur Aufgaben basierend auf Position, Unternehmen und Ort"
                          : ""
                      }
                    />
                    <span className="text-xs opacity-70">Nur Aufgaben</span>
                  </label>

                  {/* Undo/Redo buttons - only visible when there are changes */}
                  {(canUndo?.(idx) || canRedo?.(idx)) && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => onUndoExperience?.(idx)}
                        disabled={!canUndo?.(idx) || correctingIndex === idx}
                        title="Rückgängig"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => onRedoExperience?.(idx)}
                        disabled={!canRedo?.(idx) || correctingIndex === idx}
                        title="Wiederherstellen"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm btn-primary gap-2"
                    onClick={() => onCorrectExperience(idx)}
                    disabled={correctingIndex === idx}
                    title="Mit KI korrigieren"
                  >
                    {correctingIndex === idx ? (
                      <>
                        <span className="loading loading-spinner loading-xs" />
                        Korrigieren...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        KI
                      </>
                    )}
                  </button>
                </div>
              )}

              <button
                type="button"
                className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                onClick={() => onRemoveExperience(idx)}
                title="Entfernen"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor={`exp-${idx}-startDate`}>
                  <span className="label-text">Startdatum</span>
                </label>
                <input
                  id={`exp-${idx}-startDate`}
                  type="month"
                  placeholder="YYYY-MM"
                  className={`${fieldInput} ${
                    errors[idx]?.startDate ? "input-error" : ""
                  }`}
                  value={toInputMonth(exp.startDate)}
                  onChange={(e) =>
                    onUpdateExperience(
                      idx,
                      "startDate",
                      fromInputMonth(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor={`exp-${idx}-endDate`}>
                  <span className="label-text">Enddatum</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id={`exp-${idx}-endDate`}
                    type="month"
                    placeholder="YYYY-MM"
                    className={`${fieldInput} ${
                      errors[idx]?.endDate ? "input-error" : ""
                    }`}
                    disabled={exp.endDate === "bis heute"}
                    value={
                      exp.endDate === "bis heute"
                        ? ""
                        : toInputMonth(exp.endDate)
                    }
                    onChange={(e) =>
                      onUpdateExperience(
                        idx,
                        "endDate",
                        fromInputMonth(e.target.value)
                      )
                    }
                  />
                </div>
                <label className="label cursor-pointer gap-2">
                  <span className="label-text">Bis heute</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={exp.endDate === "bis heute"}
                    onChange={(e) =>
                      onUpdateExperience(
                        idx,
                        "endDate",
                        e.target.checked ? "bis heute" : ""
                      )
                    }
                  />
                </label>
              </div>
              <FormInput
                label="Position"
                placeholder="z.B. Verkäufer"
                helperText="Beispiel: Verkäufer, Lagerist, Bauhelfer"
                value={exp.position}
                inputClassName={errors[idx]?.position ? "input-error" : ""}
                onChange={(e) =>
                  onUpdateExperience(idx, "position", e.target.value)
                }
              />
              <FormInput
                label="Unternehmen"
                placeholder="z.B. ABC GmbH"
                helperText="Name des Unternehmens/Arbeitgebers."
                value={exp.company}
                inputClassName={errors[idx]?.company ? "input-error" : ""}
                onChange={(e) =>
                  onUpdateExperience(idx, "company", e.target.value)
                }
              />
              <FormInput
                className="md:col-span-2"
                label="Ort (Stadt, Land)"
                placeholder="z.B. Berlin, Deutschland"
                helperText="Bitte Stadt und Land angeben."
                value={exp.location}
                inputClassName={errors[idx]?.location ? "input-error" : ""}
                onChange={(e) =>
                  onUpdateExperience(idx, "location", e.target.value)
                }
              />
            </div>
            <div className="mt-4">
              <label className="label">
                <span className="label-text">Aufgaben</span>
              </label>
              <TagInput
                tags={exp.responsibilities}
                display="list"
                inputMode="textarea"
                placeholder={
                  "z.B.\n– Unterstützung bei täglichen Arbeitsabläufen\n– Mitarbeit im Team\n– Einhaltung von Arbeits- und Sicherheitsregeln"
                }
                onAdd={(val) => onAddResponsibility(idx, val)}
                onRemove={(tagIdx) => onRemoveResponsibility(idx, tagIdx)}
              />
            </div>
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
