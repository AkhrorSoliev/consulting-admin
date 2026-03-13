import { useMemo, useState } from "react";
import {
  buildStatusEmailTemplate,
  getStatusEmailCopy,
} from "../../../../utils/statusEmail";
import {
  makeEmailTemplateId,
  toCopyOverridesFromTemplateDoc,
} from "../../../../utils/emailTemplates";
import { CANDIDATE_STATUS_DEFAULT } from "../../../../constants/candidateStatus";
import { splitCustomEmailBody } from "../../utils";
import {
  getStageAdditionalInfo,
  stripDefaultIntroFromCustomPreview,
  stripStatusLineFromCustomEmail,
} from "./helpers";

/**
 * Sub-hook: custom email modal state, defaults, preview, and handlers.
 */
export function useCustomEmailModal({
  formCv,
  metaInfo,
  statusValue,
  emailTemplatesMap,
  sendCustomEmail,
}) {
  const [isCustomEmailModalOpen, setIsCustomEmailModalOpen] = useState(false);
  const [customEmailForm, setCustomEmailForm] = useState({
    to: "",
    emailTitle: "Ariza holati yangilandi",
    subject: "",
    bodyText: "",
  });

  function openCustomEmailModal() {
    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    setCustomEmailForm({
      to: recipientEmail,
      emailTitle: "",
      subject: "",
      bodyText: "",
    });
    setIsCustomEmailModalOpen(true);
  }

  function closeCustomEmailModal() {
    setIsCustomEmailModalOpen(false);
  }

  async function handleCustomEmailSubmit(e) {
    e?.preventDefault();
    await sendCustomEmail(customEmailForm);
  }

  const customEmailDefaults = useMemo(() => {
    const stage =
      String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const templateId = makeEmailTemplateId(stage, "accepted");
    const templateDoc = emailTemplatesMap?.[templateId] || null;
    const override = toCopyOverridesFromTemplateDoc(templateDoc) || {};
    const baseCopy = getStatusEmailCopy(stage, "accepted");
    const subjectFromTemplate =
      override?.subject !== undefined
        ? String(override.subject || "")
        : String(baseCopy?.subject || "");
    return {
      emailTitle: "Ariza holati yangilandi",
      subject: subjectFromTemplate,
      bodyText: "Asosiy matn (main)...\n\nKeyingi qadam (note)...",
    };
  }, [statusValue, emailTemplatesMap]);

  const customEmailPreview = useMemo(() => {
    const recipientEmail = String(customEmailForm?.to || "").trim();
    const stage =
      String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const info = getStageAdditionalInfo(metaInfo, stage);
    const { mainText, nextStepNote, hasMain, hasNote } =
      splitCustomEmailBody(customEmailForm?.bodyText);
    try {
      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stage,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: "accepted",
        decisionNote: "",
        additionalInfo: info,
        copyOverrides: {
          emailTitle: String(customEmailForm?.emailTitle || "").trim()
            ? String(customEmailForm?.emailTitle || "")
            : undefined,
          subject: String(customEmailForm?.subject || "").trim()
            ? String(customEmailForm?.subject || "")
            : undefined,
          mainText: hasMain ? mainText : "",
          nextStepNote: hasNote ? nextStepNote : "",
          emphasizeMainText: false,
        },
      });
      return {
        to: recipientEmail,
        subject,
        message: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(message),
        ),
        htmlContent: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(htmlContent),
        ),
      };
    } catch (err) {
      return {
        to: recipientEmail,
        subject: "",
        message: "",
        htmlContent: "",
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customEmailForm,
    formCv.personalInfo.name,
    formCv.personalInfo.lastName,
    statusValue,
    metaInfo,
  ]);

  return {
    isCustomEmailModalOpen,
    setIsCustomEmailModalOpen,
    customEmailForm,
    setCustomEmailForm,
    customEmailDefaults,
    customEmailPreview,
    openCustomEmailModal,
    closeCustomEmailModal,
    handleCustomEmailSubmit,
  };
}
