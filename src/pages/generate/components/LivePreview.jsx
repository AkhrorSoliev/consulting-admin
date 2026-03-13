/**
 * LivePreview - A4 document preview for CV generation.
 *
 * Thin orchestrator that composes sub-components from ./preview/.
 */

import { useCallback, useMemo } from "react";
import useFormData from "./preview/useFormData";
import useMainBlocks from "./preview/useMainBlocks";
import usePagination from "./preview/usePagination";
import useZoom from "./preview/useZoom";
import ViewportShell from "./preview/ViewportShell";
import MeasurementCanvas from "./preview/MeasurementCanvas";
import MainPages from "./preview/MainPages";
import CommentPages from "./preview/CommentPages";
import ZoomControls from "./preview/ZoomControls";
import { splitCommentLabelLine } from "./preview/utils";

export default function LivePreview({
  formCv,
  containerClassName,
  showToolbar = true,
  showComment = true,
  showCommentDate = true,
  showDocuments = true,
  commentMeta,
  pageScale = "auto",
  minScale = 0.5,
  enableClickZoom = false,
  clickZoomMultiplier = 1.5,
  onPhotoClick,
  rating = null,
}) {
  const {
    sortedExperience,
    educationArray,
    sortedEducation,
    fullName,
    address,
    birthDate,
    birthPlace,
    phone,
    email,
    maritalStatus,
    childrenText,
    hasDrivingLicense,
    drivingText,
    photo,
    commentDate,
    commentLineEntries,
    hasSoftSkills,
    hasLanguages,
    hasPcSkills,
    showSkillsSection,
    mainContentBottomPadPt,
  } = useFormData({ formCv, commentMeta, showComment });

  const mainBlocks = useMainBlocks({
    formCv,
    fullName,
    address,
    birthDate,
    birthPlace,
    maritalStatus,
    childrenText,
    phone,
    email,
    photo,
    onPhotoClick,
    sortedExperience,
    educationArray,
    sortedEducation,
    showSkillsSection,
    hasDrivingLicense,
    drivingText,
    hasLanguages,
    hasSoftSkills,
    hasPcSkills,
    showDocuments,
  });

  const {
    mainMeasureRef,
    commentHeaderMeasureRef,
    commentBodyMeasureRef,
    resolvedMainPageGroups,
    mainPageCount,
    resolvedCommentPageGroups,
  } = usePagination({
    mainBlocks,
    mainContentBottomPadPt,
    showComment,
    commentLineEntries,
    commentLinesLength: commentLineEntries.length,
  });

  const {
    viewportRef,
    panStateRef,
    isPanning,
    setIsPanning,
    zoomFactor,
    zoomBounds,
    isZoomedIn,
    effectiveScale,
    toggleZoom,
    setZoomClamped,
  } = useZoom({ pageScale, minScale, enableClickZoom, clickZoomMultiplier });

  const renderCommentLine = useCallback((entry) => {
    const parsed = splitCommentLabelLine(entry.line);
    if (parsed) {
      return (
        <span>
          <span className="font-bold">{parsed.labelText}</span>
          {parsed.tailText}
        </span>
      );
    }
    return <span>{entry.line}</span>;
  }, []);

  const numericRating = useMemo(() => {
    const n = Number(rating);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rating]);

  return (
    <section
      className={
        (containerClassName ||
          "w-full flex-1 min-w-0 h-[calc(100vh-2rem)] lg:sticky lg:top-4") +
        " relative"
      }
    >
      <ViewportShell
        viewportRef={viewportRef}
        panStateRef={panStateRef}
        enableClickZoom={enableClickZoom}
        isZoomedIn={isZoomedIn}
        setIsPanning={setIsPanning}
        showToolbar={showToolbar}
      >
        <MeasurementCanvas
          mainMeasureRef={mainMeasureRef}
          commentHeaderMeasureRef={commentHeaderMeasureRef}
          commentBodyMeasureRef={commentBodyMeasureRef}
          mainBlocks={mainBlocks}
          mainContentBottomPadPt={mainContentBottomPadPt}
          commentLineEntries={commentLineEntries}
          renderCommentLine={renderCommentLine}
          rating={numericRating}
        />

        <MainPages
          resolvedMainPageGroups={resolvedMainPageGroups}
          mainBlocks={mainBlocks}
          mainPageCount={mainPageCount}
          showComment={showComment}
          showCommentDate={showCommentDate}
          commentDate={commentDate}
          mainContentBottomPadPt={mainContentBottomPadPt}
          effectiveScale={effectiveScale}
          isZoomedIn={isZoomedIn}
          isPanning={isPanning}
          enableClickZoom={enableClickZoom}
          toggleZoom={toggleZoom}
        />

        {showComment && (
          <CommentPages
            resolvedCommentPageGroups={resolvedCommentPageGroups}
            commentLineEntries={commentLineEntries}
            renderCommentLine={renderCommentLine}
            mainPageCount={mainPageCount}
            showCommentDate={showCommentDate}
            commentDate={commentDate}
            rating={numericRating}
            effectiveScale={effectiveScale}
            isZoomedIn={isZoomedIn}
            isPanning={isPanning}
            enableClickZoom={enableClickZoom}
            toggleZoom={toggleZoom}
          />
        )}
      </ViewportShell>

      {enableClickZoom && (
        <ZoomControls
          showToolbar={showToolbar}
          zoomFactor={zoomFactor}
          zoomBounds={zoomBounds}
          setZoomClamped={setZoomClamped}
        />
      )}
    </section>
  );
}
