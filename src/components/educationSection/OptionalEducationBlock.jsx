import FormInput from "../FormInput";
import CollapsibleSection from "../CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../../utils";

function OptionalEducationBlock({
  sectionKey,
  title,
  subtitle,
  checkboxLabel,
  institutionPlaceholder,
  institutionHelper,
  degreePlaceholder,
  degreeLabel,
  degreeHelper,
  data,
  errors,
  fieldInput,
  isSkipped,
  onSkipChange,
  isOpen,
  onToggle,
  onUpdateEducation,
}) {
  return (
    <div>
      <label className="cursor-pointer flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={isSkipped}
          onChange={(e) => {
            const checked = Boolean(e.target.checked);
            onSkipChange(checked);
            if (checked) {
              onUpdateEducation(sectionKey, "startDate", "");
              onUpdateEducation(sectionKey, "endDate", "");
              onUpdateEducation(sectionKey, "institution", "");
              onUpdateEducation(sectionKey, "degree", "");
            }
          }}
        />
        <span className="text-sm font-medium">{checkboxLabel}</span>
      </label>
      <CollapsibleSection
        title={
          <div className="flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs text-base-content/60">
              {subtitle}
            </span>
          </div>
        }
        isOpen={isOpen}
        onToggle={onToggle}
        className="shadow-sm border-base-200"
        contentClassName="space-y-3"
        disabled={isSkipped}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor={`${sectionKey}-startDate`}>
              <span className="label-text">Startdatum</span>
            </label>
            <input
              id={`${sectionKey}-startDate`}
              type="month"
              placeholder="YYYY-MM"
              className={`${fieldInput} ${
                errors?.[sectionKey]?.startDate ? "input-error" : ""
              }`}
              value={toInputMonth(data.startDate)}
              disabled={isSkipped}
              onChange={(e) =>
                onUpdateEducation(
                  sectionKey,
                  "startDate",
                  fromInputMonth(e.target.value)
                )
              }
            />
          </div>
          <div>
            <label className="label" htmlFor={`${sectionKey}-endDate`}>
              <span className="label-text">Enddatum</span>
            </label>
            <input
              id={`${sectionKey}-endDate`}
              type="month"
              placeholder="YYYY-MM"
              className={`${fieldInput} ${
                errors?.[sectionKey]?.endDate ? "input-error" : ""
              }`}
              value={toInputMonth(data.endDate)}
              disabled={isSkipped}
              onChange={(e) =>
                onUpdateEducation(
                  sectionKey,
                  "endDate",
                  fromInputMonth(e.target.value)
                )
              }
            />
          </div>
          <FormInput
            className="md:col-span-2"
            label="Bildungseinrichtung (auf Deutsch)"
            placeholder={institutionPlaceholder}
            helperText={institutionHelper}
            value={data.institution || ""}
            inputClassName={
              errors?.[sectionKey]?.institution ? "input-error" : ""
            }
            disabled={isSkipped}
            onChange={(e) =>
              onUpdateEducation(sectionKey, "institution", e.target.value)
            }
          />
          <FormInput
            className="md:col-span-2"
            label={degreeLabel}
            placeholder={degreePlaceholder}
            helperText={degreeHelper}
            value={data.degree || ""}
            inputClassName={
              errors?.[sectionKey]?.degree ? "input-error" : ""
            }
            disabled={isSkipped}
            onChange={(e) =>
              onUpdateEducation(sectionKey, "degree", e.target.value)
            }
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default OptionalEducationBlock;
