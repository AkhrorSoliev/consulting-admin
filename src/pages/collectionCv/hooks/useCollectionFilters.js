import { useEffect, useMemo, useState } from "react";

export function useCollectionFilters(items) {
  const [searchQuery, setSearchQuery] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [commentFilter, setCommentFilter] = useState("all");
  const [commentAuthorFilter, setCommentAuthorFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [stageOutcomeFilter, setStageOutcomeFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [drivingFilter, setDrivingFilter] = useState("all");
  const [langLevelFilter, setLangLevelFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [reactionFilter, setReactionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filters = useMemo(
    () => ({
      certificate: certificateFilter,
      experience: experienceFilter,
      comment: commentFilter,
      stage: stageFilter,
      stageOutcome: stageOutcomeFilter,
      age: ageFilter,
      driving: drivingFilter,
      langLevel: langLevelFilter,
      rating: ratingFilter,
      reaction: reactionFilter,
    }),
    [
      certificateFilter, experienceFilter, commentFilter, stageFilter,
      stageOutcomeFilter, ageFilter, drivingFilter, langLevelFilter,
      ratingFilter, reactionFilter,
    ],
  );

  function setFilter(key, value) {
    const next = String(value || "all").trim();
    const map = {
      certificate: setCertificateFilter,
      experience: setExperienceFilter,
      comment: setCommentFilter,
      stage: setStageFilter,
      stageOutcome: setStageOutcomeFilter,
      age: setAgeFilter,
      driving: setDrivingFilter,
      langLevel: setLangLevelFilter,
      rating: setRatingFilter,
      reaction: setReactionFilter,
    };
    map[key]?.(next);
  }

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
      if (certificateFilter === "with" && !it.hasCertificate) return false;
      if (certificateFilter === "without" && it.hasCertificate) return false;
      if (experienceFilter === "with" && !it.hasExperience) return false;
      if (experienceFilter === "without" && it.hasExperience) return false;
      if (commentFilter === "with" && !it.hasComment) return false;
      if (commentFilter === "without" && it.hasComment) return false;

      if (commentAuthorFilter !== "all") {
        const authorName = String(it.commentUpdatedByName || "").trim();
        if (authorName !== commentAuthorFilter) return false;
      }

      if (stageFilter !== "all") {
        if (String(it.statusValue || "").trim() !== String(stageFilter || "").trim())
          return false;
      }

      if (stageOutcomeFilter !== "all") {
        const [stageKey, decisionRaw] = String(stageOutcomeFilter || "")
          .split(":")
          .map((s) => String(s || "").trim());
        const decision = decisionRaw === "rejected" ? "rejected" : "accepted";
        const stageDecisions =
          it?.stageDecisions && typeof it.stageDecisions === "object"
            ? it.stageDecisions : {};
        if (!stageKey || !stageDecisions[stageKey]) return false;
        if (stageDecisions[stageKey] !== decision) return false;
      }

      if (ageFilter !== "all") {
        const range = ranges[ageFilter];
        if (!range || typeof it.age !== "number") return false;
        if (range.min !== null && it.age < range.min) return false;
        if (range.max !== null && it.age > range.max) return false;
      }

      if (drivingFilter === "with" && !it.hasDrivingLicense) return false;
      if (drivingFilter === "without" && it.hasDrivingLicense) return false;

      if (langLevelFilter !== "all") {
        const wanted = String(langLevelFilter || "").toUpperCase();
        if (!Array.isArray(it.langLevels) || it.langLevels.length === 0) return false;
        if (!it.langLevels.some((lv) => lv === wanted)) return false;
      }

      if (ratingFilter === "with" && it.rating === null) return false;
      if (ratingFilter === "without" && it.rating !== null) return false;

      if (reactionFilter !== "all") {
        const wantedReaction = String(reactionFilter || "").trim();
        if (String(it.reaction || "").trim() !== wantedReaction) return false;
      }

      if (tokens.length === 0) return true;
      const name = String(it.name || "").toLowerCase();
      return tokens.every((t) => name.includes(t));
    });
  }, [
    items, searchQuery, certificateFilter, experienceFilter, commentFilter,
    commentAuthorFilter, stageFilter, stageOutcomeFilter, ageFilter,
    drivingFilter, langLevelFilter, ratingFilter, reactionFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery, certificateFilter, experienceFilter, commentFilter,
    commentAuthorFilter, stageFilter, stageOutcomeFilter, ageFilter,
    drivingFilter, langLevelFilter, ratingFilter, reactionFilter,
  ]);

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
    currentPage, setCurrentPage,
    totalPages, startIndex, endIndex,
    commentAuthorFilter, setCommentAuthorFilter,
    uniqueCommentAuthors,
  };
}
