import { Controller } from "react-hook-form";
import { FaBrain, FaCarSide } from "react-icons/fa";
import SkillsSection from "../../../components/SkillsSection";
import DrivingLicenseMultiSelect from "../../../components/ui/driving-license-multiselect";

/**
 * Step 4 – Skills + Driving License (Fähigkeiten + Führerschein).
 *
 * Props:
 *   cv, addTag, removeTag, autoAddSkills,
 *   isGeneratingSoft, isGeneratingPc, recentlyAdded,
 *   register, control, watch, setValue, errors,
 *   DRIVING_LICENSE_OPTIONS
 */
export default function SkillsStep({
  cv,
  addTag,
  removeTag,
  autoAddSkills,
  isGeneratingSoft,
  isGeneratingPc,
  recentlyAdded,
  register,
  control,
  watch,
  setValue,
  errors,
  DRIVING_LICENSE_OPTIONS,
}) {
  return (
    <>
      <div className="divider mt-0">
        <span className="mx-auto inline-flex items-center gap-2">
          <FaBrain className="opacity-70" aria-hidden="true" />
          <span>Fähigkeiten</span>
        </span>
      </div>
      <SkillsSection
        softSkills={cv.skills.softSkills}
        pcSkills={cv.skills.pcSkills}
        onAddSoft={(val) => addTag(["skills", "softSkills"], val)}
        onRemoveSoft={(i) => removeTag(["skills", "softSkills"], i)}
        onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
        onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
        onAutoAddSoft={() => autoAddSkills("soft")}
        onAutoAddPc={() => autoAddSkills("pc")}
        isGeneratingSoft={isGeneratingSoft}
        isGeneratingPc={isGeneratingPc}
        recentlyAddedSoft={recentlyAdded.soft}
        recentlyAddedPc={recentlyAdded.pc}
      />

      {/* Führerschein lives inside Fähigkeiten (not a separate step) */}
      <div className="divider" />
      <DrivingLicenseSection
        register={register}
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
        DRIVING_LICENSE_OPTIONS={DRIVING_LICENSE_OPTIONS}
      />
    </>
  );
}

/**
 * Driving license sub-section rendered inside the skills step.
 */
function DrivingLicenseSection({
  register,
  control,
  watch,
  setValue,
  errors,
  DRIVING_LICENSE_OPTIONS,
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 text-sm font-medium opacity-80">
          <FaCarSide className="opacity-70" aria-hidden="true" />
          <span>Führerschein</span>
        </div>
        <label
          className="label"
          htmlFor="personalInfo-hasDrivingLicense"
        >
          <span className="label-text">Führerschein</span>
        </label>
        <label className="cursor-pointer flex items-center gap-2">
          <input
            id="personalInfo-hasDrivingLicense"
            type="checkbox"
            className="checkbox"
            {...register("personalInfo.hasDrivingLicense")}
            onChange={(e) => {
              const checked = e.target.checked;
              setValue("personalInfo.hasDrivingLicense", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
              if (!checked) {
                setValue("personalInfo.drivingLicenseType", [], {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
            checked={Boolean(watch("personalInfo.hasDrivingLicense"))}
          />
          <span className="text-sm">Vorhanden</span>
        </label>
        {watch("personalInfo.hasDrivingLicense") ? (
          <div className="mt-3">
            <Controller
              control={control}
              name="personalInfo.drivingLicenseType"
              rules={{
                validate: (v) => {
                  const has = Boolean(
                    watch("personalInfo.hasDrivingLicense"),
                  );
                  if (!has) return true;
                  const arr = Array.isArray(v)
                    ? v
                    : String(v || "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                  if (!arr.length)
                    return "Bitte mindestens eine Führerschein-Klasse auswählen.";
                  return true;
                },
              }}
              render={({ field }) => {
                return (
                  <DrivingLicenseMultiSelect
                    id="personalInfo-drivingLicenseType"
                    options={DRIVING_LICENSE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    error={
                      errors?.personalInfo?.drivingLicenseType
                        ?.message
                    }
                  />
                );
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
