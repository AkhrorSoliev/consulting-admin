import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  inferLinkType,
  createEmptyStageInfo,
  getTelegramGroupIdForStage,
  toDateTimeLocalString,
} from "../../utils";
import {
  normalizeStageFormInfo,
  getStageAdditionalInfo,
  stageRequiresAdditionalInfo,
} from "./helpers";

/**
 * Sub-hook: stage email modal state and handlers (no preview).
 */
export function useStageEmailModal({
  id,
  isLimitedAdmin,
  metaInfo,
  statusValue,
  ensureTelegramGroupName,
  sendStatusEmail,
  plannedLeadership = false,
}) {
  const [isStageEmailModalOpen, setIsStageEmailModalOpen] = useState(false);
  const [pendingStageStep, setPendingStageStep] = useState(null);
  const [stageDecision, setStageDecision] = useState("accepted");
  const [stageAdditionalInfoForm, setStageAdditionalInfoForm] =
    useState(createEmptyStageInfo);
  const [selectedExample, setSelectedExample] = useState("example1");
  const [decisionNote, setDecisionNote] = useState("");

  // Clear extra info when switching to rejection
  useEffect(() => {
    if (stageDecision === "rejected") {
      setStageAdditionalInfoForm(createEmptyStageInfo());
    }
  }, [stageDecision]);

  // Reset decision note when stage changes
  useEffect(() => {
    setDecisionNote("");
  }, [pendingStageStep]);

  // Reset selected example when stage changes
  useEffect(() => {
    if (pendingStageStep === "stage_2") {
      const hasLeadershipMeta = Boolean(
        metaInfo?.interviewLeadership &&
          (metaInfo?.interviewLeadership?.date ||
            metaInfo?.interviewLeadership?.link ||
            metaInfo?.interviewLeadership?.locationName ||
            metaInfo?.interviewLeadership?.locationUrl),
      );
      setSelectedExample(
        plannedLeadership || hasLeadershipMeta ? "example2" : "example1",
      );
    }
  }, [pendingStageStep, metaInfo?.interviewLeadership, plannedLeadership]);

  function handleSendStatusEmail(stepValue) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("E-mail faqat joriy bosqich uchun yuboriladi.");
      return;
    }
    const initialInfo = getStageAdditionalInfo(metaInfo, stepValue);
    const telegramGroupIdForStage = getTelegramGroupIdForStage(
      metaInfo,
      stepValue,
    );
    const canGenerateTelegramLinkForStage = Boolean(telegramGroupIdForStage);
    if (telegramGroupIdForStage) {
      try {
        ensureTelegramGroupName(telegramGroupIdForStage);
      } catch {
        // ignore
      }
    }
    setPendingStageStep(stepValue);
    setStageDecision("accepted");

    const docId = String(id || "").trim();
    const dataExchangeLink =
      stepValue === "stage_4" && docId
        ? `https://admin.consultinguz.de/dataExchange/${docId}`
        : "";

    setStageAdditionalInfoForm({
      dateTime: toDateTimeLocalString(initialInfo?.dateTime),
      link:
        stepValue === "stage_4" && dataExchangeLink
          ? dataExchangeLink
          : String(initialInfo?.link || ""),
      linkType:
        stepValue === "stage_4"
          ? "other"
          : initialInfo?.linkType === "telegram"
            ? "telegram"
            : inferLinkType(initialInfo?.link, "zoom"),
      useGeneratedLink:
        initialInfo?.linkType === "telegram" &&
        canGenerateTelegramLinkForStage &&
        !String(initialInfo?.link || "").trim(),
      locationName: String(initialInfo?.locationName || ""),
      locationUrl: String(initialInfo?.locationUrl || ""),
    });
    setIsStageEmailModalOpen(true);
  }

  function closeStageEmailModal() {
    setIsStageEmailModalOpen(false);
    setPendingStageStep(null);
  }

  async function handleStageEmailSubmit(e) {
    e?.preventDefault();
    if (!pendingStageStep) {
      setIsStageEmailModalOpen(false);
      return;
    }
    const info = stageRequiresAdditionalInfo(pendingStageStep, selectedExample)
      ? normalizeStageFormInfo(stageAdditionalInfoForm)
      : createEmptyStageInfo();
    await sendStatusEmail(pendingStageStep, {
      stageDecision,
      additionalInfo: info,
      decisionNote: String(decisionNote || "").trim(),
    });
  }

  return {
    isStageEmailModalOpen,
    setIsStageEmailModalOpen,
    pendingStageStep,
    setPendingStageStep,
    stageDecision,
    setStageDecision,
    stageAdditionalInfoForm,
    setStageAdditionalInfoForm,
    selectedExample,
    setSelectedExample,
    decisionNote,
    setDecisionNote,
    handleSendStatusEmail,
    closeStageEmailModal,
    handleStageEmailSubmit,
  };
}
