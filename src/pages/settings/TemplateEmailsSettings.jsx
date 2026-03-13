import { useEmailTemplates } from "./templateEmails/hooks/useEmailTemplates";
import ToolbarSection from "./templateEmails/components/ToolbarSection";
import TemplateForm from "./templateEmails/components/TemplateForm";
import PreviewPanel from "./templateEmails/components/PreviewPanel";

export default function TemplateEmailsSettings() {
  const {
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
  } = useEmailTemplates();

  return (
    <div className="space-y-4">
      <ToolbarSection
        stage={stage}
        setStage={setStage}
        decision={decision}
        setDecision={setDecision}
        saving={saving}
        loading={loading}
        activeTemplate={activeTemplate}
        isDirty={isDirty}
        onLoadDefaults={handleLoadDefaultsIntoForm}
        onSave={handleSave}
      />

      {loading ? (
        <div className="rounded-box border border-base-300 bg-base-100 p-4">
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner loading-sm" />
            <div className="text-sm text-base-content/70">
              Vorlagen werden geladen...
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] gap-4 items-start">
          <TemplateForm
            form={form}
            setForm={setForm}
            saving={saving}
            activeTemplate={activeTemplate}
            onResetToDefault={handleResetToDefault}
          />

          <PreviewPanel
            preview={preview}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
          />
        </div>
      )}
    </div>
  );
}
