export default function KpiCards({ kindLabel, kind, totalUsers, totalCollections, avgAge, diplomaStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stat bg-base-100 shadow rounded-box border border-base-200">
        <div className="stat-title">Nutzer Gesamt ({kindLabel})</div>
        <div className="stat-value text-primary">{totalUsers}</div>
        <div className="stat-desc">
          {kind === "allTime"
            ? "Historische Summe (wird bei Löschung nicht reduziert)"
            : "Aktueller Stand (wird bei Löschung reduziert)"}
        </div>
      </div>

      <div className="stat bg-base-100 shadow rounded-box border border-base-200">
        <div className="stat-title">Sammlungen ({kindLabel})</div>
        <div className="stat-value text-secondary">{totalCollections}</div>
        <div className="stat-desc">
          {kind === "allTime" ? "Historische Liste" : "Aktive Kategorien"}
        </div>
      </div>

      <div className="stat bg-base-100 shadow rounded-box border border-base-200">
        <div className="stat-title">Ø Alter ({kindLabel})</div>
        <div className="stat-value text-accent">{avgAge ?? "-"}</div>
        <div className="stat-desc">Jahre</div>
      </div>

      <div className="stat bg-base-100 shadow rounded-box border border-base-200">
        <div className="stat-title">Mit Diplom ({kindLabel})</div>
        <div className="stat-value text-info">{diplomaStats.has}</div>
        <div className="stat-desc">
          ({totalUsers > 0 ? ((diplomaStats.has / totalUsers) * 100).toFixed(0) : 0}%)
        </div>
      </div>
    </div>
  );
}
