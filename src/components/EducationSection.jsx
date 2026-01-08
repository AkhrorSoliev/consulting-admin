import { useState } from "react";
import FormInput from "./FormInput";
import RequiredLabel from "./RequiredLabel";
import CollapsibleSection from "./CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../utils";

function EducationSection({
  education,
  onUpdateEducation,
  showRequiredWarning = false,
  errors = {},
}) {
  const fieldInput = "input input-bordered w-full";
  const REQUIRED_STAR_CLASS =
    "[&_[aria-hidden=true]]:text-[0.7em] [&_[aria-hidden=true]]:opacity-60";

  const schule = education?.schule || {};
  const kollej = education?.kollej || {};
  const universitat = education?.universitat || {};

  const [noKollej, setNoKollej] = useState(false);
  const [noUniversitat, setNoUniversitat] = useState(false);
  const [openSchule, setOpenSchule] = useState(true);
  const [openKollej, setOpenKollej] = useState(false);
  const [openUniversitat, setOpenUniversitat] = useState(false);

  const isEducationFilled = (edu) => {
    return edu.startDate && edu.endDate && edu.institution && edu.degree;
  };

  return (
    <div className="space-y-6">
      {/* Schule (Required) */}
      <CollapsibleSection
        title={
          <div className="flex items-center gap-2">
            <RequiredLabel>Schule</RequiredLabel>
            <span className="text-xs text-base-content/60">
              (Maktab - nemis tilida)
            </span>
          </div>
        }
        isOpen={openSchule}
        onToggle={(newOpen) => setOpenSchule(newOpen)}
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

      {/* Kollej/Litsey (Optional) */}
      <div>
        <label className="cursor-pointer flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={noKollej}
            onChange={(e) => {
              const checked = Boolean(e.target.checked);
              setNoKollej(checked);
              if (checked) {
                onUpdateEducation("kollej", "startDate", "");
                onUpdateEducation("kollej", "endDate", "");
                onUpdateEducation("kollej", "institution", "");
                onUpdateEducation("kollej", "degree", "");
              }
            }}
          />
          <span className="text-sm font-medium">
            Kein Kollej/Litsey besucht
          </span>
        </label>
        <CollapsibleSection
          title={
            <div className="flex items-center gap-2">
              <span>Kollej/Litsey (optional)</span>
              <span className="text-xs text-base-content/60">
                (Kollej/Litsey - nemis tilida)
              </span>
            </div>
          }
          isOpen={openKollej}
          onToggle={(newOpen) => setOpenKollej(newOpen)}
          className="shadow-sm border-base-200"
          contentClassName="space-y-3"
          disabled={noKollej}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="kollej-startDate">
                <span className="label-text">Startdatum</span>
              </label>
              <input
                id="kollej-startDate"
                type="month"
                placeholder="YYYY-MM"
                className={`${fieldInput} ${
                  errors?.kollej?.startDate ? "input-error" : ""
                }`}
                value={toInputMonth(kollej.startDate)}
                disabled={noKollej}
                onChange={(e) =>
                  onUpdateEducation(
                    "kollej",
                    "startDate",
                    fromInputMonth(e.target.value)
                  )
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="kollej-endDate">
                <span className="label-text">Enddatum</span>
              </label>
              <input
                id="kollej-endDate"
                type="month"
                placeholder="YYYY-MM"
                className={`${fieldInput} ${
                  errors?.kollej?.endDate ? "input-error" : ""
                }`}
                value={toInputMonth(kollej.endDate)}
                disabled={noKollej}
                onChange={(e) =>
                  onUpdateEducation(
                    "kollej",
                    "endDate",
                    fromInputMonth(e.target.value)
                  )
                }
              />
            </div>
            <FormInput
              className="md:col-span-2"
              label="Bildungseinrichtung (auf Deutsch)"
              placeholder="z.B. Tashkent College"
              helperText="Name des Kollegs/Litseys auf Deutsch."
              value={kollej.institution || ""}
              inputClassName={errors?.kollej?.institution ? "input-error" : ""}
              disabled={noKollej}
              onChange={(e) =>
                onUpdateEducation("kollej", "institution", e.target.value)
              }
            />
            <FormInput
              className="md:col-span-2"
              label="Abschluss (auf Deutsch)"
              placeholder="z.B. Fachabitur"
              helperText="Abschluss auf Deutsch."
              value={kollej.degree || ""}
              inputClassName={errors?.kollej?.degree ? "input-error" : ""}
              disabled={noKollej}
              onChange={(e) =>
                onUpdateEducation("kollej", "degree", e.target.value)
              }
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Universität (Optional) */}
      <div>
        <label className="cursor-pointer flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={noUniversitat}
            onChange={(e) => {
              const checked = Boolean(e.target.checked);
              setNoUniversitat(checked);
              if (checked) {
                onUpdateEducation("universitat", "startDate", "");
                onUpdateEducation("universitat", "endDate", "");
                onUpdateEducation("universitat", "institution", "");
                onUpdateEducation("universitat", "degree", "");
              }
            }}
          />
          <span className="text-sm font-medium">Keine Universität besucht</span>
        </label>
        <CollapsibleSection
          title={
            <div className="flex items-center gap-2">
              <span>Universität (optional)</span>
              <span className="text-xs text-base-content/60">
                (Universitet - nemis tilida)
              </span>
            </div>
          }
          isOpen={openUniversitat}
          onToggle={(newOpen) => setOpenUniversitat(newOpen)}
          className="shadow-sm border-base-200"
          contentClassName="space-y-3"
          disabled={noUniversitat}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="universitat-startDate">
                <span className="label-text">Startdatum</span>
              </label>
              <input
                id="universitat-startDate"
                type="month"
                placeholder="YYYY-MM"
                className={`${fieldInput} ${
                  errors?.universitat?.startDate ? "input-error" : ""
                }`}
                value={toInputMonth(universitat.startDate)}
                disabled={noUniversitat}
                onChange={(e) =>
                  onUpdateEducation(
                    "universitat",
                    "startDate",
                    fromInputMonth(e.target.value)
                  )
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="universitat-endDate">
                <span className="label-text">Enddatum</span>
              </label>
              <input
                id="universitat-endDate"
                type="month"
                placeholder="YYYY-MM"
                className={`${fieldInput} ${
                  errors?.universitat?.endDate ? "input-error" : ""
                }`}
                value={toInputMonth(universitat.endDate)}
                disabled={noUniversitat}
                onChange={(e) =>
                  onUpdateEducation(
                    "universitat",
                    "endDate",
                    fromInputMonth(e.target.value)
                  )
                }
              />
            </div>
            <FormInput
              className="md:col-span-2"
              label="Bildungseinrichtung (auf Deutsch)"
              placeholder="z.B. Tashkent State University"
              helperText="Name der Universität auf Deutsch."
              value={universitat.institution || ""}
              inputClassName={
                errors?.universitat?.institution ? "input-error" : ""
              }
              disabled={noUniversitat}
              onChange={(e) =>
                onUpdateEducation("universitat", "institution", e.target.value)
              }
            />
            <FormInput
              className="md:col-span-2"
              label="Abschluss / Studiengang (auf Deutsch)"
              placeholder="z.B. Bachelor Informatik"
              helperText="Beispiel: Bachelor, Master."
              value={universitat.degree || ""}
              inputClassName={errors?.universitat?.degree ? "input-error" : ""}
              disabled={noUniversitat}
              onChange={(e) =>
                onUpdateEducation("universitat", "degree", e.target.value)
              }
            />
          </div>
        </CollapsibleSection>
      </div>

      {showRequiredWarning ? (
        <div className="mt-2 alert alert-warning text-sm">
          Bitte füllen Sie alle Pflichtfelder der Schule aus.
        </div>
      )}
    </div>
  );
}

export default EducationSection;
