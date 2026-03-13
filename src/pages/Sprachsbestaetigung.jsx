import SprachsbestaetigungLivePreview from "./contract/components/SprachsbestaetigungLivePreview";
import useSprachsbestaetigungTemplate from "./sprachsbestaetigung/hooks/useSprachsbestaetigungTemplate";
import useDownloadPdf from "./sprachsbestaetigung/hooks/useDownloadPdf.jsx";
import ActionBar from "./sprachsbestaetigung/components/ActionBar";
import SprachsbestaetigungForm from "./sprachsbestaetigung/components/SprachsbestaetigungForm";

export default function Sprachsbestaetigung() {
  const {
    form,
    setForm,
    canWriteTemplate,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    saveTemplate,
  } = useSprachsbestaetigungTemplate();

  const { isDownloading, handleDownloadPdf } = useDownloadPdf(form);

  return (
    <div className="p-2 min-h-screen">
      {/* Fixed action bar under the global navbar (hidden on print) */}
      <ActionBar
        isLoadingTemplate={isLoadingTemplate}
        isSavingTemplate={isSavingTemplate}
        hasUnsavedTemplate={hasUnsavedTemplate}
        canWriteTemplate={canWriteTemplate}
        onSave={saveTemplate}
        isDownloading={isDownloading}
        onDownload={handleDownloadPdf}
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-stretch">
        <SprachsbestaetigungForm form={form} setForm={setForm} />
        <SprachsbestaetigungLivePreview form={form} />
      </div>
    </div>
  );
}
