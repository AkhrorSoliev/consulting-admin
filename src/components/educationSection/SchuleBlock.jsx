import FormInput from "../FormInput";
import RequiredLabel from "../RequiredLabel";
import CollapsibleSection from "../CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../../utils";

function SchuleBlock({ schule, errors, fieldInput, isOpen, onToggle, onUpdateEducation }) {
  return (
    <CollapsibleSection
      title={
        <div className="flex items-center gap-2">
          <RequiredLabel>Schule</RequiredLabel>
          <span className="text-xs text-base-content/60">
            (Maktab - nemis tilida)
          </span>
        </div>
      }
      isOpen={isOpen}
      onToggle={onToggle}
      className="shadow-sm border-base-200"
      contentClassName="space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="schule-startDate">
            <RequiredLabel className="label-text">Startdatum</RequiredLabel>
          </label>
          <input
            id="schule-startDate"
            type="month"
            placeholder="YYYY-MM"
            className={`${fieldInput} ${
              errors?.schule?.startDate ? "input-error" : ""
            }`}
            value={toInputMonth(schule.startDate)}
            onChange={(e) =>
              onUpdateEducation(
                "schule",
                "startDate",
                fromInputMonth(e.target.value)
              )
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="schule-endDate">
            <RequiredLabel className="label-text">Enddatum</RequiredLabel>
          </label>
          <input
            id="schule-endDate"
            type="month"
            placeholder="YYYY-MM"
            className={`${fieldInput} ${
              errors?.schule?.endDate ? "input-error" : ""
            }`}
            value={toInputMonth(schule.endDate)}
            onChange={(e) =>
              onUpdateEducation(
                "schule",
                "endDate",
                fromInputMonth(e.target.value)
              )
            }
          />
        </div>
        <FormInput
          className="md:col-span-2"
          label={
            <RequiredLabel>Bildungseinrichtung (auf Deutsch)</RequiredLabel>
          }
          placeholder="z.B. Gymnasium Nr. 1"
          helperText="Name der Schule auf Deutsch."
          value={schule.institution || ""}
          inputClassName={errors?.schule?.institution ? "input-error" : ""}
          onChange={(e) =>
            onUpdateEducation("schule", "institution", e.target.value)
          }
        />
        <FormInput
          className="md:col-span-2"
          label={<RequiredLabel>Abschluss (auf Deutsch)</RequiredLabel>}
          placeholder="z.B. Abitur"
          helperText="Schulabschluss auf Deutsch."
          value={schule.degree || ""}
          inputClassName={errors?.schule?.degree ? "input-error" : ""}
          onChange={(e) =>
            onUpdateEducation("schule", "degree", e.target.value)
          }
        />
      </div>
    </CollapsibleSection>
  );
}

export default SchuleBlock;
