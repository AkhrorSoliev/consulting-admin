export default function ExistingEmailModal({
  open,
  onClose,
  enteredEmail,
  existingMajor,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4" role="dialog" aria-modal="true">
        <div className="bg-base-100 text-base-content rounded-box shadow-xl p-6 text-center">
          <h3 className="text-xl font-bold text-error mb-4">Achtung!</h3>
          <p className="mb-6">
            Sie haben sich mit der E-Mail-Adresse <strong>{enteredEmail}</strong>{" "}
            bereits für den Bereich <strong>„{existingMajor}“</strong> beworben.
          </p>
          <button className="btn btn-primary w-full" onClick={onClose}>
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}


