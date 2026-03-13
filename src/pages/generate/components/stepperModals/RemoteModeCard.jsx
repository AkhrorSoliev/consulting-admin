export default function RemoteModeCard({
  navigate,
  restoreBusy,
  restoreFromRemoteMode,
  remoteLoading,
  remoteRecord,
}) {
  return (
    <div className="mt-6">
      <div className="card bg-base-100 border border-base-300 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Kandidatenstufen</h3>
          <p className="text-sm text-base-content/70">
            Um E-Mails senden zu k&ouml;nnen, m&uuml;ssen Sie den Kandidaten zuerst in
            den passenden Bereich (Collection/Major){" "}
            <span className="font-semibold">wiederherstellen</span>.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              disabled={restoreBusy}
            >
              Zur&uuml;ck
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={restoreFromRemoteMode}
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
