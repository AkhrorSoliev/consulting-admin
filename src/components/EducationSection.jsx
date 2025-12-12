import FormInput from "./FormInput";
import RequiredLabel from "./RequiredLabel";
import { toInputMonth, fromInputMonth } from "../utils";

function EducationSection({
  education,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  showRequiredWarning = false,
  errors = [],
}) {
  const fieldInput = "input input-bordered w-full";

  return (
    <div className="space-y-6">
      {education.map((edu, idx) => (
        <div
          key={idx}
          className="p-4 sm:p-5 rounded-xl border border-base-300 bg-base-100 shadow-sm space-y-3 ring-1 ring-base-200/80"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-base">Ausbildung #{idx + 1}</h3>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error hover:bg-error/10"
              onClick={() => onRemoveEducation(idx)}
            >
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor={`edu-${idx}-startDate`}>
                <RequiredLabel className="label-text">Startdatum</RequiredLabel>
              </label>
              <input
                id={`edu-${idx}-startDate`}
                type="month"
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
              placeholder="Bildungseinrichtung"
              value={edu.institution}
              inputClassName={errors[idx]?.institution ? "input-error" : ""}
              onChange={(e) =>
                onUpdateEducation(idx, "institution", e.target.value)
              }
            />
            <FormInput
              className="md:col-span-2"
              label={<RequiredLabel>Abschluss / Studiengang</RequiredLabel>}
              placeholder="Abschluss / Studiengang"
              value={edu.degree || ""}
              inputClassName={errors[idx]?.degree ? "input-error" : ""}
              onChange={(e) => onUpdateEducation(idx, "degree", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className={`btn btn-outline btn-sm ${
          showRequiredWarning ? "btn-error border-error/60 text-error" : ""
        }`}
        onClick={onAddEducation}
      >
        + Ausbildungsstation hinzufügen
      </button>
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
