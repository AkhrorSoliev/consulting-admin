import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import VollmachtPdfDocument from "../contract/pdf/VollmachtPdfDocument";
import VollmachtLivePreview from "../contract/components/VollmachtLivePreview";
import useUserRole from "../../hooks/useUserRole";
import { useSelector } from "react-redux";
import useVollmachtTemplate from "./hooks/useVollmachtTemplate";
import VollmachtActionBar from "./components/VollmachtActionBar";
import VollmachtFormSection from "./components/VollmachtFormSection";

export default function Vollmacht() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const {
    form,
    setForm,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    saveTemplate,
  } = useVollmachtTemplate({ canWriteTemplate, user });

  const [isDownloading, setIsDownloading] = useState(false);

  const fullName = useMemo(() => {
    const first = String(form.firstName || "").trim();
    const last = String(form.lastName || "").trim();
    return [first, last].filter(Boolean).join(" ");
  }, [form.firstName, form.lastName]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = fullName ? `Vollmacht ${fullName}` : "Vollmacht";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vollmacht";
      const blob = await pdf(<VollmachtPdfDocument form={form} />).toBlob();
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
      <VollmachtActionBar
        isLoadingTemplate={isLoadingTemplate}
        isSavingTemplate={isSavingTemplate}
        hasUnsavedTemplate={hasUnsavedTemplate}
        canWriteTemplate={canWriteTemplate}
        isDownloading={isDownloading}
        onSave={saveTemplate}
        onDownload={handleDownloadPdf}
      />

      <div className={layoutClass}>
        <section className={formCard}>
          <VollmachtFormSection form={form} setForm={setForm} />
        </section>

        <VollmachtLivePreview form={form} />
      </div>
    </div>
  );
}
