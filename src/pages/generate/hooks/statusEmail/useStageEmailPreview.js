import { useMemo } from "react";
import {
  buildStatusEmailTemplate,
  getStatusEmailCopy,
} from "../../../../utils/statusEmail";
import {
  makeEmailTemplateId,
  toCopyOverridesFromTemplateDoc,
} from "../../../../utils/emailTemplates";
import { createEmptyStageInfo, getTelegramGroupIdForStage } from "../../utils";
import {
  normalizeStageFormInfo,
  stageRequiresAdditionalInfo,
} from "./helpers";

/**
 * Memo that computes the stage email preview for the modal.
 */
export function useStageEmailPreview({
  pendingStageStep,
  stageDecision,
  stageAdditionalInfoForm,
  formCv,
  metaInfo,
  emailTemplatesMap,
  telegramGroupNameById,
  selectedExample,
  decisionNote = "",
}) {
  return useMemo(() => {
    if (!pendingStageStep) return null;
    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    const normalizedDecision =
      stageDecision === "rejected" ? "rejected" : "accepted";
    const info =
      normalizedDecision === "accepted" &&
      stageRequiresAdditionalInfo(pendingStageStep, selectedExample)
        ? normalizeStageFormInfo(stageAdditionalInfoForm)
        : createEmptyStageInfo();
    try {
      const telegramGroupIdForStage = getTelegramGroupIdForStage(
        metaInfo,
        pendingStageStep,
      );
      if (
        normalizedDecision === "accepted" &&
        stageRequiresAdditionalInfo(pendingStageStep, selectedExample) &&
        Boolean(info?.useGeneratedLink) &&
        telegramGroupIdForStage
      ) {
        info.linkType = "telegram";
        info.link =
          "Telegram invite link (send paytida avtomatik yaratiladi)";
      }

      const templateId = makeEmailTemplateId(
        pendingStageStep,
        normalizedDecision,
      );
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;
      const baseCopy = getStatusEmailCopy(
        pendingStageStep,
        normalizedDecision,
      );

      let finalCopyOverrides = copyOverrides;
      if (
        pendingStageStep === "stage_2" &&
        normalizedDecision === "accepted" &&
        baseCopy.examples
      ) {
        const sel = baseCopy.examples.find(
          (ex) => ex.id === selectedExample,
        );
        if (sel) {
          finalCopyOverrides = {
            ...copyOverrides,
            mainText: sel.content,
          };
        }
      }

      const { subject, message, htmlContent, examples } =
        buildStatusEmailTemplate({
          statusValue: pendingStageStep,
          firstName: formCv.personalInfo.name,
          lastName: formCv.personalInfo.lastName,
          stageDecision: normalizedDecision,
          decisionNote: String(decisionNote || ""),
          additionalInfo: info,
          copyOverrides: finalCopyOverrides,
        });
      return { to: recipientEmail, subject, message, htmlContent, examples };
    } catch (err) {
      return {
        to: recipientEmail,
        subject: "",
        message: "",
        htmlContent: "",
        examples: null,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pendingStageStep,
    stageDecision,
    stageAdditionalInfoForm,
    formCv.personalInfo.email,
    formCv.personalInfo.name,
    formCv.personalInfo.lastName,
    emailTemplatesMap,
    telegramGroupNameById,
    selectedExample,
    decisionNote,
  ]);
}
