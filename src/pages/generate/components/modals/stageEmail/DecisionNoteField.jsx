export default function DecisionNoteField({ decision, decisionNote, setDecisionNote }) {
  if (typeof setDecisionNote !== "function") return null;
  const rejected = decision === "rejected";
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm font-medium">
          {rejected
            ? "Izoh (rad etish sababi — ixtiyoriy)"
            : "Qo'shimcha izoh (ixtiyoriy)"}
        </span>
      </label>
      <textarea
        className="textarea textarea-bordered textarea-sm w-full"
        rows={2}
        placeholder={
          rejected
            ? "Nima uchun rad etildi? (kandidatga va arxivga yoziladi)"
            : "Admin izohi — kandidatga va arxivga yoziladi"
        }
        value={decisionNote || ""}
        onChange={(e) => setDecisionNote(e.target.value)}
        maxLength={500}
      />
    </div>
  );
}
