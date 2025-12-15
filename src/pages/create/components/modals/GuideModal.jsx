export default function GuideModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-4xl mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <div className="bg-base-100 text-base-content rounded-box shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
            <h3 id="guide-title" className="text-lg md:text-xl font-semibold">
              Video-Guide: Formular ausfüllen
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
          <div className="p-4 bg-base-200/40">
            <div className="w-full aspect-video rounded-box overflow-hidden border border-base-300">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/sx3I8o5yJA4?si=VcZUufcpOgByVRwX"
                title="Video-Guide"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


