export default function DecisionCards({ decision, setDecision }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label
        className={`card border transition cursor-pointer ${
          decision === "accepted"
            ? "border-success bg-success/5"
            : "border-base-300 hover:border-success/60"
        }`}
      >
        <div className="card-body p-4 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="stage-decision"
              className="radio radio-success"
              value="accepted"
              checked={decision === "accepted"}
              onChange={() => setDecision?.("accepted")}
            />
            <div className="font-semibold">Annehmen</div>
          </div>
          <p className="text-sm opacity-70">
            Positive E-Mail wird gesendet und zur nächsten Stufe
            übergegangen.
          </p>
        </div>
      </label>

      <label
        className={`card border transition cursor-pointer ${
          decision === "rejected"
            ? "border-error bg-error/5"
            : "border-base-300 hover:border-error/60"
        }`}
      >
        <div className="card-body p-4 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="stage-decision"
              className="radio radio-error"
              value="rejected"
              checked={decision === "rejected"}
              onChange={() => setDecision?.("rejected")}
            />
            <div className="font-semibold">Ablehnen</div>
          </div>
          <p className="text-sm opacity-70">
            Ablehnungs-E-Mail wird gesendet. Es wird nicht zur
            nächsten Stufe übergegangen.
          </p>
        </div>
      </label>
    </div>
  );
}
