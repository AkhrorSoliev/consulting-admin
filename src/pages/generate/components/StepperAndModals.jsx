import CandidateStatusStepper from "../../../components/CandidateStatusStepper";
import EmailMetaInfo from "./stepperModals/EmailMetaInfo";
import OutgoingDocumentsCard from "./stepperModals/OutgoingDocumentsCard";
import SentDocumentsCard from "./stepperModals/SentDocumentsCard";
import StatusUpdateInfo from "./stepperModals/StatusUpdateInfo";
import RemoteModeCard from "./stepperModals/RemoteModeCard";
import ModalGroup from "./stepperModals/ModalGroup";
import MobilePickerOverlay from "./stepperModals/MobilePickerOverlay";

export default function StepperAndModals({
  // Visibility flags
  remoteMode, isLimitedAdmin, loading, notFound,
  // Email meta
  emailMeta, emailMetaAvatarFromUsers,
  // Stepper
  statusValue, handleSendStatusEmail, sendingStepValue,
  resetCandidateStages, openCustomEmailModal, resetSingleStage, docCv,
  // Outgoing documents
  outgoingBulkBusy, outgoingAnyBusy, outgoingEntries,
  candidateCollection, candidateDocId,
  handleDeleteAllOutgoingDocs, getOutgoingDocState, outgoingBusyById,
  handleToggleOutgoingDoc, outgoingDocs, handleDeleteOutgoingDoc,
  copyToClipboard, openSendDocLinkModal,
  // Status update info
  statusUpdatedAt, statusUpdatedBy,
  // Remote mode restore
  navigate, restoreBusy, restoreFromRemoteMode, remoteLoading, remoteRecord,
  // Form
  formCv, setFormCv,
  // Photo modal
  isPhotoModalOpen, photoModalSrc, setIsPhotoModalOpen, setPhotoModalSrc,
  // Stage email modal
  isStageEmailModalOpen, closeStageEmailModal, pendingStageStep,
  stageDecision, setStageDecision, handleStageEmailSubmit,
  stageAdditionalInfoForm, setStageAdditionalInfoForm,
  selectedExample, setSelectedExample, stageEmailPreview,
  metaInfo, metaLoading, telegramGroupNameById,
  // Custom email modal
  isCustomEmailModalOpen, closeCustomEmailModal, handleCustomEmailSubmit,
  customEmailForm, setCustomEmailForm, customEmailPreview, customEmailDefaults,
  // Send doc link modal
  isSendDocLinkModalOpen, closeSendDocLinkModal, handleSendDocLinkSubmit, isSendingDocLink,
  // Erklaerung / Zusatzblatt modals
  isErklaerungModalOpen, setIsErklaerungModalOpen,
  isZusatzblattAModalOpen, setIsZusatzblattAModalOpen,
  isZusatzblattBModalOpen, setIsZusatzblattBModalOpen,
  isZusatzblattCModalOpen, setIsZusatzblattCModalOpen,
  isZusatzblattDModalOpen, setIsZusatzblattDModalOpen,
  // Mobile pickers
  isMobile, showBirthPlacePicker, setShowBirthPlacePicker,
  showMaritalStatusPicker, setShowMaritalStatusPicker,
}) {
  const openModal = (key) => {
    const setters = {
      erklaerung: setIsErklaerungModalOpen,
      zusatzblattA: setIsZusatzblattAModalOpen,
      zusatzblattB: setIsZusatzblattBModalOpen,
      zusatzblattC: setIsZusatzblattCModalOpen,
      zusatzblattD: setIsZusatzblattDModalOpen,
    };
    setters[key]?.(true);
  };

  return (
    <>
      {!remoteMode && !isLimitedAdmin && !loading && !notFound && (
        <div className="mt-6">
          <EmailMetaInfo emailMeta={emailMeta} emailMetaAvatarFromUsers={emailMetaAvatarFromUsers} />

          <CandidateStatusStepper
            currentValue={statusValue}
            onSendEmail={handleSendStatusEmail}
            sendingValue={sendingStepValue}
            disabled={isLimitedAdmin}
            resetStages={resetCandidateStages}
            openCustomEmailModal={openCustomEmailModal}
            onResetStage={resetSingleStage}
            hasLeadershipInterview={Boolean(docCv?.stageMeta?.stage_2?.sentWithLeadership)}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OutgoingDocumentsCard
              outgoingBulkBusy={outgoingBulkBusy}
              outgoingAnyBusy={outgoingAnyBusy}
              outgoingEntries={outgoingEntries}
              candidateCollection={candidateCollection}
              candidateDocId={candidateDocId}
              handleDeleteAllOutgoingDocs={handleDeleteAllOutgoingDocs}
              getOutgoingDocState={getOutgoingDocState}
              outgoingBusyById={outgoingBusyById}
              handleToggleOutgoingDoc={handleToggleOutgoingDoc}
              sendingStepValue={sendingStepValue}
              formCv={formCv}
              openModal={openModal}
            />
            <SentDocumentsCard
              outgoingDocs={outgoingDocs}
              outgoingBusyById={outgoingBusyById}
              candidateCollection={candidateCollection}
              candidateDocId={candidateDocId}
              sendingStepValue={sendingStepValue}
              handleDeleteOutgoingDoc={handleDeleteOutgoingDoc}
              copyToClipboard={copyToClipboard}
              openSendDocLinkModal={openSendDocLinkModal}
            />
          </div>

          <StatusUpdateInfo statusUpdatedAt={statusUpdatedAt} statusUpdatedBy={statusUpdatedBy} />
        </div>
      )}

      {remoteMode && !loading && !notFound && (
        <RemoteModeCard
          navigate={navigate}
          restoreBusy={restoreBusy}
          restoreFromRemoteMode={restoreFromRemoteMode}
          remoteLoading={remoteLoading}
          remoteRecord={remoteRecord}
        />
      )}

      <ModalGroup
        isPhotoModalOpen={isPhotoModalOpen}
        photoModalSrc={photoModalSrc}
        setIsPhotoModalOpen={setIsPhotoModalOpen}
        setPhotoModalSrc={setPhotoModalSrc}
        isStageEmailModalOpen={isStageEmailModalOpen}
        closeStageEmailModal={closeStageEmailModal}
        pendingStageStep={pendingStageStep}
        stageDecision={stageDecision}
        setStageDecision={setStageDecision}
        handleStageEmailSubmit={handleStageEmailSubmit}
        stageAdditionalInfoForm={stageAdditionalInfoForm}
        setStageAdditionalInfoForm={setStageAdditionalInfoForm}
        selectedExample={selectedExample}
        setSelectedExample={setSelectedExample}
        stageEmailPreview={stageEmailPreview}
        metaInfo={metaInfo}
        metaLoading={metaLoading}
        telegramGroupNameById={telegramGroupNameById}
        isLimitedAdmin={isLimitedAdmin}
        sendingStepValue={sendingStepValue}
        docCv={docCv}
        isCustomEmailModalOpen={isCustomEmailModalOpen}
        closeCustomEmailModal={closeCustomEmailModal}
        handleCustomEmailSubmit={handleCustomEmailSubmit}
        customEmailForm={customEmailForm}
        setCustomEmailForm={setCustomEmailForm}
        customEmailPreview={customEmailPreview}
        customEmailDefaults={customEmailDefaults}
        isSendDocLinkModalOpen={isSendDocLinkModalOpen}
        closeSendDocLinkModal={closeSendDocLinkModal}
        handleSendDocLinkSubmit={handleSendDocLinkSubmit}
        isSendingDocLink={isSendingDocLink}
        formCv={formCv}
        candidateDocId={candidateDocId}
        isErklaerungModalOpen={isErklaerungModalOpen}
        setIsErklaerungModalOpen={setIsErklaerungModalOpen}
        isZusatzblattAModalOpen={isZusatzblattAModalOpen}
        setIsZusatzblattAModalOpen={setIsZusatzblattAModalOpen}
        isZusatzblattBModalOpen={isZusatzblattBModalOpen}
        setIsZusatzblattBModalOpen={setIsZusatzblattBModalOpen}
        isZusatzblattCModalOpen={isZusatzblattCModalOpen}
        setIsZusatzblattCModalOpen={setIsZusatzblattCModalOpen}
        isZusatzblattDModalOpen={isZusatzblattDModalOpen}
        setIsZusatzblattDModalOpen={setIsZusatzblattDModalOpen}
      />

      <MobilePickerOverlay
        isMobile={isMobile}
        showBirthPlacePicker={showBirthPlacePicker}
        setShowBirthPlacePicker={setShowBirthPlacePicker}
        showMaritalStatusPicker={showMaritalStatusPicker}
        setShowMaritalStatusPicker={setShowMaritalStatusPicker}
        formCv={formCv}
        setFormCv={setFormCv}
      />
    </>
  );
}
