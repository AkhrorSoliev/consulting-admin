import { formatMaskedBody } from "./phoneUtils";

export default function CountryBottomSheet({
  open,
  filtered,
  selected,
  body,
  query,
  setQuery,
  setSelected,
  setOpen,
  onChange,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
      onClick={() => {
        setOpen(false);
        setQuery("");
      }}
    >
      <div
        className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1 bg-base-300 rounded-full" />
        </div>

        {/* Header with search */}
        <div className="shrink-0 px-4 pb-3 border-b border-base-200">
          <h3 className="font-bold text-lg text-center mb-3">
            Davlat kodini tanlang
          </h3>
          <input
            className="input input-bordered w-full"
            placeholder="Qidirish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus={
              typeof window !== "undefined" && window.innerWidth >= 1024
            }
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-3 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm opacity-70 text-center">
                Keine Ergebnisse gefunden
              </div>
            ) : (
              filtered.map((c) => {
                const name = String(c?.deu || "").trim();
                const phone = String(c?.phone || "").trim();
                if (!name || !phone) return null;
                const isSelected =
                  selected?.phone === phone && selected?.deu === name;
                return (
                  <button
                    key={`${name}__${phone}`}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      const nextBody = body
                        ? ` ${formatMaskedBody(body, phone)}`
                        : "";
                      onChange?.(`${phone}${nextBody}`.trim());
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all
                      flex items-center gap-3
                      active:scale-98
                      ${
                        isSelected
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 active:bg-base-300"
                      }
                    `}
                  >
                    {c?.flagSvg ? (
                      <img
                        src={c.flagSvg}
                        alt=""
                        className="w-6 h-5 object-cover rounded-sm shrink-0"
                        loading="lazy"
                      />
                    ) : null}
                    <span className="flex-1 font-medium">{name}</span>
                    <span className="text-sm opacity-70 font-mono">
                      {phone}
                    </span>
                    {isSelected && <span className="ml-2">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
