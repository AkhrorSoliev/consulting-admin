export default function PhotoModal({ open, src, onClose }) {
  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Foto ko&apos;rinishi</h3>
              <p className="text-sm opacity-70">
                Live Preview dagi rasmni kattalashtirilgan holda ko&apos;rish.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>
          <div className="bg-base-200 rounded-lg border border-base-300 p-2 sm:p-3 max-h-[80vh] overflow-auto">
            <img
              src={src}
              alt="Foto"
              className="w-full max-h-[72vh] object-contain rounded-md bg-base-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


