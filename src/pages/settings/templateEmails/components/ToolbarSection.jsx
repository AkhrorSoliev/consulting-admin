import { STAGES, DECISIONS, formatUpdatedAt } from "../constants";

export default function ToolbarSection({
  stage,
  setStage,
  decision,
  setDecision,
  saving,
  loading,
  activeTemplate,
  isDirty,
  onLoadDefaults,
  onSave,
}) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">
            E-Mail-Vorlagen
          </h2>
          <p className="text-sm text-base-content/60">
            Passen Sie Texte für Status-E-Mails pro Stufe/Entscheidung an.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
          {activeTemplate ? (
            <span className="badge badge-primary badge-outline">
              Überschreibung aktiv
            </span>
          ) : (
            <span className="badge badge-ghost">Standard aktiv</span>
          )}
          {isDirty && (
            <span className="badge badge-warning badge-outline">
              Ungespeicherte Änderungen
            </span>
          )}
        </div>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col md:flex-row gap-3 md:items-end min-w-0">
            <label className="form-control w-full md:w-56">
              <div className="label py-0">
                <span className="label-text text-sm font-medium">Stufe</span>
              </div>
              <select
                className="select select-bordered w-full"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                disabled={saving}
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control w-full md:w-56">
              <div className="label py-0">
                <span className="label-text text-sm font-medium">
                  Entscheidung
                </span>
              </div>
              <select
                className="select select-bordered w-full"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={saving}
              >
                {DECISIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="text-xs text-base-content/60 md:pb-1 min-w-0">
              {activeTemplate?.updatedAt ? (
                <div className="truncate">
                  Letzte Änderung:{" "}
                  <span className="font-medium">
                    {formatUpdatedAt(activeTemplate.updatedAt)}
                  </span>
                  {activeTemplate?.updatedBy ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-mono">
                        {String(activeTemplate.updatedBy)}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="truncate">
                  Keine gespeicherte Überschreibung für diese Kombination.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              className="btn btn-outline w-full sm:w-auto"
              onClick={onLoadDefaults}
              disabled={saving || loading}
              title="Lädt Standardtexte in das Formular (ohne zu speichern)."
            >
              Standard laden
            </button>

            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto"
              onClick={onSave}
              disabled={saving || loading || !isDirty}
              title={
                isDirty
                  ? "Speichert diese Vorlage."
                  : "Keine Änderungen zum Speichern."
              }
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Wird gespeichert...
                </>
              ) : (
                "Speichern"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
