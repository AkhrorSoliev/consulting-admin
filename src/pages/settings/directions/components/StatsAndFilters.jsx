export function StatsCards({ total, activeCount, deletedCount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="stat bg-base-200/50 rounded-box border border-base-300">
        <div className="stat-title">Gesamt Richtungen</div>
        <div className="stat-value text-primary">{total}</div>
      </div>
      <div className="stat bg-base-200/50 rounded-box border border-base-300">
        <div className="stat-title">Aktiv</div>
        <div className="stat-value text-success">{activeCount}</div>
      </div>
      <div className="stat bg-base-200/50 rounded-box border border-base-300">
        <div className="stat-title">Gelöscht</div>
        <div className="stat-value text-warning">{deletedCount}</div>
      </div>
    </div>
  );
}

export function FilterTabs({
  filter,
  setFilter,
  total,
  activeCount,
  deletedCount,
}) {
  return (
    <div className="tabs tabs-boxed bg-base-200">
      <button
        className={`tab ${filter === "all" ? "tab-active" : ""}`}
        onClick={() => setFilter("all")}
      >
        Alle ({total})
      </button>
      <button
        className={`tab ${filter === "active" ? "tab-active" : ""}`}
        onClick={() => setFilter("active")}
      >
        Aktiv ({activeCount})
      </button>
      <button
        className={`tab ${filter === "deleted" ? "tab-active" : ""}`}
        onClick={() => setFilter("deleted")}
      >
        Gelöscht ({deletedCount})
      </button>
    </div>
  );
}
