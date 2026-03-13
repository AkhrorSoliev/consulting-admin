import useUserRole from "../hooks/useUserRole";
import useZusatzblattDForm from "./zusatzblattD/hooks/useZusatzblattDForm";
import Toolbar from "./zusatzblattD/components/Toolbar";
import SectionA from "./zusatzblattD/components/SectionA";
import SectionB from "./zusatzblattD/components/SectionB";
import SectionC from "./zusatzblattD/components/SectionC";

const formCard =
  "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto";

export default function ZusatzblattD() {
  const { role } = useUserRole();
  const canManageDefaults = role === "super_admin" || role === "admin";

  const {
    form,
    setForm,
    isDownloading,
    isSavingDefaults,
    isClearingDefaults,
    hasDefaults,
    handleSaveAsDefaults,
    handleClearDefaults,
    handleDownloadPdf,
  } = useZusatzblattDForm();

  return (
    <div className="p-2 min-h-screen">
      <Toolbar
        canManageDefaults={canManageDefaults}
        isSavingDefaults={isSavingDefaults}
        isClearingDefaults={isClearingDefaults}
        isDownloading={isDownloading}
        hasDefaults={hasDefaults}
        onSaveDefaults={handleSaveAsDefaults}
        onClearDefaults={handleClearDefaults}
        onDownloadPdf={handleDownloadPdf}
      />

      <div className="pt-16">
        <section className={formCard}>
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">
                Zusatzblatt D - Kurzfristige Beschäftigung
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Zusatzblatt für kurzfristige Beschäftigung (bis zu 90 Tage / 8 Monate)
              </p>
            </div>

            <SectionA form={form} setForm={setForm} />
            <SectionB form={form} setForm={setForm} />
            <SectionC form={form} setForm={setForm} />
          </div>
        </section>
      </div>
    </div>
  );
}
