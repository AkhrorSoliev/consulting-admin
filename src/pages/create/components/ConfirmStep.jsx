import ReCAPTCHA from "react-google-recaptcha";

/**
 * Step 6 (FINAL_STEP) – Confirm (Bestätigen).
 * Privacy checkbox + reCAPTCHA.
 *
 * Props:
 *   register, errors, setIsPrivacyOpen,
 *   captchaRef, captchaSize, setCaptchaToken
 */
export default function ConfirmStep({
  register,
  errors,
  setIsPrivacyOpen,
  captchaRef,
  captchaSize,
  setCaptchaToken,
}) {
  return (
    <>
      <div className="divider mt-0" />
      <div className="form-control">
        <div className="rounded-box border border-base-300 bg-base-200/40 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <input
              id="agreePrivacy"
              type="checkbox"
              className={`checkbox mt-1 ${
                errors?.agreePrivacy ? "checkbox-error" : ""
              }`}
              aria-invalid={errors?.agreePrivacy ? "true" : "false"}
              aria-describedby={
                errors?.agreePrivacy ? "agreePrivacy-error" : undefined
              }
              {...register("agreePrivacy", {
                required: true,
              })}
            />
            <div className="min-w-0">
              <label
                htmlFor="agreePrivacy"
                className="font-medium leading-6 cursor-pointer"
              >
                Ich habe die Datenschutzerklärung gelesen und stimme
                zu.
              </label>
              <div className="mt-1 text-sm text-base-content/80 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="link link-primary"
                  onClick={() => setIsPrivacyOpen(true)}
                >
                  Datenschutzrichtlinie
                </button>
              </div>
              {errors?.agreePrivacy ? (
                <p
                  id="agreePrivacy-error"
                  className="text-error text-sm mt-2"
                >
                  Bitte stimmen Sie der Datenschutzerklärung zu, um
                  fortzufahren.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="flex justify-center mb-4">
        <ReCAPTCHA
          ref={captchaRef}
          sitekey={
            import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
            "6LdEVycsAAAAAJ11zB8ovl-uNIQPPI06t8Rhwow8"
          }
          size={captchaSize}
          onChange={setCaptchaToken}
          onExpired={() => setCaptchaToken(null)}
          onErrored={() => setCaptchaToken(null)}
        />
      </div>
    </>
  );
}
