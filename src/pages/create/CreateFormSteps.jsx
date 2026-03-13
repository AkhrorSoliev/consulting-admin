import DocumentsStep from "./DocumentsStep";
import PersonalInfoStep from "./components/PersonalInfoStep";
import ExperienceStep from "./components/ExperienceStep";
import EducationStep from "./components/EducationStep";
import LanguagesStep from "./components/LanguagesStep";
import SkillsStep from "./components/SkillsStep";
import ConfirmStep from "./components/ConfirmStep";
import WizardNavigation from "./components/WizardNavigation";

const REQUIRED_STAR_CLASS =
  "[&_[aria-hidden=true]]:text-[0.7em] [&_[aria-hidden=true]]:opacity-60";

export default function CreateFormSteps({ p }) {
  return (
    <form
      onSubmit={p.rhfHandleSubmit(p.onSubmit, p.onInvalid)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        const tag = String(e.target?.tagName || "").toLowerCase();
        if (tag === "textarea") return;
        if (p.currentStep !== p.FINAL_STEP) {
          e.preventDefault();
          p.goNext();
        }
      }}
      className="flex flex-col lg:flex-1 lg:min-h-0"
    >
      <div ref={p.formScrollRef} className="space-y-6 pb-[calc(env(safe-area-inset-bottom)+9rem)] lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-28">
        <div className="space-y-3">
          <div className="w-full flex justify-center pt-4">
            <h2 className="card-title text-2xl sm:text-3xl font-bold text-center leading-tight create-form-title">
              {p.currentStep === 0 && p.majorInfo.showTitle
                ? p.majorInfo.title
                : p.STEPS?.[p.currentStep]?.label || "Persönliche Daten"}
            </h2>
          </div>
          <p className="text-center text-xs text-base-content/70">
            <span className="text-error/70 text-[0.85em]" aria-hidden="true">*</span>{" "}= Pflichtfeld
          </p>
        </div>

        {p.currentStep === 0 && (
          <PersonalInfoStep
            register={p.register} control={p.control} errors={p.errors}
            watch={p.watch} setValue={p.setValue} clearErrors={p.clearErrors}
            getFieldState={p.getFieldState} isMobile={p.isMobile}
            setShowBirthPlacePicker={p.setShowBirthPlacePicker}
            setShowMaritalStatusPicker={p.setShowMaritalStatusPicker}
            setShowCityPicker={p.setShowCityPicker}
            setShowCountryPicker={p.setShowCountryPicker}
            watchBirthPlace={p.watchBirthPlace}
            watchMaritalStatus={p.watchMaritalStatus}
            addressStreet={p.addressStreet}
            addressHouseNumber={p.addressHouseNumber}
            addressCity={p.addressCity}
            addressCountry={p.addressCountry}
            isEmailChecking={p.isEmailChecking}
            isPassportChecking={p.isPassportChecking}
            lastEmailCheckRef={p.lastEmailCheckRef}
            lastPassportCheckRef={p.lastPassportCheckRef}
            watchPhoto={p.watch("personalInfo.photo")}
            photoSizeError={p.photoSizeError}
            setPhotoSizeError={p.setPhotoSizeError}
            MAX_PHOTO_BYTES={p.MAX_PHOTO_BYTES}
          />
        )}

        {p.currentStep === 1 && (
          <ExperienceStep
            cv={p.cv}
            addExperience={p.addExperience}
            updateExperience={p.updateExperience}
            removeExperience={p.removeExperience}
            addResponsibility={p.addResponsibility}
            removeResponsibility={p.removeResponsibility}
            showExperienceWarning={p.showExperienceWarning}
            experienceErrors={p.experienceErrors}
          />
        )}

        {p.currentStep === 2 && (
          <EducationStep
            cv={p.cv} updateEducation={p.updateEducation}
            showEducationWarning={p.showEducationWarning}
            educationErrors={p.educationErrors}
            noCollege={p.noCollege} setNoCollege={p.setNoCollege}
            noUniversity={p.noUniversity} setNoUniversity={p.setNoUniversity}
            REQUIRED_STAR_CLASS={REQUIRED_STAR_CLASS}
          />
        )}

        {p.currentStep === 3 && (
          <LanguagesStep
            languageRows={p.languageRows}
            addLanguageRow={p.addLanguageRow}
            updateLanguageRow={p.updateLanguageRow}
            removeLanguageRow={p.removeLanguageRow}
            showLanguageWarning={p.showLanguageWarning}
            languageErrors={p.languageErrors}
            isMobile={p.isMobile}
          />
        )}

        {p.currentStep === 4 && (
          <SkillsStep
            cv={p.cv} addTag={p.addTag} removeTag={p.removeTag}
            autoAddSkills={p.autoAddSkills}
            isGeneratingSoft={p.isGeneratingSoft}
            isGeneratingPc={p.isGeneratingPc}
            recentlyAdded={p.recentlyAdded}
            register={p.register} control={p.control}
            watch={p.watch} setValue={p.setValue} errors={p.errors}
            DRIVING_LICENSE_OPTIONS={p.DRIVING_LICENSE_OPTIONS}
          />
        )}

        {p.currentStep === 5 && (
          <DocumentsStep
            passportFiles={p.passportFiles} setPassportFiles={p.setPassportFiles}
            passportError={p.passportError} setPassportError={p.setPassportError}
            passportSizeError={p.passportSizeError} setPassportSizeError={p.setPassportSizeError}
            langCertFiles={p.langCertFiles} setLangCertFiles={p.setLangCertFiles}
            langCertSizeError={p.langCertSizeError} setLangCertSizeError={p.setLangCertSizeError}
            langCertTypeError={p.langCertTypeError} setLangCertTypeError={p.setLangCertTypeError}
            noLanguageCertificates={p.noLanguageCertificates}
            setNoLanguageCertificates={p.setNoLanguageCertificates}
            diplomaFiles={p.diplomaFiles} setDiplomaFiles={p.setDiplomaFiles}
            diplomaError={p.diplomaError} setDiplomaError={p.setDiplomaError}
            diplomaSizeError={p.diplomaSizeError} setDiplomaSizeError={p.setDiplomaSizeError}
            langCertTypes={p.LANG_CERT_TYPES}
          />
        )}

        {p.currentStep === p.FINAL_STEP && (
          <ConfirmStep
            register={p.register} errors={p.errors}
            setIsPrivacyOpen={p.setIsPrivacyOpen}
            captchaRef={p.captchaRef} captchaSize={p.captchaSize}
            setCaptchaToken={p.setCaptchaToken}
          />
        )}
      </div>

      <WizardNavigation
        currentStep={p.currentStep} STEPS={p.STEPS} FINAL_STEP={p.FINAL_STEP}
        goBack={p.goBack} goNext={p.goNext} isUploading={p.isUploading}
        watch={p.watch} majorLoading={p.majorLoading} majorInfo={p.majorInfo}
        isInputFocused={p.isInputFocused} isMobile={p.isMobile}
        setIsPdfPreviewOpen={p.setIsPdfPreviewOpen}
        setIsGuideOpen={p.setIsGuideOpen}
        TELEGRAM_SUPPORT_URL={p.TELEGRAM_SUPPORT_URL}
      />
    </form>
  );
}
