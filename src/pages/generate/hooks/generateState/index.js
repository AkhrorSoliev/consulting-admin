import { useEffect } from "react";
import { createEmptyStageInfo } from "../../utils/stageUtils";
import { useDocumentState } from "./useDocumentState";
import { useStatusState } from "./useStatusState";
import { useModalState } from "./useModalState";
import { useMetaAndRemoteState } from "./useMetaAndRemoteState";
import { useFormAndUiState } from "./useFormAndUiState";

export function useGenerateState(initialForm) {
  const docState = useDocumentState();
  const statusState = useStatusState();
  const modalState = useModalState();
  const metaRemoteState = useMetaAndRemoteState();
  const formUiState = useFormAndUiState(initialForm);

  // Stage decision effect
  useEffect(() => {
    if (modalState.stageDecision === "rejected") {
      modalState.setStageAdditionalInfoForm(createEmptyStageInfo());
    }
  }, [modalState.stageDecision]);

  return {
    ...docState,
    ...statusState,
    ...modalState,
    ...metaRemoteState,
    ...formUiState,
  };
}
