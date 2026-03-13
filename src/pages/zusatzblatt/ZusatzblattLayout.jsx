import ZusatzblattToolbar from "./ZusatzblattToolbar";

const FORM_CARD =
  "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto";

export default function ZusatzblattLayout({
  title,
  subtitle,
  toolbarTitle,
  hookData,
  children,
}) {
  const {
    canManageDefaults,
    isSavingDefaults,
    isClearingDefaults,
    isDownloading,
    hasDefaults,
    handleSaveAsDefaults,
    handleClearDefaults,
    handleDownloadPdf,
  } = hookData;

  return (
    <div className="p-2 min-h-screen">
      <ZusatzblattToolbar
        title={toolbarTitle}
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
        <section className={FORM_CARD}>
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">{title}</h2>
              <p className="text-sm opacity-70 mt-1">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
