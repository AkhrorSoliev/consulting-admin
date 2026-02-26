import PhotoModal from "../components/modals/PhotoModal";
import StageEmailModal from "../components/modals/StageEmailModal";
import CustomEmailModal from "../components/modals/CustomEmailModal";
import SendDocumentLinkModal from "../components/modals/SendDocumentLinkModal";
import ErklaerungBeschaeftigungModal from "../components/modals/ErklaerungBeschaeftigungModal";
import ZusatzblattAModal from "../components/modals/ZusatzblattAModal";
import ZusatzblattBModal from "../components/modals/ZusatzblattBModal";
import ZusatzblattCModal from "../components/modals/ZusatzblattCModal";
import ZusatzblattDModal from "../components/modals/ZusatzblattDModal";
import MissingPassportConfirmModal from "./MissingPassportConfirmModal";
import MobileBirthPlacePicker from "./MobileBirthPlacePicker";
import MobileMaritalStatusPicker from "./MobileMaritalStatusPicker";

export default function GenerateModalsHost({
  photo,
  stageEmail,
  customEmail,
  sendDocLink,
  generatedDocs,
  mobile,
  missingPassport,
}) {
  return (
    <>
      <PhotoModal
        open={photo.open}
        src={photo.src}
        onClose={photo.onClose}
      />

      <StageEmailModal
        open={stageEmail.open}
        onClose={stageEmail.onClose}
        title={stageEmail.title}
        subtitle={stageEmail.subtitle}
        decision={stageEmail.decision}
        setDecision={stageEmail.setDecision}
        onSubmit={stageEmail.onSubmit}
        isSending={stageEmail.isSending}
        previewRows={stageEmail.previewRows}
        showPreviewWhenAccepted={stageEmail.showPreviewWhenAccepted}
        showAdditionalInfoEditor={stageEmail.showAdditionalInfoEditor}
        additionalInfoForm={stageEmail.additionalInfoForm}
        setAdditionalInfoForm={stageEmail.setAdditionalInfoForm}
        canGenerateTelegramLink={stageEmail.canGenerateTelegramLink}
        autoTelegramGroupLabel={stageEmail.autoTelegramGroupLabel}
        emailPreview={stageEmail.emailPreview}
        examples={stageEmail.examples}
        selectedExample={stageEmail.selectedExample}
        setSelectedExample={stageEmail.setSelectedExample}
        hasTelegramId={stageEmail.hasTelegramId}
      />

      <CustomEmailModal
        open={customEmail.open}
        onClose={customEmail.onClose}
        onSubmit={customEmail.onSubmit}
        isSending={customEmail.isSending}
        form={customEmail.form}
        setForm={customEmail.setForm}
        emailPreview={customEmail.emailPreview}
        placeholders={customEmail.placeholders}
      />

      <SendDocumentLinkModal
        open={sendDocLink.open}
        onClose={sendDocLink.onClose}
        onSubmit={sendDocLink.onSubmit}
        isSending={sendDocLink.isSending}
        candidateEmail={sendDocLink.candidateEmail}
        hasTelegramId={sendDocLink.hasTelegramId}
        documentLink={sendDocLink.documentLink}
        candidateName={sendDocLink.candidateName}
      />

      <ErklaerungBeschaeftigungModal
        open={generatedDocs.erklaerungOpen}
        onClose={generatedDocs.onCloseErklaerung}
        candidateData={generatedDocs.candidateData}
      />

      <ZusatzblattAModal
        open={generatedDocs.zusatzblattAOpen}
        onClose={generatedDocs.onCloseZusatzblattA}
        candidateData={generatedDocs.candidateData}
      />

      <ZusatzblattBModal
        open={generatedDocs.zusatzblattBOpen}
        onClose={generatedDocs.onCloseZusatzblattB}
        candidateData={generatedDocs.candidateData}
      />

      <ZusatzblattCModal
        open={generatedDocs.zusatzblattCOpen}
        onClose={generatedDocs.onCloseZusatzblattC}
        candidateData={generatedDocs.candidateData}
      />

      <ZusatzblattDModal
        open={generatedDocs.zusatzblattDOpen}
        onClose={generatedDocs.onCloseZusatzblattD}
        candidateData={generatedDocs.candidateData}
      />

      <MissingPassportConfirmModal
        open={missingPassport.open}
        onConfirm={missingPassport.onConfirm}
        onCancel={missingPassport.onCancel}
      />

      <MobileBirthPlacePicker
        open={mobile.birthPlaceOpen}
        value={mobile.birthPlace}
        onSelect={mobile.onSelectBirthPlace}
        onClose={mobile.onCloseBirthPlace}
      />

      <MobileMaritalStatusPicker
        open={mobile.maritalStatusOpen}
        value={mobile.maritalStatus}
        onSelect={mobile.onSelectMaritalStatus}
        onClose={mobile.onCloseMaritalStatus}
      />
    </>
  );
}
