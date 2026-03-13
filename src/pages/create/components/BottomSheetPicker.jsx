/**
 * Generic reusable bottom-sheet picker for mobile.
 * Renders a slide-up sheet with a title, optional subtitle,
 * and a scrollable list of options.
 *
 * Props:
 *   open       – whether the sheet is visible
 *   onClose    – callback to dismiss
 *   title      – sheet header text
 *   subtitle   – small label below the title
 *   items      – array of { value, label }
 *   selected   – currently selected value (for highlighting)
 *   onSelect   – (value) => void
 */
export default function BottomSheetPicker({
  open,
  onClose,
  title,
  subtitle,
  items,
  selected,
  onSelect,
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
        {/* Handle bar */}
        <div className="shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1 bg-base-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 pb-3 border-b border-base-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">{title}</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Schließen"
            >
              &#x2715;
            </button>
          </div>
          {subtitle && (
            <p className="text-sm text-center text-base-content/60">
              {subtitle}
            </p>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-3 space-y-1">
            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelect(item.value)}
                className={`
                  w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                  active:scale-98
                  ${
                    selected === item.value
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-200 active:bg-base-300"
                  }
                `}
              >
                {item.label}
                {selected === item.value && (
                  <span className="float-right">&#x2713;</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
