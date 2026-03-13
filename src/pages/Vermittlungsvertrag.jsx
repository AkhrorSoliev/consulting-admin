import useVermittlungsvertragForm from "./vermittlungsvertrag/hooks/useVermittlungsvertragForm";
import TopBar from "./vermittlungsvertrag/components/TopBar";
import CandidateInfoSection from "./vermittlungsvertrag/components/CandidateInfoSection";
import ContractDetailsSection from "./vermittlungsvertrag/components/ContractDetailsSection";
import VermittlungsvertragLivePreview from "./contract/components/vermittlungsvertragPreview";

const layoutClass =
  "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
const formCard =
  "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

export default function Vermittlungsvertrag() {
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
  } = useVermittlungsvertragForm();

  return (
    <div className="p-2 min-h-screen">
      <TopBar
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
            <h2 className="card-title text-2xl font-bold">
              Vermittlungsvertrag ausfüllen
            </h2>
            <p className="text-sm opacity-70">
              Füllen Sie die erforderlichen Felder aus:{" "}
              <span className="font-semibold">Name</span>,{" "}
              <span className="font-semibold">Bewerberdaten</span>,{" "}
              <span className="font-semibold">Datum</span>.
            </p>

            <CandidateInfoSection form={form} setForm={setForm} />
            <ContractDetailsSection form={form} setForm={setForm} />
          </div>
        </section>

        <VermittlungsvertragLivePreview form={form} />
      </div>
    </div>
  );
}
