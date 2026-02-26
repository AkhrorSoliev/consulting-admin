export default function RemoteModeSection({
  visible,
  restoreBusy,
  remoteLoading,
  remoteRecord,
  onBack,
  onRestore,
}) {
  if (!visible) return null;

  return (
    <div className="mt-6">
      <div className="card bg-base-100 border border-base-300 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Kandidatenstufen</h3>
          <p className="text-sm text-base-content/70">
            Um E-Mails senden zu können, müssen Sie den Kandidaten zuerst in den
            passenden Bereich (Collection/Major){" "}
            <span className="font-semibold">wiederherstellen</span>.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onBack}
              disabled={restoreBusy}
            >
              Zurück
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRestore}
              disabled={restoreBusy || remoteLoading || !remoteRecord}
            >
              {restoreBusy ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              In Bereich (Major) wiederherstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
