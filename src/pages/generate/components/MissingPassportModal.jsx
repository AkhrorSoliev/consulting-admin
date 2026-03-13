export default function MissingPassportModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold">Reisepass topilmadi</h3>
        <p className="text-sm text-base-content/70">
          Reisepass hujjati topilmadi. Shunga qaramay Beratungsvertrag ni
          passport sahifasisiz davom ettirishni xohlaysizmi?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Yo&apos;q, bekor qilish
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Ha, davom etish
          </button>
        </div>
      </div>
    </div>
  );
}
