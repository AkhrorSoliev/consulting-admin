import { Controller } from "react-hook-form";
import FormInput from "../../../components/FormInput";
import RequiredLabel from "../../../components/RequiredLabel";
import { UZBEK_REGIONS } from "../../../constants/uzbekRegions";

function RequiredField({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

/**
 * Name, last name, gender, birth date, birth place, marital status, children count fields.
 */
export default function PersonalInfoBasicFields({
  control, register, errors, watch, setValue, isMobile,
  setShowBirthPlacePicker, setShowMaritalStatusPicker,
  watchBirthPlace, watchChildrenCount, watchMaritalStatus,
  getSuccessClass, REQUIRED_STAR_CLASS,
}) {
  return (
    <>
      <Controller
        control={control}
        name="personalInfo.name"
        rules={{ required: "Vorname ist erforderlich" }}
        render={({ field }) => (
          <RequiredField>
            <FormInput
              label={<RequiredLabel className={REQUIRED_STAR_CLASS}>Vorname</RequiredLabel>}
              placeholder="z.B. Ali"
              helperText="Bitte geben Sie Ihren Vornamen ein (wie im Ausweis)."
              inputClassName={errors?.personalInfo?.name ? "input-error" : getSuccessClass("personalInfo.name", field.value, "input")}
              aria-invalid={errors?.personalInfo?.name ? "true" : "false"}
              {...field}
            />
          </RequiredField>
        )}
      />
      <Controller
        control={control}
        name="personalInfo.lastName"
        rules={{ required: "Nachname ist erforderlich" }}
        render={({ field }) => (
          <RequiredField>
            <FormInput
              label={<RequiredLabel className={REQUIRED_STAR_CLASS}>Nachname</RequiredLabel>}
              placeholder="z.B. Soliev"
              helperText="Bitte geben Sie Ihren Nachnamen ein (wie im Ausweis)."
              inputClassName={errors?.personalInfo?.lastName ? "input-error" : getSuccessClass("personalInfo.lastName", field.value, "input")}
              aria-invalid={errors?.personalInfo?.lastName ? "true" : "false"}
              {...field}
            />
          </RequiredField>
        )}
      />
      <RequiredField className="md:col-span-2">
        <label className="label">
          <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Geschlecht</RequiredLabel>
        </label>
        <div className="flex gap-6">
          <label className="cursor-pointer flex items-center gap-2">
            <input type="radio" value="M\u00E4nnlich" className="radio radio-primary" {...register("personalInfo.gender", { required: "Bitte Geschlecht ausw\u00E4hlen" })} />
            <span>M\u00E4nnlich</span>
          </label>
          <label className="cursor-pointer flex items-center gap-2">
            <input type="radio" value="Weiblich" className="radio radio-primary" {...register("personalInfo.gender", { required: "Bitte Geschlecht ausw\u00E4hlen" })} />
            <span>Weiblich</span>
          </label>
        </div>
        {errors?.personalInfo?.gender && <p className="text-error text-sm mt-1">{errors.personalInfo.gender.message}</p>}
      </RequiredField>
      <RequiredField>
        <Controller
          control={control}
          name="personalInfo.birthDate"
          rules={{ required: "Geburtsdatum ist erforderlich" }}
          render={({ field }) => (
            <>
              <label className="label" htmlFor="personalInfo-birthDate">
                <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Geburtsdatum</RequiredLabel>
              </label>
              <input
                id="personalInfo-birthDate" type="date" placeholder="YYYY-MM-DD"
                className={`input input-bordered w-full ${errors?.personalInfo?.birthDate ? "input-error" : getSuccessClass("personalInfo.birthDate", field.value, "input")}`}
                aria-invalid={errors?.personalInfo?.birthDate ? "true" : "false"}
                {...field}
              />
              <p className="mt-1 text-xs text-base-content/70">Bitte w\u00E4hlen Sie Ihr Geburtsdatum aus.</p>
            </>
          )}
        />
      </RequiredField>
      <RequiredField>
        <label className="label" htmlFor="personalInfo-birthPlace">
          <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Geburtsort</RequiredLabel>
        </label>
        {isMobile ? (
          <>
            <button type="button" onClick={() => setShowBirthPlacePicker(true)}
              className={`w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between transition-all active:scale-98 ${watchBirthPlace ? "border-success bg-success/5 text-base-content" : "border-base-300 bg-base-100 text-base-content/60"} ${errors?.personalInfo?.birthPlace ? "border-error" : ""}`}>
              <span className="text-base">{watchBirthPlace || "Stadt w\u00E4hlen"}</span>
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {errors?.personalInfo?.birthPlace && <p className="text-error text-sm mt-1">{errors.personalInfo.birthPlace.message}</p>}
          </>
        ) : (
          <Controller control={control} name="personalInfo.birthPlace" rules={{ required: "Bitte Geburtsort ausw\u00E4hlen" }}
            render={({ field }) => (
              <>
                <select id="personalInfo-birthPlace"
                  className={`select select-bordered w-full ${errors?.personalInfo?.birthPlace ? "select-error" : getSuccessClass(field.value, "personalInfo.birthPlace")}`}
                  aria-invalid={errors?.personalInfo?.birthPlace ? "true" : "false"} {...field}>
                  <option value="">Bitte ausw\u00E4hlen</option>
                  {UZBEK_REGIONS.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
                {errors?.personalInfo?.birthPlace && <p className="text-error text-sm mt-1">{errors.personalInfo.birthPlace.message}</p>}
              </>
            )}
          />
        )}
      </RequiredField>
      <RequiredField>
        <Controller control={control} name="personalInfo.maritalStatus" rules={{ required: "Bitte Familienstand ausw\u00E4hlen" }}
          render={({ field }) => (
            <>
              <label className="label" htmlFor="personalInfo-maritalStatus">
                <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Familienstand</RequiredLabel>
              </label>
              {isMobile ? (
                <button type="button" onClick={() => setShowMaritalStatusPicker(true)}
                  className={`h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between w-full transition-all active:scale-98 ${field.value ? "border-success bg-success/5 text-base-content" : "border-base-300 bg-base-100 text-base-content/60"} ${errors?.personalInfo?.maritalStatus ? "border-error" : ""}`}>
                  <span className="text-sm">{field.value || "Bitte ausw\u00E4hlen"}</span>
                  <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              ) : (
                <select id="personalInfo-maritalStatus"
                  className={`select select-bordered w-full ${errors?.personalInfo?.maritalStatus ? "select-error" : getSuccessClass("personalInfo.maritalStatus", field.value, "select")}`}
                  aria-invalid={errors?.personalInfo?.maritalStatus ? "true" : "false"} {...field}>
                  <option value="">Bitte ausw\u00E4hlen</option>
                  <option value="ledig">ledig</option>
                  <option value="verheiratet">verheiratet</option>
                  <option value="geschieden">geschieden</option>
                  <option value="verwitwet">verwitwet</option>
                </select>
              )}
            </>
          )}
        />
      </RequiredField>
      <RequiredField className="md:col-span-2">
        <label className="label" htmlFor="personalInfo-childrenCount">
          <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Kinder</RequiredLabel>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="form-control">
            <input id="personalInfo-childrenCount" type="number" min={0} inputMode="numeric" placeholder="z.B. 2"
              className={`input input-bordered w-full ${errors?.personalInfo?.childrenCount ? "input-error" : getSuccessClass("personalInfo.childrenCount", watchChildrenCount, "input")}`}
              disabled={watch("personalInfo.noChildren")}
              aria-invalid={errors?.personalInfo?.childrenCount ? "true" : "false"}
              {...register("personalInfo.childrenCount", {
                validate: (value) => {
                  const noKids = Boolean(watch("personalInfo.noChildren"));
                  if (noKids) return true;
                  const v = String(value || "").trim();
                  if (!v) return "Bitte Kinderanzahl eingeben oder 'Keine Kinder' ausw\u00E4hlen.";
                  const n = Number(v);
                  if (Number.isNaN(n) || n < 0) return "Bitte eine g\u00FCltige Zahl eingeben.";
                  return true;
                },
                setValueAs: (v) => { const s = String(v ?? "").trim(); if (!s) return ""; const num = Number(s); if (Number.isNaN(num)) return ""; return String(Math.max(0, Math.floor(num))); },
              })}
            />
            {errors?.personalInfo?.childrenCount ? <p className="text-error text-sm mt-1">{errors.personalInfo.childrenCount.message}</p> : null}
            <p className="mt-1 text-xs text-base-content/70">Wenn Sie keine Kinder haben, w\u00E4hlen Sie bitte \u201EKeine Kinder\u201C.</p>
          </div>
          <div className="form-control">
            <label className="cursor-pointer flex items-center gap-2 mt-2 md:mt-0">
              <input type="checkbox" className="checkbox" {...register("personalInfo.noChildren")}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue("personalInfo.noChildren", checked, { shouldDirty: true, shouldValidate: true });
                  if (checked) setValue("personalInfo.childrenCount", "", { shouldDirty: true, shouldValidate: true });
                }}
                checked={Boolean(watch("personalInfo.noChildren"))}
              />
              <span className="text-sm">Keine Kinder</span>
            </label>
          </div>
        </div>
      </RequiredField>
    </>
  );
}
