const MARITAL_STATUSES = ["ledig", "verheiratet", "geschieden", "verwitwet"];

export default function MobileMaritalStatusPicker({
  open,
  value,
  onSelect,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1 bg-base-300 rounded-full" />
        </div>

        <div className="shrink-0 px-4 pb-3 border-b border-base-200">
          <h3 className="font-bold text-lg text-center">Familienstand</h3>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-3 space-y-1">
            {MARITAL_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onSelect?.(status)}
                className={[
                  "w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium active:scale-98",
                  value === status
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200 active:bg-base-300",
                ].join(" ")}
              >
                {status}
                {value === status && <span className="float-right">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
