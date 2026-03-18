import { Controller } from "react-hook-form";
import RequiredLabel from "../../../components/RequiredLabel";
import { UZBEK_REGIONS } from "../../../constants/uzbekRegions";
import countries from "../../../utils/const";

function RequiredField({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

/**
 * Address section: street, house number, city, country, postal code.
 */
export default function PersonalInfoAddressFields({
  register, control, errors, isMobile,
  addressStreet, addressHouseNumber, addressCity, addressCountry,
  setShowCityPicker, setShowCountryPicker,
  getSuccessClass, REQUIRED_STAR_CLASS,
}) {
  return (
    <div className="md:col-span-2">
      <input type="hidden" {...register("personalInfo.address")} aria-hidden="true" />
      <div className="rounded-box border border-base-300 bg-base-200/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div><div className="font-medium"><RequiredLabel className={REQUIRED_STAR_CLASS}>Adresse</RequiredLabel></div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="label" htmlFor="personalInfo-addressStreet">
              <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Straße</RequiredLabel>
            </label>
            <input id="personalInfo-addressStreet" type="text" placeholder="z.B. Musterstraße"
              className={`input input-bordered w-full ${errors?.personalInfo?.addressStreet ? "input-error" : getSuccessClass("personalInfo.addressStreet", addressStreet, "input")}`}
              aria-invalid={errors?.personalInfo?.addressStreet ? "true" : "false"}
              {...register("personalInfo.addressStreet", { required: "Straße ist erforderlich", setValueAs: (v) => String(v || "").trim() })}
            />
            {errors?.personalInfo?.addressStreet ? <p className="text-error text-sm mt-1">{errors.personalInfo.addressStreet.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="personalInfo-addressHouseNumber">
              <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Hausnummer</RequiredLabel>
            </label>
            <input id="personalInfo-addressHouseNumber" type="text" placeholder="z.B. 12A"
              className={`input input-bordered w-full ${errors?.personalInfo?.addressHouseNumber ? "input-error" : getSuccessClass("personalInfo.addressHouseNumber", addressHouseNumber, "input")}`}
              aria-invalid={errors?.personalInfo?.addressHouseNumber ? "true" : "false"}
              {...register("personalInfo.addressHouseNumber", { required: "Hausnummer ist erforderlich", setValueAs: (v) => String(v || "").trim() })}
            />
            {errors?.personalInfo?.addressHouseNumber ? <p className="text-error text-sm mt-1">{errors.personalInfo.addressHouseNumber.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="personalInfo-addressCity">
              <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Ort</RequiredLabel>
            </label>
            {isMobile ? (
              <>
                <button type="button" onClick={() => setShowCityPicker(true)}
                  className={`w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between transition-all active:scale-98 ${addressCity ? "border-success bg-success/5 text-base-content" : "border-base-300 bg-base-100 text-base-content/60"} ${errors?.personalInfo?.addressCity ? "border-error" : ""}`}>
                  <span className="text-base">{addressCity || "Stadt wählen"}</span>
                  <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {errors?.personalInfo?.addressCity && <p className="text-error text-sm mt-1">{errors.personalInfo.addressCity.message}</p>}
              </>
            ) : (
              <Controller control={control} name="personalInfo.addressCity" rules={{ required: "Bitte Ort auswählen" }}
                render={({ field }) => (
                  <>
                    <select id="personalInfo-addressCity"
                      className={`select select-bordered w-full ${errors?.personalInfo?.addressCity ? "select-error" : getSuccessClass(field.value, "personalInfo.addressCity")}`}
                      aria-invalid={errors?.personalInfo?.addressCity ? "true" : "false"} {...field}>
                      <option value="">Bitte auswählen</option>
                      {UZBEK_REGIONS.map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                    {errors?.personalInfo?.addressCity && <p className="text-error text-sm mt-1">{errors.personalInfo.addressCity.message}</p>}
                  </>
                )}
              />
            )}
          </div>
          <div>
            <label className="label" htmlFor="personalInfo-addressCountry">
              <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Land</RequiredLabel>
            </label>
            {isMobile ? (
              <>
                <button type="button" onClick={() => setShowCountryPicker(true)}
                  className={`w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between transition-all active:scale-98 ${addressCountry ? "border-success bg-success/5 text-base-content" : "border-base-300 bg-base-100 text-base-content/60"} ${errors?.personalInfo?.addressCountry ? "border-error" : ""}`}>
                  <span className="text-base">{addressCountry || "Land auswählen"}</span>
                  <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {errors?.personalInfo?.addressCountry && <p className="text-error text-sm mt-1">{errors.personalInfo.addressCountry.message}</p>}
              </>
            ) : (
              <Controller control={control} name="personalInfo.addressCountry" rules={{ required: "Bitte Land auswählen" }}
                render={({ field }) => (
                  <>
                    <select id="personalInfo-addressCountry"
                      className={`select select-bordered w-full ${errors?.personalInfo?.addressCountry ? "select-error" : getSuccessClass(field.value, "personalInfo.addressCountry")}`}
                      aria-invalid={errors?.personalInfo?.addressCountry ? "true" : "false"} {...field}>
                      <option value="">Bitte auswählen</option>
                      {countries
                        .sort((a, b) => {
                          const priority = ["Usbekistan", "Deutschland", "Russland", "Südkorea"];
                          const aI = priority.indexOf(a.deu); const bI = priority.indexOf(b.deu);
                          if (aI !== -1 && bI !== -1) return aI - bI;
                          if (aI !== -1) return -1; if (bI !== -1) return 1;
                          return a.deu.localeCompare(b.deu);
                        })
                        .map((country) => {
                          const name = String(country?.deu || "").trim();
                          if (!name) return null;
                          return <option key={name} value={name}>{name}</option>;
                        })}
                    </select>
                    {errors?.personalInfo?.addressCountry && <p className="text-error text-sm mt-1">{errors.personalInfo.addressCountry.message}</p>}
                  </>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
