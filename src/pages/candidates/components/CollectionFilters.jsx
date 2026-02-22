import { useMemo } from "react";
import CollapsibleSection from "../../../components/CollapsibleSection";
import { FILTER_DEFS } from "../constants/collectionFilterDefs";

function chipClass(active) {
  return active
    ? "btn btn-sm btn-primary gap-2"
    : "btn btn-sm btn-ghost gap-2 hover:bg-base-200";
}

function getOptionLabel(def, value) {
  return def.options.find((opt) => opt.value === value)?.label || value;
}

function FilterGroup({ def, value, onChange }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase text-base-content/60 block">
        {def.title}
      </span>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {def.options.map((opt) => (
          <button
            key={opt.value}
            className={`text-xs sm:text-sm ${chipClass(value === opt.value)}`}
            onClick={() => onChange(def.key, opt.value)}
            type="button"
          >
            {value === opt.value ? "●" : "○"} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CollectionFilters({
  searchQuery,
  setSearchQuery,
  filters,
  setFilter,
}) {
  const activeKeys = useMemo(
    () =>
      Object.keys(filters).filter(
        (key) => String(filters[key] || "all").trim() !== "all",
      ),
    [filters],
  );

  const hasActiveFilters = activeKeys.length > 0 || Boolean(searchQuery.trim());
  const activeFilterCount = activeKeys.length + (searchQuery.trim() ? 1 : 0);

  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (searchQuery.trim()) {
      badges.push({
        key: "search",
        label: `Suche: ${searchQuery.trim()}`,
        onClear: () => setSearchQuery(""),
      });
    }

    FILTER_DEFS.forEach((def) => {
      const currentValue = String(filters[def.key] || "all").trim();
      if (currentValue === "all") return;
      badges.push({
        key: def.key,
        label: `${def.badgeLabel}: ${getOptionLabel(def, currentValue)}`,
        onClear: () => setFilter(def.key, "all"),
      });
    });

    return badges;
  }, [filters, searchQuery, setFilter, setSearchQuery]);

  const groupsByColumn = useMemo(() => {
    const columns = [[], [], []];
    FILTER_DEFS.forEach((def) => {
      const idx = Number.isInteger(def.column) ? def.column : 0;
      columns[Math.max(0, Math.min(2, idx))].push(def);
    });
    return columns;
  }, []);

  function resetAllFilters() {
    FILTER_DEFS.forEach((def) => setFilter(def.key, "all"));
    setSearchQuery("");
  }

  return (
    <div className="mb-6">
      {activeFilterBadges.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-base-content/60 shrink-0">
            Filter:
          </span>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {activeFilterBadges.map((badge) => (
              <button
                key={badge.key}
                type="button"
                className="badge badge-outline gap-1 py-2 px-2 sm:py-3 sm:px-3 cursor-pointer hover:bg-base-200 text-xs sm:text-sm"
                title="Filter entfernen"
                onClick={badge.onClear}
              >
                <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-60 lg:max-w-80">
                  {badge.label}
                </span>
                <span aria-hidden="true" className="text-xs sm:text-base">
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <CollapsibleSection
        title="Filter"
        defaultOpen={false}
        className="shadow-md border-base-300/60"
        meta={`${activeFilterCount} aktiv`}
      >
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Schnellauswahl nach Zertifikat, Erfahrung und Alter.
              </p>
              <p className="text-xs text-base-content/60">
                Auch nach Führerschein, Sprachniveau, Bewertung und Reaktion
                filtern.
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn-xs btn-outline mt-2 sm:mt-0"
                onClick={resetAllFilters}
              >
                Filter zurücksetzen
              </button>
            ) : (
              <button
                type="button"
                className="badge badge-ghost mt-2 sm:mt-0 cursor-pointer hover:bg-base-200 transition-colors"
                onClick={resetAllFilters}
                title="Alle Filter aktivieren"
              >
                Keine Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {groupsByColumn.map((columnDefs, idx) => (
              <div key={`column-${idx}`} className="space-y-3">
                {columnDefs.map((def) => (
                  <FilterGroup
                    key={def.key}
                    def={def}
                    value={String(filters[def.key] || "all").trim()}
                    onChange={setFilter}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
