import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { buildStatusEmailTemplate } from "../../../../utils/statusEmail";
import {
  deleteEmailTemplate,
  makeEmailTemplateId,
  saveEmailTemplate,
  subscribeToEmailTemplates,
} from "../../../../utils/emailTemplates";
import { buildDefaultForm, mergeTemplateWithDefaults } from "../constants";
import { useDebouncedValue } from "./useDebouncedValue";

export function useEmailTemplates() {
  const user = useSelector((s) => s.auth?.user);
  const [templatesMap, setTemplatesMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [stage, setStage] = useState("stage_1");
  const [decision, setDecision] = useState("accepted");

  const [form, setForm] = useState(() =>
    buildDefaultForm("stage_1", "accepted")
  );
  const [baselineForm, setBaselineForm] = useState(() =>
    buildDefaultForm("stage_1", "accepted")
  );
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState("html");
  const debouncedForm = useDebouncedValue(form, 300);

  useEffect(() => {
    const unsub = subscribeToEmailTemplates((map) => {
      setTemplatesMap(map || {});
      setLoading(false);
    });
    return () => unsub?.();
  }, []);

  const templateId = useMemo(
    () => makeEmailTemplateId(stage, decision),
    [stage, decision]
  );

  const activeTemplate = templatesMap?.[templateId] || null;

  useEffect(() => {
    const base = buildDefaultForm(stage, decision);
    if (!activeTemplate) {
      setForm(base);
      setBaselineForm(base);
      return;
    }
    const next = mergeTemplateWithDefaults(base, activeTemplate);
    setForm(next);
    setBaselineForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, activeTemplate]);

  const preview = useMemo(() => {
    try {
      const additionalInfo =
        stage === "stage_2" || stage === "stage_2_result"
          ? null
          : {
              dateTime: "2025-12-23T15:30",
              linkType: "zoom",
              link: "https://zoom.us/j/123456789",
              locationName: "ConsultingUZ ofisi",
              locationUrl: "https://maps.app.goo.gl/example",
            };

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stage,
        firstName: "Ali",
        lastName: "Valiyev",
        stageDecision: decision,
        decisionNote: "",
        additionalInfo,
        copyOverrides: {
          emailTitle: debouncedForm.emailTitle,
          statusLabel: debouncedForm.statusLabel,
          subject: debouncedForm.subject,
          mainText: debouncedForm.mainText,
          nextStepNote: debouncedForm.nextStepNote,
          channelsText: debouncedForm.channelsText,
          emphasizeMainText: debouncedForm.emphasizeMainText,
        },
      });
      return {
        to: "candidate@example.com",
        subject,
        message,
        htmlContent,
      };
    } catch (e) {
      return {
        to: "candidate@example.com",
        subject: "",
        message: "",
        htmlContent: "",
      };
    }
  }, [stage, decision, debouncedForm]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(form) !== JSON.stringify(baselineForm);
    } catch {
      return true;
    }
  }, [form, baselineForm]);

  async function handleSave() {
    if (!templateId) return;
    setSaving(true);
    try {
      await saveEmailTemplate(stage, decision, {
        stage,
        decision,
        emailTitle: String(form.emailTitle || ""),
        statusLabel: String(form.statusLabel || ""),
        subject: String(form.subject || ""),
        mainText: String(form.mainText || ""),
        nextStepNote: String(form.nextStepNote || ""),
        channelsText: String(form.channelsText || ""),
        emphasizeMainText: Boolean(form.emphasizeMainText),
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || "admin",
      });
      toast.success("Vorlage gespeichert.");
      setBaselineForm(form);
    } catch (e) {
      toast.error(e?.message || "Fehler beim Speichern der Vorlage.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToDefault() {
    if (!templateId) return;
    const ok = window.confirm(
      "Möchten Sie diese Überschreibung löschen? (Standardtexte werden wiederhergestellt)"
    );
    if (!ok) return;
    setSaving(true);
    try {
      await deleteEmailTemplate(stage, decision);
      toast.success("Auf Standard zurückgesetzt.");
    } catch (e) {
      toast.error(e?.message || "Fehler beim Löschen.");
    } finally {
      setSaving(false);
    }
  }

  function handleLoadDefaultsIntoForm() {
    setForm(buildDefaultForm(stage, decision));
    toast(
      "Standardtexte wurden in das Formular geladen (noch nicht gespeichert)."
    );
  }

  return {
    stage,
    setStage,
    decision,
    setDecision,
    form,
    setForm,
    saving,
    loading,
    previewMode,
    setPreviewMode,
    activeTemplate,
    preview,
    isDirty,
    handleSave,
    handleResetToDefault,
    handleLoadDefaultsIntoForm,
  };
}
