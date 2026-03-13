export default function MobileBottomSheet({
  options,
  selected,
  toggleOption,
  close,
  mobileCloseBtnRef,
  error,
}) {
  return (
    <div
      className="fixed inset-0 z-[999] bg-base-content/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="F\u00FChrerschein-Klassen"
    >
      <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-base-100 rounded-t-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
          <div className="text-base font-semibold">F\u00FChrerschein-Klassen</div>
          <button
            ref={mobileCloseBtnRef}
            type="button"
            className="btn btn-ghost btn-square min-h-11 h-11 w-11"
            aria-label="Schlie\u00DFen"
            onClick={() => close()}
          >
            \u2715
          </button>
        </div>

        <div className="px-4 py-3 overflow-auto overscroll-contain">
          <div className="space-y-2">
            {options.map((opt) => {
              const upper = String(opt || "").trim().toUpperCase();
              const checked = selected.includes(upper);
              return (
                <label
                  key={opt}
                  className="flex items-center justify-between gap-3 rounded-xl border border-base-200 px-4 min-h-11 py-3 cursor-pointer select-none"
                >
                  <span className="font-medium">{upper}</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={checked}
                    onChange={() => toggleOption(opt)}
                    aria-label={`${upper} ausw\u00E4hlen`}
                  />
                </label>
              );
            })}
          </div>
          {error ? (
            <p className="text-error text-sm mt-3">{error}</p>
          ) : null}
        </div>

        <div className="sticky bottom-0 bg-base-100 border-t border-base-200 p-4">
          <button
            type="button"
            className="btn btn-primary w-full min-h-11"
            onClick={() => close()}
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
