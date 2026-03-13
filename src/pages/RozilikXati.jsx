import { useSelector } from "react-redux";
import useUserRole from "../hooks/useUserRole";
import useRozilikXatiTemplate from "./rozilikXati/hooks/useRozilikXatiTemplate";
import useRozilikXatiPdf from "./rozilikXati/hooks/useRozilikXatiPdf";
import RozilikXatiActionBar from "./rozilikXati/components/RozilikXatiActionBar";
import RozilikXatiForm from "./rozilikXati/components/RozilikXatiForm";
import RozilikXatiLivePreview from "./contract/components/RozilikXatiLivePreview";

export default function RozilikXati() {
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
  } = useRozilikXatiTemplate({ canWriteTemplate, user });

  const { isDownloading, handleDownloadPdf } = useRozilikXatiPdf(form);

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
  const formCard =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  return (
    <div className="p-2 min-h-screen">
      {/* Fixed action bar under the global navbar (hidden on print) */}
      <RozilikXatiActionBar
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
          <RozilikXatiForm form={form} setForm={setForm} />
        </section>

        <RozilikXatiLivePreview form={form} />
      </div>
    </div>
  );
}
