import useCreatePage from "./create/hooks/useCreatePage";
import CreateFormSteps from "./create/CreateFormSteps";
import UploadingOverlay from "./create/UploadingOverlay";
import CreateLivePreview from "./create/components/CreateLivePreview";
import MobileBottomSheets from "./create/components/MobileBottomSheets";
import WizardNavigation from "./create/components/WizardNavigation";
import LinkBlockedPage from "./create/components/LinkBlockedPage";
import ThankYouCard from "./create/components/ThankYouCard";
import CreateModals from "./create/components/CreateModals";
import DesktopFloatingActions from "./create/components/DesktopFloatingActions";
import KeyboardDismissButton from "./create/components/KeyboardDismissButton";

function Create() {
  const p = useCreatePage();

  if (p.isLinkBlocked) return <LinkBlockedPage />;

  return (
    <div
      className="min-h-dvh bg-base-200 lg:h-dvh lg:overflow-hidden"
      data-theme="winter"
    >
      {p.isUploading && <UploadingOverlay />}
      <div className={`min-h-dvh lg:h-full max-w-2xl mx-auto md:max-w-[1600px] lg:p-4 ${p.isSubmitted === false ? "" : "grid place-items-center"}`}>
        <div className={p.isSubmitted === false ? "lg:h-full flex flex-col lg:flex-row gap-6 items-start lg:items-stretch" : ""}>
          <section
            className={`card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full ${
              p.isSubmitted === false
                ? "lg:flex-[0_0_50%] lg:h-full lg:overflow-hidden"
                : "py-10 max-w-lg mx-auto"
            }`}
          >
            <div className={p.isSubmitted !== false ? "card-body items-center text-center p-[0.7rem]!" : "p-4 flex flex-col lg:h-full lg:min-h-0 items-stretch justify-start"}>
              {p.isSubmitted === null ? (
                <div className="w-[200px] flex flex-col items-center justify-center text-center gap-3">
                  <span className="loading loading-spinner loading-lg text-primary" />
                  <div className="text-sm font-medium">Wird geladen...</div>
                </div>
              ) : p.isSubmitted ? (
                <ThankYouCard />
              ) : (
                <CreateFormSteps p={p} />
              )}
            </div>
          </section>

          <CreateLivePreview
            isSubmitted={p.isSubmitted}
            previewCv={p.previewCv}
            openPhotoModal={p.openPhotoModal}
          />
        </div>
      </div>

      <CreateModals
        isPrivacyOpen={p.isPrivacyOpen} setIsPrivacyOpen={p.setIsPrivacyOpen}
        isGuideOpen={p.isGuideOpen} setIsGuideOpen={p.setIsGuideOpen}
        isRequiredDocsOpen={p.isRequiredDocsOpen} setIsRequiredDocsOpen={p.setIsRequiredDocsOpen}
        isPdfPreviewOpen={p.isPdfPreviewOpen} setIsPdfPreviewOpen={p.setIsPdfPreviewOpen}
        isPhotoModalOpen={p.isPhotoModalOpen} photoModalSrc={p.photoModalSrc}
        closePhotoModal={p.closePhotoModal}
        isEmailModalOpen={p.isEmailModalOpen} setIsEmailModalOpen={p.setIsEmailModalOpen}
        enteredEmail={p.enteredEmail} existingMajor={p.existingMajor}
        isPassportModalOpen={p.isPassportModalOpen} setIsPassportModalOpen={p.setIsPassportModalOpen}
        enteredPassport={p.enteredPassport} existingPassportMajor={p.existingPassportMajor}
        isTelegramModalOpen={p.isTelegramModalOpen} setIsTelegramModalOpen={p.setIsTelegramModalOpen}
        existingTelegramMajor={p.existingTelegramMajor}
        previewCv={p.previewCv} openPhotoModal={p.openPhotoModal}
        majorInfo={p.majorInfo} setIsSubmitted={p.setIsSubmitted}
      />

      <MobileBottomSheets
        isMobile={p.isMobile} setValue={p.setValue} clearErrors={p.clearErrors}
        showCityPicker={p.showCityPicker} setShowCityPicker={p.setShowCityPicker}
        addressCity={p.addressCity}
        showCountryPicker={p.showCountryPicker} setShowCountryPicker={p.setShowCountryPicker}
        addressCountry={p.addressCountry}
        showBirthPlacePicker={p.showBirthPlacePicker} setShowBirthPlacePicker={p.setShowBirthPlacePicker}
        watchBirthPlace={p.watchBirthPlace}
        showMaritalStatusPicker={p.showMaritalStatusPicker}
        setShowMaritalStatusPicker={p.setShowMaritalStatusPicker}
        watchMaritalStatus={p.watchMaritalStatus}
      />

      <DesktopFloatingActions
        setIsGuideOpen={p.setIsGuideOpen}
        TELEGRAM_SUPPORT_URL={p.TELEGRAM_SUPPORT_URL}
      />

      <KeyboardDismissButton
        isInputFocused={p.isInputFocused}
        isMobile={p.isMobile}
      />
    </div>
  );
}

export default Create;
