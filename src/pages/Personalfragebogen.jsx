import PersonalfragebogenLivePreview from "./contract/components/PersonalfragebogenLivePreview";
import usePersonalfragebogenTemplate from "./personalfragebogen/hooks/usePersonalfragebogenTemplate";
import usePersonalfragebogenPdf from "./personalfragebogen/hooks/usePersonalfragebogenPdf";
import ActionBar from "./personalfragebogen/components/ActionBar";
import PersonalDataSection from "./personalfragebogen/components/PersonalDataSection";
import AdditionalSections from "./personalfragebogen/components/AdditionalSections";
import { LAYOUT_CLASS, FORM_CARD_CLASS } from "./personalfragebogen/utils/constants";

export default function Personalfragebogen() {
  const {
    form,
    setForm,
    isLoadingTemplate,
    isSavingTemplate,
    hasUnsavedTemplate,
    canWriteTemplate,
    saveTemplate,
  } = usePersonalfragebogenTemplate();

  const { isDownloading, handleDownloadPdf } = usePersonalfragebogenPdf(form);

  return (
    <div className="p-2 min-h-screen">
      {/* Fixed action bar under the global navbar (hidden on print) */}
      <ActionBar
        isLoadingTemplate={isLoadingTemplate}
        isSavingTemplate={isSavingTemplate}
        hasUnsavedTemplate={hasUnsavedTemplate}
        canWriteTemplate={canWriteTemplate}
        saveTemplate={saveTemplate}
        isDownloading={isDownloading}
        handleDownloadPdf={handleDownloadPdf}
      />

      <div className={LAYOUT_CLASS}>
        <section className={FORM_CARD_CLASS}>
          <div className="card-body space-y-4 grow-0">
            <h2 className="card-title text-2xl font-bold">
              Personalfragebogen
            </h2>
            <p className="text-sm opacity-70">
              Ishchi haqidagi ma'lumotnoma. Generate sahifasida kandidat ma'lumotlari avtomatik to'ldiriladi.
            </p>

            <PersonalDataSection form={form} setForm={setForm} />
            <AdditionalSections form={form} setForm={setForm} />
          </div>
        </section>

        <PersonalfragebogenLivePreview form={form} />
      </div>
    </div>
  );
}
