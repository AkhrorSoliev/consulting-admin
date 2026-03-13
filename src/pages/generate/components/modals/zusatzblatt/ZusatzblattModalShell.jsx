import { FaDownload } from "react-icons/fa";

/**
 * Shared modal chrome for all Zusatzblatt modals.
 * Renders backdrop, header with title/subtitle/PDF button, and scrollable body.
 */
export default function ZusatzblattModalShell({
  title,
  subtitle = "Kandidat ma'lumotlari bilan to'ldirilgan forma",
  isDownloading,
  onDownload,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 flex flex-col max-h-[90vh]">
          <div className="p-4 sm:p-6 border-b border-base-300 flex items-start justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm opacity-70">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={onDownload}
                disabled={isDownloading}
              >
                <FaDownload />
                {isDownloading ? "Wird erstellt..." : "PDF"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
