import { useState, useEffect } from "react";
import FormInput from "./FormInput";
import RequiredLabel from "./RequiredLabel";
import CollapsibleSection from "./CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../utils";
import { Trash2 } from "lucide-react";

function EducationSection({
  education,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  showRequiredWarning = false,
  errors = [],
  renderItemActions,
}) {
  const fieldInput = "input input-bordered w-full";

  const [openIndex, setOpenIndex] = useState(education.length - 1);

  // When a new education is added, open the last one
  useEffect(() => {
    setOpenIndex(education.length - 1);
  }, [education.length]);

  // Check if current education is filled
  const isEducationFilled = (edu) => {
    return edu.startDate && edu.endDate && edu.institution && edu.degree;
  };

  // Check if education is completely empty
  const isEducationEmpty = (edu) => {
    return !edu.startDate && !edu.endDate && !edu.institution && !edu.degree;
  };

  // Check if education is partially filled (some fields filled, but not all)
  const isEducationPartiallyFilled = (edu) => {
    return !isEducationFilled(edu) && !isEducationEmpty(edu);
  };

  const canAddNew = () => {
    if (education.length === 0) return true;
    const lastEdu = education[education.length - 1];
    return isEducationFilled(lastEdu);
  };

  const handleAddEducation = () => {
    if (canAddNew()) {
      onAddEducation();
      // Set the next index to be open immediately
      setTimeout(() => {
        setOpenIndex(education.length);
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
      {education.length === 0 && (
        <div className="alert alert-info text-sm">
          Bitte fügen Sie mindestens eine vollständige Ausbildungsstation hinzu
          und füllen Sie alle Felder aus (z. B. Schule).
        </div>
      )}
      {education.map((edu, idx) => {
        return (
          <CollapsibleSection
            key={idx}
            title={`Ausbildung #${idx + 1}`}
            isOpen={idx === openIndex}
            onToggle={(newOpen) => handleToggle(idx, newOpen)}
            className="shadow-sm border-base-200"
            contentClassName="space-y-3"
          >
            <div className="flex items-center justify-end gap-2 mb-3">
              {typeof renderItemActions === "function"
                ? renderItemActions(idx, edu)
                : null}
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                onClick={() => onRemoveEducation(idx)}
                title="Entfernen"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor={`edu-${idx}-startDate`}>
                  <RequiredLabel className="label-text">
                    Startdatum
                  </RequiredLabel>
                </label>
                <input
                  id={`edu-${idx}-startDate`}
                  type="month"
                  placeholder="YYYY-MM"
                  className={`${fieldInput} ${
                    errors[idx]?.startDate ? "input-error" : ""
                  }`}
                  value={toInputMonth(edu.startDate)}
                  onChange={(e) =>
                    onUpdateEducation(
                      idx,
                      "startDate",
                      fromInputMonth(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor={`edu-${idx}-endDate`}>
                  <RequiredLabel className="label-text">Enddatum</RequiredLabel>
                </label>
                <input
                  id={`edu-${idx}-endDate`}
                  type="month"
                  placeholder="YYYY-MM"
                  className={`${fieldInput} ${
                    errors[idx]?.endDate ? "input-error" : ""
                  }`}
                  value={toInputMonth(edu.endDate)}
                  onChange={(e) =>
                    onUpdateEducation(
                      idx,
                      "endDate",
                      fromInputMonth(e.target.value)
                    )
                  }
                />
              </div>
              <FormInput
                className="md:col-span-2"
                label={<RequiredLabel>Bildungseinrichtung</RequiredLabel>}
                placeholder="z.B. Tashkent State University"
                helperText="Beispiel: Schule, Universität, College."
                value={edu.institution}
                inputClassName={errors[idx]?.institution ? "input-error" : ""}
                onChange={(e) =>
                  onUpdateEducation(idx, "institution", e.target.value)
                }
              />
              <FormInput
                className="md:col-span-2"
                label={<RequiredLabel>Abschluss / Studiengang</RequiredLabel>}
                placeholder="z.B. Bachelor Informatik"
                helperText="Beispiel: Abitur, Bachelor, Master, Ausbildung."
                value={edu.degree || ""}
                inputClassName={errors[idx]?.degree ? "input-error" : ""}
                onChange={(e) =>
                  onUpdateEducation(idx, "degree", e.target.value)
                }
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
        onClick={handleAddEducation}
        disabled={!canAddNew()}
      >
        + Ausbildungsstation hinzufügen
      </button>
      {education.length > 0 &&
        isEducationPartiallyFilled(education[education.length - 1]) && (
          <div className="mt-2 alert alert-warning text-sm">
            Bitte füllen Sie alle Felder der aktuellen Ausbildung aus, bevor Sie
            eine neue hinzufügen.
          </div>
        )}
      {showRequiredWarning ? (
        <div className="mt-2 alert alert-warning text-sm">
          Bitte fügen Sie mindestens eine vollständige Ausbildungsstation hinzu
          und füllen Sie alle Felder aus (z. B. Schule).
        </div>
      ) : null}
    </div>
  );
}

export default EducationSection;
