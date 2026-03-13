import FormInput from "../FormInput";
import TagInput from "../TagInput";
import { toInputMonth, fromInputMonth } from "../../utils";

function ExperienceItemForm({
  idx,
  exp,
  errors,
  onUpdateExperience,
  onAddResponsibility,
  onRemoveResponsibility,
}) {
  const fieldInput = "input input-bordered w-full";

  return (
    <>
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
            "z.B.\n\u2013 Unterst\u00fctzung bei t\u00e4glichen Arbeitsabl\u00e4ufen\n\u2013 Mitarbeit im Team\n\u2013 Einhaltung von Arbeits- und Sicherheitsregeln"
          }
          onAdd={(val) => onAddResponsibility(idx, val)}
          onRemove={(tagIdx) => onRemoveResponsibility(idx, tagIdx)}
        />
      </div>
    </>
  );
}

export default ExperienceItemForm;
