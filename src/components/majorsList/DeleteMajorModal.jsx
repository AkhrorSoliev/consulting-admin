export default function DeleteMajorModal({
  deleteMajorModal,
  setDeleteMajorModal,
  onDelete,
}) {
  if (!deleteMajorModal.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-base-content/50"
        onClick={() => {
          if (!deleteMajorModal.deleting) {
            setDeleteMajorModal({
              open: false,
              major: null,
              deleting: false,
            });
          }
        }}
      />
      <div className="relative bg-base-100 rounded-box shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-error mb-4">
          Yo'nalishni o'chirish
        </h3>
        <p className="text-sm mb-2">
          <span className="font-semibold">
            {deleteMajorModal.major?.title ||
              deleteMajorModal.major?.collectionName ||
              "Yo'nalish"}
          </span>{" "}
          yo'nalishini o'chirmoqchimisiz?
        </p>
        <p className="text-xs text-error mb-4">
          Diqqat: Bu yo'nalish va uning ichidagi barcha kandidatlar butunlay
          o'chiriladi! Bu amalni qaytarib bo'lmaydi.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setDeleteMajorModal({
                open: false,
                major: null,
                deleting: false,
              })
            }
            disabled={deleteMajorModal.deleting}
          >
            Bekor qilish
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={onDelete}
            disabled={deleteMajorModal.deleting}
          >
            {deleteMajorModal.deleting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                O'chirilmoqda...
              </>
            ) : (
              "O'chirish"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
