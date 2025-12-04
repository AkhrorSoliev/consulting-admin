import FormInput from "./FormInput";
import { toInputDate, fromInputDate } from "../utils";

function EducationSection({
  education,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
}) {
  return (
    <div className="space-y-6">
      {education.map((edu, idx) => (
        <div key={idx} className="p-4 rounded-lg border border-base-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Ausbildung #{idx + 1}</h3>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error"
              onClick={() => onRemoveEducation(idx)}
            >
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor={`edu-${idx}-startDate`}>
                <span className="label-text">Startdatum</span>
              </label>
              <input
                id={`edu-${idx}-startDate`}
                type="date"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                value={toInputDate(edu.startDate)}
                onChange={(e) =>
                  onUpdateEducation(idx, "startDate", fromInputDate(e.target.value))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="label" htmlFor={`edu-${idx}-endDate`}>
                  <span className="label-text">Enddatum</span>
                </label>
                <input
                  id={`edu-${idx}-endDate`}
                  type="date"
                  className="input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                  disabled={edu.endDate === "bis heute"}
                  value={edu.endDate === "bis heute" ? "" : toInputDate(edu.endDate)}
                  onChange={(e) =>
                    onUpdateEducation(idx, "endDate", fromInputDate(e.target.value))
                  }
                />
              </div>
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Bis heute</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={edu.endDate === "bis heute"}
                  onChange={(e) =>
                    onUpdateEducation(idx, "endDate", e.target.checked ? "bis heute" : "")
                  }
                />
              </label>
            </div>
            <FormInput
              className="md:col-span-2"
              label="Bildungseinrichtung"
              placeholder="Bildungseinrichtung"
              value={edu.institution}
              onChange={(e) => onUpdateEducation(idx, "institution", e.target.value)}
            />
            <FormInput
              className="md:col-span-2"
              label="Abschluss / Studiengang (optional)"
              placeholder="Abschluss / Studiengang (optional)"
              value={edu.degree || ""}
              onChange={(e) => onUpdateEducation(idx, "degree", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={onAddEducation}
      >
        + Ausbildungsstation hinzufügen
      </button>
    </div>
  );
}

export default EducationSection;


