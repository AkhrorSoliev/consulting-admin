import { useCallback } from "react";
import { FaUser } from "react-icons/fa";
import PersonalInfoBasicFields from "./PersonalInfoBasicFields";
import PersonalInfoContactFields from "./PersonalInfoContactFields";
import PersonalInfoAddressFields from "./PersonalInfoAddressFields";
import PersonalInfoPhotoField from "./PersonalInfoPhotoField";

const REQUIRED_STAR_CLASS =
  "[&_[aria-hidden=true]]:text-[0.7em] [&_[aria-hidden=true]]:opacity-60";

/**
 * Step 0 - Personal information (Persoenliche Daten).
 * Orchestrator that composes the four sub-field components.
 */
export default function PersonalInfoStep({
  register, control, errors, watch, setValue, clearErrors, getFieldState,
  isMobile,
  setShowBirthPlacePicker, setShowMaritalStatusPicker,
  setShowCityPicker, setShowCountryPicker,
  watchBirthPlace, watchMaritalStatus,
  addressStreet, addressHouseNumber, addressCity, addressCountry,
  isEmailChecking, isPassportChecking,
  lastEmailCheckRef, lastPassportCheckRef,
  watchPhoto, photoSizeError, setPhotoSizeError, MAX_PHOTO_BYTES,
}) {
  const watchChildrenCount = watch("personalInfo.childrenCount");

  const hasNonEmptyValue = useCallback((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return true;
    if (v === null || v === undefined) return false;
    return Boolean(String(v).trim());
  }, []);

  const getSuccessClass = useCallback((path, value, kind = "input") => {
    const st = getFieldState(path);
    const touched = Boolean(st?.isTouched || st?.isDirty);
    const ok = touched && !st?.invalid && hasNonEmptyValue(value);
    if (!ok) return "";
    if (kind === "select") return "select-success";
    if (kind === "file") return "file-input-success";
    return "input-success";
  }, [getFieldState, hasNonEmptyValue]);

  const getLiveInputClass = useCallback((path, value, validateFn) => {
    const st = getFieldState(path);
    const touched = Boolean(st?.isTouched || st?.isDirty);
    const has = hasNonEmptyValue(value);
    if (!touched || !has) return "";
    const normalized = typeof value === "string" ? value.trim() : value === null ? "" : value;
    const ok = Boolean(validateFn?.(normalized));
    return ok ? "input-success" : "input-warning";
  }, [getFieldState, hasNonEmptyValue]);

  return (
    <>
      <div className="divider mt-0">
        <span className="mx-auto inline-flex items-center gap-2">
          <FaUser className="opacity-70" aria-hidden="true" />
          <span>Persönliche Daten</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PersonalInfoBasicFields
          control={control} register={register} errors={errors} watch={watch} setValue={setValue}
          isMobile={isMobile}
          setShowBirthPlacePicker={setShowBirthPlacePicker}
          setShowMaritalStatusPicker={setShowMaritalStatusPicker}
          watchBirthPlace={watchBirthPlace}
          watchChildrenCount={watchChildrenCount}
          watchMaritalStatus={watchMaritalStatus}
          getSuccessClass={getSuccessClass}
          REQUIRED_STAR_CLASS={REQUIRED_STAR_CLASS}
        />
        <PersonalInfoContactFields
          control={control} errors={errors} getFieldState={getFieldState}
          isEmailChecking={isEmailChecking} isPassportChecking={isPassportChecking}
          lastEmailCheckRef={lastEmailCheckRef} lastPassportCheckRef={lastPassportCheckRef}
          getSuccessClass={getSuccessClass} getLiveInputClass={getLiveInputClass}
          hasNonEmptyValue={hasNonEmptyValue}
          REQUIRED_STAR_CLASS={REQUIRED_STAR_CLASS}
        />
        <PersonalInfoPhotoField
          register={register} errors={errors} setValue={setValue} clearErrors={clearErrors}
          watchPhoto={watchPhoto} photoSizeError={photoSizeError} setPhotoSizeError={setPhotoSizeError}
          getSuccessClass={getSuccessClass}
          REQUIRED_STAR_CLASS={REQUIRED_STAR_CLASS}
          MAX_PHOTO_BYTES={MAX_PHOTO_BYTES}
        />
        <PersonalInfoAddressFields
          register={register} control={control} errors={errors} isMobile={isMobile}
          addressStreet={addressStreet} addressHouseNumber={addressHouseNumber}
          addressCity={addressCity} addressCountry={addressCountry}
          setShowCityPicker={setShowCityPicker} setShowCountryPicker={setShowCountryPicker}
          getSuccessClass={getSuccessClass}
          REQUIRED_STAR_CLASS={REQUIRED_STAR_CLASS}
        />
      </div>
    </>
  );
}
