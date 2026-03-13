export default function DeleteLeadDialog({
  deleteLead,
  isSavingLeads,
  onClose,
  onConfirm,
}) {
  if (!deleteLead?.id) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-base-content/50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-base-100 text-base-content shadow-2xl border border-base-300/50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Leadni o'chirish"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="bg-neutral text-neutral-content px-4 py-3 rounded-t-box flex items-center justify-between gap-3">
          <h3 className="font-semibold">Leadni o'chirish</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-neutral-content hover:bg-neutral-content/10"
            onClick={onClose}
            disabled={isSavingLeads}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-sm opacity-80">
            Rostdan ham{" "}
            <span className="font-semibold">{deleteLead?.name}</span>{" "}
            leadini o'chirmoqchimisiz?
          </div>
          <div className="text-xs opacity-60">
            Bu amal qaytarib bo'lmaydi.
          </div>
        </div>
        <div className="p-4 border-t border-base-300 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isSavingLeads}
          >
            Bekor qilish
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={async () => {
              const id = deleteLead?.id;
              if (!id) return;
              await onConfirm(id);
            }}
            disabled={isSavingLeads}
          >
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
