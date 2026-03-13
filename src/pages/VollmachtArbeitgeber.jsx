import { useSelector } from "react-redux";
import useUserRole from "../hooks/useUserRole";
import useVollmachtTemplate from "./vollmacht-arbeitgeber/hooks/useVollmachtTemplate";
import useFormHandlers from "./vollmacht-arbeitgeber/hooks/useFormHandlers";
import ActionBar from "./vollmacht-arbeitgeber/components/ActionBar";
import CandidateForm from "./vollmacht-arbeitgeber/components/CandidateForm";
import EmployerForm from "./vollmacht-arbeitgeber/components/EmployerForm";
import VollmachtArbeitgeberLivePreview from "./contract/components/vollmachtArbeitgeberPreview";

const layoutClass =
  "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
const formCard =
  "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

export default function VollmachtArbeitgeber() {
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

  const {
    isDownloading,
    handleFieldChange,
    handleOmitToggle,
    handleDownloadPdf,
  } = useFormHandlers({ form, setForm });

  return (
    <div className="p-2 min-h-screen">
      {/* Fixed action bar under the global navbar (hidden on print) */}
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
        <section className={formCard}>
          <div className="card-body space-y-4">
            <h2 className="card-title text-2xl font-bold">
              Vollmacht an Arbeitgeber ausfüllen
            </h2>
            <p className="text-sm opacity-70">
              Füllen Sie alle erforderlichen Felder für die Vollmacht nach § 81a
              Abs. 1 AufenthG aus.
            </p>

            <CandidateForm
              form={form}
              onFieldChange={handleFieldChange}
              onOmitToggle={handleOmitToggle}
            />

            <EmployerForm
              form={form}
              onFieldChange={handleFieldChange}
              onOmitToggle={handleOmitToggle}
            />

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Tipp</div>
              <div className="opacity-70">
                Wenn Felder leer bleiben, werden in der Vollmacht
                Platzhalter‑Linien angezeigt.
              </div>
            </div>
          </div>
        </section>

        <VollmachtArbeitgeberLivePreview form={form} />
      </div>
    </div>
  );
}
