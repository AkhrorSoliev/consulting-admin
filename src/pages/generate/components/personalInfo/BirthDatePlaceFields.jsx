import FormInput from "../../../../components/FormInput";
import { UZBEK_REGIONS } from "../../../../constants/uzbekRegions";

export default function BirthDatePlaceFields({
  formCv,
  updatePersonalInfo,
  isMobile,
  selectBase,
  showBirthPlacePicker,
  setShowBirthPlacePicker,
  toInputDate,
  fromInputDate,
}) {
  return (
    <>
      <FormInput
        label="Geburtsdatum"
        type="date"
        placeholder="YYYY-MM-DD"
        value={toInputDate(formCv.personalInfo.birthDate)}
        onChange={(e) =>
          updatePersonalInfo("birthDate", fromInputDate(e.target.value))
        }
      />
      <div className="form-control w-full">
        <label className="label" htmlFor="g-birthPlace">
          <span className="label-text">Geburtsort</span>
        </label>
        {isMobile ? (
          <button
            type="button"
            onClick={() => setShowBirthPlacePicker(true)}
            className={`
              w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
              transition-all active:scale-98
              ${
                formCv.personalInfo.birthPlace
                  ? "border-success bg-success/5 text-base-content"
                  : "border-base-300 bg-base-100 text-base-content/60"
              }
            `}
          >
            <span className="text-base">
              {formCv.personalInfo.birthPlace || "Bitte auswählen"}
            </span>
            <svg
              className="w-5 h-5 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        ) : (
          <select
            id="g-birthPlace"
            className={selectBase}
            value={String(formCv.personalInfo.birthPlace || "")}
            onChange={(e) =>
              updatePersonalInfo("birthPlace", e.target.value)
            }
          >
            <option value="">Bitte auswählen</option>
            {UZBEK_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
