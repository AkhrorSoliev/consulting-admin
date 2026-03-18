import { Controller } from "react-hook-form";
import FormInput from "../../../components/FormInput";
import RequiredLabel from "../../../components/RequiredLabel";
import PhoneInputWithCountry from "../../../components/PhoneInputWithCountry";
import {
  getPhoneBodyDigits, isEmailValid, isPhoneComplete,
  isPassportNumberValid, normalizePassportNumber,
} from "../../../utils/validation";

function RequiredField({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

/**
 * Phone, email, and passport number fields.
 */
export default function PersonalInfoContactFields({
  control, errors, getFieldState,
  isEmailChecking, isPassportChecking,
  lastEmailCheckRef, lastPassportCheckRef,
  getSuccessClass, getLiveInputClass,
  hasNonEmptyValue, REQUIRED_STAR_CLASS,
}) {
  return (
    <>
      <Controller
        control={control}
        name="personalInfo.phone"
        rules={{
          required: "Telefonnummer ist erforderlich",
          validate: (v) => {
            const raw = String(v || "").trim();
            const firstSpace = raw.indexOf(" ");
            if (firstSpace < 0) return "Bitte Telefonnummer vollständig eingeben.";
            const body = raw.slice(firstSpace + 1);
            const digits = String(body || "").replace(/[^\d]/g, "");
            if (digits.length !== 9) return "Bitte Telefonnummer vollständig eingeben.";
            return true;
          },
        }}
        render={({ field }) => {
          const st = getFieldState("personalInfo.phone");
          const touched = Boolean(st?.isTouched || st?.isDirty);
          const rawPhone = String(field.value || "").trim();
          const phoneOk = isPhoneComplete(rawPhone);
          const phoneHas = hasNonEmptyValue(rawPhone);
          const phoneWarn = !errors?.personalInfo?.phone && touched && phoneHas && !phoneOk;
          const phoneDigits = getPhoneBodyDigits(rawPhone);
          return (
            <RequiredField className="md:col-span-2">
              <PhoneInputWithCountry
                label={<RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS}`}>Telefonnummer</RequiredLabel>}
                required value={field.value} onChange={field.onChange}
                error={errors?.personalInfo?.phone?.message}
                inputClassName={errors?.personalInfo?.phone ? "" : getLiveInputClass("personalInfo.phone", field.value, isPhoneComplete)}
                helperText={<>Beispiel: +998 90 123 45 67{phoneWarn ? <><br /><span className="text-warning">Telefonnummer unvollständig ({phoneDigits.length}/9 Ziffern)</span></> : null}</>}
              />
            </RequiredField>
          );
        }}
      />
      <RequiredField>
        <Controller
          control={control}
          name="personalInfo.email"
          rules={{ required: "E-Mail ist erforderlich", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Bitte gültige E-Mail eingeben" } }}
          render={({ field }) => {
            const st = getFieldState("personalInfo.email");
            const touched = Boolean(st?.isTouched || st?.isDirty);
            const rawEmail = String(field.value || "").trim();
            const emailHas = hasNonEmptyValue(rawEmail);
            const emailOk = isEmailValid(rawEmail);
            const emailWarn = !errors?.personalInfo?.email && touched && emailHas && !emailOk;
            const emailChecked = Boolean(lastEmailCheckRef.current?.email === rawEmail);
            const emailValid = emailOk && !errors?.personalInfo?.email;
            const showEmailSuccess = emailChecked && emailValid && !lastEmailCheckRef.current?.exists;
            return (
              <>
                <FormInput
                  label={<RequiredLabel className={REQUIRED_STAR_CLASS}>E-Mail</RequiredLabel>}
                  placeholder="z.B. name@example.com" disabled={isEmailChecking}
                  aria-busy={isEmailChecking ? "true" : "false"}
                  rightElement={
                    isEmailChecking ? <span className="loading loading-spinner loading-sm text-base-content/60 pointer-events-none" aria-hidden="true" />
                    : showEmailSuccess ? <span className="text-success text-xl pointer-events-none" aria-hidden="true">{"✓"}</span> : null
                  }
                  helperText={<>Bitte geben Sie eine E-Mail ein, die Sie regelmäßig nutzen.{emailWarn ? <><br /><span className="text-warning">Bitte gültige E-Mail eingeben.</span></> : null}</>}
                  type="email"
                  inputClassName={errors?.personalInfo?.email ? "input-error" : getLiveInputClass("personalInfo.email", field.value, isEmailValid)}
                  aria-invalid={errors?.personalInfo?.email ? "true" : "false"}
                  {...field}
                />
                {errors?.personalInfo?.email ? <p className="text-error text-sm mt-1">{errors.personalInfo.email.message}</p> : null}
              </>
            );
          }}
        />
      </RequiredField>
      <RequiredField>
        <Controller
          control={control}
          name="personalInfo.passportNumber"
          rules={{ required: "Passnummer ist erforderlich", validate: (v) => isPassportNumberValid(v) || "Bitte Passnummer im Format AA 0000000 eingeben" }}
          render={({ field }) => {
            const st = getFieldState("personalInfo.passportNumber");
            const touched = Boolean(st?.isTouched || st?.isDirty);
            const raw = String(field.value || "");
            const norm = normalizePassportNumber(raw);
            const has = hasNonEmptyValue(raw);
            const ok = isPassportNumberValid(norm);
            const warn = !errors?.personalInfo?.passportNumber && touched && has && !ok;
            const passportChecked = Boolean(lastPassportCheckRef.current?.passport === norm);
            const passportValid = ok && !errors?.personalInfo?.passportNumber;
            const showPassportSuccess = passportChecked && passportValid && !lastPassportCheckRef.current?.exists;
            return (
              <>
                <FormInput
                  label={<RequiredLabel className={REQUIRED_STAR_CLASS}>Passnummer</RequiredLabel>}
                  placeholder="AA 0000000" disabled={isPassportChecking}
                  aria-busy={isPassportChecking ? "true" : "false"}
                  rightElement={
                    isPassportChecking ? <span className="loading loading-spinner loading-sm text-base-content/60 pointer-events-none" aria-hidden="true" />
                    : showPassportSuccess ? <span className="text-success text-xl pointer-events-none" aria-hidden="true">{"✓"}</span> : null
                  }
                  helperText={<>Beispiel: AA 0000000{warn ? <><br /><span className="text-warning">Bitte vollständig eingeben (AA 0000000).</span></> : null}</>}
                  inputClassName={errors?.personalInfo?.passportNumber ? "input-error" : getLiveInputClass("personalInfo.passportNumber", raw, isPassportNumberValid)}
                  aria-invalid={errors?.personalInfo?.passportNumber ? "true" : "false"}
                  name={field.name} value={field.value} onBlur={field.onBlur}
                  onChange={(e) => { const next = normalizePassportNumber(e?.target?.value); field.onChange(next); }}
                />
                {errors?.personalInfo?.passportNumber ? <p className="text-error text-sm mt-1">{errors.personalInfo.passportNumber.message}</p> : null}
              </>
            );
          }}
        />
      </RequiredField>
    </>
  );
}
