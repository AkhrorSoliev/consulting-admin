import { commentHtmlToPlainText, sortTimelineItemsDesc } from "../../../utils";
import { PreviewInfoRow, PreviewSectionTitle } from "./PreviewParts";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function arePageIndexGroupsEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (!Array.isArray(pa) || !Array.isArray(pb) || pa.length !== pb.length)
      return false;
    for (let j = 0; j < pa.length; j++) {
      if (pa[j] !== pb[j]) return false;
    }
  }
  return true;
}

function escapeRegExp(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitCommentLabelLine(line) {
  const raw = String(line || "");
  if (!raw.trim()) return null;

  const labels = [
    "Eingeschätzte Sprachniveau",
    "Erfahrung in diesem Bereich",
    "Langfristige Ziele in Deutschland",
    "Auslandserfahrungen",
    "Familie/Kinder",
    "Weitere Gesprächsnotizen",
  ];
  const alt = labels.map(escapeRegExp).join("|");
  const re = new RegExp(
    `^(\\s*(?:\\d+\\.)?\\s*)(${alt})(\\s*:)?(\\s*)(.*)$`,
    "i",
  );
  const m = raw.match(re);
  if (!m) return null;

  const label = m[2] || "";
  const colon = m[3] || "";
  const spacesAfter = m[4] || "";
  const tail = m[5] || "";

  return {
    labelText: `${label}${colon}`,
    tailText: `${spacesAfter}${tail}`,
  };
}

function softWrapTextLine(line, maxChars = 110) {
  const raw = String(line ?? "");
  if (!raw) return [""];
  if (raw.length <= maxChars) return [raw];

  const chunks = [];
  let current = "";
  const tokens = raw.split(/(\s+)/).filter((t) => t.length > 0);

  const pushCurrent = () => {
    if (current.length > 0) {
      chunks.push(current);
      current = "";
    }
  };

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token);
    if (isSpace) {
      if (!current) continue;
      if ((current + token).length <= maxChars) {
        current += token;
      } else {
        pushCurrent();
      }
      continue;
    }

    if (token.length > maxChars) {
      pushCurrent();
      for (let i = 0; i < token.length; i += maxChars) {
        chunks.push(token.slice(i, i + maxChars));
      }
      continue;
    }

    if (!current) {
      current = token;
      continue;
    }

    if ((current + token).length <= maxChars) {
      current += token;
      continue;
    }

    pushCurrent();
    current = token;
  }

  pushCurrent();
  return chunks.length ? chunks : [raw];
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateDDMMYYYY(ms) {
  const n = typeof ms === "number" ? ms : Number(ms);
  if (!Number.isFinite(n)) return "—";
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function renderStars(rating) {
  if (rating === null || rating === undefined) return null;
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating <= 0) return null;

  const stars = [];
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span
        key={`full-${i}`}
        className="text-amber-500 text-[14pt] leading-none"
      >
        ★
      </span>,
    );
  }

  if (hasHalfStar) {
    stars.push(
      <span
        key="half"
        className="relative inline-flex w-[14pt] h-[14pt] leading-none align-middle"
      >
        <span className="absolute inset-0 text-gray-300 text-[14pt] leading-none">
          ★
        </span>
        <span className="absolute inset-0 overflow-hidden w-[7pt]">
          <span className="text-amber-500 text-[14pt] leading-none">★</span>
        </span>
      </span>,
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span
        key={`empty-${i}`}
        className="text-gray-300 text-[14pt] leading-none"
      >
        ★
      </span>,
    );
  }

  return stars;
}

export default function LivePreview({
  formCv,
  commentMeta,
  showDocuments,
  showComment,
  showCommentDate,
  onPhotoClick,
  containerClassName,
  showToolbar = true,
  rating = null,
  // IMPORTANT: scaling must NEVER change layout. We only zoom the whole A4 canvas via transform: scale().
  // Use `pageScale` as:
  // - a number (0.5..1) to force a specific zoom level
  // - "auto" (default) to fit the A4 width into the available viewport
  pageScale = "auto",
  // Minimum scale allowed for auto-fit and zoom-out (defaults to 0.5).
  // Useful for small/mobile viewports where 0.5 would clip the A4 page.
  minScale = 0.5,
  // Opt-in: click the A4 page to zoom in/out (desktop preview behavior).
  enableClickZoom = false,
  // Multiplier applied on top of `safeScale` when zoomed in.
  clickZoomMultiplier = 1.5,
}) {
  // A4 in points (matching `@react-pdf/renderer` default A4 size)
  const A4_WIDTH_PT = 595;
  const A4_HEIGHT_PT = 842;
  const PT_TO_PX = 96 / 72; // CSS: 1pt = 1/72in, 1in = 96px
  const A4_WIDTH_PX = A4_WIDTH_PT * PT_TO_PX;
  const A4_HEIGHT_PX = A4_HEIGHT_PT * PT_TO_PX;

  const viewportRef = useRef(null);
  const mainMeasureRef = useRef(null);
  const commentHeaderMeasureRef = useRef(null);
  const commentBodyMeasureRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [mainPageGroups, setMainPageGroups] = useState(null);
  const [commentPageGroups, setCommentPageGroups] = useState(null);
  const [fontReadyTick, setFontReadyTick] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    moved: false,
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const w =
        entry?.contentRect?.width ?? el.getBoundingClientRect?.().width ?? 0;
      setViewportWidth(Number.isFinite(w) ? w : 0);
    });
    ro.observe(el);
    return () => {
      try {
        ro.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    // If webfonts load after first paint, text metrics can shift.
    // Trigger exactly one extra pagination pass when fonts are ready.
    let alive = true;
    try {
      const fonts = typeof document !== "undefined" ? document.fonts : null;
      if (fonts?.ready && typeof fonts.ready.then === "function") {
        fonts.ready
          .then(() => {
            if (!alive) return;
            setFontReadyTick((t) => t + 1);
          })
          .catch(() => {
            // ignore
          });
      }
    } catch {
      // ignore
    }
    return () => {
      alive = false;
    };
  }, []);

  const minScaleClamped = useMemo(() => {
    const n = Number(minScale);
    if (!Number.isFinite(n)) return 0.5;
    // Keep it sane; below ~0.25 gets too tiny and hurts usability.
    return Math.min(0.8, Math.max(0.25, n));
  }, [minScale]);

  const safeScale = useMemo(() => {
    const raw =
      typeof pageScale === "number"
        ? pageScale
        : pageScale === "auto" || pageScale == null
          ? null
          : Number(pageScale);

    // Manual scale
    if (raw != null && Number.isFinite(raw)) {
      return Math.min(1, Math.max(minScaleClamped, raw));
    }

    // Auto-fit width (zoom out on smaller screens without compressing content)
    // Keep some breathing room so it doesn't touch container edges.
    const paddingPx = 24;
    const available = Math.max(0, (viewportWidth || 0) - paddingPx);
    if (!available) return 1;
    const auto = available / A4_WIDTH_PX;
    return Math.min(1, Math.max(minScaleClamped, auto));
  }, [pageScale, viewportWidth, A4_WIDTH_PX, minScaleClamped]);

  const MIN_EFFECTIVE_SCALE = minScaleClamped;
  const MAX_EFFECTIVE_SCALE = 2.25;

  const zoomBounds = useMemo(() => {
    // zoomFactor is applied on top of safeScale: effective = safeScale * zoomFactor
    const min = Math.max(
      0.5,
      MIN_EFFECTIVE_SCALE / Math.max(0.0001, safeScale),
    );
    const max = Math.min(
      4.5,
      MAX_EFFECTIVE_SCALE / Math.max(0.0001, safeScale),
    );
    return { min, max };
  }, [safeScale]);

  useEffect(() => {
    // Keep zoomFactor in bounds if viewport changes.
    if (!enableClickZoom) return;
    setZoomFactor((z) => {
      const next = Math.min(zoomBounds.max, Math.max(zoomBounds.min, z));
      // Snap to 1x when close, so UI doesn't get "stuck" at 0.99/1.01.
      return Math.abs(next - 1) < 0.01 ? 1 : next;
    });
  }, [enableClickZoom, zoomBounds.min, zoomBounds.max]);

  const isZoomedIn = enableClickZoom && zoomFactor > 1.001;

  const effectiveScale = useMemo(() => {
    const scaled = safeScale * (enableClickZoom ? zoomFactor : 1);
    return Math.min(MAX_EFFECTIVE_SCALE, Math.max(MIN_EFFECTIVE_SCALE, scaled));
  }, [enableClickZoom, zoomFactor, safeScale]);

  const ZOOM_RANGE_LEN_PX = 260;

  function toggleZoom() {
    if (!enableClickZoom) return;
    // If the last interaction was a drag-to-pan, don't treat it as a click.
    if (panStateRef.current?.moved) {
      panStateRef.current.moved = false;
      return;
    }
    setZoomFactor((z) => {
      const next =
        Math.abs(z - 1) < 0.01
          ? Math.max(
              zoomBounds.min,
              Math.min(zoomBounds.max, clickZoomMultiplier),
            )
          : 1;
      return next;
    });
  }

  function setZoomClamped(next) {
    const n = Number(next);
    if (!Number.isFinite(n)) return;
    let clamped = Math.min(zoomBounds.max, Math.max(zoomBounds.min, n));

    // Skip 95-100% range: if in this range, jump to nearest boundary
    if (clamped > 0.94 && clamped < 1.01) {
      // If we're increasing zoom, jump to 1.01
      if (n > zoomFactor) {
        clamped = 1.01;
      } else {
        // If we're decreasing zoom, jump to 0.94
        clamped = 0.94;
      }
    }

    setZoomFactor(Math.abs(clamped - 1) < 0.01 ? 1 : clamped);
  }

  function ScaledA4({ children, pageLabel = "A4-Seite" }) {
    const scaledW = A4_WIDTH_PX * effectiveScale;
    const scaledH = A4_HEIGHT_PX * effectiveScale;
    const zoomPanMode = isZoomedIn;
    return (
      <div
        style={{
          width: `${scaledW}px`,
          height: `${scaledH}px`,
        }}
      >
        <div
          role={enableClickZoom ? "button" : undefined}
          tabIndex={enableClickZoom ? 0 : undefined}
          aria-label={
            enableClickZoom
              ? isZoomedIn
                ? `${pageLabel} – klicken zum Herauszoomen`
                : `${pageLabel} – klicken zum Hineinzoomen`
              : undefined
          }
          onClick={enableClickZoom ? toggleZoom : undefined}
          onKeyDown={
            enableClickZoom
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleZoom();
                  }
                }
              : undefined
          }
          className={
            enableClickZoom
              ? `select-none ${
                  isZoomedIn
                    ? isPanning
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-zoom-in"
                }`
              : undefined
          }
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            position: "relative",
            left: zoomPanMode ? 0 : "50%",
            top: 0,
            transform: zoomPanMode
              ? `scale(${effectiveScale})`
              : `translateX(-50%) scale(${effectiveScale})`,
            transformOrigin: zoomPanMode ? "top left" : "top center",
            transition: enableClickZoom
              ? "transform 220ms ease-out"
              : undefined,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const sortedExperience = sortTimelineItemsDesc(formCv?.experience || []);

  // Education is already an array
  const educationArray = Array.isArray(formCv?.education)
    ? formCv.education
    : [];
  const sortedEducation = sortTimelineItemsDesc(educationArray);
  const firstName = String(formCv?.personalInfo?.name || "").trim();
  const lastName = String(formCv?.personalInfo?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const address = String(formCv?.personalInfo?.address || "").trim();
  const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
  const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
  const phone = String(formCv?.personalInfo?.phone || "").trim();
  const email = String(formCv?.personalInfo?.email || "").trim();
  const maritalStatus = String(
    formCv?.personalInfo?.maritalStatus || "",
  ).trim();
  const noChildren = Boolean(formCv?.personalInfo?.noChildren);
  const childrenCount = String(
    formCv?.personalInfo?.childrenCount || "",
  ).trim();
  const childrenText = noChildren
    ? "Keine Kinder"
    : childrenCount
      ? childrenCount
      : "";
  const hasDrivingLicense = Boolean(formCv?.personalInfo?.hasDrivingLicense);
  const drivingType = String(formCv?.personalInfo?.drivingLicenseType || "")
    .trim()
    .toUpperCase();
  const drivingText = hasDrivingLicense
    ? drivingType
      ? `Ja (${drivingType})`
      : "Ja"
    : "Nein";
  const photo = String(formCv?.personalInfo?.photo || "").trim();
  const commentPlain = commentHtmlToPlainText(formCv?.commentar);
  const commentLines = String(commentPlain || "").split("\n");
  const commentDate = commentMeta?.updatedAt
    ? formatDateDDMMYYYY(commentMeta.updatedAt)
    : "";
  const autoGeneratedNote =
    "Dieser Lebenslauf wurde automatisch vom ConsultingUz erstellt";
  const hasSoftSkills = formCv.skills.softSkills?.length > 0;
  const hasLanguages = Object.entries(formCv.skills.languages || {}).length > 0;
  const hasPcSkills = formCv.skills.pcSkills?.length > 0;
  const showSkillsSection =
    hasDrivingLicense || hasSoftSkills || hasLanguages || hasPcSkills;
  const commentLineEntries = useMemo(
    () =>
      commentLines.flatMap((line, idx) => {
        const wrapped = softWrapTextLine(line, 110);
        return wrapped.map((part, chunkIdx) => ({
          id: `comment-line-${idx}-${chunkIdx}`,
          line: part,
          idx,
          isContinuation: chunkIdx > 0,
          isLastChunk: chunkIdx === wrapped.length - 1,
        }));
      }),
    [commentLines],
  );

  function renderCommentLine(entry) {
    if (!entry) return null;
    const { line, idx, isContinuation, isLastChunk } = entry;
    const parts = isContinuation ? null : splitCommentLabelLine(line);
    const suffix = isLastChunk && idx < commentLines.length - 1 ? "\n" : "";
    if (!parts) return <>{line + suffix}</>;
    return (
      <>
        <span className="font-bold">{parts.labelText}</span>
        {parts.tailText}
        {suffix}
      </>
    );
  }

  const mainBlocks = useMemo(() => {
    const blocks = [];

    // Header (only once, first page)
    blocks.push({
      id: "header",
      kind: "header",
      keepWithNext: true,
      node: (
        <div className="mb-[18pt]">
          <h1 className="text-[24pt] font-bold leading-tight">{fullName}</h1>
          <div className="h-[2pt] bg-base-content/80 mt-[17pt] mb-[12pt] w-full" />

          <div className="flex flex-row gap-[22pt] min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-[6pt] mt-1">
                <PreviewInfoRow label="Name" value={fullName} />
                <PreviewInfoRow label="Anschrift" value={address} />
                <PreviewInfoRow label="Geburtsdatum" value={birthDate} />
                <PreviewInfoRow label="Geburtsort" value={birthPlace || "—"} />
                <PreviewInfoRow label="Familienstand" value={maritalStatus} />
                <PreviewInfoRow label="Kinder" value={childrenText} />
                <PreviewInfoRow label="Tel" value={phone} />
                <PreviewInfoRow label="E-Mail" value={email} />
              </div>
            </div>

            <div className="shrink-0">
              {photo ? (
                <img
                  src={photo}
                  alt="Foto"
                  role="button"
                  tabIndex={0}
                  onClick={onPhotoClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPhotoClick();
                    }
                  }}
                  onMouseDown={(e) => {
                    // Don't toggle page zoom when interacting with the photo preview.
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    // Don't start drag-pan on the photo element.
                    e.stopPropagation();
                  }}
                  className="w-[128pt] h-[160pt] object-cover border border-base-300 rounded-[8pt] cursor-zoom-in transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                />
              ) : (
                <div className="w-[128pt] h-[160pt] border border-base-300 rounded-[8pt] flex items-center justify-center bg-base-200 text-base-content/50 text-xs">
                  Foto
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    });

    // Experience
    if (sortedExperience.length > 0) {
      blocks.push({
        id: "experience-title",
        kind: "sectionTitle",
        keepWithNext: true,
        node: <PreviewSectionTitle>Berufliche Laufbahn</PreviewSectionTitle>,
      });
      sortedExperience.forEach((exp, i) => {
        const addGap = i < sortedExperience.length - 1;
        blocks.push({
          id: `experience-${i}`,
          kind: "row",
          node: (
            <div
              className={`flex flex-row gap-[10pt] min-w-0 ${
                addGap ? "mb-[10pt]" : ""
              }`}
            >
              <div className="w-[140pt] shrink-0 font-bold text-base-content/70">
                {(exp.startDate || "—") + " – " + (exp.endDate || "heute")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold wrap-break-word">
                  {exp.position || "—"}
                  {exp.location ? `, ${exp.location}` : ""}
                </div>
                {exp.company && (
                  <div className="italic text-base-content/70">
                    {exp.company}
                  </div>
                )}
                {Array.isArray(exp.responsibilities) &&
                  exp.responsibilities.length > 0 && (
                    <div className="mt-[4pt]">
                      {exp.responsibilities.map((r, ri) => (
                        <div
                          key={ri}
                          className="flex flex-row gap-[6pt] min-w-0"
                        >
                          <span className="shrink-0">•</span>
                          <span className="min-w-0 wrap-break-word">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ),
        });
      });
    }

    // Education
    if (educationArray.length > 0) {
      blocks.push({
        id: "education-title",
        kind: "sectionTitle",
        keepWithNext: true,
        node: <PreviewSectionTitle>Ausbildung</PreviewSectionTitle>,
      });
      sortedEducation.forEach((edu, i) => {
        const addGap = i < sortedEducation.length - 1;
        blocks.push({
          id: `education-${i}`,
          kind: "row",
          node: (
            <div
              className={`flex flex-row gap-[10pt] min-w-0 ${
                addGap ? "mb-[10pt]" : ""
              }`}
            >
              <div className="w-[140pt] shrink-0 font-bold text-base-content/70">
                {(edu.startDate || "—") + " – " + (edu.endDate || "—")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="wrap-break-word">{edu.institution || "—"}</div>
                <div className="italic text-base-content/70">
                  Abschluss: {edu.degree || "—"}
                </div>
              </div>
            </div>
          ),
        });
      });
    }

    // Skills (groups as blocks so they can move to next page cleanly)
    if (showSkillsSection) {
      blocks.push({
        id: "skills-title",
        kind: "sectionTitle",
        keepWithNext: true,
        node: (
          <PreviewSectionTitle>Kenntnisse & Fähigkeiten</PreviewSectionTitle>
        ),
      });

      const skillGroups = [];
      if (hasDrivingLicense) skillGroups.push("driving");
      // Order requirement: show "Sprachen" before "Fähigkeiten"
      if (hasLanguages) skillGroups.push("lang");
      if (hasSoftSkills) skillGroups.push("soft");
      if (hasPcSkills) skillGroups.push("pc");

      skillGroups.forEach((g, idx) => {
        const addGap = idx < skillGroups.length - 1;
        if (g === "driving") {
          blocks.push({
            id: "skills-driving",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">Führerschein</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  <div className="flex flex-row gap-[6pt] min-w-0">
                    <span className="shrink-0">•</span>
                    <span className="min-w-0 wrap-break-word">
                      {drivingText}
                    </span>
                  </div>
                </div>
              </div>
            ),
          });
          return;
        }
        if (g === "soft") {
          blocks.push({
            id: "skills-soft",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">Fähigkeiten</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  {formCv.skills.softSkills.map((s, i) => (
                    <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                      <span className="shrink-0">•</span>
                      <span className="min-w-0 wrap-break-word">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          });
          return;
        }
        if (g === "lang") {
          blocks.push({
            id: "skills-languages",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">Sprachen</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  {Object.entries(formCv.skills.languages).map(
                    ([lang, level]) => (
                      <div
                        key={lang}
                        className="flex flex-row gap-[6pt] min-w-0"
                      >
                        <span className="shrink-0">•</span>
                        <span className="min-w-0 wrap-break-word">
                          {lang} — {level}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ),
          });
          return;
        }
        if (g === "pc") {
          blocks.push({
            id: "skills-pc",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">PC-Kenntnisse</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  {formCv.skills.pcSkills.map((s, i) => (
                    <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                      <span className="shrink-0">•</span>
                      <span className="min-w-0 wrap-break-word">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          });
        }
      });
    }

    // Documents (groups as blocks)
    if (
      showDocuments &&
      (formCv.documents?.diplomas?.length > 0 ||
        formCv.documents?.certificates?.length > 0 ||
        formCv.documents?.passport?.length > 0)
    ) {
      blocks.push({
        id: "docs-title",
        kind: "sectionTitle",
        keepWithNext: true,
        node: <PreviewSectionTitle>Dokumente</PreviewSectionTitle>,
      });

      const docGroups = [];
      if (formCv.documents.passport?.length > 0) docGroups.push("passport");
      if (formCv.documents.diplomas?.length > 0) docGroups.push("diplomas");
      if (formCv.documents.certificates?.length > 0) docGroups.push("certs");

      docGroups.forEach((g, idx) => {
        const addGap = idx < docGroups.length - 1;
        if (g === "passport") {
          blocks.push({
            id: "docs-passport",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">Reisepass</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  {formCv.documents.passport.map((url, i) => (
                    <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                      <span className="shrink-0">•</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline break-all min-w-0"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ),
          });
          return;
        }
        if (g === "diplomas") {
          blocks.push({
            id: "docs-diplomas",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">Diplome</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  {formCv.documents.diplomas.map((url, i) => (
                    <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                      <span className="shrink-0">•</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline break-all min-w-0"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ),
          });
          return;
        }
        if (g === "certs") {
          blocks.push({
            id: "docs-certs",
            kind: "group",
            node: (
              <div
                className={`flex flex-col gap-[4pt] ${
                  addGap ? "mb-[12pt]" : ""
                }`}
              >
                <div className="font-bold">Zertifikate</div>
                <div className="flex flex-col gap-[3pt] min-w-0">
                  {formCv.documents.certificates.map((url, i) => (
                    <div key={i} className="flex flex-row gap-[6pt] min-w-0">
                      <span className="shrink-0">•</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline break-all min-w-0"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ),
          });
        }
      });
    }

    return blocks;
  }, [
    address,
    birthDate,
    birthPlace,
    childrenText,
    drivingText,
    email,
    formCv,
    fullName,
    hasDrivingLicense,
    hasLanguages,
    hasPcSkills,
    hasSoftSkills,
    maritalStatus,
    phone,
    photo,
    showDocuments,
    showSkillsSection,
    sortedEducation,
    sortedExperience,
  ]);

  const mainContentBottomPadPt = showComment ? 44 : 72;
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
    commentLines.length,
    A4_HEIGHT_PX,
    PT_TO_PX,
    fontReadyTick,
  ]);

  return (
    <section
      className={
        (containerClassName ||
          "hidden lg:block flex-1 min-w-0 h-[calc(100vh-2rem)] sticky top-4") +
        " relative"
      }
    >
      {/* Zoom controls live INSIDE the preview container so they stay accessible on narrower layouts.
          Mobile: bottom horizontal bar. Desktop/tablet: top-right vertical bar. */}
      {enableClickZoom ? (
        <>
          {/* Mobile zoom bar (bottom, horizontal) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 pointer-events-auto sm:hidden">
            <div className="rounded-2xl border border-base-200 bg-base-100/95 backdrop-blur shadow-lg px-3 py-2 flex items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
                onClick={() => setZoomClamped(zoomFactor - 0.05)}
                aria-label="Herauszoomen"
                title="Zoom -"
                disabled={zoomFactor <= zoomBounds.min + 0.0001}
              >
                −
              </button>
              <div className="flex flex-col gap-1 min-w-[220px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold text-base-content/70 tracking-wide select-none">
                    {Math.round(zoomFactor * 100)}%
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs normal-case h-auto min-h-0 px-2 py-1 text-[10px]"
                    onClick={() => setZoomClamped(1)}
                    aria-label="Zoom zurücksetzen"
                    title="Reset (100%)"
                  >
                    Reset
                  </button>
                </div>
                <input
                  type="range"
                  className="range range-primary w-full"
                  min={zoomBounds.min}
                  max={zoomBounds.max}
                  step={0.05}
                  value={zoomFactor}
                  onChange={(e) => setZoomClamped(e.target.value)}
                  aria-label="Zoom"
                />
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
                onClick={() => setZoomClamped(zoomFactor + 0.05)}
                aria-label="Hineinzoomen"
                title="Zoom +"
                disabled={zoomFactor >= zoomBounds.max - 0.0001}
              >
                +
              </button>
            </div>
          </div>

          {/* Desktop/tablet zoom bar (top-right, vertical) */}
          <div
            className={`absolute ${
              showToolbar ? "top-12" : "top-3"
            } right-3 sm:right-4 z-30 pointer-events-auto hidden sm:block`}
          >
            <div className="rounded-2xl border border-base-200 bg-base-100/95 backdrop-blur shadow-lg p-2 flex flex-col items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
                onClick={() => setZoomClamped(zoomFactor + 0.05)}
                aria-label="Hineinzoomen"
                title="Zoom +"
                disabled={zoomFactor >= zoomBounds.max - 0.0001}
              >
                +
              </button>

              <div className="flex flex-col items-center gap-2 flex-1 min-h-0 py-1">
                <div className="text-[10px] font-semibold text-base-content/70 tracking-wide select-none">
                  {Math.round(zoomFactor * 100)}%
                </div>
                <div
                  className="relative w-12 flex items-center justify-center"
                  style={{ height: `${ZOOM_RANGE_LEN_PX}px` }}
                >
                  <input
                    type="range"
                    className="range range-primary -rotate-90 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
                    min={zoomBounds.min}
                    max={zoomBounds.max}
                    step={0.05}
                    value={zoomFactor}
                    onChange={(e) => setZoomClamped(e.target.value)}
                    aria-label="Zoom"
                    style={{ width: `${ZOOM_RANGE_LEN_PX}px` }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs normal-case h-auto min-h-0 px-2 py-1 text-[10px]"
                  onClick={() => setZoomClamped(1)}
                  aria-label="Zoom zurücksetzen"
                  title="Reset (100%)"
                >
                  Reset
                </button>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200 active:bg-base-300 text-base-content shadow-sm flex items-center justify-center"
                onClick={() => setZoomClamped(zoomFactor - 0.05)}
                aria-label="Herauszoomen"
                title="Zoom -"
                disabled={zoomFactor <= zoomBounds.min + 0.0001}
              >
                −
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div className="bg-base-200/50 rounded-xl border border-base-300 shadow-inner h-full flex flex-col overflow-hidden">
        {showToolbar ? (
          <div className="bg-base-100 border-b border-base-200 px-4 py-2 flex justify-between items-center text-xs font-semibold text-base-content/70 uppercase tracking-wider z-10">
            <span>Vorschau (A4)</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live-Aktualisierung
            </span>
          </div>
        ) : null}

        <div
          ref={viewportRef}
          onPointerDown={(e) => {
            if (!enableClickZoom || !isZoomedIn) return;
            if (e.button != null && e.button !== 0) return; // left click only
            const el = viewportRef.current;
            if (!el) return;
            panStateRef.current.active = true;
            panStateRef.current.moved = false;
            panStateRef.current.startX = e.clientX;
            panStateRef.current.startY = e.clientY;
            panStateRef.current.startLeft = el.scrollLeft;
            panStateRef.current.startTop = el.scrollTop;
            setIsPanning(true);
            try {
              el.setPointerCapture?.(e.pointerId);
            } catch {
              // ignore
            }
          }}
          onPointerMove={(e) => {
            if (!enableClickZoom || !isZoomedIn) return;
            const st = panStateRef.current;
            if (!st.active) return;
            const el = viewportRef.current;
            if (!el) return;
            const dx = e.clientX - st.startX;
            const dy = e.clientY - st.startY;
            if (!st.moved && Math.hypot(dx, dy) > 3) st.moved = true;
            el.scrollLeft = st.startLeft - dx;
            el.scrollTop = st.startTop - dy;
          }}
          onPointerUp={(e) => {
            if (!enableClickZoom || !isZoomedIn) return;
            const el = viewportRef.current;
            panStateRef.current.active = false;
            setIsPanning(false);
            try {
              el?.releasePointerCapture?.(e.pointerId);
            } catch {
              // ignore
            }
          }}
          onPointerCancel={(e) => {
            if (!enableClickZoom || !isZoomedIn) return;
            const el = viewportRef.current;
            panStateRef.current.active = false;
            setIsPanning(false);
            try {
              el?.releasePointerCapture?.(e.pointerId);
            } catch {
              // ignore
            }
          }}
          className={`flex-1 overflow-y-auto w-full bg-base-200 ${
            enableClickZoom && isZoomedIn
              ? "overflow-x-auto"
              : "overflow-x-hidden"
          }`}
          style={{
            // Prevent the browser from turning drag into text selection while panning.
            userSelect: enableClickZoom && isZoomedIn ? "none" : undefined,
            // Allow smooth "paper drag" on touch/trackpad too.
            touchAction: enableClickZoom && isZoomedIn ? "none" : undefined,
          }}
        >
          <div
            className={`w-full flex flex-col gap-6 py-6 ${
              enableClickZoom && isZoomedIn
                ? "items-start px-6"
                : "items-center"
            }`}
          >
            {/* Hidden measurement canvas (for pagination) */}
            <div
              aria-hidden="true"
              className="absolute -left-[99999px] top-0 h-0 overflow-hidden opacity-0 pointer-events-none"
            >
              <div
                className="bg-base-100 text-base-content text-[11pt] leading-[1.38] box-border"
                style={{
                  fontFamily: "Inter, Helvetica, Arial, sans-serif",
                  width: `${A4_WIDTH_PT}pt`,
                  padding: "44pt",
                  paddingBottom: `${mainContentBottomPadPt}pt`,
                }}
              >
                <div
                  ref={mainMeasureRef}
                  style={{ position: "relative", width: "100%" }}
                >
                  {mainBlocks.map((b) => (
                    <div
                      key={b.id}
                      data-main-block
                      className={b.kind === "header" ? "" : "pr-[6pt]"}
                    >
                      {b.node}
                    </div>
                  ))}
                  <div data-main-sentinel />
                </div>
              </div>

              <div
                className="bg-base-100 text-base-content text-[11pt] leading-normal box-border"
                style={{
                  fontFamily: "Inter, Helvetica, Arial, sans-serif",
                  width: `${A4_WIDTH_PT}pt`,
                  height: `${A4_HEIGHT_PT}pt`,
                  padding: "44pt",
                  paddingBottom: "72pt",
                }}
              >
                <div ref={commentHeaderMeasureRef} className="mb-[18pt]">
                  <div className="text-[24pt] font-bold leading-tight">
                    Erst- und Zweitgesprächsfeedback
                  </div>
                  {rating !== null && rating > 0 && (
                    <div className="flex items-center gap-1 mt-2 mb-1">
                      {renderStars(rating)}
                    </div>
                  )}
                  <div className="h-[2pt] bg-base-content/80 mt-[17pt] mb-[12pt] w-full" />
                </div>
                <div
                  ref={commentBodyMeasureRef}
                  className="mt-[10pt] text-[11pt] leading-normal whitespace-pre-wrap break-words"
                >
                  {commentLineEntries.map((entry) => (
                    <div key={entry.id} data-comment-line-block>
                      {renderCommentLine(entry)}
                    </div>
                  ))}
                  <div data-comment-line-sentinel />
                </div>
              </div>
            </div>

            {/* Main pages (auto-paginated) */}
            {resolvedMainPageGroups.map((group, pageIdx) => {
              const blocksForPage = group
                .map((i) => mainBlocks[i])
                .filter(Boolean);
              const showFooter =
                !showComment && pageIdx === Math.max(0, mainPageCount - 1);

              return (
                <ScaledA4
                  key={`main-${pageIdx}`}
                  pageLabel={`A4-Seite ${pageIdx + 1}`}
                >
                  <div
                    className={`bg-base-100 shadow-2xl text-base-content text-[11pt] leading-[1.38] origin-top shrink-0 box-border overflow-hidden ${
                      showFooter ? "relative" : ""
                    }`}
                    style={{
                      fontFamily: "Inter, Helvetica, Arial, sans-serif",
                      width: `${A4_WIDTH_PT}pt`,
                      height: `${A4_HEIGHT_PT}pt`,
                      padding: "44pt",
                      paddingBottom: `${mainContentBottomPadPt}pt`,
                    }}
                  >
                    {blocksForPage.map((b) => (
                      <div
                        key={b.id}
                        className={b.kind === "header" ? "" : "pr-[6pt]"}
                      >
                        {b.node}
                      </div>
                    ))}

                    {/* Footer on the last page (when Kommentar page is hidden) */}
                    {showFooter && showCommentDate && (
                      <div className="absolute left-[44pt] right-[44pt] bottom-[34pt]">
                        <div className="text-[10pt] text-right">
                          Datum: {commentDate || "—"}
                        </div>
                        <div className="text-[9pt] text-center">
                          {autoGeneratedNote}
                        </div>
                      </div>
                    )}
                  </div>
                </ScaledA4>
              );
            })}

            {/* Legacy single-page render (disabled) */}
            {false && (
              <>
                {/* Page 1 */}
                <ScaledA4 pageLabel="A4-Seite 1">
                  <div
                    className={`bg-white shadow-2xl text-[#0f172a] text-[11pt] leading-[1.38] origin-top shrink-0 box-border ${
                      showComment ? "" : "relative"
                    }`}
                    style={{
                      fontFamily: "Inter, Helvetica, Arial, sans-serif",
                      width: `${A4_WIDTH_PT}pt`,
                      height: `${A4_HEIGHT_PT}pt`,
                      padding: "44pt",
                      paddingBottom: showComment ? "44pt" : "72pt",
                    }}
                  >
                    <div className="flex flex-col gap-[18pt]">
                      {/* Header */}
                      <div className="mb-[18pt]">
                        <h1 className="text-[24pt] font-bold text-[#0f172a] leading-tight">
                          {fullName}
                        </h1>
                        <div className="h-[2pt] bg-[#1f2937] mt-[17pt] mb-[12pt] w-full" />

                        <div className="flex flex-row gap-[22pt] min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-[6pt] mt-1">
                              <PreviewInfoRow label="Name" value={fullName} />
                              <PreviewInfoRow
                                label="Anschrift"
                                value={address}
                              />
                              <PreviewInfoRow
                                label="Geburtsdatum"
                                value={birthDate}
                              />
                              <PreviewInfoRow
                                label="Geburtsort"
                                value={birthPlace || "—"}
                              />
                              <PreviewInfoRow
                                label="Familienstand"
                                value={maritalStatus}
                              />
                              <PreviewInfoRow
                                label="Kinder"
                                value={childrenText}
                              />
                              <PreviewInfoRow label="Tel" value={phone} />
                              <PreviewInfoRow label="E-Mail" value={email} />
                            </div>
                          </div>

                          <div className="shrink-0">
                            {photo ? (
                              <img
                                src={photo}
                                alt="Foto"
                                role="button"
                                tabIndex={0}
                                onClick={onPhotoClick}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onPhotoClick();
                                  }
                                }}
                                onMouseDown={(e) => {
                                  // Don't toggle page zoom when interacting with the photo preview.
                                  e.stopPropagation();
                                }}
                                onPointerDown={(e) => {
                                  // Don't start drag-pan on the photo element.
                                  e.stopPropagation();
                                }}
                                className="w-[128pt] h-[160pt] object-cover border border-[#d9dee3] rounded-[8pt] cursor-zoom-in transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                              />
                            ) : (
                              <div className="w-[128pt] h-[160pt] border border-[#d9dee3] rounded-[8pt] flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                                Foto
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 pr-[6pt]">
                        {/* Berufliche Laufbahn */}
                        {sortedExperience.length > 0 && (
                          <>
                            <PreviewSectionTitle>
                              Berufliche Laufbahn
                            </PreviewSectionTitle>
                            <div className="flex flex-col gap-[10pt] min-w-0">
                              {sortedExperience.map((exp, i) => (
                                <div
                                  key={i}
                                  className="flex flex-row gap-[10pt] min-w-0"
                                >
                                  <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                                    {(exp.startDate || "—") +
                                      " – " +
                                      (exp.endDate || "heute")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[#0f172a] wrap-break-word">
                                      {exp.position || "—"}
                                      {exp.location ? `, ${exp.location}` : ""}
                                    </div>
                                    {exp.company && (
                                      <div className="italic text-[#475569]">
                                        {exp.company}
                                      </div>
                                    )}
                                    {Array.isArray(exp.responsibilities) &&
                                      exp.responsibilities.length > 0 && (
                                        <div className="mt-[4pt]">
                                          {exp.responsibilities.map((r, ri) => (
                                            <div
                                              key={ri}
                                              className="flex flex-row gap-[6pt] min-w-0"
                                            >
                                              <span className="shrink-0">
                                                •
                                              </span>
                                              <span className="min-w-0 wrap-break-word">
                                                {r}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Ausbildung */}
                        {sortedEducation.length > 0 && (
                          <>
                            <PreviewSectionTitle>
                              Ausbildung
                            </PreviewSectionTitle>
                            <div className="flex flex-col gap-[10pt] min-w-0">
                              {sortedEducation.map((edu, i) => (
                                <div
                                  key={i}
                                  className="flex flex-row gap-[10pt] min-w-0"
                                >
                                  <div className="w-[140pt] shrink-0 font-bold text-[#475569]">
                                    {(edu.startDate || "—") +
                                      " – " +
                                      (edu.endDate || "—")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="wrap-break-word">
                                      {edu.institution || "—"}
                                    </div>
                                    <div className="italic text-[#475569]">
                                      Abschluss: {edu.degree || "—"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Kenntnisse & Fähigkeiten */}
                        {showSkillsSection && (
                          <>
                            <PreviewSectionTitle>
                              Kenntnisse & Fähigkeiten
                            </PreviewSectionTitle>
                            <div className="flex flex-col gap-[12pt] min-w-0">
                              {hasDrivingLicense && (
                                <div className="flex flex-col gap-[4pt]">
                                  <div className="font-bold">Führerschein</div>
                                  <div className="flex flex-col gap-[3pt] min-w-0">
                                    <div className="flex flex-row gap-[6pt] min-w-0">
                                      <span className="shrink-0">•</span>
                                      <span className="min-w-0 wrap-break-word">
                                        {drivingText}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {hasLanguages && (
                                <div className="flex flex-col gap-[4pt]">
                                  <div className="font-bold">Sprachen</div>
                                  <div className="flex flex-col gap-[3pt] min-w-0">
                                    {Object.entries(
                                      formCv.skills.languages,
                                    ).map(([lang, level]) => (
                                      <div
                                        key={lang}
                                        className="flex flex-row gap-[6pt] min-w-0"
                                      >
                                        <span className="shrink-0">•</span>
                                        <span className="min-w-0 wrap-break-word">
                                          {lang} — {level}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {hasSoftSkills && (
                                <div className="flex flex-col gap-[4pt]">
                                  <div className="font-bold">Fähigkeiten</div>
                                  <div className="flex flex-col gap-[3pt] min-w-0">
                                    {formCv.skills.softSkills.map((s, i) => (
                                      <div
                                        key={i}
                                        className="flex flex-row gap-[6pt] min-w-0"
                                      >
                                        <span className="shrink-0">•</span>
                                        <span className="min-w-0 wrap-break-word">
                                          {s}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {hasPcSkills && (
                                <div className="flex flex-col gap-[4pt]">
                                  <div className="font-bold">PC-Kenntnisse</div>
                                  <div className="flex flex-col gap-[3pt] min-w-0">
                                    {formCv.skills.pcSkills.map((s, i) => (
                                      <div
                                        key={i}
                                        className="flex flex-row gap-[6pt] min-w-0"
                                      >
                                        <span className="shrink-0">•</span>
                                        <span className="min-w-0 wrap-break-word">
                                          {s}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Dokumente */}
                        {showDocuments &&
                          (formCv.documents?.diplomas?.length > 0 ||
                            formCv.documents?.certificates?.length > 0 ||
                            formCv.documents?.passport?.length > 0) && (
                            <>
                              <PreviewSectionTitle>
                                Dokumente
                              </PreviewSectionTitle>
                              <div className="flex flex-col gap-[12pt]">
                                {formCv.documents.passport?.length > 0 && (
                                  <div className="flex flex-col gap-[4pt]">
                                    <div className="font-bold">Reisepass</div>
                                    <div className="flex flex-col gap-[3pt]">
                                      {formCv.documents.passport.map(
                                        (url, i) => (
                                          <div
                                            key={i}
                                            className="flex flex-row gap-[6pt]"
                                          >
                                            <span>•</span>
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-blue-600 hover:underline break-all"
                                            >
                                              {url}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                                {formCv.documents.diplomas?.length > 0 && (
                                  <div className="flex flex-col gap-[4pt]">
                                    <div className="font-bold">Diplome</div>
                                    <div className="flex flex-col gap-[3pt]">
                                      {formCv.documents.diplomas.map(
                                        (url, i) => (
                                          <div
                                            key={i}
                                            className="flex flex-row gap-[6pt]"
                                          >
                                            <span>•</span>
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-blue-600 hover:underline break-all"
                                            >
                                              {url}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                                {formCv.documents.certificates?.length > 0 && (
                                  <div className="flex flex-col gap-[4pt]">
                                    <div className="font-bold">Zertifikate</div>
                                    <div className="flex flex-col gap-[3pt]">
                                      {formCv.documents.certificates.map(
                                        (url, i) => (
                                          <div
                                            key={i}
                                            className="flex flex-row gap-[6pt]"
                                          >
                                            <span>•</span>
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-blue-600 hover:underline break-all"
                                            >
                                              {url}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                    {/* Footer on the last page (when Kommentar page is hidden) */}
                    {!showComment && showCommentDate && (
                      <div className="absolute left-[44pt] right-[44pt] bottom-[34pt] text-[#0f172a]">
                        <div className="text-[10pt] text-right">
                          Datum: {commentDate || "—"}
                        </div>
                        <div className="text-[9pt] text-center">
                          {autoGeneratedNote}
                        </div>
                      </div>
                    )}
                  </div>
                </ScaledA4>
              </>
            )}

            {/* Kommentar pages (auto-paginated, can be 1..N pages) */}
            {showComment &&
              resolvedCommentPageGroups.map((group, commentPageIdx) => (
                <ScaledA4
                  key={`comment-${commentPageIdx}`}
                  pageLabel={`A4-Seite ${mainPageCount + commentPageIdx + 1}`}
                >
                  <div
                    className="bg-base-100 shadow-2xl text-base-content text-[11pt] leading-normal origin-top shrink-0 relative box-border overflow-hidden"
                    style={{
                      fontFamily: "Inter, Helvetica, Arial, sans-serif",
                      width: `${A4_WIDTH_PT}pt`,
                      height: `${A4_HEIGHT_PT}pt`,
                      padding: "44pt",
                      paddingBottom: "72pt",
                    }}
                  >
                    {commentPageIdx === 0 && (
                      <div className="mb-[18pt]">
                        <div className="text-[24pt] font-bold leading-tight">
                          Erst- und Zweitgesprächsfeedback
                        </div>
                        {rating !== null && rating > 0 && (
                          <div className="flex items-center gap-1 mt-2 mb-1">
                            {renderStars(rating)}
                          </div>
                        )}
                        <div className="h-[2pt] bg-base-content/80 mt-[17pt] mb-[12pt] w-full" />
                      </div>
                    )}
                    <div
                      className={`text-[11pt] leading-normal whitespace-pre-wrap break-words ${
                        commentPageIdx === 0 ? "mt-[10pt]" : ""
                      }`}
                    >
                      {group.map((lineIdx) => {
                        const item = commentLineEntries[lineIdx];
                        if (!item) return null;
                        return (
                          <div key={item.id}>{renderCommentLine(item)}</div>
                        );
                      })}
                    </div>

                    {/* Footer (match PDF) */}
                    {commentPageIdx === resolvedCommentPageGroups.length - 1 &&
                      showCommentDate && (
                        <div className="absolute left-[44pt] right-[44pt] bottom-[34pt]">
                          <div className="text-[10pt] text-right">
                            Datum: {commentDate || "—"}
                          </div>
                          <div className="text-[9pt] text-center">
                            {autoGeneratedNote}
                          </div>
                        </div>
                      )}
                  </div>
                </ScaledA4>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
