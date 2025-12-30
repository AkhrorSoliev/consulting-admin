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
            <div className="flex items-center justify-end gap-2 mb-3">
              {typeof renderItemActions === "function"
                ? renderItemActions(idx, exp)
                : null}
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
