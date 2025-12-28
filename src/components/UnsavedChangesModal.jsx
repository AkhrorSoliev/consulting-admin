export default function UnsavedChangesModal({
  open,
  title = "Saqlanmagan o‘zgarishlar",
  message = "",
  stayText = "Qolish",
  leaveText = "Davom etish",
  onStay,
  onLeave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div className="absolute inset-0 bg-base-content/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              {message ? (
                <p className="text-sm opacity-70 mt-1">{message}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onStay}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn" onClick={onStay}>
              {stayText}
            </button>
            <button type="button" className="btn btn-primary" onClick={onLeave}>
              {leaveText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


