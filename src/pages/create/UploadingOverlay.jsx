export default function UploadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/40 backdrop-blur-sm">
      <div className="card bg-base-100 shadow-2xl p-6 flex items-center gap-3" role="status" aria-live="polite">
        <span className="loading loading-spinner loading-lg text-primary" />
        <div className="text-sm font-medium">Wird hochgeladen...</div>
      </div>
    </div>
  );
}
