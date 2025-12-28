export default function ExistingPassportModal({
  open,
  onClose,
  onAcknowledge,
  enteredPassport,
  existingMajor,
}) {
  if (!open) return null;

  const handleAcknowledge = () => {
    if (typeof onAcknowledge === "function") {
      onAcknowledge();
      return;
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4" role="dialog" aria-modal="true">
        <div className="bg-base-100 text-base-content rounded-box shadow-xl p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-xl font-bold text-error">Achtung!</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Modalni yopish"
            >
              ✕
            </button>
          </div>
          <p className="mb-6 text-center">
            Sie haben sich mit der Passnummer <strong>{enteredPassport}</strong>{" "}
            bereits für den Bereich <strong>„{existingMajor}"</strong> beworben.
          </p>
          <button className="btn btn-primary w-full" onClick={handleAcknowledge}>
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}





