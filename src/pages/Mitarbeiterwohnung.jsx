import MitarbeiterwohnungLivePreview from "./contract/components/MitarbeiterwohnungLivePreview";
import useMitarbeiterwohnungTemplate from "./mitarbeiterwohnung/hooks/useMitarbeiterwohnungTemplate";
import ActionBar from "./mitarbeiterwohnung/components/ActionBar";
import MitarbeiterwohnungForm from "./mitarbeiterwohnung/components/MitarbeiterwohnungForm";
import { layoutClass } from "./mitarbeiterwohnung/utils/constants";

export default function Mitarbeiterwohnung() {
  const {
    form,
    setForm,
    isDownloading,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    canWriteTemplate,
    saveTemplate,
    handleDownloadPdf,
  } = useMitarbeiterwohnungTemplate();

  return (
    <div className="p-2 min-h-screen">
      <ActionBar
        isLoadingTemplate={isLoadingTemplate}
        isSavingTemplate={isSavingTemplate}
        hasUnsavedTemplate={hasUnsavedTemplate}
        canWriteTemplate={canWriteTemplate}
        isDownloading={isDownloading}
        onSave={saveTemplate}
        onDownload={handleDownloadPdf}
      />

      <div className={layoutClass}>
        <MitarbeiterwohnungForm form={form} setForm={setForm} />
        <MitarbeiterwohnungLivePreview form={form} />
      </div>
    </div>
  );
}
