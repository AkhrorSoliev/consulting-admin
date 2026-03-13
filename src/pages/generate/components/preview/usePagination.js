import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { arePageIndexGroupsEqual } from "./utils";
import { A4_HEIGHT_PX, PT_TO_PX } from "./utils";

export default function usePagination({
  mainBlocks,
  mainContentBottomPadPt,
  showComment,
  commentLineEntries,
  commentLinesLength,
}) {
  const mainMeasureRef = useRef(null);
  const commentHeaderMeasureRef = useRef(null);
  const commentBodyMeasureRef = useRef(null);
  const [mainPageGroups, setMainPageGroups] = useState(null);
  const [commentPageGroups, setCommentPageGroups] = useState(null);
  const [fontReadyTick, setFontReadyTick] = useState(0);

  useEffect(() => {
    let alive = true;
    try {
      const fonts = typeof document !== "undefined" ? document.fonts : null;
      if (fonts?.ready && typeof fonts.ready.then === "function") {
        fonts.ready
          .then(() => {
            if (!alive) return;
            setFontReadyTick((t) => t + 1);
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
    return () => {
      alive = false;
    };
  }, []);

  const mainContentHeightPx =
    A4_HEIGHT_PX - (44 + mainContentBottomPadPt) * PT_TO_PX;

  useLayoutEffect(() => {
    const root = mainMeasureRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll("[data-main-block]"));
    const sentinel = root.querySelector("[data-main-sentinel]");
    if (!nodes.length || !sentinel) {
      setMainPageGroups((prev) => {
        const fallback = [mainBlocks.map((_, idx) => idx)];
        return arePageIndexGroupsEqual(prev, fallback) ? prev : fallback;
      });
      return;
    }

    const tops = nodes.map((el) => el.offsetTop || 0);
    const sentinelTop = sentinel.offsetTop || 0;
    const occupied = nodes.map((_, i) => {
      const nextTop = i < nodes.length - 1 ? tops[i + 1] : sentinelTop;
      return Math.max(0, nextTop - tops[i]);
    });

    const pages = [];
    let current = [];
    let used = 0;
    for (let i = 0; i < mainBlocks.length; i++) {
      const block = mainBlocks[i];
      const h = occupied[i] || 0;
      const nextH = i + 1 < occupied.length ? occupied[i + 1] || 0 : 0;
      const required =
        block?.keepWithNext && i + 1 < mainBlocks.length ? h + nextH : h;

      if (current.length > 0 && used + required > mainContentHeightPx) {
        pages.push(current);
        current = [];
        used = 0;
      }
      current.push(i);
      used += h;
    }
    if (current.length) pages.push(current);
    if (!pages.length) pages.push([0]);

    setMainPageGroups((prev) =>
      arePageIndexGroupsEqual(prev, pages) ? prev : pages,
    );
  }, [fontReadyTick, mainBlocks, mainContentHeightPx]);

  useLayoutEffect(() => {
    if (!showComment) {
      setCommentPageGroups(null);
      return;
    }

    const bodyRoot = commentBodyMeasureRef.current;
    const headerRoot = commentHeaderMeasureRef.current;
    if (!bodyRoot || !headerRoot) return;

    const nodes = Array.from(
      bodyRoot.querySelectorAll("[data-comment-line-block]"),
    );
    const sentinel = bodyRoot.querySelector("[data-comment-line-sentinel]");
    if (!sentinel) {
      setCommentPageGroups([[]]);
      return;
    }

    const headerCss = window.getComputedStyle(headerRoot);
    const headerMarginBottom =
      Number.parseFloat(headerCss.marginBottom || "0") || 0;
    const headerTotalHeight =
      (headerRoot.offsetHeight || 0) + headerMarginBottom;
    const firstBodyTopGapPx = 10 * PT_TO_PX;
    const nextBodyTopGapPx = 0;
    const commentBottomPadPt = 72;
    const firstPageAvailableHeight =
      A4_HEIGHT_PX -
      (44 + commentBottomPadPt) * PT_TO_PX -
      headerTotalHeight -
      firstBodyTopGapPx;
    const nextPageAvailableHeight =
      A4_HEIGHT_PX - (44 + commentBottomPadPt) * PT_TO_PX - nextBodyTopGapPx;
    const safeFirstPageAvailableHeight = Math.max(40, firstPageAvailableHeight);
    const safeNextPageAvailableHeight = Math.max(40, nextPageAvailableHeight);

    if (!nodes.length) {
      setCommentPageGroups([[]]);
      return;
    }

    const tops = nodes.map((el) => el.offsetTop || 0);
    const sentinelTop = sentinel.offsetTop || 0;
    const occupied = nodes.map((_, i) => {
      const nextTop = i < nodes.length - 1 ? tops[i + 1] : sentinelTop;
      return Math.max(0, nextTop - tops[i]);
    });

    const pages = [];
    let current = [];
    let used = 0;
    let currentPageLimit = safeFirstPageAvailableHeight;

    for (let i = 0; i < nodes.length; i++) {
      const h = occupied[i] || 0;
      if (current.length > 0 && used + h > currentPageLimit) {
        pages.push(current);
        current = [];
        used = 0;
        currentPageLimit = safeNextPageAvailableHeight;
      }
      current.push(i);
      used += h;
    }

    if (current.length) pages.push(current);
    if (!pages.length) pages.push([]);

    setCommentPageGroups((prev) =>
      arePageIndexGroupsEqual(prev, pages) ? prev : pages,
    );
  }, [
    showComment,
    commentLineEntries,
    commentLinesLength,
    fontReadyTick,
  ]);

  const resolvedMainPageGroups =
    Array.isArray(mainPageGroups) && mainPageGroups.length
      ? mainPageGroups
      : [mainBlocks.map((_, idx) => idx)];
  const mainPageCount = resolvedMainPageGroups.length || 1;
  const resolvedCommentPageGroups = !showComment
    ? []
    : Array.isArray(commentPageGroups) && commentPageGroups.length
      ? commentPageGroups
      : commentLineEntries.length
        ? [commentLineEntries.map((_, idx) => idx)]
        : [[]];

  return {
    mainMeasureRef,
    commentHeaderMeasureRef,
    commentBodyMeasureRef,
    resolvedMainPageGroups,
    mainPageCount,
    resolvedCommentPageGroups,
  };
}
