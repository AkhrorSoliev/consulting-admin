import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import FotoVideoRozilikPdfDocument from "../contract/pdf/FotoVideoRozilikPdfDocument";
import FotoVideoRozilikLivePreview from "../contract/components/FotoVideoRozilikLivePreview";
import useUserRole from "../../hooks/useUserRole";
import { useSelector } from "react-redux";
import useFotoVideoTemplate from "./hooks/useFotoVideoTemplate";
import FotoVideoActionBar from "./components/FotoVideoActionBar";
import FotoVideoFormSection from "./components/FotoVideoFormSection";

export default function FotoVideoRozilik() {
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
  } = useFotoVideoTemplate({ canWriteTemplate, user });

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fullName = form.fullName || "";
      const fileBase = fullName
        ? `Foto-Video-Rozilik ${fullName}`
        : "Foto-Video-Rozilik";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Foto-Video-Rozilik";
      const blob = await pdf(
        <FotoVideoRozilikPdfDocument form={form} />
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
      <FotoVideoActionBar
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
          <FotoVideoFormSection form={form} setForm={setForm} />
        </section>

        <FotoVideoRozilikLivePreview form={form} />
      </div>
    </div>
  );
}
