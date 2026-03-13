import { useState, useRef } from "react";
import { createEmptyStageInfo } from "../../utils/stageUtils";

export function useModalState() {
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // Stage email modal state
  const [isStageEmailModalOpen, setIsStageEmailModalOpen] = useState(false);
  const [pendingStageStep, setPendingStageStep] = useState(null);
  const [stageDecision, setStageDecision] = useState("accepted");
  const [stageAdditionalInfoForm, setStageAdditionalInfoForm] =
    useState(createEmptyStageInfo);
  const [selectedExample, setSelectedExample] = useState("example1");
  const [emailTemplatesMap, setEmailTemplatesMap] = useState({});

  // Custom email modal state
  const [isCustomEmailModalOpen, setIsCustomEmailModalOpen] = useState(false);
  const [customEmailForm, setCustomEmailForm] = useState({
    to: "",
    emailTitle: "Ariza holati yangilandi",
    subject: "",
    bodyText: "",
  });

  // Photo modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");
  const [missingPassportModalOpen, setMissingPassportModalOpen] =
    useState(false);
  const missingPassportResolverRef = useRef(null);

  // Unsaved changes state
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);

  return {
    // Delete modal
    deleteModalOpen,
    setDeleteModalOpen,
    deleteTarget,
    setDeleteTarget,
    isDeletingCandidate,
    setIsDeletingCandidate,

    // Stage email modal
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
    emailTemplatesMap,
    setEmailTemplatesMap,

    // Custom email modal
    isCustomEmailModalOpen,
    setIsCustomEmailModalOpen,
    customEmailForm,
    setCustomEmailForm,

    // Photo modal
    isPhotoModalOpen,
    setIsPhotoModalOpen,
    photoModalSrc,
    setPhotoModalSrc,
    missingPassportModalOpen,
    setMissingPassportModalOpen,
    missingPassportResolverRef,

    // Unsaved changes
    unsavedModalOpen,
    setUnsavedModalOpen,
  };
}
