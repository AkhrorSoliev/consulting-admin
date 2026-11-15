/**
 * Persisted view state (search, filters, page) for the candidate list.
 *
 * Stored per Berufsfeld in sessionStorage so opening a candidate and coming
 * back lands on the same page instead of resetting to the first one.
 */

const STORAGE_PREFIX = "collectionCv:view:";

const FILTER_KEYS = [
  "certificate",
  "experience",
  "comment",
  "stage",
  "stageOutcome",
  "age",
  "driving",
  "langLevel",
  "rating",
  "reaction",
];

export function defaultFilterState() {
  const filters = {};
  FILTER_KEYS.forEach((key) => {
    filters[key] = "all";
  });
  return {
    searchQuery: "",
    commentAuthorFilter: "all",
    currentPage: 1,
    filters,
  };
}

export function isFilterKey(key) {
  return FILTER_KEYS.includes(key);
}

export function filterStateKey(major) {
  return `${STORAGE_PREFIX}${String(major || "").trim()}`;
}

export function readFilterState(key) {
  const state = defaultFilterState();
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return state;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return state;

    if (typeof saved.searchQuery === "string") state.searchQuery = saved.searchQuery;
    if (typeof saved.commentAuthorFilter === "string") {
      state.commentAuthorFilter = saved.commentAuthorFilter;
    }
    const page = Number(saved.currentPage);
    if (Number.isFinite(page) && page >= 1) state.currentPage = Math.floor(page);

    if (saved.filters && typeof saved.filters === "object") {
      FILTER_KEYS.forEach((filterKey) => {
        const value = saved.filters[filterKey];
        if (typeof value === "string" && value) state.filters[filterKey] = value;
      });
    }
    return state;
  } catch {
    // Private mode / disabled storage / corrupt payload — fall back to defaults.
    return state;
  }
}

export function writeFilterState(key, state) {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Quota or disabled storage: persistence is a convenience, never fatal.
  }
}
