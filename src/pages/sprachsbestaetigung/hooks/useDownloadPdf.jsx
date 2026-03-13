import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import SprachsbestaetigungPdfDocument from "../../contract/pdf/SprachsbestaetigungPdfDocument";

export default function useDownloadPdf(form) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = form.kandidatName
        ? `Sprachsbestaetigung ${form.kandidatName}`
        : "Sprachsbestaetigung";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Sprachsbestaetigung";
      const blob = await pdf(
        <SprachsbestaetigungPdfDocument form={form} />
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

  return { isDownloading, handleDownloadPdf };
}
