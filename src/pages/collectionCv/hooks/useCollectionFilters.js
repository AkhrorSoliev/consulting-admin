import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  filterStateKey,
  isFilterKey,
  readFilterState,
  writeFilterState,
} from "../filterState";

export function useCollectionFilters(items) {
  const { major } = useParams();
  const storageKey = filterStateKey(major);

  const [view, setView] = useState(() => readFilterState(storageKey));

  // Switching Berufsfeld swaps in that list's own saved view.
  const [appliedKey, setAppliedKey] = useState(storageKey);
  if (appliedKey !== storageKey) {
    setAppliedKey(storageKey);
    setView(readFilterState(storageKey));
  }

  useEffect(() => {
    writeFilterState(storageKey, view);
  }, [storageKey, view]);

  const {
    searchQuery,
    commentAuthorFilter,
    currentPage,
    filters,
  } = view;
  const itemsPerPage = 10;

  // Any narrowing of the list starts over at page 1.
  const setSearchQuery = useCallback((value) => {
    setView((s) => ({ ...s, searchQuery: String(value ?? ""), currentPage: 1 }));
  }, []);

  const setCommentAuthorFilter = useCallback((value) => {
    const next = String(value || "all").trim();
    setView((s) => ({ ...s, commentAuthorFilter: next, currentPage: 1 }));
  }, []);

  const setFilter = useCallback((key, value) => {
    if (!isFilterKey(key)) return;
    const next = String(value || "all").trim();
    setView((s) => ({
      ...s,
      filters: { ...s.filters, [key]: next },
      currentPage: 1,
    }));
  }, []);

  const setCurrentPage = useCallback((page) => {
    const next = Math.max(1, Math.floor(Number(page) || 1));
    setView((s) => ({ ...s, currentPage: next }));
  }, []);

  const filteredItems = useMemo(() => {
    const ranges = {
      all: null,
      "18_25": { min: 18, max: 25 },
      "26_35": { min: 26, max: 35 },
      "36_45": { min: 36, max: 45 },
      "46_plus": { min: 46, max: null },
    };
    const q = String(searchQuery || "").trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    return items.filter((it) => {
      if (filters.certificate === "with" && !it.hasCertificate) return false;
      if (filters.certificate === "without" && it.hasCertificate) return false;
      if (filters.experience === "with" && !it.hasExperience) return false;
      if (filters.experience === "without" && it.hasExperience) return false;
      if (filters.comment === "with" && !it.hasComment) return false;
      if (filters.comment === "without" && it.hasComment) return false;

      if (commentAuthorFilter !== "all") {
        const authorName = String(it.commentUpdatedByName || "").trim();
        if (authorName !== commentAuthorFilter) return false;
      }

      if (filters.stage !== "all") {
        if (String(it.statusValue || "").trim() !== String(filters.stage || "").trim())
          return false;
      }

      if (filters.stageOutcome !== "all") {
        const [stageKey, decisionRaw] = String(filters.stageOutcome || "")
          .split(":")
          .map((s) => String(s || "").trim());
        const decision = decisionRaw === "rejected" ? "rejected" : "accepted";
        const stageDecisions =
          it?.stageDecisions && typeof it.stageDecisions === "object"
            ? it.stageDecisions : {};
        if (!stageKey || !stageDecisions[stageKey]) return false;
        if (stageDecisions[stageKey] !== decision) return false;
      }

      if (filters.age !== "all") {
        const range = ranges[filters.age];
        if (!range || typeof it.age !== "number") return false;
        if (range.min !== null && it.age < range.min) return false;
        if (range.max !== null && it.age > range.max) return false;
      }

      if (filters.driving === "with" && !it.hasDrivingLicense) return false;
      if (filters.driving === "without" && it.hasDrivingLicense) return false;

      if (filters.langLevel !== "all") {
        const wanted = String(filters.langLevel || "").toUpperCase();
        if (!Array.isArray(it.langLevels) || it.langLevels.length === 0) return false;
        if (!it.langLevels.some((lv) => lv === wanted)) return false;
      }

      if (filters.rating === "with" && it.rating === null) return false;
      if (filters.rating === "without" && it.rating !== null) return false;

      if (filters.reaction !== "all") {
        const wantedReaction = String(filters.reaction || "").trim();
        if (String(it.reaction || "").trim() !== wantedReaction) return false;
      }

      if (tokens.length === 0) return true;
      const name = String(it.name || "").toLowerCase();
      return tokens.every((t) => name.includes(t));
    });
  }, [items, searchQuery, commentAuthorFilter, filters]);

  // Pagination. The stored page is clamped rather than corrected, so a page that
  // is briefly out of range (list still loading, a candidate just deleted) comes
  // back once the data does.
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const uniqueCommentAuthors = useMemo(() => {
    const authors = new Set();
    items.forEach((item) => {
      const name = String(item?.commentUpdatedByName || "").trim();
      if (name) authors.add(name);
    });
    return Array.from(authors).sort((a, b) => a.localeCompare(b));
  }, [items]);

  return {
    searchQuery, setSearchQuery,
    filters, setFilter,
    filteredItems, paginatedItems,
    currentPage: safePage, setCurrentPage,
    totalPages, startIndex, endIndex,
    commentAuthorFilter, setCommentAuthorFilter,
    uniqueCommentAuthors,
  };
}
