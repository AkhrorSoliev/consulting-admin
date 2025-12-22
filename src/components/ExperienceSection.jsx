import FormInput from "./FormInput";
import TagInput from "./TagInput";
import { toInputMonth, fromInputMonth } from "../utils";

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
  const fieldInput =
    "input input-bordered w-full";

  return (
    <div className="space-y-6">
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
      {experience.map((exp, idx) => (
        <div
          key={idx}
          className="p-4 sm:p-5 rounded-xl border border-base-300 bg-base-100 shadow-sm space-y-3 ring-1 ring-base-200/80"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-base">Berufserfahrung #{idx + 1}</h3>
            <div className="flex items-center gap-2">
              {typeof renderItemActions === "function" ? renderItemActions(idx, exp) : null}
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                onClick={() => onRemoveExperience(idx)}
              >
                Entfernen
              </button>
            </div>
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
                onUpdateExperience(idx, "startDate", fromInputMonth(e.target.value))
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
                  value={exp.endDate === "bis heute" ? "" : toInputMonth(exp.endDate)}
                  onChange={(e) =>
                    onUpdateExperience(idx, "endDate", fromInputMonth(e.target.value))
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
              placeholder="z.B. Verkäufer"
              helperText="Beispiel: Verkäufer, Lagerist, Bauhelfer"
              value={exp.position}
              inputClassName={errors[idx]?.position ? "input-error" : ""}
              onChange={(e) => onUpdateExperience(idx, "position", e.target.value)}
            />
            <FormInput
              label="Unternehmen"
              placeholder="z.B. ABC GmbH"
              helperText="Name des Unternehmens/Arbeitgebers."
              value={exp.company}
              inputClassName={errors[idx]?.company ? "input-error" : ""}
              onChange={(e) => onUpdateExperience(idx, "company", e.target.value)}
            />
            <FormInput
              className="md:col-span-2"
              label="Ort (Stadt, Land)"
              placeholder="z.B. Berlin, Deutschland"
              helperText="Bitte Stadt und Land angeben."
              value={exp.location}
              inputClassName={errors[idx]?.location ? "input-error" : ""}
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
              placeholder={
                "z.B.\n– Unterstützung bei täglichen Arbeitsabläufen\n– Mitarbeit im Team\n– Einhaltung von Arbeits- und Sicherheitsregeln"
              }
              onAdd={(val) => onAddResponsibility(idx, val)}
              onRemove={(tagIdx) => onRemoveResponsibility(idx, tagIdx)}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className={`btn btn-outline btn-sm ${
          showRequiredWarning ? "btn-error border-error/60 text-error" : ""
        }`}
        onClick={onAddExperience}
      >
        + Berufserfahrung hinzufügen
      </button>
      {showRequiredWarning ? (
        <div className="mt-2 alert alert-warning text-sm">
          Bitte füllen Sie alle Felder in jeder Berufserfahrung aus oder entfernen Sie unvollständige Einträge.
        </div>
      ) : null}
    </div>
  );
}

export default ExperienceSection;
