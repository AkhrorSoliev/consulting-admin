import TagInput from "./TagInput";

function SkillsSection({
  softSkills,
  pcSkills,
  onAddSoft,
  onRemoveSoft,
  onAddPc,
  onRemovePc,
  onAutoAddSoft,
  onAutoAddPc,
  isGeneratingSoft,
  isGeneratingPc,
  recentlyAddedSoft = [],
  recentlyAddedPc = [],
}) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <label className="label">
          <span className="label-text">Soziale Kompetenzen</span>
        </label>
        <TagInput
          tags={softSkills}
          placeholder="Zum Beispiel: Teamarbeit, Kommunikation ..."
          onAdd={onAddSoft}
          onRemove={onRemoveSoft}
          hideInput={true}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onAutoAddSoft}
            disabled={isGeneratingSoft}
          >
            {isGeneratingSoft ? "Wird generiert..." : "+ Fähigkeit hinzufügen"}
          </button>
          {recentlyAddedSoft?.length ? (
            <span className="text-xs text-success">
              Hinzugefügt: {recentlyAddedSoft.join(", ")}
            </span>
          ) : null}
        </div>
      </div>
      <div>
        <label className="label">
          <span className="label-text">Computerkenntnisse (PC Skills)</span>
        </label>
        <TagInput
          tags={pcSkills}
          placeholder="Zum Beispiel: Word, Excel, PowerPoint ..."
          onAdd={onAddPc}
          onRemove={onRemovePc}
          hideInput={true}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onAutoAddPc}
            disabled={isGeneratingPc}
          >
            {isGeneratingPc ? "Wird generiert..." : "+ Fähigkeit hinzufügen"}
          </button>
          {recentlyAddedPc?.length ? (
            <span className="text-xs text-success">
              Hinzugefügt: {recentlyAddedPc.join(", ")}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SkillsSection;


