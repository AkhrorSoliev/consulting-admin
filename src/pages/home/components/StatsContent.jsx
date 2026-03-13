import StatsSection from "../../StatsSection";

export default function StatsContent({
  loading,
  error,
  statsError,
  liveStats,
  allTimeStats,
  collectionNames,
}) {
  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || statsError) {
    return (
      <div role="alert" className="alert alert-error max-w-lg mx-auto">
        <span>{error || statsError}</span>
      </div>
    );
  }

  if (!liveStats && !allTimeStats) {
    return (
      <div className="text-center py-24 opacity-70">
        <h3 className="text-xl font-medium">Keine Statistiken gefunden</h3>
        <p className="mt-2">
          Statistikdokumente wurden noch nicht erstellt. Sie werden
          automatisch erstellt, wenn neue Kandidaten hinzugefügt werden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="collapse collapse-arrow bg-base-100 shadow border border-base-200">
        <input type="checkbox" defaultChecked={true} />
        <div className="collapse-title text-xl font-semibold">
          Aktuelle Statistik (LIVE)
          <div className="text-sm font-normal opacity-70 mt-1">
            Aktueller Datenbankstand. Wird bei Löschung reduziert.
          </div>
        </div>
        <div className="collapse-content">
          <div className="pt-2">
            {!liveStats ? (
              <div className="text-center py-10 opacity-70">
                <h3 className="text-xl font-medium">
                  Keine Live-Statistik verfügbar
                </h3>
                <p className="mt-2">
                  Keine Daten nach Berufsfeldern gefunden.
                </p>
              </div>
            ) : (
              <StatsSection
                title=""
                subtitle=""
                statsDoc={liveStats}
                collectionNames={collectionNames}
                kind="live"
              />
            )}
          </div>
        </div>
      </div>

      <div className="collapse collapse-arrow bg-base-100 shadow border border-base-200">
        <input type="checkbox" defaultChecked={false} />
        <div className="collapse-title text-xl font-semibold">
          Gesamtstatistik (HISTORISCH)
          <div className="text-sm font-normal opacity-70 mt-1">
            Historisch gesammelt. Wird bei Löschung nicht reduziert.
          </div>
        </div>
        <div className="collapse-content">
          <div className="pt-2">
            {!allTimeStats ? (
              <div className="text-center py-10 opacity-70">
                <h3 className="text-xl font-medium">
                  Keine Gesamtstatistik verfügbar (stats/global)
                </h3>
                <p className="mt-2">
                  Wird automatisch erstellt, wenn neue Kandidaten
                  hinzugefügt werden.
                </p>
              </div>
            ) : (
              <StatsSection
                title=""
                subtitle=""
                statsDoc={allTimeStats}
                collectionNames={collectionNames}
                kind="allTime"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
