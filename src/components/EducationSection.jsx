import FormInput from "./FormInput";
import RequiredLabel from "./RequiredLabel";
import CollapsibleSection from "./CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../utils";

function EducationSection({
  education,
  onUpdateEducation,
  showRequiredWarning = false,
  errors = {},
  noCollege = false,
  setNoCollege,
  noUniversity = false,
  setNoUniversity,
}) {
  const fieldInput = "input input-bordered w-full";
  const REQUIRED_STAR_CLASS =
    "[&_[aria-hidden=true]]:text-[0.7em] [&_[aria-hidden=true]]:opacity-60";

  const schule = education?.schule || {};
  const kollej = education?.kollej || {};
  const universitat = education?.universitat || {};

  const schuleBisHeute = schule.endDate === "bis heute";
  const kollejBisHeute = kollej.endDate === "bis heute";
  const universitatBisHeute = universitat.endDate === "bis heute";

  const schuleErrors = errors?.schule || {};

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title={
          <RequiredLabel className={REQUIRED_STAR_CLASS}>Schule</RequiredLabel>
        }
        defaultOpen={true}
        contentClassName="space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>
                Startdatum
              </RequiredLabel>
            </label>
            <input
              type="month"
              className={`${fieldInput} ${
                schuleErrors?.startDate ? "input-error" : ""
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
            <label className="label">
              <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>
                Enddatum
              </RequiredLabel>
            </label>
            <input
              type="month"
              className={`${fieldInput} ${
                schuleErrors?.endDate ? "input-error" : ""
              }`}
              value={toInputMonth(schule.endDate)}
              onChange={(e) =>
                onUpdateEducation(
                  "schule",
                  "endDate",
                  fromInputMonth(e.target.value)
                )
              }
              disabled={schuleBisHeute}
            />
            <label className="cursor-pointer flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={schuleBisHeute}
                onChange={(e) => {
                  onUpdateEducation(
                    "schule",
                    "endDate",
                    e.target.checked ? "bis heute" : ""
                  );
                }}
              />
              <span className="text-sm">bis heute (aktuell)</span>
            </label>
          </div>
          <FormInput
            className="md:col-span-2"
            label={
              <RequiredLabel className={REQUIRED_STAR_CLASS}>
                Bildungseinrichtung (auf Deutsch)
              </RequiredLabel>
            }
            helperText="Name der Schule auf Deutsch."
            placeholder="z.B. Gymnasium Nr. 1"
            value={schule.institution || ""}
            inputClassName={schuleErrors?.institution ? "input-error" : ""}
            onChange={(e) =>
              onUpdateEducation("schule", "institution", e.target.value)
            }
            name="edu-school-institution"
          />
          <FormInput
            className="md:col-span-2"
            label={
              <RequiredLabel className={REQUIRED_STAR_CLASS}>
                Abschluss (auf Deutsch)
              </RequiredLabel>
            }
            helperText="Schulabschluss auf Deutsch."
            placeholder="z.B. Abitur"
            value={schule.degree || ""}
            inputClassName={schuleErrors?.degree ? "input-error" : ""}
            onChange={(e) =>
              onUpdateEducation("schule", "degree", e.target.value)
            }
            name="edu-school-degree"
          />
        </div>
      </CollapsibleSection>

      <label className="cursor-pointer flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          className="checkbox"
          checked={noCollege}
          onChange={(e) => {
            const checked = e.target.checked;
            setNoCollege(checked);
            if (checked) {
              // Clear kollej data when skipped
              onUpdateEducation("kollej", "startDate", "");
              onUpdateEducation("kollej", "endDate", "");
              onUpdateEducation("kollej", "institution", "");
              onUpdateEducation("kollej", "degree", "");
            }
          }}
        />
        <span className="text-sm">Kein Kollej/Litsey besucht</span>
      </label>

      <CollapsibleSection
        title="Kollej/Litsey (optional)"
        defaultOpen={false}
        contentClassName="space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <span className="label-text">Startdatum</span>
            </label>
            <input
              type="month"
              className={fieldInput}
              value={toInputMonth(kollej.startDate)}
              onChange={(e) =>
                onUpdateEducation(
                  "kollej",
                  "startDate",
                  fromInputMonth(e.target.value)
                )
              }
              disabled={noCollege}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Enddatum</span>
            </label>
            <input
              type="month"
              className={fieldInput}
              value={toInputMonth(kollej.endDate)}
              onChange={(e) =>
                onUpdateEducation(
                  "kollej",
                  "endDate",
                  fromInputMonth(e.target.value)
                )
              }
              disabled={noCollege || kollejBisHeute}
            />
            <label className="cursor-pointer flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={kollejBisHeute}
                onChange={(e) => {
                  onUpdateEducation(
                    "kollej",
                    "endDate",
                    e.target.checked ? "bis heute" : ""
                  );
                }}
                disabled={noCollege}
              />
              <span className="text-sm">bis heute (aktuell)</span>
            </label>
          </div>
          <FormInput
            className="md:col-span-2"
            label="Bildungseinrichtung (auf Deutsch)"
            helperText="Name der Schule auf Deutsch."
            placeholder="z.B. Lyzeum Nr. 1"
            value={kollej.institution || ""}
            onChange={(e) =>
              onUpdateEducation("kollej", "institution", e.target.value)
            }
            name="edu-college-institution"
            disabled={noCollege}
          />
          <FormInput
            className="md:col-span-2"
            label="Abschluss (auf Deutsch)"
            helperText="Schulabschluss auf Deutsch."
            placeholder="z.B. Abitur"
            value={kollej.degree || ""}
            onChange={(e) =>
              onUpdateEducation("kollej", "degree", e.target.value)
            }
            name="edu-college-degree"
            disabled={noCollege}
          />
        </div>
      </CollapsibleSection>

      <label className="cursor-pointer flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          className="checkbox"
          checked={noUniversity}
          onChange={(e) => {
            const checked = e.target.checked;
            setNoUniversity(checked);
            if (checked) {
              // Clear universitat data when skipped
              onUpdateEducation("universitat", "startDate", "");
              onUpdateEducation("universitat", "endDate", "");
              onUpdateEducation("universitat", "institution", "");
              onUpdateEducation("universitat", "degree", "");
            }
          }}
        />
        <span className="text-sm">Keine Universität besucht</span>
      </label>

      <CollapsibleSection
        title="Universität (optional)"
        defaultOpen={false}
        contentClassName="space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <span className="label-text">Startdatum</span>
            </label>
            <input
              type="month"
              className={fieldInput}
              value={toInputMonth(universitat.startDate)}
              onChange={(e) =>
                onUpdateEducation(
                  "universitat",
                  "startDate",
                  fromInputMonth(e.target.value)
                )
              }
              disabled={noUniversity}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Enddatum</span>
            </label>
            <input
              type="month"
              className={fieldInput}
              value={toInputMonth(universitat.endDate)}
              onChange={(e) =>
                onUpdateEducation(
                  "universitat",
                  "endDate",
                  fromInputMonth(e.target.value)
                )
              }
              disabled={noUniversity || universitatBisHeute}
            />
            <label className="cursor-pointer flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={universitatBisHeute}
                onChange={(e) => {
                  onUpdateEducation(
                    "universitat",
                    "endDate",
                    e.target.checked ? "bis heute" : ""
                  );
                }}
                disabled={noUniversity}
              />
              <span className="text-sm">bis heute (aktuell)</span>
            </label>
          </div>
          <FormInput
            className="md:col-span-2"
            label="Bildungseinrichtung (auf Deutsch)"
            helperText="Name der Schule auf Deutsch."
            placeholder="z.B. Universität"
            value={universitat.institution || ""}
            onChange={(e) =>
              onUpdateEducation("universitat", "institution", e.target.value)
            }
            name="edu-uni-institution"
            disabled={noUniversity}
          />
          <FormInput
            className="md:col-span-2"
            label="Abschluss (auf Deutsch)"
            helperText="Schulabschluss auf Deutsch."
            placeholder="z.B. Bachelor"
            value={universitat.degree || ""}
            onChange={(e) =>
              onUpdateEducation("universitat", "degree", e.target.value)
            }
            name="edu-uni-degree"
            disabled={noUniversity}
          />
        </div>
      </CollapsibleSection>

      {showRequiredWarning && (
        <div className="mt-2 alert alert-warning text-sm">
          Bitte füllen Sie alle Pflichtfelder der Schule aus.
        </div>
      )}
    </div>
  );
}

export default EducationSection;
