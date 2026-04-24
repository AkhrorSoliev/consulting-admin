import PhotoModal from "../modals/PhotoModal";
import StageEmailModal from "../modals/StageEmailModal";
import CustomEmailModal from "../modals/CustomEmailModal";
import SendDocumentLinkModal from "../modals/SendDocumentLinkModal";
import ErklaerungBeschaeftigungModal from "../modals/ErklaerungBeschaeftigungModal";
import ZusatzblattAModal from "../modals/ZusatzblattAModal";
import ZusatzblattBModal from "../modals/ZusatzblattBModal";
import ZusatzblattCModal from "../modals/ZusatzblattCModal";
import ZusatzblattDModal from "../modals/ZusatzblattDModal";
import { getTelegramGroupIdForStage } from "../../utils";
import { stageRequiresAdditionalInfo } from "../../hooks/statusEmail/helpers";

export default function ModalGroup({
  // Photo modal
  isPhotoModalOpen,
  photoModalSrc,
  setIsPhotoModalOpen,
  setPhotoModalSrc,
  // Stage email modal
  isStageEmailModalOpen,
  closeStageEmailModal,
  pendingStageStep,
  stageDecision,
  setStageDecision,
  handleStageEmailSubmit,
  stageAdditionalInfoForm,
  setStageAdditionalInfoForm,
  selectedExample,
  setSelectedExample,
  decisionNote,
  setDecisionNote,
  stageEmailPreview,
  metaInfo,
  metaLoading,
  telegramGroupNameById,
  isLimitedAdmin,
  sendingStepValue,
  docCv,
  // Custom email modal
  isCustomEmailModalOpen,
  closeCustomEmailModal,
  handleCustomEmailSubmit,
  customEmailForm,
  setCustomEmailForm,
  customEmailPreview,
  customEmailDefaults,
  // Send doc link modal
  isSendDocLinkModalOpen,
  closeSendDocLinkModal,
  handleSendDocLinkSubmit,
  isSendingDocLink,
  formCv,
  candidateDocId,
  // Erklaerung / Zusatzblatt modals
  isErklaerungModalOpen,
  setIsErklaerungModalOpen,
  isZusatzblattAModalOpen,
  setIsZusatzblattAModalOpen,
  isZusatzblattBModalOpen,
  setIsZusatzblattBModalOpen,
  isZusatzblattCModalOpen,
  setIsZusatzblattCModalOpen,
  isZusatzblattDModalOpen,
  setIsZusatzblattDModalOpen,
}) {
  function closePhotoModal() {
    setIsPhotoModalOpen(false);
    setPhotoModalSrc("");
  }

  const autoTelegramGroupLabel = (() => {
    try {
      const gid = pendingStageStep
        ? getTelegramGroupIdForStage(metaInfo, pendingStageStep)
        : "";
      if (!gid) return "";
      return String(telegramGroupNameById?.[gid] || gid).trim();
    } catch {
      return "";
    }
  })();

  return (
    <>
      <PhotoModal open={isPhotoModalOpen} src={photoModalSrc} onClose={closePhotoModal} />

      <StageEmailModal
        open={isStageEmailModalOpen}
        onClose={closeStageEmailModal}
        title="Status-E-Mail senden"
        subtitle={
          pendingStageStep === "stage_2" || pendingStageStep === "stage_2_result"
            ? "In dieser Stufe werden Link und Datum/Uhrzeit nicht gesendet."
            : isLimitedAdmin
              ? "Sie haben keine Berechtigung, E-Mails zu senden."
              : metaLoading
                ? "Zusätzliche Informationen werden geladen..."
                : "Bei Annahme werden Datum/Uhrzeit und Link (oder Standort) zur E-Mail hinzugefügt."
        }
        decision={stageDecision}
        setDecision={setStageDecision}
        onSubmit={handleStageEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        previewRows={[]}
        showPreviewWhenAccepted
        showAdditionalInfoEditor={
          !isLimitedAdmin &&
          stageDecision === "accepted" &&
          stageRequiresAdditionalInfo(pendingStageStep, selectedExample)
        }
        additionalInfoForm={stageAdditionalInfoForm}
        setAdditionalInfoForm={setStageAdditionalInfoForm}
        canGenerateTelegramLink={Boolean(
          pendingStageStep && getTelegramGroupIdForStage(metaInfo, pendingStageStep),
        )}
        autoTelegramGroupLabel={autoTelegramGroupLabel}
        emailPreview={stageEmailPreview}
        examples={stageEmailPreview?.examples || null}
        selectedExample={selectedExample}
        setSelectedExample={setSelectedExample}
        hasTelegramId={Boolean(docCv?.telegramId)}
        decisionNote={decisionNote}
        setDecisionNote={setDecisionNote}
      />

      <CustomEmailModal
        open={isCustomEmailModalOpen}
        onClose={closeCustomEmailModal}
        onSubmit={handleCustomEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        form={customEmailForm}
        setForm={setCustomEmailForm}
        emailPreview={customEmailPreview}
        placeholders={customEmailDefaults}
      />

      <SendDocumentLinkModal
        open={isSendDocLinkModalOpen}
        onClose={closeSendDocLinkModal}
        onSubmit={handleSendDocLinkSubmit}
        isSending={isSendingDocLink}
        candidateEmail={String(formCv.personalInfo.email || "").trim()}
        hasTelegramId={Boolean(docCv?.telegramId)}
        documentLink={`https://admin.consultinguz.de/dataExchange/${candidateDocId}`}
        candidateName={`${formCv.personalInfo.lastName || ""} ${formCv.personalInfo.name || ""}`.trim()}
      />

      <ErklaerungBeschaeftigungModal
        open={isErklaerungModalOpen}
        onClose={() => setIsErklaerungModalOpen(false)}
        candidateData={formCv}
      />
      <ZusatzblattAModal
        open={isZusatzblattAModalOpen}
        onClose={() => setIsZusatzblattAModalOpen(false)}
        candidateData={formCv}
      />
      <ZusatzblattBModal
        open={isZusatzblattBModalOpen}
        onClose={() => setIsZusatzblattBModalOpen(false)}
        candidateData={formCv}
      />
      <ZusatzblattCModal
        open={isZusatzblattCModalOpen}
        onClose={() => setIsZusatzblattCModalOpen(false)}
        candidateData={formCv}
      />
      <ZusatzblattDModal
        open={isZusatzblattDModalOpen}
        onClose={() => setIsZusatzblattDModalOpen(false)}
        candidateData={formCv}
      />
    </>
  );
}
