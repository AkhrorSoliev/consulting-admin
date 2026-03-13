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
        className="relative w-full max-w-md rounded-box bg-base-100 text-base-content shadow-xl border border-base-300"
        role="dialog"
        aria-modal="true"
        aria-label="Leadni o'chirish"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-base-300 flex items-center justify-between gap-3">
          <div className="font-semibold">Leadni o'chirish</div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
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
              onClose();
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
