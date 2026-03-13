import { useRef, useState } from "react";
import { useStatusPersistence } from "./useStatusPersistence";
import { makeSendStatusEmail } from "./useSendStatusEmail";
import { makeSendCustomEmail } from "./useSendCustomEmail";
import { useStageEmailModal } from "./useStageEmailModal";
import { useStageEmailPreview } from "./useStageEmailPreview";
import { useCustomEmailModal } from "./useCustomEmailModal";
import { normalizeStageFormInfo, getNextStepValue } from "./helpers";

/**
 * Orchestrator hook that composes all status-email sub-hooks.
 * Drop-in replacement for the original monolithic useStatusEmail.
 */
export function useStatusEmail({
  id, resolvedMajor, formCv, isLimitedAdmin, user, docCv,
  metaInfo, metaLoading, emailTemplatesMap,
  selectedExample: selectedExampleProp,
  setDeleteTarget, setDeleteModalOpen, setDocCv,
  ensureTelegramGroupName, telegramGroupNameById,
}) {
  // Shared refs / state
  const sendingEmailLockRef = useRef(false);
  const [sendingStepValue, setSendingStepValue] = useState(null);
  const [emailMeta, setEmailMeta] = useState({
    count: 0, lastSentAt: null, lastSentBy: "",
    lastSentByUid: "", lastSentByName: "", lastSentByPhoto: "",
    lastSentType: "",
  });

  // Status persistence (save, reset)
  const persistence = useStatusPersistence({
    id, resolvedMajor, isLimitedAdmin, user, docCv,
    sendingEmailLockRef, sendingStepValue, setDocCv,
  });

  // Stage email modal (state + handlers, no preview yet)
  const stageModal = useStageEmailModal({
    id, isLimitedAdmin, metaInfo,
    statusValue: persistence.statusValue,
    ensureTelegramGroupName,
    // sendStatusEmail is wired below after creation
    sendStatusEmail: (...args) => sendStatusEmailFn.current(...args),
  });

  // Build the actual sendStatusEmail function
  const sendStatusEmailFn = useRef(null);
  sendStatusEmailFn.current = makeSendStatusEmail({
    id, resolvedMajor, formCv, isLimitedAdmin, user, docCv,
    metaInfo, emailTemplatesMap,
    selectedExample: stageModal.selectedExample,
    statusValue: persistence.statusValue,
    sendingEmailLockRef, setSendingStepValue,
    setEmailMeta, emailMeta,
    persistStatus: persistence.persistStatus,
    setStatusValue: persistence.setStatusValue,
    setPendingStageStep: stageModal.setPendingStageStep,
    setIsStageEmailModalOpen: stageModal.setIsStageEmailModalOpen,
    setDeleteTarget, setDeleteModalOpen,
  });

  // Build the sendCustomEmail function
  const sendCustomEmailFn = useRef(null);
  sendCustomEmailFn.current = makeSendCustomEmail({
    id, resolvedMajor, formCv, isLimitedAdmin, user, docCv,
    metaInfo,
    statusValue: persistence.statusValue,
    sendingEmailLockRef, setSendingStepValue,
    emailMeta, setEmailMeta,
    setIsCustomEmailModalOpen: null, // patched below
  });

  // Custom email modal
  const customModal = useCustomEmailModal({
    formCv, metaInfo,
    statusValue: persistence.statusValue,
    emailTemplatesMap,
    sendCustomEmail: (...args) => sendCustomEmailFn.current(...args),
  });

  // Patch the custom modal close into sendCustomEmail
  sendCustomEmailFn.current = makeSendCustomEmail({
    id, resolvedMajor, formCv, isLimitedAdmin, user, docCv,
    metaInfo,
    statusValue: persistence.statusValue,
    sendingEmailLockRef, setSendingStepValue,
    emailMeta, setEmailMeta,
    setIsCustomEmailModalOpen: customModal.setIsCustomEmailModalOpen,
  });

  // Stage email preview (memo)
  const stageEmailPreview = useStageEmailPreview({
    pendingStageStep: stageModal.pendingStageStep,
    stageDecision: stageModal.stageDecision,
    stageAdditionalInfoForm: stageModal.stageAdditionalInfoForm,
    formCv, metaInfo, emailTemplatesMap, telegramGroupNameById,
    selectedExample: stageModal.selectedExample,
  });

  return {
    // functions
    persistStatus: persistence.persistStatus,
    handleStatusSave: persistence.handleStatusSave,
    getNextStepValue,
    sendStatusEmail: (...a) => sendStatusEmailFn.current(...a),
    handleSendStatusEmail: stageModal.handleSendStatusEmail,
    handleStageEmailSubmit: stageModal.handleStageEmailSubmit,
    normalizeStageFormInfo,
    resetCandidateStages: persistence.resetCandidateStages,
    resetSingleStage: persistence.resetSingleStage,
    handleCustomEmailSubmit: customModal.handleCustomEmailSubmit,

    // state
    sendingStepValue, setSendingStepValue,
    isSavingStatus: persistence.isSavingStatus,
    statusValue: persistence.statusValue,
    setStatusValue: persistence.setStatusValue,
    statusUpdatedAt: persistence.statusUpdatedAt,
    setStatusUpdatedAt: persistence.setStatusUpdatedAt,
    statusUpdatedBy: persistence.statusUpdatedBy,
    setStatusUpdatedBy: persistence.setStatusUpdatedBy,
    stageDecision: stageModal.stageDecision,
    setStageDecision: stageModal.setStageDecision,
    stageAdditionalInfoForm: stageModal.stageAdditionalInfoForm,
    setStageAdditionalInfoForm: stageModal.setStageAdditionalInfoForm,
    stageEmailPreview,
    selectedExample: stageModal.selectedExample,
    setSelectedExample: stageModal.setSelectedExample,
    emailMeta, setEmailMeta,
    customEmailForm: customModal.customEmailForm,
    setCustomEmailForm: customModal.setCustomEmailForm,
    customEmailPreview: customModal.customEmailPreview,
    customEmailDefaults: customModal.customEmailDefaults,

    // modal controls
    isStageEmailModalOpen: stageModal.isStageEmailModalOpen,
    openStageEmailModal: stageModal.handleSendStatusEmail,
    closeStageEmailModal: stageModal.closeStageEmailModal,
    isCustomEmailModalOpen: customModal.isCustomEmailModalOpen,
    openCustomEmailModal: customModal.openCustomEmailModal,
    closeCustomEmailModal: customModal.closeCustomEmailModal,
    pendingStageStep: stageModal.pendingStageStep,
  };
}
