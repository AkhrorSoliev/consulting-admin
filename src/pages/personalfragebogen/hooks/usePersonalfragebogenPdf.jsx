import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import PersonalfragebogenPdfDocument from "../../contract/pdf/PersonalfragebogenPdfDocument";

export default function usePersonalfragebogenPdf(form) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fullName = [form.nachname, form.vorname].filter(Boolean).join(" ");
      const fileBase = fullName
        ? `Personalfragebogen ${fullName}`
        : "Personalfragebogen";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Personalfragebogen";
      const blob = await pdf(
        <PersonalfragebogenPdfDocument form={form} />
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
