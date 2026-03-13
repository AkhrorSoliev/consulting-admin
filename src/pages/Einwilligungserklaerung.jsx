import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import EinwilligungserklaerungPdfDocument from "./contract/pdf/EinwilligungserklaerungPdfDocument";
import EinwilligungserklaerungLivePreview from "./contract/components/EinwilligungserklaerungLivePreview";
import useEinwilligungTemplate from "./einwilligungserklaerung/hooks/useEinwilligungTemplate";
import ActionBar from "./einwilligungserklaerung/components/ActionBar";
import EinwilligungForm from "./einwilligungserklaerung/components/EinwilligungForm";

export default function Einwilligungserklaerung() {
  const {
    form,
    setForm,
    isDownloading,
    setIsDownloading,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    canWriteTemplate,
    saveTemplate,
  } = useEinwilligungTemplate();

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fullName = [form.nachname, form.vorname].filter(Boolean).join(" ");
      const fileBase = fullName
        ? `Einwilligungserklaerung ${fullName}`
        : "Einwilligungserklaerung";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Einwilligungserklaerung";
      const blob = await pdf(
        <EinwilligungserklaerungPdfDocument form={form} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
  const formCard =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  return (
    <div className="p-2 min-h-screen">
      <ActionBar
        isLoadingTemplate={isLoadingTemplate}
        isSavingTemplate={isSavingTemplate}
        hasUnsavedTemplate={hasUnsavedTemplate}
        canWriteTemplate={canWriteTemplate}
        isDownloading={isDownloading}
        onSave={() => saveTemplate({ silent: false })}
        onDownload={handleDownloadPdf}
      />

      <div className={layoutClass}>
        <section className={formCard}>
          <EinwilligungForm form={form} setForm={setForm} />
        </section>

        <EinwilligungserklaerungLivePreview form={form} />
      </div>
    </div>
  );
}
