import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import useUserRole from "../hooks/useUserRole";
import ContractActionBar from "./contract/components/ContractActionBar";
import ContractFormFields from "./contract/components/ContractFormFields";
import ContractFormPricing from "./contract/components/ContractFormPricing";
import ContractLivePreview from "./contract/components/ContractLivePreview";
import BeratungsvertragPdfDocument from "./contract/pdf/BeratungsvertragPdfDocument";
import useContractTemplate from "./contract/hooks/useContractTemplate";

function todayDdMmYyyy() {
  try {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

export default function Contract() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => ({
    firstName: "",
    lastName: "",
    contractDate: todayDdMmYyyy(),
    candidateCity: "",
    pdfGeneratedDate: todayDdMmYyyy(),
    feeTotalEur: "1200",
    feeAdvanceEur: "250",
    signatureCity: "",
    pdfUrl: "",
  }));
  const [isDownloading, setIsDownloading] = useState(false);
  const [passportImageDataUrl, setPassportImageDataUrl] = useState(null);

  const { isLoadingTemplate, isSavingTemplate, hasUnsavedTemplate, saveTemplate } =
    useContractTemplate({ form, setForm, canWriteTemplate, user });

  const clientFullName = useMemo(() => {
    const a = String(form.firstName || "").trim();
    const b = String(form.lastName || "").trim();
    return [a, b].filter(Boolean).join(" ").trim();
  }, [form.firstName, form.lastName]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = clientFullName
        ? `Beratungsvertrag ${clientFullName}`
        : "Beratungsvertrag";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Beratungsvertrag";
      const blob = await pdf(
        <BeratungsvertragPdfDocument
          form={form}
          passportImageDataUrl={passportImageDataUrl}
        />
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
      <ContractActionBar
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
          <div className="card-body space-y-4">
            <h2 className="card-title text-2xl font-bold">Vertrag ausfüllen</h2>
            <p className="text-sm opacity-70">
              Nur die wichtigsten Felder:{" "}
              <span className="font-semibold">Name</span>,{" "}
              <span className="font-semibold">Nachname</span>,{" "}
              <span className="font-semibold">Datum</span>. Vorschau
              aktualisiert sofort.
            </p>

            <ContractFormFields form={form} setForm={setForm} />
            <ContractFormPricing form={form} setForm={setForm} />
          </div>
        </section>

        <ContractLivePreview
          form={form}
          pdfUrl={form.pdfUrl}
          onPassportPreviewReady={setPassportImageDataUrl}
        />
      </div>
    </div>
  );
}
