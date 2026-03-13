import useErklaerungForm from "./erklaerungBeschaeftigung/hooks/useErklaerungForm";
import HeaderBar from "./erklaerungBeschaeftigung/components/HeaderBar";
import FormSectionsTop from "./erklaerungBeschaeftigung/components/FormSectionsTop";
import FormSectionsBottom from "./erklaerungBeschaeftigung/components/FormSectionsBottom";

export default function ErklaerungBeschaeftigung() {
  const {
    form,
    updateField,
    isDownloading,
    isSavingDefaults,
    isClearingDefaults,
    hasDefaults,
    canManageDefaults,
    handleSaveAsDefaults,
    handleClearDefaults,
    handleDownloadPdf,
  } = useErklaerungForm();

  return (
    <div className="p-2 min-h-screen">
      <HeaderBar
        canManageDefaults={canManageDefaults}
        hasDefaults={hasDefaults}
        isSavingDefaults={isSavingDefaults}
        isClearingDefaults={isClearingDefaults}
        isDownloading={isDownloading}
        onSaveDefaults={handleSaveAsDefaults}
        onClearDefaults={handleClearDefaults}
        onDownloadPdf={handleDownloadPdf}
      />

      <div className="pt-16">
        <section className="card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto">
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">
                Erklärung zum Beschäftigungsverhältnis
              </h2>
              <p className="text-sm opacity-70 mt-1">{"Fillable PDF formasi. Ma'lumotlarni to'ldiring va PDF yuklab oling."}</p>
            </div>

            <FormSectionsTop form={form} updateField={updateField} />
            <FormSectionsBottom form={form} updateField={updateField} />

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Eslatma</div>
              <div className="opacity-70">{"Bu forma Germaniya mehnat agentligi uchun to'ldiriladigan rasmiy hujjat. Ma'lumotlarni to'ldiring va PDF yuklab oling."}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
