import { FaTrash } from "react-icons/fa";
import CollapsibleSection from "../../../../components/CollapsibleSection";
import { toInputMonth, fromInputMonth } from "../../../../utils";

export default function EducationSection({
  formCv,
  inputBase,
  educationCount,
  addEducation,
  updateEducation,
  removeEducation,
}) {
  return (
    <CollapsibleSection
      title="Ausbildung"
      count={educationCount}
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-base-content/70">
            Ausbildungseinträge
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={addEducation}
          >
            Hinzufügen
          </button>
        </div>

        {educationCount === 0 ? (
          <div className="text-sm text-base-content/60">
            Keine Einträge.
          </div>
        ) : null}

        <div className="space-y-3">
          {(Array.isArray(formCv.education)
            ? formCv.education
            : []
          ).map((edu, idx) => {
            const endIsBisHeute =
              String(edu?.endDate || "").trim() === "bis heute";
            return (
              <CollapsibleSection
                key={idx}
                title={`Ausbildung #${idx + 1}`}
                defaultOpen={false}
                contentClassName="p-4 pt-0 space-y-3"
                meta={
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs relative z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeEducation(idx);
                    }}
                    aria-label={`Ausbildung #${
                      idx + 1
                    } löschen`}
                  >
                    <FaTrash />
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">
                        Startdatum
                      </span>
                    </label>
                    <input
                      type="month"
                      className={inputBase}
                      value={toInputMonth(edu?.startDate)}
                      onChange={(e) =>
                        updateEducation(
                          idx,
                          "startDate",
                          fromInputMonth(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">
                        Enddatum
                      </span>
                    </label>
                    <input
                      type="month"
                      className={inputBase}
                      value={toInputMonth(edu?.endDate)}
                      onChange={(e) =>
                        updateEducation(
                          idx,
                          "endDate",
                          fromInputMonth(e.target.value),
                        )
                      }
                      disabled={endIsBisHeute}
                    />
                    <label className="cursor-pointer flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={endIsBisHeute}
                        onChange={(e) => {
                          updateEducation(
                            idx,
                            "endDate",
                            e.target.checked ? "bis heute" : "",
                          );
                        }}
                      />
                      <span className="text-sm">
                        bis heute (aktuell)
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">
                      <span className="label-text">
                        Bildungseinrichtung (auf Deutsch)
                      </span>
                    </label>
                    <input
                      type="text"
                      className={inputBase}
                      placeholder="z.B. Gymnasium Nr. 1"
                      value={String(edu?.institution || "")}
                      onChange={(e) =>
                        updateEducation(
                          idx,
                          "institution",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">
                      <span className="label-text">
                        Abschluss (auf Deutsch)
                      </span>
                    </label>
                    <input
                      type="text"
                      className={inputBase}
                      placeholder="z.B. Abitur"
                      value={String(edu?.degree || "")}
                      onChange={(e) =>
                        updateEducation(
                          idx,
                          "degree",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      </div>
    </CollapsibleSection>
  );
}
