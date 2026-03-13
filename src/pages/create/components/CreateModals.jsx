import PrivacyModal from "./modals/PrivacyModal";
import GuideModal from "./modals/GuideModal";
import ExistingEmailModal from "./modals/ExistingEmailModal";
import ExistingPassportModal from "./modals/ExistingPassportModal";
import ExistingTelegramModal from "./modals/ExistingTelegramModal";
import PdfPreviewModal from "./modals/PdfPreviewModal";
import RequiredDocumentsModal from "./modals/RequiredDocumentsModal";
import PhotoModal from "../../generate/components/modals/PhotoModal";

/**
 * All modals used in the Create form, grouped in one component.
 */
export default function CreateModals({
  isPrivacyOpen, setIsPrivacyOpen,
  isGuideOpen, setIsGuideOpen,
  isRequiredDocsOpen, setIsRequiredDocsOpen,
  isPdfPreviewOpen, setIsPdfPreviewOpen,
  isPhotoModalOpen, photoModalSrc, closePhotoModal,
  isEmailModalOpen, setIsEmailModalOpen, enteredEmail, existingMajor,
  isPassportModalOpen, setIsPassportModalOpen, enteredPassport, existingPassportMajor,
  isTelegramModalOpen, setIsTelegramModalOpen, existingTelegramMajor,
  previewCv, openPhotoModal, majorInfo, setIsSubmitted,
}) {
  const handleEmailAcknowledge = () => {
    const majorCollection = String(majorInfo?.collectionName || "").trim();
    if (majorCollection) {
      try {
        localStorage.setItem(`createCvSubmitted:${majorCollection}`, "true");
        localStorage.removeItem("createCvSubmitted");
      } catch { /* ignore */ }
    }
    setIsEmailModalOpen(false);
    setIsSubmitted(true);
  };

  const handlePassportAcknowledge = () => {
    const majorCollection = String(majorInfo?.collectionName || "").trim();
    if (majorCollection) {
      try {
        localStorage.setItem(`createCvSubmitted:${majorCollection}`, "true");
        localStorage.removeItem("createCvSubmitted");
      } catch { /* ignore */ }
    }
    setIsPassportModalOpen(false);
    setIsSubmitted(true);
  };

  return (
    <>
      <PrivacyModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <GuideModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <RequiredDocumentsModal
        open={isRequiredDocsOpen}
        onClose={() => { setIsRequiredDocsOpen(false); setIsGuideOpen(true); }}
      />
      <PdfPreviewModal
        open={isPdfPreviewOpen} onClose={() => setIsPdfPreviewOpen(false)}
        form={previewCv} showDocuments={false} showComment={false} showCommentDate={false}
        onPhotoClick={openPhotoModal}
      />
      <PhotoModal open={isPhotoModalOpen} src={photoModalSrc} onClose={closePhotoModal} />
      <ExistingEmailModal
        open={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}
        onAcknowledge={handleEmailAcknowledge}
        enteredEmail={enteredEmail} existingMajor={existingMajor}
      />
      <ExistingPassportModal
        open={isPassportModalOpen} onClose={() => setIsPassportModalOpen(false)}
        onAcknowledge={handlePassportAcknowledge}
        enteredPassport={enteredPassport} existingMajor={existingPassportMajor}
      />
      <ExistingTelegramModal
        open={isTelegramModalOpen} onClose={() => setIsTelegramModalOpen(false)}
        existingMajor={existingTelegramMajor}
      />
    </>
  );
}
