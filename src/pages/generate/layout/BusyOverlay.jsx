export default function BusyOverlay({ show, label }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
        <span className="loading loading-spinner loading-md text-primary" />
        <div className="text-sm font-medium">{label || "Bitte warten..."}</div>
      </div>
    </div>
  );
}
