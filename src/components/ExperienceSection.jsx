import FormInput from "./FormInput";
import TagInput from "./TagInput";
import { toInputDate, fromInputDate } from "../utils";

function ExperienceSection({
  experience,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  onAddResponsibility,
  onRemoveResponsibility,
}) {
  return (
    <div className="space-y-6">
      {experience.map((exp, idx) => (
        <div key={idx} className="p-4 rounded-lg border border-base-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Berufserfahrung #{idx + 1}</h3>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error"
              onClick={() => onRemoveExperience(idx)}
            >
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor={`exp-${idx}-startDate`}>
                <span className="label-text">Startdatum</span>
              </label>
              <input
                id={`exp-${idx}-startDate`}
                type="date"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                value={toInputDate(exp.startDate)}
                onChange={(e) =>
                  onUpdateExperience(idx, "startDate", fromInputDate(e.target.value))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="label" htmlFor={`exp-${idx}-endDate`}>
                  <span className="label-text">Enddatum</span>
                </label>
                <input
                  id={`exp-${idx}-endDate`}
                  type="date"
                  className="input input-bordered w-full bg-base-100 text-base-content border-base-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200"
                  disabled={exp.endDate === "bis heute"}
                  value={exp.endDate === "bis heute" ? "" : toInputDate(exp.endDate)}
                  onChange={(e) =>
                    onUpdateExperience(idx, "endDate", fromInputDate(e.target.value))
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
                    onUpdateExperience(idx, "endDate", e.target.checked ? "bis heute" : "")
                  }
                />
              </label>
            </div>
            <FormInput
              label="Position"
              placeholder="Position"
              value={exp.position}
              onChange={(e) => onUpdateExperience(idx, "position", e.target.value)}
            />
            <FormInput
              label="Unternehmen"
              placeholder="Unternehmen"
              value={exp.company}
              onChange={(e) => onUpdateExperience(idx, "company", e.target.value)}
            />
            <FormInput
              className="md:col-span-2"
              label="Ort (Stadt, Land)"
              placeholder="Ort (Stadt, Land)"
              value={exp.location}
              onChange={(e) => onUpdateExperience(idx, "location", e.target.value)}
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
              placeholder="Neuen Punkt eingeben und auf Hinzufügen klicken (oder , setzen)"
              onAdd={(val) => onAddResponsibility(idx, val)}
              onRemove={(tagIdx) => onRemoveResponsibility(idx, tagIdx)}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={onAddExperience}
      >
        + Berufserfahrung hinzufügen
      </button>
    </div>
  );
}

export default ExperienceSection;


