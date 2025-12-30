import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Link,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FaDownload,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { pdf } from "@react-pdf/renderer";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { extractPassportCanvasFromCanvas } from "../utils/passportImageProcessing";
import CvPdfDocument from "./generate/pdf/CvPdfDocument";
import FormInput from "../components/FormInput";
import PhoneInputWithCountry from "../components/PhoneInputWithCountry";
import {
  getPhoneBodyDigits,
  isEmailValid,
  isPhoneComplete,
  isPassportNumberValid,
  normalizePassportNumber,
} from "../utils/validation";
import CountryNameCombobox from "../components/CountryNameCombobox";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import LanguagesSection from "../components/LanguagesSection";
import CollapsibleSection from "../components/CollapsibleSection";
import {
  addCandidateWithDualStats,
  deleteCandidateWithCurrentStats,
  getDocumentDataById,
  getRemoteUserRecord,
  subscribeToCollections,
  subscribeToMetaByName,
  upsertEmailAndPassIdFirestore,
  upsertUserRemoteAllUsers,
  deleteEmailAndPassIdByEmail,
  saveArchivedUserSnapshotFirestore,
  saveDeletedUserSnapshotFirestore,
  imageFileToBase64,
  uploadFileToConsulting,
  toInputDate,
  fromInputDate,
  generateSkills,
  sortTimelineItemsDesc,
  updateDocument,
  updateCandidateWithDualStats,
  updateEmailRemote,
  getMetaByName,
  hasRichTextContent,
  commentHtmlToPlainText,
  DEFAULT_COMMENT_TEMPLATE_HTML,
  deleteUploadedFileRemote,
  toInputMonth,
  fromInputMonth,
} from "../utils";
import CandidateStatusStepper from "../components/CandidateStatusStepper";
import {
  CANDIDATE_STATUS_DEFAULT,
  CANDIDATE_STATUS_OPTIONS,
  getCandidateStatus,
  normalizeCandidateStatusValue,
} from "../constants/candidateStatus";
import {
  buildStatusEmailTemplate,
  getStatusEmailCopy,
} from "../utils/statusEmail";
import {
  generateTelegramInviteLink,
  trackTelegramInviteSent,
} from "../utils/telegramInvites";
import { sendBrevoEmail } from "../utils/brevo";
import RichTextEditor from "../components/RichTextEditor";
import { useUserRole } from "../hooks/useUserRole";
import DeleteCandidateModal from "../components/DeleteCandidateModal";
import UnsavedChangesModal from "../components/UnsavedChangesModal";
import PhotoModal from "./generate/components/modals/PhotoModal";
import StageEmailModal from "./generate/components/modals/StageEmailModal";
import CustomEmailModal from "./generate/components/modals/CustomEmailModal";
import LivePreview from "./generate/components/LivePreview";
import SelectMajorModal from "../components/SelectMajorModal";
import { restoreRemoteRecordToFirebase } from "./candidates/remoteUserUtils";
import { UZBEK_REGIONS } from "../constants/uzbekRegions";
import { LANGUAGE_OPTIONS } from "../constants/languageOptions";
import { DOCUMENT_TEMPLATES } from "../constants/documentTemplates";
import BeratungsvertragPdfDocument from "./contract/pdf/BeratungsvertragPdfDocument";
import VermittlungsvertragPdfDocument from "./contract/pdf/VermittlungsvertragPdfDocument";
import VollmachtPdfDocument from "./contract/pdf/VollmachtPdfDocument";
import VollmachtArbeitgeberPdfDocument from "./contract/pdf/VollmachtArbeitgeberPdfDocument";
import {
  makeEmailTemplateId,
  subscribeToEmailTemplates,
  toCopyOverridesFromTemplateDoc,
} from "../utils/emailTemplates";

function safeJson(value, space = 2, maxLen = 120_000) {
  try {
    const s = JSON.stringify(value, null, space);
    if (typeof s === "string" && s.length > maxLen) {
      return `${s.slice(0, maxLen)}\n... (truncated ${
        s.length - maxLen
      } chars)`;
    }
    return s;
  } catch (e) {
    return `"(unserializable)" ${e?.message || ""}`.trim();
  }
}

function safeClone(value) {
  // structuredClone is not available in some environments (older browsers / webviews).
  // Our form state is plain JSON, so JSON clone is an acceptable fallback.
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {
    // ignore and fallback to JSON clone
  }
  return JSON.parse(JSON.stringify(value ?? null));
}

function todayDdMmYyyy() {
  try {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

async function blobToDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

function normalizeMaybeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw;
}

function getFunctionsBaseCandidates() {
  const out = [];
  const explicit = String(import.meta?.env?.VITE_FUNCTIONS_BASE || "").trim();
  if (explicit) out.push(explicit);

  // Fallback: derive Functions base from Firebase project id (works in many setups)
  // Note: HTTP Functions default region is typically `us-central1` unless configured otherwise.
  const projectId = String(
    import.meta?.env?.VITE_FIREBASE_PROJECT_ID || ""
  ).trim();
  if (projectId) {
    out.push(`https://us-central1-${projectId}.cloudfunctions.net`);
    // Some projects deploy in the same region as Firestore (your firebase.json uses europe-west3).
    out.push(`https://europe-west3-${projectId}.cloudfunctions.net`);
  }

  const normalized = out
    .map((b) =>
      String(b || "")
        .trim()
        .replace(/\/+$/, "")
    )
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function buildProxyAssetUrlCandidates(rawUrl) {
  const raw = normalizeMaybeUrl(rawUrl);
  if (!raw) return [];

  // We only proxy json-api.uz URLs (the backend allowlist enforces this too).
  let u;
  try {
    u = new URL(raw);
  } catch {
    return [];
  }
  const host = String(u.hostname || "").toLowerCase();
  const isJsonApi = host === "json-api.uz";
  if (!isJsonApi) return [];

  // Local dev fallback: Vite proxy (same-origin).
  try {
    let isLocalhost = false;
    try {
      const lh = String(window?.location?.hostname || "").toLowerCase();
      isLocalhost =
        lh === "localhost" ||
        lh === "127.0.0.1" ||
        lh === "::1" ||
        /^192\.168\.\d+\.\d+$/.test(lh);
    } catch {
      // ignore
    }
    const isDev = Boolean(import.meta?.env?.DEV) || isLocalhost;
    if (isDev) {
      return [`/__pdf_proxy${u.pathname}${u.search || ""}`];
    }
  } catch {
    // ignore
  }

  // Production: Firebase Functions proxy (CORS bypass)
  const bases = getFunctionsBaseCandidates();
  return bases.map(
    (base) => `${String(base)}/proxyPdf?url=${encodeURIComponent(raw)}`
  );
}

function buildProxyAssetUrl(rawUrl) {
  const candidates = buildProxyAssetUrlCandidates(rawUrl);
  return candidates[0] || normalizeMaybeUrl(rawUrl);
}

function sniffFileKindFromArrayBuffer(ab) {
  try {
    const u8 = new Uint8Array(ab instanceof ArrayBuffer ? ab : []);
    if (u8.length >= 5) {
      // %PDF-
      if (
        u8[0] === 0x25 &&
        u8[1] === 0x50 &&
        u8[2] === 0x44 &&
        u8[3] === 0x46 &&
        u8[4] === 0x2d
      )
        return "pdf";
    }
    if (u8.length >= 3) {
      // JPEG: FF D8 FF
      if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "jpeg";
    }
    if (u8.length >= 8) {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (
        u8[0] === 0x89 &&
        u8[1] === 0x50 &&
        u8[2] === 0x4e &&
        u8[3] === 0x47 &&
        u8[4] === 0x0d &&
        u8[5] === 0x0a &&
        u8[6] === 0x1a &&
        u8[7] === 0x0a
      )
        return "png";
    }
    if (u8.length >= 12) {
      // WEBP: RIFF....WEBP
      const riff =
        u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46;
      const webp =
        u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50;
      if (riff && webp) return "webp";
    }
  } catch {
    // ignore
  }
  return "unknown";
}

function rotateCanvas180(srcCanvas) {
  try {
    const sw = srcCanvas?.width || 0;
    const sh = srcCanvas?.height || 0;
    if (!sw || !sh) return null;
    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const ctx = out.getContext("2d", { alpha: false });
    if (!ctx) return null;
    // white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.translate(out.width, out.height);
    ctx.rotate(Math.PI);
    ctx.drawImage(srcCanvas, 0, 0);
    return out;
  } catch {
    return null;
  }
}

async function blobToJpegDataUrlBestEffort(blob, { quality = 0.92 } = {}) {
  try {
    const b = blob instanceof Blob ? blob : null;
    if (!b) return "";
    const objUrl = URL.createObjectURL(b);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width || 0;
      canvas.height = img.naturalHeight || img.height || 0;
      if (!canvas.width || !canvas.height) return "";
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.imageSmoothingEnabled = true;
      try {
        ctx.imageSmoothingQuality = "high";
      } catch {
        // ignore
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const processed =
        extractPassportCanvasFromCanvas(canvas, {
          paddingLeftRightPx: 40,
          paddingBottomPx: 60,
          paddingTopPx: 8,
        }) || canvas;
      // Keep same behavior as /settings/documents/beratungsvertrag live preview:
      // After robust crop+rotation normalization, rotate 180° to match scan output.
      const rotated = rotateCanvas180(processed) || processed;
      return rotated.toDataURL("image/jpeg", quality);
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } catch {
    return "";
  }
}

async function pdfArrayBufferFirstPageToJpegDataUrlBestEffort(
  arrayBuffer,
  {
    scale = 2,
    quality = 0.92,
    // Crop away blank margins so embedded passport images don't look tiny in PDFs.
    crop = true,
    whiteThreshold = 245,
    cropPaddingTopBottomPx = 60,
    cropPaddingLeftRightPx = 40,
    forcePortrait = true,
  } = {}
) {
  try {
    // pdfjs needs a worker; set it once (best-effort)
    try {
      // eslint-disable-next-line no-param-reassign
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
    } catch {
      // ignore
    }

    const ab = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : null;
    if (!ab) return "";
    // pdfjs is most reliable with Uint8Array input
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) })
      .promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    await page.render({ canvasContext: ctx, viewport }).promise;

    if (!crop) return canvas.toDataURL("image/jpeg", quality);

    // ---- Robust crop + rotation normalization (passport-only) ----
    try {
      const processed =
        extractPassportCanvasFromCanvas(canvas, {
          paddingLeftRightPx: cropPaddingLeftRightPx,
          paddingBottomPx: cropPaddingTopBottomPx,
          paddingTopPx: 8,
        }) || canvas;
      // Keep same behavior as /settings/documents/beratungsvertrag live preview:
      // After robust crop+rotation normalization, rotate 180° to match scan output.
      const rotated = rotateCanvas180(processed) || processed;
      // forcePortrait kept for compatibility; extractor already prefers portrait
      return rotated.toDataURL("image/jpeg", quality);
    } catch {
      return canvas.toDataURL("image/jpeg", quality);
    }
  } catch {
    return "";
  }
}

async function fetchUrlAsImageDataUrlBestEffort(url) {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) return "";
  try {
    const proxyCandidates = buildProxyAssetUrlCandidates(safeUrl);
    const rawAttempt = normalizeMaybeUrl(safeUrl);
    // IMPORTANT:
    // In production, json-api.uz links can work directly (CORS enabled for admin origin).
    // The Contract template page works even without Functions base by using the raw URL.
    // So we always try the raw URL first, then fall back to proxies.
    const tryUrls = Array.from(
      new Set([rawAttempt, ...(proxyCandidates || [])].filter(Boolean))
    );

    let res = null;
    for (const attemptUrl of tryUrls) {
      try {
        const r = await fetch(String(attemptUrl || ""), { method: "GET" });
        if (r && r.ok) {
          res = r;
          break;
        }
      } catch {
        // ignore and try next
      }
    }
    if (!res) return "";

    const ct = String(res.headers.get("content-type") || "").toLowerCase();
    const ab = await res.arrayBuffer();
    const sniffed = sniffFileKindFromArrayBuffer(ab);
    const looksPdf =
      sniffed === "pdf" ||
      ct.includes("application/pdf") ||
      safeUrl.toLowerCase().includes(".pdf");

    if (looksPdf) {
      const jpg = await pdfArrayBufferFirstPageToJpegDataUrlBestEffort(ab);
      return jpg || "";
    }

    const mimeFromSniff =
      sniffed === "jpeg"
        ? "image/jpeg"
        : sniffed === "png"
        ? "image/png"
        : sniffed === "webp"
        ? "image/webp"
        : "";
    const blob = new Blob([ab], {
      type:
        mimeFromSniff ||
        (ct.startsWith("image/") ? ct : "application/octet-stream"),
    });

    const jpeg = await blobToJpegDataUrlBestEffort(blob);
    if (jpeg) return jpeg;
    return "";
  } catch {
    return "";
  }
}

function toDateTimeLocalString(value) {
  if (!value) return "";
  function formatDateTimeLocalInTimeZone(date, timeZone) {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) return "";
      const formatter = new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      });
      const parts = formatter.formatToParts(d).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
      if (
        !parts.year ||
        !parts.month ||
        !parts.day ||
        !parts.hour ||
        !parts.minute
      ) {
        return "";
      }
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    } catch {
      return "";
    }
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    // datetime-local: yyyy-mm-ddThh:mm
    // If it's already a plain datetime-local string (NO timezone info), keep as-is.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(s))
      return s.slice(0, 16);
    // If it contains timezone (Z or +hh:mm/-hh:mm), normalize to Asia/Tashkent for the input.
    if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) {
      const out = formatDateTimeLocalInTimeZone(new Date(s), "Asia/Tashkent");
      if (out) return out;
    }
    // yyyy-mm-dd -> yyyy-mm-ddT00:00
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;
    // dd.mm.yyyy -> yyyy-mm-ddT00:00
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}T00:00`;
    }
    return "";
  }
  if (typeof value === "number") {
    // IMPORTANT: datetime-local expects *local wall time*; toISOString() is UTC and shifts time.
    // We standardize on Toshkent time for scheduling fields.
    return formatDateTimeLocalInTimeZone(new Date(value), "Asia/Tashkent");
  }
  return "";
}

function inferLinkType(link, fallback = "zoom") {
  const raw = String(link || "").toLowerCase();
  if (raw.includes("t.me/") || raw.includes("telegram")) return "telegram";
  return fallback;
}

function createEmptyStageInfo() {
  return {
    dateTime: "",
    link: "",
    linkType: "zoom",
    useGeneratedLink: false,
    locationName: "",
    locationUrl: "",
  };
}

function getTelegramGroupIdForStage(metaInfo, stageValue) {
  const meta = metaInfo && typeof metaInfo === "object" ? metaInfo : {};
  const internalType = String(
    meta?.interviewInternal?.linkType || ""
  ).toLowerCase();
  const employerType = String(
    meta?.interviewEmployer?.linkType || ""
  ).toLowerCase();
  const internal =
    internalType === "telegram"
      ? String(meta?.interviewInternal?.telegramGroupId || "").trim()
      : "";
  const employer =
    employerType === "telegram"
      ? String(meta?.interviewEmployer?.telegramGroupId || "").trim()
      : "";
  const stage = String(stageValue || "").trim();
  if (stage === "stage_1" || stage === "stage_2") return internal || "";
  if (stage === "stage_3" || stage === "stage_4")
    return employer || internal || "";
  return internal || employer || "";
}

function ensureTelegramGroupNameFactory({
  getDocFn,
  docFn,
  dbRef,
  cacheRef,
  setMap,
}) {
  return async function ensureTelegramGroupName(groupDocId) {
    const id = String(groupDocId || "").trim();
    if (!id) return "";
    const cached = cacheRef.current?.[id];
    if (cached) return String(cached || "");
    try {
      const snap = await getDocFn(docFn(dbRef, "telegram_groups", id));
      const data = snap.exists() ? snap.data() || {} : {};
      const name = String(data?.name || "").trim() || id;
      cacheRef.current = { ...(cacheRef.current || {}), [id]: name };
      setMap((prev) => ({ ...(prev || {}), [id]: name }));
      return name;
    } catch {
      const fallback = id;
      cacheRef.current = { ...(cacheRef.current || {}), [id]: fallback };
      setMap((prev) => ({ ...(prev || {}), [id]: fallback }));
      return fallback;
    }
  };
}

function formatGermanAddress(parts) {
  const street = String(parts?.street || "").trim();
  const houseNumber = String(parts?.houseNumber || "").trim();
  const postalCode = String(parts?.postalCode || "").trim();
  const city = String(parts?.city || "").trim();
  const country = String(parts?.country || "").trim();

  const streetLine = [street, houseNumber].filter(Boolean).join(" ").trim();
  const cityLine = [postalCode, city].filter(Boolean).join(" ").trim();
  return [streetLine, cityLine, country].filter(Boolean).join(", ").trim();
}

function parseGermanAddress(raw) {
  const normalized = String(raw || "")
    .replace(/\s*\n+\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return {
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "",
    };
  }

  const parts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let streetLine = normalized;
  let postalCode = "";
  let city = "";
  let country = "";

  // If we have 3 parts like: "Street 1", "12345 Berlin", "Deutschland"
  if (parts.length >= 3) {
    const maybeCountry = parts[parts.length - 1];
    if (maybeCountry && !/\d/.test(maybeCountry)) {
      country = maybeCountry;
      streetLine = parts.slice(0, parts.length - 1).join(", ");
    }
  }

  // Split off postal code + city at the end, if present:
  // "... , 12345 Berlin" (DE) or "... , 150100 Fergana" (UZ)
  // Create.jsx currently collects 6-digit codes, so we support both 5 and 6 digits
  // to avoid corrupt parsing ("1" leaking into house number, etc.).
  const mPlz = streetLine.match(/^(.*?)(?:,\s*)?(\d{5,6})\s+(.+)$/);
  if (mPlz) {
    streetLine = String(mPlz[1] || "")
      .trim()
      .replace(/,+\s*$/, "");
    postalCode = String(mPlz[2] || "").trim();
    city = String(mPlz[3] || "").trim();
  }

  let street = streetLine;
  let houseNumber = "";
  const mHouse = streetLine.match(/^(.*\D)\s+(\d+\w*)$/);
  if (mHouse) {
    street = String(mHouse[1] || "").trim();
    houseNumber = String(mHouse[2] || "").trim();
  }

  return { street, houseNumber, postalCode, city, country };
}

function isGermanAddressComplete(parts) {
  return (
    Boolean(String(parts?.street || "").trim()) &&
    Boolean(String(parts?.houseNumber || "").trim()) &&
    /^\d{5,6}$/.test(String(parts?.postalCode || "").trim()) &&
    Boolean(String(parts?.city || "").trim()) &&
    Boolean(String(parts?.country || "").trim())
  );
}

function Generate() {
  const { major, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sp = useMemo(
    () => new URLSearchParams(String(location?.search || "")),
    [location?.search]
  );
  const remoteMode = sp.get("remote") === "1";
  const remoteKind = String(sp.get("kind") || "")
    .trim()
    .toLowerCase();
  const remoteRid = String(sp.get("rid") || "").trim();
  const deletedDocId = String(sp.get("deletedDocId") || "").trim();
  const archivedDocId = String(sp.get("archivedDocId") || "").trim();
  const stateRemoteRecord = useMemo(() => {
    const st = location?.state;
    if (!st || typeof st !== "object") return null;
    const rec = st.remoteRecord;
    return rec && typeof rec === "object" ? rec : null;
  }, [location?.state]);
  const DEBUG_GENERATE = useMemo(() => {
    try {
      if (import.meta.env.DEV) return true;
      // Enable debug logs in production via URL: /generate/...?...&debug=1
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("debug") === "1") return true;
      }
      // Optional build-time flag
      return String(import.meta.env.VITE_DEBUG_GENERATE || "") === "true";
    } catch {
      return false;
    }
  }, []);
  const DRIVING_LICENSE_OPTIONS = useMemo(
    () => [
      "AM",
      "A1",
      "A2",
      "A",
      "B",
      "BE",
      "C1",
      "C1E",
      "C",
      "CE",
      "D1",
      "D1E",
      "D",
      "DE",
      "T",
    ],
    []
  );
  const [docCv, setDocCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusValue, setStatusValue] = useState(CANDIDATE_STATUS_DEFAULT);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [sendingStepValue, setSendingStepValue] = useState(null);
  const sendingEmailLockRef = useRef(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  const [metaInfo, setMetaInfo] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  // Cache telegram group names by Firestore doc id (telegram_groups/{id})
  const telegramGroupNameCacheRef = useRef({});
  const [telegramGroupNameById, setTelegramGroupNameById] = useState({});
  const [resolvedMajor, setResolvedMajor] = useState({
    collectionName: "",
    title: "",
    linkId: "",
  });

  const ensureTelegramGroupName = useMemo(() => {
    // stable function that can update local cache + state
    return ensureTelegramGroupNameFactory({
      getDocFn: getDoc,
      docFn: doc,
      dbRef: db,
      cacheRef: telegramGroupNameCacheRef,
      setMap: setTelegramGroupNameById,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { user } = useSelector((state) => state.auth);
  const { role: userRole } = useUserRole();

  // Remote-mode restore UI (for candidates/* -> Generate)
  const [remoteRecord, setRemoteRecord] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [majors, setMajors] = useState([]);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [majorModalKey, setMajorModalKey] = useState("");

  const [isStageEmailModalOpen, setIsStageEmailModalOpen] = useState(false);
  const [pendingStageStep, setPendingStageStep] = useState(null);
  const [stageDecision, setStageDecision] = useState("accepted");
  const [stageAdditionalInfoForm, setStageAdditionalInfoForm] =
    useState(createEmptyStageInfo);
  const [emailTemplatesMap, setEmailTemplatesMap] = useState({});
  useEffect(() => {
    if (stageDecision === "rejected") {
      // Clear extra info when switching to rejection to avoid leaking previous data
      setStageAdditionalInfoForm(createEmptyStageInfo());
    }
  }, [stageDecision]);

  useEffect(() => {
    const isPrivileged = userRole === "super_admin" || userRole === "admin";
    if (!isPrivileged) {
      setEmailTemplatesMap({});
      return undefined;
    }
    // Live subscribe so newly saved templates in Settings are picked up instantly.
    const unsub = subscribeToEmailTemplates((map) => {
      setEmailTemplatesMap(map || {});
    });
    return () => unsub?.();
  }, [userRole]);

  const [isCustomEmailModalOpen, setIsCustomEmailModalOpen] = useState(false);
  const [customEmailForm, setCustomEmailForm] = useState({
    to: "",
    emailTitle: "Ariza holati yangilandi",
    subject: "",
    bodyText: "",
  });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalSrc, setPhotoModalSrc] = useState("");
  const [missingPassportModalOpen, setMissingPassportModalOpen] =
    useState(false);
  const missingPassportResolverRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [showBirthPlacePicker, setShowBirthPlacePicker] = useState(false);
  const [showMaritalStatusPicker, setShowMaritalStatusPicker] = useState(false);

  const [isDrivingLicenseDropdownOpen, setIsDrivingLicenseDropdownOpen] =
    useState(false);
  const drivingLicenseDropdownRef = useRef(null);

  useEffect(() => {
    // Track window size for mobile vs desktop UI
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isDrivingLicenseDropdownOpen) return;
    function onPointerDown(e) {
      const el = drivingLicenseDropdownRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setIsDrivingLicenseDropdownOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [isDrivingLicenseDropdownOpen]);

  // Local editable state (Create.jsx like)
  const initialForm = useMemo(
    () => ({
      personalInfo: {
        name: "",
        lastName: "",
        gender: "",
        address: "",
        birthDate: "",
        birthPlace: "",
        maritalStatus: "",
        childrenCount: "",
        noChildren: false,
        hasDrivingLicense: false,
        drivingLicenseType: "",
        phone: "",
        passportNumber: "",
        email: "",
        photo: "",
      },
      experience: [],
      education: [],
      skills: { softSkills: [], pcSkills: [], languages: {} },
      documents: { diplomas: [], certificates: [], passport: [] },
      commentar: "",
    }),
    []
  );
  const [formCv, setFormCv] = useState(initialForm);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [passportTouched, setPassportTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showComment, setShowComment] = useState(true);
  const [showCommentDate, setShowCommentDate] = useState(true);
  const [isGeneratingSoft, setIsGeneratingSoft] = useState(false);
  const [isGeneratingPc, setIsGeneratingPc] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState({ soft: [], pc: [] });
  const [formInitialized, setFormInitialized] = useState(false);
  const passportToastShownRef = useRef(false);
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [commentBaseline, setCommentBaseline] = useState("");
  const [commentMeta, setCommentMeta] = useState({
    updatedAt: null,
    updatedByName: "",
    updatedByPhoto: "",
    updatedByUid: "",
  });

  // Track documents marked for deletion (soft delete)
  const [documentsMarkedForDeletion, setDocumentsMarkedForDeletion] = useState({
    passport: [],
    diplomas: [],
    certificates: [],
  });

  function getCommentHtml(obj) {
    return String(obj?.commentar || "");
  }

  function setCommentHtml(nextHtml) {
    const v = String(nextHtml || "");
    setFormCv((prev) => ({ ...prev, commentar: v }));
  }

  const [addressFields, setAddressFields] = useState(() =>
    parseGermanAddress(initialForm.personalInfo.address)
  );
  const lastSyncedAddressRef = useRef("");
  const internalAddressUpdateRef = useRef(false);

  function normalizeForm(form) {
    const safe = form || initialForm;
    const commentHtml = getCommentHtml(safe);
    const langEntries = Object.entries(safe?.skills?.languages || {}).filter(
      ([key]) => key !== undefined && key !== null
    );
    langEntries.sort(([a], [b]) =>
      String(a || "").localeCompare(String(b || ""), undefined, {
        sensitivity: "base",
      })
    );

    return {
      personalInfo: {
        name: String(safe?.personalInfo?.name || ""),
        lastName: String(safe?.personalInfo?.lastName || ""),
        gender: String(safe?.personalInfo?.gender || ""),
        address: String(safe?.personalInfo?.address || ""),
        birthDate: String(safe?.personalInfo?.birthDate || ""),
        birthPlace: String(safe?.personalInfo?.birthPlace || ""),
        maritalStatus: String(safe?.personalInfo?.maritalStatus || ""),
        childrenCount: String(safe?.personalInfo?.childrenCount || ""),
        noChildren: Boolean(safe?.personalInfo?.noChildren),
        hasDrivingLicense: Boolean(safe?.personalInfo?.hasDrivingLicense),
        drivingLicenseType: String(
          safe?.personalInfo?.drivingLicenseType || ""
        ).trim(),
        phone: String(safe?.personalInfo?.phone || ""),
        passportNumber: normalizePassportNumber(
          safe?.personalInfo?.passportNumber || ""
        ),
        email: String(safe?.personalInfo?.email || ""),
        photo: String(safe?.personalInfo?.photo || ""),
      },
      experience: sortTimelineItemsDesc(
        Array.isArray(safe?.experience)
          ? safe.experience.map((exp) => ({
              startDate: String(exp?.startDate || ""),
              endDate: String(exp?.endDate || ""),
              position: String(exp?.position || ""),
              company: String(exp?.company || ""),
              location: String(exp?.location || ""),
              responsibilities: Array.isArray(exp?.responsibilities)
                ? exp.responsibilities.map((r) => String(r || ""))
                : [],
            }))
          : []
      ),
      education: sortTimelineItemsDesc(
        Array.isArray(safe?.education)
          ? safe.education.map((edu) => ({
              startDate: String(edu?.startDate || ""),
              endDate: String(edu?.endDate || ""),
              institution: String(edu?.institution || ""),
              degree: String(edu?.degree || ""),
            }))
          : []
      ),
      skills: {
        softSkills: Array.isArray(safe?.skills?.softSkills)
          ? safe.skills.softSkills.map((s) => String(s || ""))
          : [],
        pcSkills: Array.isArray(safe?.skills?.pcSkills)
          ? safe.skills.pcSkills.map((s) => String(s || ""))
          : [],
        languages: Object.fromEntries(
          langEntries.map(([k, v]) => [String(k), v])
        ),
      },
      documents: {
        diplomas: Array.isArray(safe?.documents?.diplomas)
          ? safe.documents.diplomas.map((d) => String(d || ""))
          : [],
        certificates: Array.isArray(safe?.documents?.certificates)
          ? safe.documents.certificates.map((c) => String(c || ""))
          : [],
        passport: Array.isArray(safe?.documents?.passport)
          ? safe.documents.passport.map((p) => String(p || ""))
          : [],
      },
      commentar: commentHtml,
    };
  }

  const isLimitedAdmin = userRole === "limited_admin";
  const isSuperAdmin = userRole === "super_admin";

  // ---- Outgoing documents (templates sent to the candidate) ----
  const candidateCollection = String(
    resolvedMajor?.collectionName || ""
  ).trim();
  const candidateDocId = String(id || "").trim();
  const [outgoingDocs, setOutgoingDocs] = useState(() => ({}));
  const [outgoingBusyById, setOutgoingBusyById] = useState(() => ({}));
  const [outgoingBulkBusy, setOutgoingBulkBusy] = useState(false);
  const outgoingDocsRef = useRef({});

  useEffect(() => {
    const raw = docCv?.outgoingDocuments;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      setOutgoingDocs(raw);
      outgoingDocsRef.current = raw;
    } else {
      setOutgoingDocs({});
      outgoingDocsRef.current = {};
    }
  }, [docCv]);

  const outgoingEntries = useMemo(
    () =>
      Object.entries(outgoingDocs || {}).filter(
        ([, v]) => v && typeof v === "object" && String(v?.url || "").trim()
      ),
    [outgoingDocs]
  );

  const outgoingAnyBusy = useMemo(
    () => Object.values(outgoingBusyById || {}).some(Boolean),
    [outgoingBusyById]
  );

  function getOutgoingDocState(templateId) {
    const key = String(templateId || "").trim();
    const raw = outgoingDocs?.[key];
    return raw && typeof raw === "object" ? raw : {};
  }

  function cloneOutgoingDocsState(map) {
    if (!map || typeof map !== "object" || Array.isArray(map)) {
      return {};
    }
    const cloned = {};
    for (const key of Object.keys(map)) {
      const value = map[key];
      cloned[key] =
        value && typeof value === "object" && !Array.isArray(value)
          ? { ...value }
          : value;
    }
    return cloned;
  }

  async function persistOutgoingDocs(updater) {
    if (remoteMode) return false;
    if (!candidateCollection || !candidateDocId) return false;

    const prevStateRaw =
      outgoingDocsRef.current &&
      typeof outgoingDocsRef.current === "object" &&
      !Array.isArray(outgoingDocsRef.current)
        ? outgoingDocsRef.current
        : {};
    const prevSnapshot = cloneOutgoingDocsState(prevStateRaw);

    const nextCandidate =
      typeof updater === "function"
        ? updater(cloneOutgoingDocsState(prevSnapshot))
        : updater || {};

    const nextState = cloneOutgoingDocsState(nextCandidate);

    outgoingDocsRef.current = nextState;
    setOutgoingDocs(nextState);

    try {
      await updateDocument(candidateCollection, candidateDocId, {
        outgoingDocuments: nextState,
        outgoingDocumentsUpdatedAt: Date.now(),
      });
      return true;
    } catch (e) {
      console.error("persistOutgoingDocs failed:", e);
      toast.error("Hujjatlar bo‘limini saqlashda xatolik.");
      outgoingDocsRef.current = prevSnapshot;
      setOutgoingDocs(prevSnapshot);
      return false;
    }
  }

  async function deleteOutgoingDocFromState(tplId) {
    return persistOutgoingDocs((current) => {
      const next = { ...current };
      delete next[tplId];
      return next;
    });
  }

  async function deleteOutgoingDocRemoteFirst(tplId, options = {}) {
    const safeId = String(tplId || "").trim();
    if (!safeId) return { ok: false, remoteMissing: false };

    const currentSnapshot =
      options?.current && typeof options.current === "object"
        ? options.current
        : getOutgoingDocState(safeId);
    const url = String(
      options?.urlOverride ?? currentSnapshot?.url ?? ""
    ).trim();

    let remoteMissing = false;
    if (url) {
      try {
        await deleteUploadedFileRemote(url);
      } catch (err) {
        if (Number(err?.status) === 404) {
          remoteMissing = true;
          console.warn(
            `[outgoing-delete] Remote file missing (404) for ${safeId}:`,
            url
          );
        } else {
          throw err;
        }
      }
    }

    const persisted = await deleteOutgoingDocFromState(safeId);
    return { ok: Boolean(persisted), remoteMissing };
  }

  async function deleteDocumentRemoteFirst(url, documentType, index) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) return { ok: false, remoteMissing: false };

    // Soft delete: only mark for deletion in UI, actual deletion happens on save
    setDocumentsMarkedForDeletion((prev) => ({
      ...prev,
      [documentType]: [...(prev[documentType] || []), { url, index }],
    }));

    toast.success(
      "Dokument zum Löschen markiert. Wird beim Speichern endgültig gelöscht."
    );
    return { ok: true, remoteMissing: false };
  }

  async function generateAndUploadBeratungsvertrag(options = {}) {
    const omitPassportPage = Boolean(options?.omitPassportPage);
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "beratungsvertrag"
    );
    const savedForm =
      templateDoc &&
      typeof templateDoc === "object" &&
      templateDoc.form &&
      typeof templateDoc.form === "object"
        ? templateDoc.form
        : null;

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const city =
      String(addressFields?.city || "").trim() ||
      String(
        parseGermanAddress(formCv?.personalInfo?.address || "")?.city || ""
      ).trim();

    const baseForm = {
      firstName: "",
      lastName: "",
      contractDate: todayDdMmYyyy(),
      candidateCity: "",
      pdfGeneratedDate: todayDdMmYyyy(),
      feeTotalEur: "1200",
      feeAdvanceEur: "250",
      signatureCity: "",
      pdfUrl: "",
    };

    const merged = {
      ...baseForm,
      ...(savedForm ? savedForm : {}),
      firstName,
      lastName,
      candidateCity: city,
      signatureCity: city,
      pdfGeneratedDate: todayDdMmYyyy(),
    };

    const passportUrls = Array.isArray(formCv?.documents?.passport)
      ? formCv.documents.passport
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      : [];
    const diplomaUrls = Array.isArray(formCv?.documents?.diplomas)
      ? formCv.documents.diplomas
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      : [];
    // Source priority:
    // 1) Reisepass (passport) — desired default for Beratungsvertrag page
    // 2) Fallback: Diplome (if passport is missing)
    const docUrls = omitPassportPage
      ? []
      : Array.from(
          new Set([
            ...(passportUrls.length ? passportUrls : []),
            ...(!passportUrls.length ? diplomaUrls : []),
          ])
        );
    let passportSrc = "";
    let usedPassportUrl = "";
    // Try all candidate passport URLs until we can successfully embed one.
    for (const u of docUrls) {
      // eslint-disable-next-line no-await-in-loop
      const extracted = await fetchUrlAsImageDataUrlBestEffort(u);
      if (extracted) {
        passportSrc = extracted;
        usedPassportUrl = u;
        break;
      }
      // Fallback: if it's a direct image URL and extraction failed, let react-pdf fetch the image itself.
      const looksImage = /\.(png|jpe?g|webp)$/i.test(u);
      if (looksImage) {
        passportSrc = buildProxyAssetUrl(u) || u;
        usedPassportUrl = u;
        break;
      }
    }
    if (!passportSrc && docUrls.length) {
      console.warn(
        "[Beratungsvertrag] Attachment could not be embedded. Tried URLs:",
        docUrls
      );
    }

    const fileBase =
      firstName || lastName
        ? `Beratungsvertrag ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Beratungsvertrag";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Beratungsvertrag";

    const blob = await pdf(
      <BeratungsvertragPdfDocument
        form={merged}
        passportImageDataUrl={passportSrc || null}
      />
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToConsulting(file);
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadVermittlungsvertrag() {
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vermittlungsvertrag"
    );
    const savedForm =
      templateDoc &&
      typeof templateDoc === "object" &&
      templateDoc.form &&
      typeof templateDoc.form === "object"
        ? templateDoc.form
        : null;

    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const street = String(addressFields?.street || "").trim();
    const houseNumber = String(addressFields?.houseNumber || "").trim();
    const postalCode = String(addressFields?.postalCode || "").trim();
    const city = String(addressFields?.city || "").trim();
    const country = String(addressFields?.country || "").trim();

    const baseForm = {
      candidateFirstName: "",
      candidateLastName: "",
      candidateStreet: "",
      candidateHouseNumber: "",
      candidatePLZ: "",
      candidateBirthPlace: "",
      candidateLand: "",
      contractDurationYears: "2",
      signatureDate: todayDdMmYyyy(),
      signatureCity: "",
    };

    const merged = {
      ...baseForm,
      ...(savedForm ? savedForm : {}),
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidateStreet: street,
      candidateHouseNumber: houseNumber,
      candidatePLZ: postalCode,
      candidateBirthPlace: birthPlace,
      candidateLand: country,
      signatureCity: city,
      signatureDate: todayDdMmYyyy(),
    };

    const fileBase =
      firstName || lastName
        ? `Vermittlungsvertrag ${[firstName, lastName]
            .filter(Boolean)
            .join(" ")}`
        : "Vermittlungsvertrag";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vermittlungsvertrag";

    const blob = await pdf(
      <VermittlungsvertragPdfDocument form={merged} />
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToConsulting(file);
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadVollmacht() {
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vollmacht"
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const city = String(addressFields?.city || "").trim();
    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      firstName,
      lastName,
      birthDate,
      city,
      date,
    };

    const fileBase =
      firstName || lastName
        ? `Vollmacht ${[firstName, lastName].filter(Boolean).join(" ")}`
        : "Vollmacht";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vollmacht";

    const blob = await pdf(<VollmachtPdfDocument form={merged} />).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToConsulting(file);
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function generateAndUploadVollmachtArbeitgeber() {
    // Load template defaults from Firestore (same source as Contract template page)
    const templateDoc = await getDocumentDataById(
      "template_documents",
      "vollmacht_arbeitgeber"
    );
    const savedForm =
      templateDoc && typeof templateDoc.form === "object"
        ? templateDoc.form
        : {};

    // Merge with current candidate data
    const firstName = String(formCv?.personalInfo?.name || "").trim();
    const lastName = String(formCv?.personalInfo?.lastName || "").trim();
    const birthDate = String(formCv?.personalInfo?.birthDate || "").trim();
    const birthPlace = String(formCv?.personalInfo?.birthPlace || "").trim();
    const phone = String(formCv?.personalInfo?.phone || "").trim();
    const email = String(formCv?.personalInfo?.email || "").trim();
    const date = todayDdMmYyyy();

    const merged = {
      ...savedForm,
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidateBirthDate: birthDate,
      candidateBirthPlace: birthPlace,
      candidateStreet: addressFields?.street || "",
      candidateHouseNumber: addressFields?.houseNumber || "",
      candidatePostalCode: addressFields?.postalCode || "",
      candidateCity: addressFields?.city || "",
      candidateCountry: addressFields?.country || "",
      candidatePhone: phone,
      candidateEmail: email,
      candidatePlaceDate: date,
    };

    const fileBase =
      firstName || lastName
        ? `Vollmacht an Arbeitgeber ${[firstName, lastName]
            .filter(Boolean)
            .join(" ")}`
        : "Vollmacht an Arbeitgeber";
    const safeFileName =
      fileBase.replace(/[\\/:*?"<>|]/g, "").trim() ||
      "Vollmacht an Arbeitgeber";

    const blob = await pdf(
      <VollmachtArbeitgeberPdfDocument form={merged} />
    ).toBlob();

    const file = new File([blob], `ConsultingUz ${safeFileName}.pdf`, {
      type: "application/pdf",
    });
    const url = await uploadFileToConsulting(file);
    return { url, fileName: `ConsultingUz ${safeFileName}.pdf` };
  }

  async function handleToggleOutgoingDoc(template, nextEnabled, options = {}) {
    const tpl = template || {};
    const templateId = String(tpl.id || "").trim();
    if (!templateId) return;
    if (remoteMode) return;
    if (outgoingBusyById?.[templateId]) return;
    const forceRegenerate = Boolean(options?.forceRegenerate);

    const prev = getOutgoingDocState(templateId);
    const nextMap = { ...(outgoingDocs || {}) };

    // If turning OFF: just mark disabled (do not delete previously uploaded file).
    if (!nextEnabled) {
      await persistOutgoingDocs((current) => {
        const next = { ...current };
        next[templateId] = {
          ...(current?.[templateId] || {}),
          enabled: false,
          updatedAt: Date.now(),
        };
        return next;
      });
      return;
    }

    // Turning ON:
    // If we already have an uploaded URL, enable without re-uploading (unless forced).
    const existingUrl = String(prev?.url || "").trim();
    if (existingUrl && !forceRegenerate) {
      await persistOutgoingDocs((current) => {
        const next = { ...current };
        next[templateId] = {
          ...(current?.[templateId] || {}),
          enabled: true,
          updatedAt: Date.now(),
        };
        return next;
      });
      return;
    }

    try {
      setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: true }));

      let generated = null;
      let omitPassportPage = false;
      if (templateId === "beratungsvertrag") {
        const hasPassportAttachment = Array.isArray(formCv?.documents?.passport)
          ? formCv.documents.passport.some((u) => String(u || "").trim())
          : false;
        if (!hasPassportAttachment) {
          const confirmed = await askContinueWithoutPassport();
          if (!confirmed) {
            return;
          }
          omitPassportPage = true;
        }
      }
      if (templateId === "beratungsvertrag") {
        generated = await generateAndUploadBeratungsvertrag({
          omitPassportPage,
        });
      } else if (templateId === "vermittlungsvertrag") {
        generated = await generateAndUploadVermittlungsvertrag();
      } else if (templateId === "vollmacht") {
        generated = await generateAndUploadVollmacht();
      } else if (templateId === "vollmacht_arbeitgeber") {
        generated = await generateAndUploadVollmachtArbeitgeber();
      } else {
        throw new Error(`Unknown document template: ${templateId}`);
      }

      const persisted = await persistOutgoingDocs((current) => ({
        ...current,
        [templateId]: {
          ...(current?.[templateId] || {}),
          enabled: true,
          url: String(generated?.url || "").trim(),
          fileName: String(generated?.fileName || "").trim() || null,
          uploadedAt: Date.now(),
          updatedAt: Date.now(),
        },
      }));
      if (persisted) {
        toast.success("PDF tayyor bo‘ldi va upload qilindi.");
      }
    } catch (e) {
      console.error("Outgoing doc generate/upload failed:", e);
      toast.error("Fehler beim Erstellen oder Hochladen der PDF.");
    } finally {
      setOutgoingBusyById((p) => ({ ...(p || {}), [templateId]: false }));
    }
  }

  async function handleDeleteOutgoingDoc(templateId) {
    const tplId = String(templateId || "").trim();
    if (!tplId) return;
    if (remoteMode) return;
    if (outgoingBusyById?.[tplId]) return;

    const current = getOutgoingDocState(tplId);

    try {
      setOutgoingBusyById((p) => ({ ...(p || {}), [tplId]: true }));
      const { ok, remoteMissing } = await deleteOutgoingDocRemoteFirst(tplId, {
        current,
      });
      if (ok) {
        toast.success(
          remoteMissing
            ? "Link o‘chirildi (fayl allaqachon yo‘q edi)."
            : "Link o‘chirildi."
        );
      } else {
        toast.error("Linkni o‘chirishda xatolik.");
      }
    } catch (e) {
      console.error("Outgoing doc delete failed:", e);
      toast.error("Linkni o‘chirishda xatolik.");
    } finally {
      setOutgoingBusyById((p) => ({ ...(p || {}), [tplId]: false }));
    }
  }

  async function handleDeleteAllOutgoingDocs() {
    if (remoteMode) return;
    if (outgoingBulkBusy) return;
    if (outgoingAnyBusy) return;
    if (!candidateCollection || !candidateDocId) return;
    if (Boolean(sendingStepValue)) return;

    const entriesSnapshot = Array.isArray(outgoingEntries)
      ? [...outgoingEntries]
      : [];
    if (!entriesSnapshot.length) return;

    const ids = entriesSnapshot
      .map(([docId]) => String(docId || "").trim())
      .filter(Boolean);
    if (!ids.length) return;

    setOutgoingBulkBusy(true);
    setOutgoingBusyById((prev) => {
      const next = { ...(prev || {}) };
      ids.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    const missingIds = new Set();
    const removedIds = new Set();
    let hadError = false;

    try {
      for (const [docId, value] of entriesSnapshot) {
        const tplId = String(docId || "").trim();
        if (!tplId) continue;
        try {
          const { ok, remoteMissing } = await deleteOutgoingDocRemoteFirst(
            tplId,
            { current: value }
          );
          if (ok) {
            removedIds.add(tplId);
            if (remoteMissing) missingIds.add(tplId);
          } else {
            hadError = true;
          }
        } catch (error) {
          hadError = true;
          console.error(`Bulk outgoing doc delete failed for ${tplId}:`, error);
        }
      }

      if (removedIds.size) {
        const removedAll = removedIds.size === entriesSnapshot.length;
        const missingSuffix = missingIds.size
          ? " (ba'zi fayllar allaqachon yo‘q edi)."
          : "";
        const successMessage = removedAll
          ? `Barcha linklar o‘chirildi${missingSuffix}`
          : `Ba'zi linklar o‘chirildi${missingSuffix}`;
        toast.success(successMessage);
      }
      if (hadError) {
        toast.error("Ba'zi linklarni o‘chirishda xatolik yuz berdi.");
      }
    } finally {
      setOutgoingBusyById((prev) => {
        const next = { ...(prev || {}) };
        ids.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOutgoingBulkBusy(false);
    }
  }

  const commentHtml = useMemo(() => getCommentHtml(formCv), [formCv]);
  const hasComment = useMemo(
    () => hasRichTextContent(commentHtml),
    [commentHtml]
  );
  const commentChanged = useMemo(
    () => String(commentHtml || "") !== String(commentBaseline || ""),
    [commentHtml, commentBaseline]
  );

  const normalizedDocForm = useMemo(() => {
    if (!docCv) return null;
    return normalizeForm(mapDocToForm(docCv));
  }, [docCv]);

  const normalizedCurrentForm = useMemo(() => normalizeForm(formCv), [formCv]);

  const [savedBaselineJson, setSavedBaselineJson] = useState("");
  useEffect(() => {
    if (!normalizedDocForm) return;
    setSavedBaselineJson(JSON.stringify(normalizedDocForm));
  }, [normalizedDocForm]);

  const currentFormJson = useMemo(
    () => JSON.stringify(normalizedCurrentForm),
    [normalizedCurrentForm]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (remoteMode) return false;
    if (!savedBaselineJson) return false;
    const formChanged = savedBaselineJson !== currentFormJson;
    const hasDocumentsMarkedForDeletion = Object.values(
      documentsMarkedForDeletion
    ).some((arr) => arr.length > 0);
    return formChanged || hasDocumentsMarkedForDeletion;
  }, [
    savedBaselineJson,
    currentFormJson,
    remoteMode,
    documentsMarkedForDeletion,
  ]);

  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const unsavedBlocker = useBlocker(
    Boolean(hasUnsavedChanges) && !Boolean(isSaving)
  );

  useEffect(() => {
    if (unsavedBlocker.state === "blocked") {
      setUnsavedModalOpen(true);
    }
  }, [unsavedBlocker.state]);

  useEffect(() => {
    if (!hasUnsavedChanges && unsavedModalOpen) {
      setUnsavedModalOpen(false);
    }
  }, [hasUnsavedChanges, unsavedModalOpen]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const message =
      "Sie haben ungespeicherte Änderungen. Wenn Sie die Seite verlassen, gehen diese Änderungen verloren.";
    function onBeforeUnload(e) {
      e.preventDefault();
      // Most browsers ignore custom text, but setting returnValue is required to trigger the prompt.
      e.returnValue = message;
      return message;
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  function stayOnGeneratePage() {
    setUnsavedModalOpen(false);
    unsavedBlocker.reset?.();
  }

  function leaveGeneratePage() {
    setUnsavedModalOpen(false);
    unsavedBlocker.proceed?.();
  }

  function handleCancel() {
    if (!docCv) return;
    const mapped = mapDocToForm(docCv);
    setFormCv(normalizeForm(mapped));
    setCommentBaseline(getCommentHtml(mapped));
    setIsCommentEditorOpen(false);
    setPhoneTouched(false);
    setPassportTouched(false);
    setEmailTouched(false);
    setRecentlyAdded({ soft: [], pc: [] });
    // Clear documents marked for deletion
    setDocumentsMarkedForDeletion({
      passport: [],
      diplomas: [],
      certificates: [],
    });
  }

  useEffect(() => {
    const raw = String(formCv?.personalInfo?.address || "").trim();
    if (internalAddressUpdateRef.current) {
      internalAddressUpdateRef.current = false;
      lastSyncedAddressRef.current = raw;
      return;
    }
    if (raw === lastSyncedAddressRef.current) return;
    lastSyncedAddressRef.current = raw;
    setAddressFields(parseGermanAddress(raw));
  }, [formCv?.personalInfo?.address]);

  function applyAddressFields(nextFields) {
    setAddressFields(nextFields);
    const formatted = formatGermanAddress(nextFields);
    internalAddressUpdateRef.current = true;
    setFormCv((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, address: formatted },
    }));
  }

  useEffect(() => {
    const key = String(major || "").trim();
    if (!key) {
      setResolvedMajor({ collectionName: "", title: "", linkId: "" });
      setMetaInfo(null);
      setNotFound(true);
      setLoading(false);
      setMetaLoading(false);
      return () => {};
    }

    setMetaLoading(true);
    let gotFirst = false;
    const unsub = subscribeToMetaByName(
      key,
      (data) => {
        gotFirst = true;
        if (data) {
          setResolvedMajor({
            collectionName:
              data.collectionName || data.slug || data.name || key,
            title: data.title || data.collectionName || key,
            linkId: data.linkId || data.uuid || data.id || key,
          });
          setMetaInfo(data || null);
        } else {
          // Meta doc is optional; candidate collection can still exist.
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
        }
        setMetaLoading(false);
      },
      (e) => {
        console.error("subscribeToMetaByName failed:", e);
        if (!gotFirst) {
          setResolvedMajor({
            collectionName: key,
            title: key,
            linkId: key,
          });
          setMetaInfo(null);
          setMetaLoading(false);
        }
      }
    );

    return () => unsub?.();
  }, [major]);

  // Preload telegram group names when meta changes (best-effort)
  useEffect(() => {
    const ids = [
      String(metaInfo?.interviewInternal?.telegramGroupId || "").trim(),
      String(metaInfo?.interviewEmployer?.telegramGroupId || "").trim(),
    ].filter(Boolean);
    if (ids.length === 0) return;
    ids.forEach((id) => {
      if (telegramGroupNameCacheRef.current?.[id]) return;
      // best-effort (no await)
      ensureTelegramGroupName(id);
    });
  }, [
    metaInfo?.interviewInternal?.telegramGroupId,
    metaInfo?.interviewEmployer?.telegramGroupId,
    ensureTelegramGroupName,
  ]);

  useEffect(() => {
    if (!remoteMode) return undefined;
    // Fast path: if navigation passed the record via route state, render immediately.
    if (stateRemoteRecord) {
      setRemoteRecord(stateRemoteRecord);
      setRemoteLoading(false);
      return undefined;
    }
    setRemoteLoading(true);
    let cancelled = false;
    (async () => {
      try {
        if (remoteKind === "archived") {
          if (archivedDocId) {
            const snap = await getDoc(doc(db, "archived_users", archivedDocId));
            if (!cancelled) {
              setRemoteRecord(
                snap.exists() ? { id: snap.id, ...snap.data() } : null
              );
            }
            return;
          }
          // Legacy fallback: allow previewing remote registry records if rid is provided.
          const rec = await getRemoteUserRecord("archived", remoteRid || id);
          if (!cancelled) setRemoteRecord(rec || null);
        } else if (remoteKind === "all") {
          const rec = await getRemoteUserRecord("all", remoteRid || id);
          if (!cancelled) setRemoteRecord(rec || null);
        } else if (remoteKind === "deleted") {
          if (!deletedDocId) {
            if (!cancelled) setRemoteRecord(null);
            return;
          }
          const snap = await getDoc(doc(db, "deleted_users", deletedDocId));
          if (!cancelled) {
            setRemoteRecord(
              snap.exists() ? { id: snap.id, ...snap.data() } : null
            );
          }
        } else {
          if (!cancelled) setRemoteRecord(null);
        }
      } catch (e) {
        console.error("remoteMode load failed:", e);
        if (!cancelled) setRemoteRecord(null);
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    remoteMode,
    remoteKind,
    remoteRid,
    deletedDocId,
    archivedDocId,
    id,
    stateRemoteRecord,
  ]);

  useEffect(() => {
    if (!remoteMode) return undefined;
    const unsub = subscribeToCollections((list) => {
      setMajors(Array.isArray(list) ? list : []);
    });
    return () => unsub?.();
  }, [remoteMode]);

  useEffect(() => {
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (remoteMode) return undefined;
    if (!col || !docId) {
      setNotFound(true);
      setLoading(false);
      return undefined;
    }
    const ref = doc(db, col, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setDocCv(null);
        } else {
          const data = snap.data() || null;
          if (DEBUG_GENERATE) {
            const debugPayload = {
              path: { collection: col, id: docId },
              data,
              meta: {
                hasPendingWrites: Boolean(snap?.metadata?.hasPendingWrites),
                fromCache: Boolean(snap?.metadata?.fromCache),
              },
            };
            // Expose for easy inspection in DevTools
            try {
              window.__generateCandidateSnapshot = debugPayload;
            } catch {
              // ignore
            }
            console.log(
              "[Generate] Firestore candidate snapshot:",
              debugPayload
            );
          }
          const status = data?.status || {};
          setStatusValue(
            normalizeCandidateStatusValue(
              status?.value || CANDIDATE_STATUS_DEFAULT
            ) || CANDIDATE_STATUS_DEFAULT
          );
          setStatusUpdatedAt(status?.updatedAt || null);
          setStatusUpdatedBy(status?.updatedBy || "");
          setDocCv(data);
          const cMeta = data?.commentarMeta || {};
          setCommentMeta({
            updatedAt: cMeta?.updatedAt || null,
            updatedByName: cMeta?.updatedByName || "",
            updatedByPhoto: cMeta?.updatedByPhoto || "",
            updatedByUid: cMeta?.updatedByUid || "",
          });
          setNotFound(false);
          if (!formInitialized) {
            const mapped = mapDocToForm(data);
            const normalized = normalizeForm(mapped);
            setFormCv(normalized);
            setFormInitialized(true);
            // Don't show "success" validation colors on initial load.
            setPhoneTouched(false);
            setEmailTouched(false);
          }
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [resolvedMajor.collectionName, id, formInitialized]);

  useEffect(() => {
    if (!remoteMode) return undefined;
    // In remote-mode we render the page using remoteRecord (read-only preview).
    // Email send / stage actions are only available after restoring to Firebase.
    if (remoteLoading) return undefined;

    if (!remoteRecord) {
      setDocCv(null);
      setNotFound(true);
      setLoading(false);
      return undefined;
    }

    try {
      setDocCv(remoteRecord);
      const mapped = mapDocToForm(remoteRecord);
      setFormCv(normalizeForm(mapped));
      setFormInitialized(true);
      setNotFound(false);
      setLoading(false);
    } catch (e) {
      console.error("remoteMode mapDocToForm failed:", e);
      setDocCv(null);
      setNotFound(true);
      setLoading(false);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteMode, remoteLoading, remoteRecord]);

  useEffect(() => {
    if (!formInitialized || passportToastShownRef.current) return;
    const passportNumber = String(
      formCv?.personalInfo?.passportNumber || ""
    ).trim();
    const hasPassportDoc = Array.isArray(formCv?.documents?.passport)
      ? formCv.documents.passport.some((u) => String(u || "").trim())
      : false;

    passportToastShownRef.current = true;
  }, [
    formInitialized,
    formCv?.personalInfo?.passportNumber,
    formCv?.documents?.passport,
  ]);

  useEffect(() => {
    return () => {
      if (missingPassportResolverRef.current) {
        missingPassportResolverRef.current(false);
        missingPassportResolverRef.current = null;
      }
    };
  }, []);

  function pickFirstNonEmptyString(values) {
    for (const v of values) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
    return "";
  }

  function extractEmailFromSnapshot(record) {
    const r = record && typeof record === "object" ? record : {};
    return pickFirstNonEmptyString([
      r?.persoenlicheDaten?.email,
      r?.personalInfo?.email,
      r?.personalData?.email,
      r?.email,
    ]);
  }

  function extractPassportIdFromSnapshot(record) {
    const r = record && typeof record === "object" ? record : {};
    return pickFirstNonEmptyString([
      r?.passportId,
      r?.passportID,
      r?.passportNumber,
      r?.reisepassNummer,
      r?.persoenlicheDaten?.reisepassNummer,
      r?.persoenlicheDaten?.passportId,
      r?.persoenlicheDaten?.passportID,
      r?.persoenlicheDaten?.passportNumber,
      r?.personalInfo?.passportNumber,
      r?.personalInfo?.reisepassNummer,
      r?.personalData?.passportNumber,
      r?.personalData?.reisepassNummer,
    ]);
  }

  function stripDeletedUserMetaForRestore(record) {
    const r = record && typeof record === "object" ? record : {};
    const omit = new Set([
      "id",
      "sourceMajor",
      "sourceDocId",
      "sourceMajorTitle",
      "deletedAt",
      "deletedBy",
      "email",
    ]);
    const out = {};
    Object.keys(r).forEach((k) => {
      if (!omit.has(k)) out[k] = r[k];
    });
    return out;
  }

  function stripArchivedUserMetaForRestore(record) {
    const r = record && typeof record === "object" ? record : {};
    const omit = new Set([
      "id",
      "sourceMajor",
      "sourceDocId",
      "sourceMajorTitle",
      "archivedAt",
      "archivedBy",
      "email",
    ]);
    const out = {};
    Object.keys(r).forEach((k) => {
      if (!omit.has(k)) out[k] = r[k];
    });
    return out;
  }

  async function restoreFromRemoteMode() {
    if (!remoteMode) return;
    if (restoreBusy) return;
    if (!remoteRecord) {
      toast.error("Remote-Kandidat nicht gefunden.");
      return;
    }
    try {
      setRestoreBusy(true);

      // Resolve default major from record
      const rawMajor = String(
        remoteRecord?.sourceMajor ||
          remoteRecord?.major ||
          remoteRecord?.collectionName ||
          ""
      ).trim();

      let majorKey = rawMajor;
      let resolvedMeta = null;
      if (majorKey) {
        try {
          resolvedMeta = await getMetaByName(majorKey);
        } catch {
          resolvedMeta = null;
        }
      }

      // If no major (or unknown) -> ask user to choose
      if (!majorKey || !resolvedMeta?.collectionName) {
        setMajorModalKey("");
        setMajorModalOpen(true);
        return;
      }

      const ok = window.confirm(
        `Möchten Sie den Kandidaten wiederherstellen?\n\nBereich (Major): ${
          resolvedMeta?.title || resolvedMeta?.collectionName || majorKey
        }\n\nHinweis: Nach der Wiederherstellung können E-Mails versendet werden.`
      );
      if (!ok) return;

      // Restore based on source
      if (remoteKind === "all") {
        const res = await restoreRemoteRecordToFirebase({
          kind: "all",
          record: remoteRecord,
          restoredBy: user?.email || user?.uid || "admin",
          majorOverride: resolvedMeta.collectionName,
          majorLabel: resolvedMeta.title || resolvedMeta.collectionName,
        });
        toast.success(`Wiederhergestellt: ${res.major} (ID=${res.firebaseId})`);
        navigate(
          `/generate/${resolvedMeta.linkId || res.major}/${res.firebaseId}`
        );
        return;
      }

      if (remoteKind === "archived") {
        if (archivedDocId) {
          const majorCol = resolvedMeta.collectionName;
          const majorLabel =
            String(remoteRecord?.sourceMajorTitle || "").trim() ||
            resolvedMeta.title ||
            majorCol;
          const payload = stripArchivedUserMetaForRestore(remoteRecord);
          const { id: newId } = await addCandidateWithDualStats(
            majorCol,
            payload,
            {
              majorLabel,
            }
          );

          const email = extractEmailFromSnapshot(payload);
          const passportId = extractPassportIdFromSnapshot(payload);
          if (email) {
            await upsertEmailAndPassIdFirestore({
              email,
              major: majorCol,
              passportId,
            });
          }

          await deleteDoc(doc(db, "archived_users", archivedDocId));

          toast.success(`Wiederhergestellt: ${majorCol} (ID=${newId})`);
          navigate(`/generate/${resolvedMeta.linkId || majorCol}/${newId}`);
          return;
        }

        // Legacy fallback (remote registry)
        const res = await restoreRemoteRecordToFirebase({
          kind: "archived",
          record: remoteRecord,
          restoredBy: user?.email || user?.uid || "admin",
          majorOverride: resolvedMeta.collectionName,
          majorLabel: resolvedMeta.title || resolvedMeta.collectionName,
        });
        toast.success(`Wiederhergestellt: ${res.major} (ID=${res.firebaseId})`);
        navigate(
          `/generate/${resolvedMeta.linkId || res.major}/${res.firebaseId}`
        );
        return;
      }

      if (remoteKind === "deleted") {
        if (!deletedDocId) {
          toast.error("deletedDocId nicht gefunden.");
          return;
        }
        const majorCol = resolvedMeta.collectionName;
        const majorLabel =
          String(remoteRecord?.sourceMajorTitle || "").trim() ||
          resolvedMeta.title ||
          majorCol;
        const payload = stripDeletedUserMetaForRestore(remoteRecord);
        const { id: newId } = await addCandidateWithDualStats(
          majorCol,
          payload,
          {
            majorLabel,
          }
        );

        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: majorCol,
            passportId,
          });
        }

        if (deletedDocId) {
          await deleteDoc(doc(db, "deleted_users", deletedDocId));
        }

        toast.success(`Wiederhergestellt: ${majorCol} (ID=${newId})`);
        navigate(`/generate/${resolvedMeta.linkId || majorCol}/${newId}`);
        return;
      }

      toast.error("Remote-Quelle unbekannt (kind).");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoreBusy(false);
    }
  }

  async function confirmRestoreFromModal() {
    if (!majorModalKey) {
      toast.error("Bitte wählen Sie zuerst einen Bereich (Major) aus.");
      return;
    }
    try {
      setRestoreBusy(true);
      const meta = await getMetaByName(majorModalKey);
      const col = String(meta?.collectionName || "").trim();
      if (!col) {
        toast.error("Bereich (Major) wurde nicht gefunden.");
        return;
      }
      setMajorModalOpen(false);

      if (remoteKind === "archived" || remoteKind === "all") {
        // Keep legacy remote restore support only for `all`. Archived is Firestore-based when archivedDocId exists.
        if (remoteKind === "all") {
          const res = await restoreRemoteRecordToFirebase({
            kind: "all",
            record: remoteRecord,
            restoredBy: user?.email || user?.uid || "admin",
            majorOverride: col,
            majorLabel: meta?.title || col,
          });
          toast.success(
            `Wiederhergestellt: ${meta?.title || res.major} (ID=${
              res.firebaseId
            })`
          );
          navigate(`/generate/${meta.linkId || col}/${res.firebaseId}`);
          return;
        }
        if (remoteKind === "archived") {
          if (archivedDocId) {
            const majorLabel =
              String(remoteRecord?.sourceMajorTitle || "").trim() ||
              meta?.title ||
              col;
            const payload = stripArchivedUserMetaForRestore(remoteRecord);
            const { id: newId } = await addCandidateWithDualStats(
              col,
              payload,
              {
                majorLabel,
              }
            );
            const email = extractEmailFromSnapshot(payload);
            const passportId = extractPassportIdFromSnapshot(payload);
            if (email) {
              await upsertEmailAndPassIdFirestore({
                email,
                major: col,
                passportId,
              });
            }
            await deleteDoc(doc(db, "archived_users", archivedDocId));
            toast.success(
              `Wiederhergestellt: ${meta?.title || col} (ID=${newId})`
            );
            navigate(`/generate/${meta.linkId || col}/${newId}`);
            return;
          }

          const res = await restoreRemoteRecordToFirebase({
            kind: "archived",
            record: remoteRecord,
            restoredBy: user?.email || user?.uid || "admin",
            majorOverride: col,
            majorLabel: meta?.title || col,
          });
          toast.success(
            `Wiederhergestellt: ${meta?.title || res.major} (ID=${
              res.firebaseId
            })`
          );
          navigate(`/generate/${meta.linkId || col}/${res.firebaseId}`);
          return;
        }
      }

      if (remoteKind === "deleted") {
        if (!deletedDocId) {
          toast.error("deletedDocId nicht gefunden.");
          return;
        }

        const majorLabel =
          String(remoteRecord?.sourceMajorTitle || "").trim() ||
          meta?.title ||
          col;
        const payload = stripDeletedUserMetaForRestore(remoteRecord);
        const { id: newId } = await addCandidateWithDualStats(col, payload, {
          majorLabel,
        });
        const email = extractEmailFromSnapshot(payload);
        const passportId = extractPassportIdFromSnapshot(payload);
        if (email) {
          await upsertEmailAndPassIdFirestore({
            email,
            major: col,
            passportId,
          });
        }
        if (deletedDocId) {
          await deleteDoc(doc(db, "deleted_users", deletedDocId));
        }
        toast.success(`Wiederhergestellt: ${meta?.title || col} (ID=${newId})`);
        navigate(`/generate/${meta.linkId || col}/${newId}`);
        return;
      }

      toast.error("Remote-Quelle unbekannt (kind).");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Wiederherstellen.");
    } finally {
      setRestoreBusy(false);
    }
  }

  function mapDocToForm(data) {
    // NOTE: Historically we had multiple Firestore schemas.
    // - New (Create.jsx): `persoenlicheDaten.email`
    // - Older: `personalInfo.email` (or sometimes root `email`)
    // We normalize here so Generate always displays email if it exists anywhere.
    const p = data?.persoenlicheDaten || {};
    const legacyPersonal = data?.personalInfo || data?.personal || {};
    const rawLicense = p?.fuehrerschein;
    const rawLicenseType = p?.fuehrerscheinTyp;
    const licenseTypeFromLegacy =
      typeof rawLicense === "string" &&
      rawLicense &&
      !["ja", "true", "nein", "false"].includes(
        String(rawLicense).trim().toLowerCase()
      )
        ? String(rawLicense).trim()
        : "";
    const hasDrivingLicense =
      rawLicense === true ||
      rawLicense === 1 ||
      String(rawLicense || "")
        .trim()
        .toLowerCase() === "ja" ||
      String(rawLicense || "")
        .trim()
        .toLowerCase() === "true" ||
      Boolean(String(rawLicenseType || "").trim()) ||
      Boolean(licenseTypeFromLegacy);
    const drivingLicenseType = String(
      rawLicenseType || licenseTypeFromLegacy || ""
    )
      .trim()
      .toUpperCase();
    const berufe = Array.isArray(data?.berufserfahrung)
      ? data.berufserfahrung
      : [];
    const ausb = Array.isArray(data?.ausbildung) ? data.ausbildung : [];

    const normalizeMonth = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "";
      // Convert "yyyy-mm" back to "mm.yyyy" for our form state; keep other formats as-is.
      const from = fromInputMonth(raw);
      return from || raw;
    };

    const f = data?.faehigkeiten || {};
    const d = data?.dokumente || {};
    const att = data?.attachments || {};

    let diplomas = [];
    if (Array.isArray(d?.diplome)) {
      diplomas = d.diplome;
    } else if (typeof d?.diplome === "string" && String(d.diplome).trim()) {
      diplomas = [d.diplome];
    } else if (Array.isArray(att?.diplomas)) {
      diplomas = att.diplomas;
    } else if (
      typeof att?.diplomas === "string" &&
      String(att.diplomas).trim()
    ) {
      diplomas = [att.diplomas];
    }
    diplomas = Array.isArray(diplomas)
      ? diplomas.map((u) => String(u || "").trim()).filter(Boolean)
      : [];

    let certificates = [];
    if (Array.isArray(d?.zertifikate)) {
      certificates = d.zertifikate;
    } else if (
      typeof d?.zertifikate === "string" &&
      String(d.zertifikate).trim()
    ) {
      certificates = [d.zertifikate];
    } else if (Array.isArray(att?.languageCertificates)) {
      certificates = att.languageCertificates;
    } else if (
      typeof att?.languageCertificates === "string" &&
      String(att.languageCertificates).trim()
    ) {
      certificates = [att.languageCertificates];
    }
    certificates = Array.isArray(certificates)
      ? certificates.map((u) => String(u || "").trim()).filter(Boolean)
      : [];

    const passportCandidates = [
      att?.passport,
      ...(Array.isArray(att?.passports) ? att.passports : []),
      d?.reisepass,
      d?.passport,
      ...(Array.isArray(d?.reisepaesse) ? d.reisepaesse : []),
      ...(Array.isArray(d?.passports) ? d.passports : []),
      (data?.documents || {})?.passport,
      ...(Array.isArray((data?.documents || {})?.passports)
        ? (data?.documents || {})?.passports
        : []),
    ];
    const passport = passportCandidates
      .flatMap((p) => (Array.isArray(p) ? p : [p]))
      .map((p) => String(p || "").trim())
      .filter(Boolean);
    // Dedupe (some docs store the same URL in multiple legacy fields)
    const seenPassport = new Set();
    let passportUnique = passport.filter((u) => {
      if (seenPassport.has(u)) return false;
      seenPassport.add(u);
      return true;
    });

    // Conservative fallback: only treat a diploma entry as passport if its name
    // looks like a passport (contains "pass" / "reisepass"). This avoids
    // misclassifying real diplomas as passport files.
    if (passportUnique.length === 0 && diplomas.length > 0) {
      const passIdx = diplomas.findIndex((u) =>
        /pass|reisepass/i.test(String(u || ""))
      );
      if (passIdx >= 0) {
        passportUnique = [diplomas[passIdx]];
        diplomas = diplomas.filter((_, i) => i !== passIdx);
      }
    }

    // Avoid showing the same file under both passport and diplomas.
    if (passportUnique.length > 0 && diplomas.length > 0) {
      const passSet = new Set(passportUnique);
      diplomas = diplomas.filter((u) => !passSet.has(u));
    }

    const rawChildrenCount = String(p.kinderAnzahl ?? "").trim();
    const noChildrenFromDoc = Boolean(p.keinKinder);
    const inferredNoChildren =
      noChildrenFromDoc || rawChildrenCount === "" || rawChildrenCount === "0";
    const childrenCount = inferredNoChildren ? "" : rawChildrenCount;

    return {
      personalInfo: {
        name: String(p.name || ""),
        lastName: String(p.nachname || ""),
        gender: String(p.geschlecht || ""),
        address: String(p.adresse || ""),
        birthDate: String(p.geburtsdatum || ""),
        birthPlace: String(p.geburtsort || ""),
        maritalStatus: String(p.familienstand || ""),
        childrenCount,
        noChildren: inferredNoChildren,
        hasDrivingLicense,
        drivingLicenseType,
        phone: String(p.telefon || ""),
        passportNumber: normalizePassportNumber(
          p?.reisepassNummer ||
            data?.passportId ||
            p?.passportId ||
            p?.passportNumber ||
            data?.reisepassNummer ||
            ""
        ),
        email: String(
          p.email ||
            legacyPersonal?.email ||
            data?.email ||
            data?.emailAddress ||
            data?.email_address ||
            ""
        ).trim(),
        photo: String(p.foto || ""),
      },
      experience: berufe.map((b) => ({
        startDate: normalizeMonth(b?.beginn),
        endDate: normalizeMonth(b?.ende),
        position: String(b?.position || ""),
        company: String(b?.unternehmen || ""),
        location: String(b?.ort || ""),
        responsibilities: Array.isArray(b?.aufgaben) ? b.aufgaben : [],
      })),
      education: ausb.map((a) => ({
        startDate: normalizeMonth(a?.beginn),
        endDate: normalizeMonth(a?.ende),
        institution: String(a?.bildungseinrichtung || ""),
        degree: String(a?.abschluss || ""),
      })),
      skills: {
        softSkills: Array.isArray(f?.sozialkompetenzen)
          ? f.sozialkompetenzen
          : [],
        pcSkills: Array.isArray(f?.pcKenntnisse) ? f.pcKenntnisse : [],
        languages:
          typeof f?.sprachen === "object" && f?.sprachen !== null
            ? f.sprachen
            : {},
      },
      documents: {
        diplomas,
        certificates,
        passport: passportUnique,
      },
      commentar: String(data?.commentar || ""),
    };
  }

  function mapFormToDoc(f) {
    const noChildren = Boolean(f?.personalInfo?.noChildren);
    const passportNumber = normalizePassportNumber(
      f?.personalInfo?.passportNumber || ""
    );
    return {
      persoenlicheDaten: {
        name: f.personalInfo.name,
        nachname: f.personalInfo.lastName,
        geschlecht: f.personalInfo.gender,
        adresse: f.personalInfo.address,
        geburtsdatum: f.personalInfo.birthDate,
        geburtsort: String(f?.personalInfo?.birthPlace || "").trim(),
        familienstand: f.personalInfo.maritalStatus,
        kinderAnzahl: noChildren
          ? ""
          : String(f.personalInfo.childrenCount || ""),
        keinKinder: noChildren,
        fuehrerschein: Boolean(f?.personalInfo?.hasDrivingLicense),
        fuehrerscheinTyp: String(f?.personalInfo?.drivingLicenseType || "")
          .trim()
          .toUpperCase(),
        telefon: f.personalInfo.phone,
        email: f.personalInfo.email,
        reisepassNummer: passportNumber,
        foto: f.personalInfo.photo,
      },
      passportId: passportNumber || null,
      berufserfahrung: Array.isArray(f.experience)
        ? f.experience.map((exp) => ({
            beginn: exp.startDate,
            ende: exp.endDate,
            position: exp.position,
            unternehmen: exp.company,
            ort: exp.location,
            aufgaben: Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : [],
          }))
        : [],
      ausbildung: Array.isArray(f.education)
        ? f.education.map((edu) => ({
            beginn: edu.startDate,
            ende: edu.endDate,
            bildungseinrichtung: edu.institution,
            abschluss: edu.degree || "",
          }))
        : [],
      faehigkeiten: {
        sozialkompetenzen: f.skills?.softSkills || [],
        pcKenntnisse: f.skills?.pcSkills || [],
        sprachen: f.skills?.languages || {},
      },
      dokumente: {
        diplome: f.documents?.diplomas || [],
        zertifikate: f.documents?.certificates || [],
        reisepass: f.documents?.passport || [],
        reisepaesse: Array.isArray(f.documents?.passport)
          ? f.documents.passport
          : [],
      },
      documents: {
        diplomas: f.documents?.diplomas || [],
        certificates: f.documents?.certificates || [],
        passport: Array.isArray(f.documents?.passport)
          ? f.documents.passport
          : f.documents?.passport
          ? [f.documents.passport]
          : [],
      },
      commentar: String(getCommentHtml(f) || ""),
    };
  }

  // PDF export UI/logic extracted to `src/pages/generate/pdf/CvPdfDocument.jsx`

  async function handlePhotoFileChange(e) {
    if (isLimitedAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        mimeType: "image/jpeg",
      });
      setFormCv((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, photo: base64 },
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // Experience handlers
  function addExperience() {
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.experience) ? prev.experience : []),
        {
          startDate: "",
          endDate: "",
          position: "",
          company: "",
          location: "",
          responsibilities: [],
        },
      ];
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function updateExperience(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function removeExperience(idx) {
    setFormCv((prev) => {
      const next = prev.experience.filter((_, i) => i !== idx);
      return { ...prev, experience: sortTimelineItemsDesc(next) };
    });
  }
  function addResponsibility(expIdx, text) {
    if (!text?.trim()) return;
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = [...next[expIdx].responsibilities, text.trim()];
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }
  function removeResponsibility(expIdx, respIdx) {
    setFormCv((prev) => {
      const next = [...prev.experience];
      const resp = next[expIdx].responsibilities.filter(
        (_, i) => i !== respIdx
      );
      next[expIdx] = { ...next[expIdx], responsibilities: resp };
      return { ...prev, experience: next };
    });
  }

  // Education handlers
  function addEducation() {
    setFormCv((prev) => {
      const next = [
        ...(Array.isArray(prev.education) ? prev.education : []),
        { startDate: "", endDate: "", institution: "", degree: "" },
      ];
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }
  function updateEducation(idx, field, value) {
    setFormCv((prev) => {
      const next = [...prev.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }
  function removeEducation(idx) {
    setFormCv((prev) => {
      const next = prev.education.filter((_, i) => i !== idx);
      return { ...prev, education: sortTimelineItemsDesc(next) };
    });
  }

  // Skills handlers
  function addTag(path, value) {
    if (isLimitedAdmin) return;
    if (!value?.trim()) return;
    setFormCv((prev) => {
      const draft = safeClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = [...target[key], value.trim()];
      return draft;
    });
  }
  function removeTag(path, index) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const draft = safeClone(prev);
      let target = draft;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const key = path[path.length - 1];
      target[key] = target[key].filter((_, i) => i !== index);
      return draft;
    });
  }
  async function autoAddSkills(kind) {
    if (isLimitedAdmin) return;
    if (kind === "soft") setIsGeneratingSoft(true);
    else setIsGeneratingPc(true);
    try {
      const generated = generateSkills(formCv, kind);
      if (generated.length) {
        if (kind === "soft") {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              softSkills: [...prev.skills.softSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, soft: generated }));
        } else {
          setFormCv((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              pcSkills: [...prev.skills.pcSkills, ...generated],
            },
          }));
          setRecentlyAdded((p) => ({ ...p, pc: generated }));
        }
      } else {
        setRecentlyAdded((p) =>
          kind === "soft" ? { ...p, soft: [] } : { ...p, pc: [] }
        );
      }
    } finally {
      if (kind === "soft") setIsGeneratingSoft(false);
      else setIsGeneratingPc(false);
    }
  }

  // Languages handlers
  const languageRows = useMemo(
    () =>
      Object.entries(formCv.skills.languages).map(([name, level]) => ({
        name,
        level,
      })),
    [formCv.skills.languages]
  );
  const experienceCount = Array.isArray(formCv.experience)
    ? formCv.experience.length
    : 0;
  const educationCount = Array.isArray(formCv.education)
    ? formCv.education.length
    : 0;

  const languagesCount = Array.isArray(languageRows) ? languageRows.length : 0;
  const documentsCount =
    (Array.isArray(formCv.documents?.diplomas)
      ? formCv.documents.diplomas.length
      : 0) +
    (Array.isArray(formCv.documents?.certificates)
      ? formCv.documents.certificates.length
      : 0) +
    (Array.isArray(formCv.documents?.passport)
      ? formCv.documents.passport.length
      : 0);
  function addLanguageRow() {
    if (isLimitedAdmin) return;
    setFormCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: { ...prev.skills.languages, "": "A1" },
      },
    }));
  }
  function updateLanguageRow(rowIdx, field, value) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages);
      const [oldName, oldLevel] = entries[rowIdx] || ["", "A1"];
      let next = [...entries];
      if (field === "name") next[rowIdx] = [value, oldLevel];
      else next[rowIdx] = [oldName, value];
      const nextObj = Object.fromEntries(
        next.filter(
          ([k]) => k !== "" || (k === "" && field === "name" && value !== "")
        )
      );
      return { ...prev, skills: { ...prev.skills, languages: nextObj } };
    });
  }
  function removeLanguageRow(rowIdx) {
    if (isLimitedAdmin) return;
    setFormCv((prev) => {
      const entries = Object.entries(prev.skills.languages).filter(
        (_, i) => i !== rowIdx
      );
      return {
        ...prev,
        skills: { ...prev.skills, languages: Object.fromEntries(entries) },
      };
    });
  }

  async function persistStatus(targetValue, { silent = false } = {}) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, den Status zu ändern.");
      return false;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return false;

    try {
      setIsSavingStatus(true);
      const now = Date.now();
      // Always persist canonical stage values (backward compatible with legacy status values).
      const normalizedValue =
        normalizeCandidateStatusValue(targetValue) || CANDIDATE_STATUS_DEFAULT;
      const statusMeta = getCandidateStatus(normalizedValue);
      await updateDocument(col, docId, {
        status: {
          value: normalizedValue,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(normalizedValue);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      if (!silent) {
        toast.success("Status gespeichert.");
      }
      return true;
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error("Fehler beim Speichern des Status.");
      }
      return false;
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleStatusSave() {
    await persistStatus(statusValue, { silent: false });
  }

  function getNextStepValue(value) {
    const steps = CANDIDATE_STATUS_OPTIONS;
    const idx = steps.findIndex((s) => s.value === value);
    if (idx === -1) return null;
    return steps[idx + 1]?.value || null;
  }

  async function sendStatusEmail(
    stepValue,
    { stageDecision: decisionRaw, decisionNote, additionalInfo } = {}
  ) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("E-Mails können nur für die aktuelle Stufe gesendet werden.");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    if (!recipientEmail) {
      toast.error("E-Mail-Adresse des Kandidaten wurde nicht gefunden.");
      return;
    }

    if (sendingEmailLockRef.current) {
      toast("E-Mail wird gesendet, bitte warten...");
      return;
    }

    sendingEmailLockRef.current = true;
    setSendingStepValue(stepValue);

    try {
      const normalizedDecision =
        decisionRaw === "rejected" ? "rejected" : "accepted";

      const emailSentAt = Date.now();
      const info =
        normalizedDecision === "accepted"
          ? stepValue === "stage_2"
            ? createEmptyStageInfo()
            : normalizeStageFormInfo(additionalInfo)
          : createEmptyStageInfo();

      const telegramGroupIdForStage = getTelegramGroupIdForStage(
        metaInfo,
        stepValue
      );

      if (normalizedDecision === "accepted" && stepValue !== "stage_2") {
        const wantsGeneratedLink = Boolean(info?.useGeneratedLink);
        const hasLink =
          Boolean(info.link) ||
          (wantsGeneratedLink && Boolean(telegramGroupIdForStage));
        const hasLocation = Boolean(info.locationName || info.locationUrl);
        if (!info.dateTime) {
          toast.error("Datum/Uhrzeit fehlt.");
          return;
        }
        if (!hasLink && !hasLocation) {
          toast.error("Bitte Link oder Standort angeben.");
          return;
        }
      }

      if (
        normalizedDecision === "accepted" &&
        Boolean(info?.useGeneratedLink) &&
        telegramGroupIdForStage
      ) {
        try {
          const { invite_link } = await generateTelegramInviteLink({
            groupId: telegramGroupIdForStage,
          });
          info.link = invite_link;
          info.linkType = "telegram";
        } catch (e) {
          console.error("generateTelegramInviteLink failed:", e);
          toast.error("Telegram invite link yaratib bo‘lmadi.");
          return;
        }
      } else if (
        normalizedDecision === "accepted" &&
        Boolean(info?.useGeneratedLink) &&
        !telegramGroupIdForStage
      ) {
        toast.error("Telegram guruh sozlanmagan (Einstellungen’dan tanlang).");
        return;
      }

      const templateId = makeEmailTemplateId(stepValue, normalizedDecision);
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stepValue,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: normalizedDecision,
        decisionNote,
        additionalInfo: info,
        copyOverrides,
      });
      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject,
        message,
        htmlContent,
      });
      if (res?.success === false) {
        throw new Error("E-Mail wurde nicht gesendet (success=false).");
      }

      // Count "sent" telegram invites when email was successfully sent with telegram link
      try {
        const usedTelegramLink =
          String(info?.linkType || "").toLowerCase() === "telegram" &&
          Boolean(telegramGroupIdForStage);

        if (DEBUG_GENERATE) {
          console.log("[Generate] Telegram link tracking:", {
            usedTelegramLink,
            linkType: info?.linkType,
            telegramGroupIdForStage,
            stepValue,
            useGeneratedLink: info?.useGeneratedLink,
          });
        }

        if (usedTelegramLink) {
          await trackTelegramInviteSent({
            groupId: telegramGroupIdForStage,
            count: 1,
          });
          if (DEBUG_GENERATE) {
            console.log(
              "[Generate] Telegram sent counter updated for group:",
              telegramGroupIdForStage
            );
          }
        }
      } catch (e) {
        console.error("trackTelegramInviteSent failed:", e);
        // Don't fail the email send if counter update fails
        toast.error(
          "E-Mail wurde gesendet, aber Telegram-Zähler konnte nicht aktualisiert werden."
        );
      }

      toast.success("Status-E-Mail wurde gesendet.");

      // Best-effort: store email send counters for list view (CollectionCv)
      try {
        const stageBase = `stageMeta.${stepValue}`;
        await updateDocument(col, docId, {
          "emailMeta.count": increment(1),
          "emailMeta.lastSentAt": emailSentAt,
          "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
          "emailMeta.lastSentType": "status",
          "emailMeta.lastSentStage": stepValue,
          "emailMeta.lastSentDecision": normalizedDecision,
          [`${stageBase}.decision`]: normalizedDecision,
          [`${stageBase}.decidedAt`]: emailSentAt,
          [`${stageBase}.decidedBy`]: user?.email || user?.uid || "admin",
          [`${stageBase}.decisionNote`]: String(decisionNote || "").trim(),
        });
      } catch (e) {
        console.error("emailMeta update failed:", e);
      }

      if (normalizedDecision === "accepted") {
        const nextValue = getNextStepValue(stepValue) || stepValue;
        await persistStatus(nextValue, { silent: true });
        setStatusValue(nextValue);
      }

      setPendingStageStep(null);
      setIsStageEmailModalOpen(false);

      if (normalizedDecision === "rejected") {
        const itemId = String(id || "").trim();
        const targetEmail = String(formCv?.personalInfo?.email || "").trim();
        const firstName = String(formCv?.personalInfo?.name || "").trim();
        const lastName = String(formCv?.personalInfo?.lastName || "").trim();
        const targetName = [firstName, lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (itemId) {
          setDeleteTarget({
            id: itemId,
            email: targetEmail,
            name: targetName,
          });
          setDeleteModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(
        "Fehler beim Senden der E-Mail. Bitte später erneut versuchen."
      );
    } finally {
      setSendingStepValue(null);
      sendingEmailLockRef.current = false;
    }
  }

  function closeDeleteModal() {
    if (isDeletingCandidate) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDeleteCandidate() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = String(deleteTarget?.id || "").trim();
    if (!colName || !itemId) return;
    try {
      setIsDeletingCandidate(true);

      // 0) Load full candidate doc so we can snapshot it into deleted_users
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 1) Remove from Firestore email registry (`email_and_passId`)
      const emailFromDoc = String(full?.persoenlicheDaten?.email || "").trim();
      const targetEmail = String(deleteTarget?.email || emailFromDoc || "")
        .trim()
        .toLowerCase();
      if (targetEmail) {
        await deleteEmailAndPassIdByEmail(targetEmail);
      }

      // 1.5) Store deleted user snapshot in Firestore `deleted_users`
      await saveDeletedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        deletedBy: user?.email || user?.uid || "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde gelöscht.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen.");
    } finally {
      setIsDeletingCandidate(false);
    }
  }

  async function confirmArchiveCandidate() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Kandidaten zu löschen.");
      return;
    }
    const colName = String(resolvedMajor?.collectionName || "").trim();
    const itemId = String(deleteTarget?.id || "").trim();
    if (!colName || !itemId) return;
    try {
      setIsDeletingCandidate(true);

      // 0) Load full candidate doc (we do NOT delete uploaded file URLs here)
      const full = await getDocumentDataById(colName, itemId);
      const remotePayload = full && typeof full === "object" ? full : {};

      // 1.5) Store archived user snapshot in Firestore `archived_users`
      await saveArchivedUserSnapshotFirestore({
        major: resolvedMajor?.collectionName || colName,
        sourceDocId: itemId,
        majorTitle: resolvedMajor?.title || colName,
        archivedBy: user?.email || user?.uid || "admin",
        payload: {
          major: resolvedMajor?.collectionName || colName,
          ...remotePayload,
        },
      });

      // 2) Delete from Firestore + update LIVE stats (current only)
      await deleteCandidateWithCurrentStats(colName, itemId, {
        majorLabel: resolvedMajor?.title || colName,
      });

      toast.success("Kandidat wurde archiviert.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      navigate(`/collectionCv/${resolvedMajor?.linkId || major}`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Archivieren.");
    } finally {
      setIsDeletingCandidate(false);
    }
  }

  function splitCustomEmailBody(raw) {
    const normalized = String(raw || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    // first blank line separates main vs note
    const parts = normalized.split(/\n\s*\n/);
    const main = String(parts[0] || "").trim();
    const note = parts.slice(1).join("\n\n").trim();
    return {
      mainText: main,
      nextStepNote: note,
      hasMain: Boolean(main),
      hasNote: Boolean(note),
    };
  }

  async function sendCustomEmail({ to, emailTitle, subject, bodyText }) {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, E-Mails zu senden.");
      return;
    }
    const recipientEmail = String(to || "").trim();
    if (!recipientEmail) {
      toast.error("Empfänger-E-Mail (To) ist nicht ausgefüllt.");
      return;
    }
    const safeStatusValue =
      String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const safeDecision = "accepted";

    const firstName = String(formCv.personalInfo.name || "");
    const lastName = String(formCv.personalInfo.lastName || "");

    const additionalInfo = getStageAdditionalInfo(safeStatusValue);

    const { mainText, nextStepNote, hasMain, hasNote } =
      splitCustomEmailBody(bodyText);

    if (!hasMain) {
      toast.error(
        "Im Textbereich muss mindestens 1 Absatz (Haupttext) enthalten sein."
      );
      return;
    }
    const subjectRaw = String(subject || "").trim();
    if (!subjectRaw) {
      toast.error("Betreff ist nicht ausgefüllt.");
      return;
    }

    const copyOverrides = {
      emailTitle: String(emailTitle || "").trim()
        ? String(emailTitle)
        : undefined,
      subject: subjectRaw,
      // Custom email: DO NOT fallback to stage defaults
      mainText,
      nextStepNote: hasNote ? nextStepNote : "",
      emphasizeMainText: false,
    };

    const {
      subject: builtSubject,
      message,
      htmlContent,
    } = buildStatusEmailTemplate({
      statusValue: safeStatusValue,
      firstName,
      lastName,
      stageDecision: safeDecision,
      decisionNote: "",
      additionalInfo,
      copyOverrides,
    });

    const safeSubject = String(builtSubject || "").trim();
    if (!safeSubject) {
      toast.error("Betreff ist nicht ausgefüllt.");
      return;
    }

    if (sendingEmailLockRef.current) {
      toast("E-Mail wird gesendet, bitte warten...");
      return;
    }

    sendingEmailLockRef.current = true;
    setSendingStepValue("custom");
    try {
      const emailSentAt = Date.now();
      const finalMessage = stripStatusLineFromCustomEmail(message);
      const finalHtml = stripStatusLineFromCustomEmail(htmlContent);
      const res = await sendBrevoEmail({
        to: recipientEmail,
        subject: safeSubject,
        message: finalMessage,
        htmlContent: finalHtml || undefined,
      });
      if (res?.success === false) {
        throw new Error("E-Mail wurde nicht gesendet (success=false).");
      }

      // Count "sent" telegram invites for custom email (if telegram link was included)
      try {
        const usedTelegramLink =
          String(additionalInfo?.linkType || "").toLowerCase() === "telegram";
        const telegramGroupIdForStage = getTelegramGroupIdForStage(
          metaInfo,
          safeStatusValue
        );

        if (DEBUG_GENERATE) {
          console.log("[Generate] Custom email telegram link tracking:", {
            usedTelegramLink,
            linkType: additionalInfo?.linkType,
            telegramGroupIdForStage,
            statusValue: safeStatusValue,
          });
        }

        if (usedTelegramLink && telegramGroupIdForStage) {
          await trackTelegramInviteSent({
            groupId: telegramGroupIdForStage,
            count: 1,
          });
          if (DEBUG_GENERATE) {
            console.log(
              "[Generate] Custom email telegram sent counter updated for group:",
              telegramGroupIdForStage
            );
          }
        }
      } catch (e) {
        console.error("trackTelegramInviteSent (custom email) failed:", e);
        // Don't fail the email send if counter update fails
      }

      toast.success("Benutzerdefinierte E-Mail wurde gesendet.");

      // Best-effort: store email send counters for list view (CollectionCv)
      try {
        const col = String(resolvedMajor?.collectionName || "").trim();
        const docId = String(id || "").trim();
        if (col && docId) {
          await updateDocument(col, docId, {
            "emailMeta.count": increment(1),
            "emailMeta.lastSentAt": emailSentAt,
            "emailMeta.lastSentBy": user?.email || user?.uid || "admin",
            "emailMeta.lastSentType": "custom",
          });
        }
      } catch (e) {
        console.error("emailMeta update failed:", e);
      }

      setIsCustomEmailModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        "Fehler beim Senden der benutzerdefinierten E-Mail. Bitte später erneut versuchen."
      );
    } finally {
      setSendingStepValue(null);
      sendingEmailLockRef.current = false;
    }
  }

  async function resetCandidateStages() {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, die Stufen zurückzusetzen.");
      return;
    }
    if (sendingEmailLockRef.current || sendingStepValue) {
      toast("E-Mail-Vorgang läuft, bitte warten...");
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;

    const ok = window.confirm(
      "Kandidatenstufen auf Anfang (Stufe 1) zurücksetzen?\n\nHinweis: Der E-Mail-Zähler wird ebenfalls auf 0 gesetzt."
    );
    if (!ok) return;

    try {
      const now = Date.now();
      const statusMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
      await updateDocument(col, docId, {
        status: {
          value: CANDIDATE_STATUS_DEFAULT,
          label: statusMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        },
        emailMeta: {
          count: 0,
          lastSentAt: null,
          lastSentBy: null,
          lastSentType: null,
          lastSentStage: null,
          resetAt: now,
          resetBy: user?.email || user?.uid || "admin",
        },
      });
      setStatusValue(CANDIDATE_STATUS_DEFAULT);
      setStatusUpdatedAt(now);
      setStatusUpdatedBy(user?.email || user?.uid || "admin");
      toast.success("Stufen wurden zurückgesetzt.");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Zurücksetzen der Stufen.");
    }
  }

  function getStageAdditionalInfo(stepValue) {
    const v = String(stepValue || "").trim();
    const normalizeInterview = (obj) => {
      const rawType = String(obj?.linkType || "").toLowerCase();
      const resolvedType =
        rawType === "telegram" ? "telegram" : inferLinkType(obj?.link, "zoom");
      return {
        dateTime: String(obj?.date || ""),
        link: String(obj?.link || ""),
        linkType: resolvedType,
        locationName: String(obj?.locationName || ""),
        locationUrl: String(obj?.locationUrl || ""),
      };
    };
    if (v === "stage_1") {
      return normalizeInterview(metaInfo?.interviewInternal);
    }
    if (v === "stage_3") {
      return normalizeInterview(metaInfo?.interviewEmployer);
    }
    return createEmptyStageInfo();
  }

  function normalizeStageFormInfo(raw) {
    const link = String(raw?.link || "").trim();
    const linkType =
      raw?.linkType === "telegram" ? "telegram" : inferLinkType(link, "zoom");
    const locationUrl = String(raw?.locationUrl || "").trim();
    const locationNameRaw = String(raw?.locationName || "").trim();
    const locationName = locationNameRaw || locationUrl;
    return {
      dateTime: String(raw?.dateTime || "").trim(),
      link,
      linkType,
      useGeneratedLink: Boolean(raw?.useGeneratedLink),
      locationName,
      locationUrl,
    };
  }

  function handleSendStatusEmail(stepValue) {
    if (isLimitedAdmin) {
      toast.error("Sizda e-mail yuborish uchun ruxsat yo‘q.");
      return;
    }
    if (stepValue !== statusValue) {
      toast.error("E-mail faqat joriy bosqich uchun yuboriladi.");
      return;
    }
    const initialInfo = getStageAdditionalInfo(stepValue);
    const telegramGroupIdForStage = getTelegramGroupIdForStage(
      metaInfo,
      stepValue
    );
    const canGenerateTelegramLinkForStage = Boolean(telegramGroupIdForStage);
    // Best-effort: preload group name so modal can show it immediately.
    if (telegramGroupIdForStage) {
      try {
        ensureTelegramGroupName(telegramGroupIdForStage);
      } catch {
        // ignore
      }
    }
    setPendingStageStep(stepValue);
    setStageDecision("accepted");
    setStageAdditionalInfoForm({
      dateTime: toDateTimeLocalString(initialInfo?.dateTime),
      link: String(initialInfo?.link || ""),
      linkType:
        initialInfo?.linkType === "telegram"
          ? "telegram"
          : inferLinkType(initialInfo?.link, "zoom"),
      useGeneratedLink:
        initialInfo?.linkType === "telegram" &&
        canGenerateTelegramLinkForStage &&
        !String(initialInfo?.link || "").trim(),
      locationName: String(initialInfo?.locationName || ""),
      locationUrl: String(initialInfo?.locationUrl || ""),
    });
    setIsStageEmailModalOpen(true);
  }

  function closeStageEmailModal() {
    setIsStageEmailModalOpen(false);
    setPendingStageStep(null);
  }

  function openCustomEmailModal() {
    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    // Start clean (inputs empty), placeholders + preview show defaults.
    setCustomEmailForm({
      to: recipientEmail,
      emailTitle: "",
      subject: "",
      bodyText: "",
    });
    setIsCustomEmailModalOpen(true);
  }

  function closeCustomEmailModal() {
    setIsCustomEmailModalOpen(false);
  }

  async function handleCustomEmailSubmit(e) {
    e?.preventDefault();
    await sendCustomEmail(customEmailForm);
  }

  async function handleStageEmailSubmit(e) {
    e?.preventDefault();
    if (!pendingStageStep) {
      setIsStageEmailModalOpen(false);
      return;
    }
    const info =
      pendingStageStep === "stage_2"
        ? createEmptyStageInfo()
        : normalizeStageFormInfo(stageAdditionalInfoForm);
    await sendStatusEmail(pendingStageStep, {
      stageDecision,
      additionalInfo: info,
    });
  }

  const stageEmailPreview = useMemo(() => {
    if (!pendingStageStep) return null;
    const recipientEmail = String(formCv.personalInfo.email || "").trim();
    const normalizedDecision =
      stageDecision === "rejected" ? "rejected" : "accepted";
    const info =
      normalizedDecision === "accepted"
        ? pendingStageStep === "stage_2"
          ? createEmptyStageInfo()
          : normalizeStageFormInfo(stageAdditionalInfoForm)
        : createEmptyStageInfo();
    try {
      // Preview should reflect the *effective* link choice:
      // - If manual link is used: show it
      // - If auto-generate is selected: show a placeholder (real invite is generated on send)
      const telegramGroupIdForStage = getTelegramGroupIdForStage(
        metaInfo,
        pendingStageStep
      );
      const wantsGeneratedLink = Boolean(info?.useGeneratedLink);
      if (
        normalizedDecision === "accepted" &&
        pendingStageStep !== "stage_2" &&
        wantsGeneratedLink &&
        telegramGroupIdForStage
      ) {
        info.linkType = "telegram";
        info.link = "Telegram invite link (send paytida avtomatik yaratiladi)";
      }

      const templateId = makeEmailTemplateId(
        pendingStageStep,
        normalizedDecision
      );
      const templateDoc = emailTemplatesMap?.[templateId] || null;
      const copyOverrides =
        toCopyOverridesFromTemplateDoc(templateDoc) || undefined;

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: pendingStageStep,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: normalizedDecision,
        decisionNote: "",
        additionalInfo: info,
        copyOverrides,
      });
      return {
        to: recipientEmail,
        subject,
        message,
        htmlContent,
      };
    } catch (err) {
      console.error("stageEmailPreview error:", err);
      return {
        to: recipientEmail,
        subject: "",
        message: "",
        htmlContent: "",
      };
    }
  }, [
    pendingStageStep,
    stageDecision,
    stageAdditionalInfoForm,
    formCv.personalInfo.email,
    formCv.personalInfo.name,
    formCv.personalInfo.lastName,
    emailTemplatesMap,
    telegramGroupNameById,
  ]);

  const customEmailDefaults = useMemo(() => {
    const stage = String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const templateId = makeEmailTemplateId(stage, "accepted");
    const templateDoc = emailTemplatesMap?.[templateId] || null;
    const override = toCopyOverridesFromTemplateDoc(templateDoc) || {};
    const baseCopy = getStatusEmailCopy(stage, "accepted");
    const subjectFromTemplate =
      override?.subject !== undefined
        ? String(override.subject || "")
        : String(baseCopy?.subject || "");
    return {
      emailTitle: "Ariza holati yangilandi",
      subject: subjectFromTemplate,
      bodyText: "Asosiy matn (main)...\n\nKeyingi qadam (note)...",
    };
  }, [statusValue, emailTemplatesMap]);

  function stripDefaultIntroFromCustomPreview(value) {
    const raw = String(value || "");
    if (!raw) return raw;
    const intros = [
      // legacy (Uzbek)
      "Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing:",
      // current (German)
      "Wir haben den Status Ihrer Bewerbung aktualisiert. Bitte lesen Sie die folgenden Hinweise und nächsten Schritte sorgfältig durch:",
    ];
    // Remove the exact intro line from both HTML and plain text previews (best-effort).
    let out = raw;
    for (const intro of intros) {
      out = out
        .replace(
          new RegExp(
            `<p[^>]*>\\s*${intro.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*<\\/p>\\s*`,
            "g"
          ),
          ""
        )
        .replace(
          new RegExp(
            `\\s*${intro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
            "g"
          ),
          ""
        );
    }
    return out.trim();
  }

  function stripStatusLineFromCustomEmail(value) {
    const raw = String(value || "");
    if (!raw) return raw;
    // HTML header "Status/Holat: <strong>...": remove the entire div line.
    const htmlOut = raw.replace(
      /<div[^>]*>\s*(?:Holat|Status):\s*<strong>[\s\S]*?<\/strong>\s*<\/div>\s*/gi,
      ""
    );
    // Plain text "Status/Holat: ..." line
    return htmlOut
      .replace(/\n?(?:Holat|Status):\s*.*(\n|$)/gi, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const customEmailPreview = useMemo(() => {
    const recipientEmail = String(customEmailForm?.to || "").trim();
    const stage = String(statusValue || "").trim() || CANDIDATE_STATUS_DEFAULT;
    const decision = "accepted";
    const info = getStageAdditionalInfo(stage);
    const { mainText, nextStepNote, hasMain, hasNote } = splitCustomEmailBody(
      customEmailForm?.bodyText
    );
    try {
      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stage,
        firstName: formCv.personalInfo.name,
        lastName: formCv.personalInfo.lastName,
        stageDecision: decision,
        decisionNote: "",
        additionalInfo: info,
        copyOverrides: {
          emailTitle: String(customEmailForm?.emailTitle || "").trim()
            ? String(customEmailForm?.emailTitle || "")
            : undefined,
          subject: String(customEmailForm?.subject || "").trim()
            ? String(customEmailForm?.subject || "")
            : undefined,
          // Preview: don't show stage default texts if user didn't type anything
          mainText: hasMain ? mainText : "",
          nextStepNote: hasNote ? nextStepNote : "",
          emphasizeMainText: false,
        },
      });
      return {
        to: recipientEmail,
        subject,
        message: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(message)
        ),
        htmlContent: stripStatusLineFromCustomEmail(
          stripDefaultIntroFromCustomPreview(htmlContent)
        ),
      };
    } catch (err) {
      console.error("customEmailPreview error:", err);
      return { to: recipientEmail, subject: "", message: "", htmlContent: "" };
    }
  }, [
    customEmailForm,
    formCv.personalInfo.name,
    formCv.personalInfo.lastName,
    statusValue,
    metaInfo,
  ]);

  async function handleSave() {
    if (remoteMode) {
      toast.error(
        "Stellen Sie den Kandidaten zuerst im passenden Bereich (Major) wieder her. Danach können E-Mails versendet werden."
      );
      return;
    }
    const col = String(resolvedMajor?.collectionName || "").trim();
    const docId = String(id || "").trim();
    if (!col || !docId) return;
    const commentHasContent = hasRichTextContent(commentHtml);
    const originalComment = String(docCv?.commentar || "");
    const isCommentUpdated =
      String(commentHtml || "") !== String(originalComment || "");

    const nextCommentMeta = isCommentUpdated
      ? {
          updatedAt: Date.now(),
          updatedByUid: user?.uid || "",
          updatedByName:
            user?.displayName ||
            user?.email ||
            user?.phoneNumber ||
            "Unbekannt",
          updatedByPhoto: user?.photoURL || "",
        }
      : null;

    if (!isLimitedAdmin) {
      if (!formCv.personalInfo.name?.trim()) {
        toast.error("Vorname ist erforderlich.");
        return;
      }
      if (!formCv.personalInfo.lastName?.trim()) {
        toast.error("Nachname ist erforderlich.");
        return;
      }
      if (!formCv.personalInfo.gender) {
        toast.error("Bitte Geschlecht auswählen.");
        return;
      }
      if (!String(formCv.personalInfo.birthPlace || "").trim()) {
        toast.error("Geburtsort ist erforderlich.");
        return;
      }
      if (!isGermanAddressComplete(addressFields)) {
        toast.error(
          "Bitte vollständige Adresse eingeben (Straße, Hausnummer, PLZ, Ort, Land)."
        );
        return;
      }
      const noKids = Boolean(formCv.personalInfo.noChildren);
      const kidsCount = String(formCv.personalInfo.childrenCount || "").trim();
      if (!noKids && !kidsCount) {
        toast.error(
          "Bitte Kinderanzahl eingeben oder 'Keine Kinder' auswählen."
        );
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = isLimitedAdmin
        ? {
            commentar: String(commentHtml || ""),
            berufserfahrung: formCv.experience || [],
            ausbildung: formCv.education || [],
          }
        : mapFormToDoc(formCv);
      if (nextCommentMeta) {
        payload.commentarMeta = nextCommentMeta;
      }

      // Email sync (Firestore + external API)
      const oldEmail = String(docCv?.persoenlicheDaten?.email || "").trim();
      const newEmail = String(formCv?.personalInfo?.email || "").trim();
      const shouldSyncEmail =
        !isLimitedAdmin &&
        Boolean(oldEmail) &&
        Boolean(newEmail) &&
        oldEmail.toLowerCase() !== newEmail.toLowerCase();

      // If email changed, reset candidate stages so emails can be re-sent from the beginning.
      if (shouldSyncEmail) {
        const now = Date.now();
        const resetMeta = getCandidateStatus(CANDIDATE_STATUS_DEFAULT);
        payload.status = {
          value: CANDIDATE_STATUS_DEFAULT,
          label: resetMeta.label,
          updatedAt: now,
          updatedBy: user?.email || user?.uid || "admin",
        };
        // Update local UI immediately; snapshot will also refresh.
        setStatusValue(CANDIDATE_STATUS_DEFAULT);
        setStatusUpdatedAt(now);
        setStatusUpdatedBy(user?.email || user?.uid || "admin");
      }

      // ---- Process documents marked for deletion ----
      const updatedPayload = { ...payload };
      let hasDocumentChanges = false;

      for (const documentType of ["passport", "diplomas", "certificates"]) {
        const markedForDeletion =
          documentsMarkedForDeletion[documentType] || [];
        if (markedForDeletion.length > 0) {
          hasDocumentChanges = true;
          // Delete from JSON API first
          for (const { url } of markedForDeletion) {
            try {
              await deleteUploadedFileRemote(url);
            } catch (err) {
              if (Number(err?.status) === 404) {
                console.warn(
                  `[document-delete] Remote file missing (404):`,
                  url
                );
              } else {
                console.error(`Failed to delete remote file:`, url, err);
              }
            }
          }

          // Remove documents from payload
          const currentDocs = updatedPayload.documents?.[documentType] || [];
          const remainingDocs = currentDocs.filter(
            (url, index) =>
              !markedForDeletion.some((marked) => marked.index === index)
          );

          if (!updatedPayload.documents) {
            updatedPayload.documents = {};
          }
          updatedPayload.documents[documentType] = remainingDocs;
        }
      }

      // If documents were changed, recreate payload from updated formCv to ensure consistency
      if (hasDocumentChanges && !isLimitedAdmin) {
        // Create a temporary updated form to generate the correct payload
        const tempUpdatedForm = { ...formCv };
        if (!tempUpdatedForm.documents) {
          tempUpdatedForm.documents = {
            passport: [],
            diplomas: [],
            certificates: [],
          };
        }

        for (const documentType of ["passport", "diplomas", "certificates"]) {
          const markedForDeletion =
            documentsMarkedForDeletion[documentType] || [];
          if (markedForDeletion.length > 0) {
            const currentDocs = tempUpdatedForm.documents[documentType] || [];
            const remainingDocs = currentDocs.filter(
              (url, index) =>
                !markedForDeletion.some((marked) => marked.index === index)
            );
            tempUpdatedForm.documents[documentType] = remainingDocs;
          }
        }

        // Recreate payload with updated form
        const finalPayload = mapFormToDoc(tempUpdatedForm);
        if (nextCommentMeta) {
          finalPayload.commentarMeta = nextCommentMeta;
        }

        // Update Firestore with the correct payload
        await updateCandidateWithDualStats(col, docId, finalPayload, {
          majorLabel: col,
        });
      } else {
        // Use the updated payload for limited admin or when no document changes
        if (isLimitedAdmin) {
          await updateDocument(col, docId, updatedPayload);
        } else {
          await updateCandidateWithDualStats(col, docId, updatedPayload, {
            majorLabel: col,
          });
        }
      }

      // ---- Sync to external user registry (all_users) (best-effort) ----
      try {
        const latest = await getDocumentDataById(col, docId);
        await upsertUserRemoteAllUsers({
          firebaseId: docId,
          major: col,
          payload: latest && typeof latest === "object" ? latest : payload,
        });
      } catch (err) {
        console.error("all_users sync failed:", err);
        toast.error(
          "In Firebase gespeichert, aber Fehler beim Schreiben in die externe Benutzerdatenbank."
        );
      }

      if (shouldSyncEmail) {
        try {
          await updateEmailRemote(oldEmail, newEmail, col);
        } catch (err) {
          console.error("updateEmailRemote failed:", err);
          toast.error(
            "In Firebase gespeichert, aber Fehler beim Aktualisieren der externen E-Mail-Datenbank."
          );
        }
      }
      if (shouldSyncEmail) {
        toast(
          "E-Mail wurde geändert: Kandidatenstufen wurden auf stage_1 zurückgesetzt."
        );
      }
      if (isLimitedAdmin) {
        setCommentBaseline(String(commentHtml || ""));
      }

      // Clear documents marked for deletion and update form state
      const hadDocumentsToDelete = Object.values(
        documentsMarkedForDeletion
      ).some((arr) => arr.length > 0);

      if (hadDocumentsToDelete) {
        // Update formCv to reflect the deleted documents
        setFormCv((prev) => {
          const updated = { ...prev };
          if (!updated.documents) {
            updated.documents = {
              passport: [],
              diplomas: [],
              certificates: [],
            };
          }

          for (const documentType of ["passport", "diplomas", "certificates"]) {
            const markedForDeletion =
              documentsMarkedForDeletion[documentType] || [];
            if (markedForDeletion.length > 0) {
              const currentDocs = updated.documents[documentType] || [];
              const remainingDocs = currentDocs.filter(
                (url, index) =>
                  !markedForDeletion.some((marked) => marked.index === index)
              );
              updated.documents[documentType] = remainingDocs;
            }
          }

          // Update savedBaselineJson with the updated form state
          setTimeout(() => {
            setSavedBaselineJson(JSON.stringify(normalizeForm(updated)));
          }, 0);

          return updated;
        });

        // Clear the deletion marks
        setDocumentsMarkedForDeletion({
          passport: [],
          diplomas: [],
          certificates: [],
        });
      } else {
        // If no documents were deleted, update baseline immediately
        setSavedBaselineJson(JSON.stringify(normalizedCurrentForm));
      }

      if (nextCommentMeta) {
        setCommentMeta(nextCommentMeta);
      }
      if (commentHasContent) {
        setIsCommentEditorOpen(false);
      }

      // Show appropriate success message
      if (hadDocumentsToDelete) {
        toast.success(
          isLimitedAdmin
            ? "Kommentar und Dokumente wurden gespeichert."
            : "Änderungen und Dokumente wurden gespeichert."
        );
      } else {
        toast.success(
          isLimitedAdmin
            ? "Kommentar wurde gespeichert."
            : "Änderungen wurden gespeichert."
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (remoteMode) {
      toast.error(
        "Stellen Sie den Kandidaten zuerst im passenden Bereich (Major) wieder her."
      );
      return;
    }
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung zum Herunterladen.");
      return;
    }
    try {
      setIsDownloading(true);
      const firstName = String(formCv.personalInfo.name || "").trim();
      const lastName = String(formCv.personalInfo.lastName || "").trim();
      const candidateName = [firstName, lastName].filter(Boolean).join(" ");
      const fileBase = candidateName
        ? `Lebenslauf ${candidateName}`
        : "Lebenslauf";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Lebenslauf";
      const blob = await pdf(
        <CvPdfDocument
          form={{ ...formCv, commentarMeta: commentMeta }}
          showDocuments={showDocuments}
          showComment={showComment}
          showCommentDate={showCommentDate}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const SectionTitle = ({ children }) => (
    <div className="mt-8 mb-3">
      <h3 className="text-xl font-semibold">{children}</h3>
      <div className="h-[2px] bg-base-300 mt-1" />
    </div>
  );

  // Preview data from form state
  const firstName = String(formCv.personalInfo.name || "").trim();
  const lastName = String(formCv.personalInfo.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const address = String(formCv.personalInfo.address || "").trim();
  const birthDate = String(formCv.personalInfo.birthDate || "").trim();
  const phone = String(formCv.personalInfo.phone || "").trim();
  const passportNumber = normalizePassportNumber(
    formCv.personalInfo.passportNumber || ""
  );
  const email = String(formCv.personalInfo.email || "").trim();
  const maritalStatus = String(formCv.personalInfo.maritalStatus || "").trim();
  const noChildren = Boolean(formCv.personalInfo.noChildren);
  const childrenCount = String(formCv.personalInfo.childrenCount || "").trim();
  const photo = String(formCv.personalInfo.photo || "").trim();

  function openPhotoModal() {
    if (!photo) return;
    setPhotoModalSrc(photo);
    setIsPhotoModalOpen(true);
  }

  function closePhotoModal() {
    setIsPhotoModalOpen(false);
    setPhotoModalSrc("");
  }

  function askContinueWithoutPassport() {
    if (missingPassportResolverRef.current) {
      missingPassportResolverRef.current(false);
    }
    return new Promise((resolve) => {
      missingPassportResolverRef.current = resolve;
      setMissingPassportModalOpen(true);
    });
  }

  function resolveMissingPassportModal(value) {
    const resolver = missingPassportResolverRef.current;
    missingPassportResolverRef.current = null;
    if (typeof resolver === "function") {
      resolver(value);
    }
  }

  function handleMissingPassportConfirm() {
    setMissingPassportModalOpen(false);
    resolveMissingPassportModal(true);
  }

  function handleMissingPassportCancel() {
    setMissingPassportModalOpen(false);
    resolveMissingPassportModal(false);
  }

  // Shared DaisyUI input styles for the edit form
  const inputBase = "input input-bordered w-full";
  const selectBase = "select select-bordered w-full";
  const textareaBase = "textarea textarea-bordered w-full";
  const fileInputBase =
    "file-input file-input-bordered file-input-primary w-full";

  const phoneOk = isPhoneComplete(phone);
  const phoneWarn = phone.length > 0 && !phoneOk;
  const phoneDigits = getPhoneBodyDigits(phone);
  const emailOk = isEmailValid(email);
  const emailWarn = email.length > 0 && !emailOk;
  const passportOk = isPassportNumberValid(passportNumber);
  const passportWarn = passportNumber.length > 0 && !passportOk;
  const phoneShowOk = phoneTouched && phoneOk;
  const passportShowOk = passportTouched && passportOk;
  const emailShowOk = emailTouched && emailOk;

  // Style overrides for FormInput component

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";

  const formCardLimited =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto";
  const formCardAdmin =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[640px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  const formSectionClass = isLimitedAdmin
    ? `${formCardLimited} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none pb-14`
    : `${formCardAdmin} flex-1 min-w-0 lg:self-stretch lg:basis-[60%] lg:max-w-[60%] lg:flex-none`;

  const canSaveComment = commentChanged && !isSaving && !loading && !notFound;
  const showCommentPreview = !isCommentEditorOpen;
  const commentActionLabel = !isCommentEditorOpen ? "Hinzufügen" : "Abbrechen";
  const showLimitedCommentSaveButton =
    isLimitedAdmin &&
    isCommentEditorOpen &&
    commentChanged &&
    !loading &&
    !notFound;

  const showLimitedAdminSaveButton =
    isLimitedAdmin && !isSaving && !loading && !notFound && hasUnsavedChanges;

  function formatCommentDate(val) {
    if (!val) return "";
    try {
      if (val?.seconds)
        return new Date(val.seconds * 1000).toLocaleString("de-DE");
      if (typeof val === "number") return new Date(val).toLocaleString("de-DE");
      const parsed = new Date(val);
      if (!Number.isNaN(parsed.getTime()))
        return parsed.toLocaleString("de-DE");
    } catch (err) {
      console.error("formatCommentDate error:", err);
    }
    return "";
  }

  const renderCommentPreview = (extraClassName = "") => (
    <div
      className={`rounded-lg border border-base-300 bg-base-100 p-3 max-h-60 overflow-auto ${extraClassName}`}
    >
      {hasComment ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {commentMeta?.updatedByPhoto ? (
                <img
                  src={commentMeta.updatedByPhoto}
                  alt={commentMeta?.updatedByName || "Kommentator"}
                  className="w-8 h-8 rounded-full object-cover border border-base-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-base-300 text-base-content/70 flex items-center justify-center text-xs font-semibold">
                  {(commentMeta?.updatedByName || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <div className="leading-tight">
                <div className="text-sm font-semibold text-base-content">
                  {commentMeta?.updatedByName || "Unbekannter Benutzer"}
                </div>
                {commentMeta?.updatedAt && (
                  <div className="text-[11px] text-base-content/60">
                    Aktualisiert: {formatCommentDate(commentMeta.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="prose prose-sm max-w-none text-base-content"
            dangerouslySetInnerHTML={{ __html: commentHtml }}
          />
        </div>
      ) : (
        <p className="text-sm text-base-content/60 italic">
          Kein Kommentar vorhanden.
        </p>
      )}
    </div>
  );

  function openCommentEditor() {
    setCommentBaseline(String(commentHtml || ""));
    setIsCommentEditorOpen(true);
  }

  function handleCommentPrimaryAction() {
    if (!isCommentEditorOpen) {
      const current = String(commentHtml || "");
      setCommentBaseline(current);
      if (!hasRichTextContent(current)) {
        setCommentHtml(DEFAULT_COMMENT_TEMPLATE_HTML);
      }
      setIsCommentEditorOpen(true);
      return;
    }
    // Cancel comment edits
    setCommentHtml(String(commentBaseline || ""));
    setIsCommentEditorOpen(false);
  }

  function handleClearComment() {
    if (!isSuperAdmin) {
      toast.error("Sie haben keine Berechtigung, den Kommentar zu löschen.");
      return;
    }
    const ok = window.confirm(
      "Kommentar wirklich löschen?\n\nHinweis: Diese Änderung wird erst in Firestore gespeichert, wenn Sie auf „Speichern“ klicken."
    );
    if (!ok) return;
    setCommentHtml("");
    setIsCommentEditorOpen(false);
  }

  function appendToComment(nextHtmlBlock) {
    const block = String(nextHtmlBlock || "").trim();
    if (!block) return;
    setCommentHtml(`${String(commentHtml || "")}${block}`);
    setShowComment(true);
    setIsCommentEditorOpen(true);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function plainTextToSimpleHtml(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const paras = raw.split(/\n{2,}/g);
    return paras
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  const isPageBusy =
    loading ||
    isSaving ||
    isDownloading ||
    isSavingStatus ||
    Boolean(sendingStepValue) ||
    metaLoading;

  const busyLabel = loading
    ? "Wird geladen..."
    : isSaving
    ? "Wird gespeichert..."
    : isDownloading
    ? "PDF wird erstellt..."
    : isSavingStatus
    ? "Status wird gespeichert..."
    : sendingStepValue
    ? "E-Mail wird gesendet..."
    : metaLoading
    ? "Daten werden geladen..."
    : "Bitte warten...";

  return (
    <div className="p-2 min-h-screen">
      {remoteMode ? (
        <SelectMajorModal
          open={majorModalOpen}
          majors={majors}
          selectedKey={majorModalKey}
          onSelectKey={setMajorModalKey}
          onCancel={() => {
            if (restoreBusy) return;
            setMajorModalOpen(false);
            setMajorModalKey("");
          }}
          onConfirm={confirmRestoreFromModal}
          confirming={Boolean(restoreBusy)}
          title="Bereich (Major) auswählen"
          subtitle="Wählen Sie einen Bereich (Major) für die Wiederherstellung. Danach können E-Mails versendet werden."
        />
      ) : null}
      {isPageBusy && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <div className="text-sm font-medium">{busyLabel}</div>
          </div>
        </div>
      )}
      <DeleteCandidateModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={confirmDeleteCandidate}
        onArchive={confirmArchiveCandidate}
        onConfirm={confirmDeleteCandidate}
        candidateName={deleteTarget?.name}
        isDeleting={isDeletingCandidate}
        seconds={5}
        skipCountdown={true}
      />
      {missingPassportModalOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Reisepass topilmadi</h3>
            <p className="text-sm text-base-content/70">
              Reisepass hujjati topilmadi. Shunga qaramay Beratungsvertrag ni
              passport sahifasisiz davom ettirishni xohlaysizmi?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleMissingPassportCancel}
              >
                Yo'q, bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMissingPassportConfirm}
              >
                Ha, davom etish
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <UnsavedChangesModal
        open={unsavedModalOpen && unsavedBlocker.state === "blocked"}
        title="Ungespeicherte Änderungen"
        message="Sie haben ungespeicherte Änderungen. Wenn Sie zu einer anderen Seite wechseln oder die Seite neu laden, gehen diese Änderungen verloren. Möchten Sie fortfahren?"
        stayText="Bleiben"
        leaveText="Fortfahren"
        onStay={stayOnGeneratePage}
        onLeave={leaveGeneratePage}
      />

      {/* Fixed action bar under the global navbar (hidden on print) */}
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link
                  to={`/collectionCv/${resolvedMajor.linkId || major}`}
                  className="link flex items-center gap-2"
                >
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">CV</li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            {(!isLimitedAdmin || showLimitedAdminSaveButton) && !remoteMode && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  <FaSave />
                  <span>Speichern</span>
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handleCancel}
                  disabled={
                    isSaving || loading || notFound || !hasUnsavedChanges
                  }
                >
                  Abbrechen
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleDownloadPdf}
                  disabled={loading || notFound || isDownloading}
                >
                  <FaDownload />{" "}
                  {isDownloading ? "Wird geladen..." : "Herunterladen"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Spacer so content doesn't go under the fixed action bar */}
      <div className="h-14 print:hidden" />

      <div className="w-full">
        {loading ? (
          <div className="grid place-items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : notFound ? (
          <div className="py-16 text-center bg-base-100 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
            <p className="opacity-70">
              Das Dokument existiert nicht oder wurde gelöscht.
            </p>
          </div>
        ) : (
          <>
            <div className={layoutClass}>
              <section className={formSectionClass}>
                <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="card-title text-2xl font-bold">
                      Daten bearbeiten
                    </h2>
                  </div>

                  {isLimitedAdmin && (
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Profilfoto
                        </p>
                        {photo ? (
                          <button
                            type="button"
                            className="rounded-md border border-base-300 overflow-hidden shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={openPhotoModal}
                          >
                            <img
                              src={photo}
                              alt="Kandidatenfoto"
                              className="w-[128pt] h-[160pt] object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-[128pt] h-[160pt] border border-dashed border-base-300 rounded-md bg-base-200 flex items-center justify-center text-xs uppercase tracking-wide text-base-content/60">
                            Kein Foto vorhanden
                          </div>
                        )}
                        {photo && (
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={openPhotoModal}
                          >
                            Vergrößern
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <fieldset
                    disabled={isLimitedAdmin || remoteMode}
                    className="space-y-4 disabled:opacity-70"
                  >
                    <div className="divider mt-2">Persönliche Daten</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Vorname"
                        placeholder="Vorname"
                        value={formCv.personalInfo.name}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                      <FormInput
                        label="Nachname"
                        placeholder="Nachname"
                        value={formCv.personalInfo.lastName}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              lastName: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="md:col-span-2">
                        <label className="label">
                          <span className="label-text">Geschlecht</span>
                        </label>
                        <div className="flex gap-6">
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              type="radio"
                              value="Männlich"
                              className="radio radio-primary"
                              checked={
                                formCv.personalInfo.gender === "Männlich"
                              }
                              onChange={(e) =>
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    gender: e.target.value,
                                  },
                                }))
                              }
                            />
                            <span>Männlich</span>
                          </label>
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              type="radio"
                              value="Weiblich"
                              className="radio radio-primary"
                              checked={
                                formCv.personalInfo.gender === "Weiblich"
                              }
                              onChange={(e) =>
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    gender: e.target.value,
                                  },
                                }))
                              }
                            />
                            <span>Weiblich</span>
                          </label>
                        </div>
                      </div>
                      <FormInput
                        label="Geburtsdatum"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={toInputDate(formCv.personalInfo.birthDate)}
                        onChange={(e) =>
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              birthDate: fromInputDate(e.target.value),
                            },
                          }))
                        }
                      />
                      <div className="form-control w-full">
                        <label className="label" htmlFor="g-birthPlace">
                          <span className="label-text">Geburtsort</span>
                        </label>
                        {isMobile ? (
                          <button
                            type="button"
                            onClick={() => setShowBirthPlacePicker(true)}
                            className={`
                              w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
                              transition-all active:scale-98
                              ${
                                formCv.personalInfo.birthPlace
                                  ? "border-success bg-success/5 text-base-content"
                                  : "border-base-300 bg-base-100 text-base-content/60"
                              }
                            `}
                          >
                            <span className="text-base">
                              {formCv.personalInfo.birthPlace ||
                                "Bitte auswählen"}
                            </span>
                            <svg
                              className="w-5 h-5 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        ) : (
                          <select
                            id="g-birthPlace"
                            className={selectBase}
                            value={String(formCv.personalInfo.birthPlace || "")}
                            onChange={(e) =>
                              setFormCv((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  birthPlace: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="">Bitte auswählen</option>
                            {UZBEK_REGIONS.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="form-control w-full">
                        <label className="label" htmlFor="g-marital">
                          <span className="label-text">Familienstand</span>
                        </label>
                        {isMobile ? (
                          <button
                            type="button"
                            onClick={() => setShowMaritalStatusPicker(true)}
                            className={`
                              w-full h-12 px-4 rounded-lg border-2 text-left flex items-center justify-between
                              transition-all active:scale-98
                              ${
                                formCv.personalInfo.maritalStatus
                                  ? "border-success bg-success/5 text-base-content"
                                  : "border-base-300 bg-base-100 text-base-content/60"
                              }
                            `}
                          >
                            <span className="text-base">
                              {formCv.personalInfo.maritalStatus ||
                                "Bitte auswählen"}
                            </span>
                            <svg
                              className="w-5 h-5 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        ) : (
                          <select
                            id="g-marital"
                            className={selectBase}
                            value={formCv.personalInfo.maritalStatus}
                            onChange={(e) =>
                              setFormCv((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  maritalStatus: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="">Bitte auswählen</option>
                            <option value="ledig">ledig</option>
                            <option value="verheiratet">verheiratet</option>
                            <option value="geschieden">geschieden</option>
                            <option value="verwitwet">verwitwet</option>
                          </select>
                        )}
                      </div>
                      <div className="md:col-span-2 form-control w-full">
                        <label className="label" htmlFor="g-childrenCount">
                          <span className="label-text">Kinder *</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            id="g-childrenCount"
                            type="number"
                            min={0}
                            inputMode="numeric"
                            className={inputBase}
                            placeholder="0"
                            disabled={noChildren}
                            value={childrenCount}
                            onChange={(e) => {
                              const raw = String(e.target.value || "");
                              const cleaned = raw.replace(/[^\d]/g, "");
                              setFormCv((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  childrenCount: cleaned,
                                },
                              }));
                            }}
                          />
                          <label className="cursor-pointer flex items-center gap-2 mt-2 md:mt-0">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={noChildren}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    noChildren: checked,
                                    childrenCount: checked
                                      ? ""
                                      : String(
                                          prev.personalInfo.childrenCount || ""
                                        ),
                                  },
                                }));
                              }}
                            />
                            <span className="text-sm">Keine Kinder</span>
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2 form-control w-full">
                        {/* Führerschein moved to Fähigkeiten section */}
                      </div>
                      <div className="md:col-span-2">
                        <PhoneInputWithCountry
                          label="Telefonnummer"
                          required
                          value={formCv.personalInfo.phone}
                          onChange={(next) => {
                            setPhoneTouched(true);
                            setFormCv((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                phone: next,
                              },
                            }));
                          }}
                          inputClassName={
                            phoneShowOk
                              ? "input-success"
                              : phoneWarn
                              ? "input-warning"
                              : ""
                          }
                          helperText={
                            phoneWarn ? (
                              <span className="text-warning">
                                Telefonnummer unvollständig (
                                {phoneDigits.length}/9 Ziffern)
                              </span>
                            ) : null
                          }
                        />
                      </div>
                      <FormInput
                        label="Passnummer"
                        placeholder="AA 0000000"
                        value={passportNumber}
                        onChange={(e) => {
                          setPassportTouched(true);
                          const norm = normalizePassportNumber(e.target.value);
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              passportNumber: norm,
                            },
                          }));
                        }}
                        inputClassName={
                          passportShowOk
                            ? "input-success"
                            : passportWarn
                            ? "input-warning"
                            : ""
                        }
                        helperText={
                          passportWarn ? (
                            <span className="text-warning">
                              Bitte Passnummer im Format AA 0000000 eingeben.
                            </span>
                          ) : (
                            ""
                          )
                        }
                      />
                      <FormInput
                        label="E-Mail"
                        placeholder="E-Mail"
                        type="email"
                        value={formCv.personalInfo.email}
                        onChange={(e) => {
                          setEmailTouched(true);
                          setFormCv((prev) => ({
                            ...prev,
                            personalInfo: {
                              ...prev.personalInfo,
                              email: e.target.value,
                            },
                          }));
                        }}
                        inputClassName={
                          emailShowOk
                            ? "input-success"
                            : emailWarn
                            ? "input-warning"
                            : ""
                        }
                        helperText={
                          emailWarn ? (
                            <span className="text-warning">
                              Bitte gültige E-Mail eingeben.
                            </span>
                          ) : (
                            ""
                          )
                        }
                      />

                      <div className="md:col-span-2 form-control w-full">
                        <label
                          className="label pb-1 flex-col items-start gap-1"
                          htmlFor="g-photo-file"
                        >
                          <span className="label-text font-medium">
                            Foto hochladen (JPEG/PNG) (Ihr eigenes Foto)
                          </span>
                          <span className="label-text-alt text-xs text-base-content/70">
                            Eigenes 3×4‑Passfoto. Bis 250 KB
                          </span>
                        </label>
                        <input
                          id="g-photo-file"
                          type="file"
                          accept="image/*"
                          className={fileInputBase}
                          onChange={handlePhotoFileChange}
                        />
                      </div>

                      <div className="md:col-span-2 form-control w-full">
                        <label className="label pb-1" htmlFor="g-addressStreet">
                          <span className="label-text font-medium">
                            Adresse
                          </span>
                        </label>
                        <div className="rounded-box border border-base-300 bg-base-200/40 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label
                                className="label"
                                htmlFor="g-addressStreet"
                              >
                                <span className="label-text">Straße *</span>
                              </label>
                              <input
                                id="g-addressStreet"
                                type="text"
                                className={inputBase}
                                placeholder="Straße"
                                value={addressFields.street}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    street: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label
                                className="label"
                                htmlFor="g-addressHouseNumber"
                              >
                                <span className="label-text">Hausnummer *</span>
                              </label>
                              <input
                                id="g-addressHouseNumber"
                                type="text"
                                className={inputBase}
                                placeholder="z.B. 12A"
                                value={addressFields.houseNumber}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    houseNumber: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label
                                className="label"
                                htmlFor="g-addressPostalCode"
                              >
                                <span className="label-text">PLZ *</span>
                              </label>
                              <input
                                id="g-addressPostalCode"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className={inputBase}
                                placeholder="123456"
                                value={String(addressFields.postalCode || "")}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    postalCode: String(e.target.value || "")
                                      .replace(/[^\d]/g, "")
                                      .slice(0, 6),
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label className="label" htmlFor="g-addressCity">
                                <span className="label-text">Ort *</span>
                              </label>
                              <select
                                id="g-addressCity"
                                className={selectBase}
                                value={addressFields.city}
                                onChange={(e) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    city: e.target.value,
                                  })
                                }
                              >
                                <option value="">Bitte auswählen</option>
                                {UZBEK_REGIONS.map((region) => (
                                  <option key={region} value={region}>
                                    {region}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <CountryNameCombobox
                                id="g-addressCountry"
                                label="Land"
                                required
                                placeholder="Usbekistan"
                                value={addressFields.country}
                                onChange={(v) =>
                                  applyAddressFields({
                                    ...addressFields,
                                    country: String(v || ""),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset
                    disabled={remoteMode}
                    className="space-y-4 disabled:opacity-70"
                  >
                    <CollapsibleSection
                      title="Berufserfahrung"
                      count={experienceCount}
                      defaultOpen={false}
                    >
                      <ExperienceSection
                        experience={formCv.experience}
                        onAddExperience={addExperience}
                        onUpdateExperience={updateExperience}
                        onRemoveExperience={removeExperience}
                        onAddResponsibility={addResponsibility}
                        onRemoveResponsibility={removeResponsibility}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Ausbildung"
                      count={educationCount}
                      defaultOpen={false}
                    >
                      <EducationSection
                        education={formCv.education}
                        onAddEducation={addEducation}
                        onUpdateEducation={updateEducation}
                        onRemoveEducation={removeEducation}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Fähigkeiten"
                      className="!overflow-visible"
                      contentClassName="!overflow-visible"
                      openClassName="relative z-[80]"
                      defaultOpen={false}
                    >
                      <div className="mb-4 rounded-box border border-base-300 bg-base-200/40 p-4">
                        <div className="form-control w-full">
                          <label className="label" htmlFor="g-driving">
                            <span className="label-text font-semibold">
                              Führerschein
                            </span>
                          </label>
                          <label className="cursor-pointer flex items-center gap-2">
                            <input
                              id="g-driving"
                              type="checkbox"
                              className="checkbox"
                              checked={Boolean(
                                formCv.personalInfo.hasDrivingLicense
                              )}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormCv((prev) => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    hasDrivingLicense: checked,
                                    drivingLicenseType: checked
                                      ? String(
                                          prev.personalInfo
                                            .drivingLicenseType || ""
                                        )
                                      : "",
                                  },
                                }));
                                if (!checked)
                                  setIsDrivingLicenseDropdownOpen(false);
                              }}
                            />
                            <span className="text-sm">Vorhanden</span>
                          </label>
                          {formCv.personalInfo.hasDrivingLicense ? (
                            <div className="mt-3">
                              <div
                                ref={drivingLicenseDropdownRef}
                                className={`dropdown w-full ${
                                  isDrivingLicenseDropdownOpen
                                    ? "dropdown-open"
                                    : ""
                                }`}
                              >
                                <label className="label">
                                  <span className="label-text">
                                    Führerschein-Klassen (mehrere möglich)
                                  </span>
                                </label>

                                <button
                                  type="button"
                                  className={`${selectBase} flex items-center justify-between gap-3`}
                                  aria-haspopup="listbox"
                                  aria-expanded={isDrivingLicenseDropdownOpen}
                                  onClick={() =>
                                    setIsDrivingLicenseDropdownOpen((p) => !p)
                                  }
                                >
                                  {(() => {
                                    const raw = String(
                                      formCv.personalInfo.drivingLicenseType ||
                                        ""
                                    )
                                      .trim()
                                      .toUpperCase();
                                    const selected = raw
                                      ? raw
                                          .split(",")
                                          .map((s) => s.trim())
                                          .filter(Boolean)
                                      : [];
                                    const displayValue = selected.length
                                      ? selected.join(", ")
                                      : "Bitte auswählen";
                                    return (
                                      <>
                                        <span
                                          className={
                                            selected.length
                                              ? "text-base-content"
                                              : "text-base-content/60"
                                          }
                                        >
                                          {displayValue}
                                        </span>
                                        <span className="text-base-content/60">
                                          ▾
                                        </span>
                                      </>
                                    );
                                  })()}
                                </button>

                                <div className="dropdown-content w-full mt-1 max-h-72 rounded-box border border-base-300 bg-base-100 shadow z-[60] overflow-hidden flex flex-col">
                                  <ul
                                    className="menu p-2 overflow-auto w-full"
                                    role="listbox"
                                    aria-multiselectable="true"
                                  >
                                    {DRIVING_LICENSE_OPTIONS.map((opt) => {
                                      const upper = String(opt || "")
                                        .trim()
                                        .toUpperCase();
                                      const selected = String(
                                        formCv.personalInfo
                                          .drivingLicenseType || ""
                                      )
                                        .trim()
                                        .toUpperCase()
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                      const isSelected =
                                        selected.includes(upper);

                                      return (
                                        <li key={opt}>
                                          <button
                                            type="button"
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              const set = new Set(selected);
                                              if (set.has(upper))
                                                set.delete(upper);
                                              else set.add(upper);
                                              const next =
                                                Array.from(set).join(", ");
                                              setFormCv((prev) => ({
                                                ...prev,
                                                personalInfo: {
                                                  ...prev.personalInfo,
                                                  drivingLicenseType: next,
                                                },
                                              }));
                                              // Close dropdown after selecting a value (user can reopen to add more)
                                              setIsDrivingLicenseDropdownOpen(
                                                false
                                              );
                                            }}
                                          >
                                            <span className="w-5 text-center">
                                              {isSelected ? "✓" : ""}
                                            </span>
                                            <span className="font-medium">
                                              {opt}
                                            </span>
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <SkillsSection
                        softSkills={formCv.skills.softSkills}
                        pcSkills={formCv.skills.pcSkills}
                        onAddSoft={(val) =>
                          addTag(["skills", "softSkills"], val)
                        }
                        onRemoveSoft={(i) =>
                          removeTag(["skills", "softSkills"], i)
                        }
                        onAddPc={(val) => addTag(["skills", "pcSkills"], val)}
                        onRemovePc={(i) => removeTag(["skills", "pcSkills"], i)}
                        onAutoAddSoft={() => autoAddSkills("soft")}
                        onAutoAddPc={() => autoAddSkills("pc")}
                        isGeneratingSoft={isGeneratingSoft}
                        isGeneratingPc={isGeneratingPc}
                        recentlyAddedSoft={recentlyAdded.soft}
                        recentlyAddedPc={recentlyAdded.pc}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Sprachen"
                      count={languagesCount}
                      defaultOpen={false}
                    >
                      <LanguagesSection
                        languageRows={languageRows}
                        onAddRow={addLanguageRow}
                        onUpdateRow={updateLanguageRow}
                        onRemoveRow={removeLanguageRow}
                        languageOptions={LANGUAGE_OPTIONS}
                      />
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Dokumente"
                      count={documentsCount}
                      defaultOpen={false}
                    >
                      <div className="form-control mb-4">
                        <label className="label cursor-pointer justify-start gap-3">
                          <span className="label-text font-semibold">
                            Dokumente im PDF anzeigen
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showDocuments}
                            onChange={(e) => setShowDocuments(e.target.checked)}
                          />
                        </label>
                      </div>

                      {/* Passport */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Reisepass
                        </h4>
                        <div className="flex flex-col gap-2">
                          {!formCv.documents?.passport ||
                          formCv.documents.passport.length === 0 ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Kein Reisepass vorhanden.
                            </div>
                          ) : (
                            formCv.documents.passport.map((url, i) => {
                              const isMarkedForDeletion =
                                documentsMarkedForDeletion.passport.some(
                                  (marked) => marked.index === i
                                );
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 items-center p-2 border rounded ${
                                    isMarkedForDeletion
                                      ? "bg-error/10 border-error/50 opacity-60"
                                      : "bg-base-100"
                                  }`}
                                >
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`link text-sm truncate flex-1 ${
                                      isMarkedForDeletion
                                        ? "link-error line-through"
                                        : "link-primary"
                                    }`}
                                  >
                                    {url}
                                  </a>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-square btn-sm btn-ghost text-primary"
                                    title="Link öffnen"
                                  >
                                    <FaExternalLinkAlt />
                                  </a>
                                  {!isLimitedAdmin && (
                                    <button
                                      type="button"
                                      className="btn btn-square btn-sm btn-ghost text-error"
                                      title={
                                        isMarkedForDeletion
                                          ? "Löschung wird beim Speichern ausgeführt"
                                          : "Dokument löschen"
                                      }
                                      onClick={() =>
                                        deleteDocumentRemoteFirst(
                                          url,
                                          "passport",
                                          i
                                        )
                                      }
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Diplomas */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Diplome
                        </h4>
                        <div className="flex flex-col gap-2">
                          {!formCv.documents?.diplomas ||
                          formCv.documents.diplomas.length === 0 ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Keine Diplome vorhanden.
                            </div>
                          ) : (
                            formCv.documents.diplomas.map((url, i) => {
                              const isMarkedForDeletion =
                                documentsMarkedForDeletion.diplomas.some(
                                  (marked) => marked.index === i
                                );
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 items-center p-2 border rounded ${
                                    isMarkedForDeletion
                                      ? "bg-error/10 border-error/50 opacity-60"
                                      : "bg-base-100"
                                  }`}
                                >
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`link text-sm truncate flex-1 ${
                                      isMarkedForDeletion
                                        ? "link-error line-through"
                                        : "link-primary"
                                    }`}
                                  >
                                    {url}
                                  </a>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-square btn-sm btn-ghost text-primary"
                                    title="Link öffnen"
                                  >
                                    <FaExternalLinkAlt />
                                  </a>
                                  {!isLimitedAdmin && (
                                    <button
                                      type="button"
                                      className="btn btn-square btn-sm btn-ghost text-error"
                                      title={
                                        isMarkedForDeletion
                                          ? "Löschung wird beim Speichern ausgeführt"
                                          : "Dokument löschen"
                                      }
                                      onClick={() =>
                                        deleteDocumentRemoteFirst(
                                          url,
                                          "diplomas",
                                          i
                                        )
                                      }
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="mb-2">
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
                          Zertifikate
                        </h4>
                        <div className="flex flex-col gap-2">
                          {!formCv.documents?.certificates ||
                          formCv.documents.certificates.length === 0 ? (
                            <div className="p-3 bg-base-200 rounded text-sm text-center opacity-60 italic border border-dashed border-base-300">
                              Keine Zertifikate vorhanden.
                            </div>
                          ) : (
                            formCv.documents.certificates.map((url, i) => {
                              const isMarkedForDeletion =
                                documentsMarkedForDeletion.certificates.some(
                                  (marked) => marked.index === i
                                );
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 items-center p-2 border rounded ${
                                    isMarkedForDeletion
                                      ? "bg-error/10 border-error/50 opacity-60"
                                      : "bg-base-100"
                                  }`}
                                >
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`link text-sm truncate flex-1 ${
                                      isMarkedForDeletion
                                        ? "link-error line-through"
                                        : "link-primary"
                                    }`}
                                  >
                                    {url}
                                  </a>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-square btn-sm btn-ghost text-primary"
                                    title="Link öffnen"
                                  >
                                    <FaExternalLinkAlt />
                                  </a>
                                  {!isLimitedAdmin && (
                                    <button
                                      type="button"
                                      className="btn btn-square btn-sm btn-ghost text-error"
                                      title={
                                        isMarkedForDeletion
                                          ? "Löschung wird beim Speichern ausgeführt"
                                          : "Dokument löschen"
                                      }
                                      onClick={() =>
                                        deleteDocumentRemoteFirst(
                                          url,
                                          "certificates",
                                          i
                                        )
                                      }
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </CollapsibleSection>
                  </fieldset>

                  {!isLimitedAdmin && (
                    <>
                      <div className="divider mt-1">Kommentar</div>
                      <div className="form-control mb-2">
                        <label className="label cursor-pointer justify-start gap-3">
                          <span className="label-text font-semibold">
                            Kommentar in Vorschau & PDF anzeigen
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showComment}
                            onChange={(e) => setShowComment(e.target.checked)}
                          />
                        </label>
                      </div>
                      <div className="form-control mb-3">
                        <label className="label cursor-pointer justify-start gap-3">
                          <span className="label-text font-semibold">
                            Datum im Footer anzeigen
                          </span>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showCommentDate}
                            onChange={(e) =>
                              setShowCommentDate(e.target.checked)
                            }
                          />
                        </label>
                      </div>
                      <div className="form-control gap-3">
                        <label className="label" htmlFor="comment-admin">
                          <span className="label-text font-medium">
                            Allgemeiner Kommentar (zum Kandidaten)
                          </span>
                        </label>
                        {showCommentPreview && renderCommentPreview()}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={commentHtml}
                            onChange={setCommentHtml}
                            placeholder='Allgemeine Notiz: "Der Kandidat passt sehr gut, nur das Foto sollte aktualisiert werden."'
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline btn-error"
                              onClick={handleClearComment}
                              disabled={isSaving || loading || notFound}
                              title="Kommentar löschen (nur Super-Admin)"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {!isLimitedAdmin && (
                    <>
                      <div className="divider"></div>
                      <div className="flex justify-end gap-2"></div>
                    </>
                  )}
                </div>
              </section>

              {isLimitedAdmin && (
                <>
                  {/* Right: Kommentar (sticky) */}
                  <aside className="w-full lg:basis-[40%] lg:max-w-[40%] shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[90vh] flex">
                    <div className="card bg-base-100 border border-base-300 shadow-2xl w-full h-full flex flex-col">
                      <div className="card-body space-y-3 flex-1 flex flex-col">
                        <div>
                          <h3 className="card-title text-lg mb-1">Kommentar</h3>
                          <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                            Notiz zum Kandidaten
                          </p>
                        </div>
                        {showCommentPreview && renderCommentPreview("flex-1")}
                        {isCommentEditorOpen && (
                          <RichTextEditor
                            value={commentHtml}
                            onChange={setCommentHtml}
                            placeholder='Allgemeine Notiz: "Der Kandidat passt sehr gut, nur das Foto sollte aktualisiert werden."'
                            className="flex-1"
                            editorClassName="min-h-[220px]"
                          />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline w-full"
                            onClick={handleCommentPrimaryAction}
                            disabled={isSaving || loading || notFound}
                          >
                            {commentActionLabel}
                          </button>
                        </div>
                        <div className="pt-2">
                          {showLimitedCommentSaveButton && (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className={`btn btn-primary w-full ${
                                  !canSaveComment ? "btn-disabled" : ""
                                }`}
                                onClick={handleSave}
                                disabled={!canSaveComment}
                              >
                                {isSaving ? (
                                  <>
                                    <span className="loading loading-spinner loading-sm" />
                                    Wird gespeichert...
                                  </>
                                ) : (
                                  <>
                                    <FaSave />
                                    <span>Speichern</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </aside>
                </>
              )}

              {/* Right: Live Preview (WYSIWYG) */}
              {!isLimitedAdmin && (
                <LivePreview
                  formCv={formCv}
                  commentMeta={commentMeta}
                  showDocuments={showDocuments}
                  showComment={showComment}
                  showCommentDate={showCommentDate}
                  onPhotoClick={openPhotoModal}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Stepper should be below the form & preview */}
      {!remoteMode && !isLimitedAdmin && !loading && !notFound && (
        <div className="mt-6">
          <CandidateStatusStepper
            currentValue={statusValue}
            onSendEmail={handleSendStatusEmail}
            sendingValue={sendingStepValue}
            disabled={isLimitedAdmin}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="btn btn-sm btn-outline mr-2"
              onClick={resetCandidateStages}
              disabled={Boolean(sendingStepValue)}
              title="Kandidatenstufen auf Anfang (Stufe 1) zurücksetzen und E-Mail-Zähler auf 0 setzen"
            >
              Stufen zurücksetzen
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={openCustomEmailModal}
              disabled={Boolean(sendingStepValue)}
            >
              Benutzerdefinierte E-Mail
            </button>
          </div>
          <div className="text-xs opacity-60 mt-2">
            Letzte Aktualisierung:{" "}
            {statusUpdatedAt
              ? (() => {
                  try {
                    const d = new Date(statusUpdatedAt);
                    if (Number.isNaN(d.getTime())) return "—";
                    return new Intl.DateTimeFormat("uz-UZ", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "Asia/Tashkent",
                    }).format(d);
                  } catch {
                    return "—";
                  }
                })()
              : "—"}
            {statusUpdatedBy ? ` • Von: ${statusUpdatedBy}` : ""}
          </div>

          {/* Outgoing documents to the candidate */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card bg-base-100 border border-base-300 shadow-xl">
              <div className="card-body">
                <div>
                  <h3 className="card-title">
                    Kandidatga jo‘natiladigan hujjatlar
                  </h3>
                  <p className="text-sm text-base-content/70">
                    Switch yoqilsa PDF generatsiya bo‘ladi va avtomatik upload
                    qilinadi.
                  </p>
                </div>

                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={handleDeleteAllOutgoingDocs}
                    disabled={
                      outgoingBulkBusy ||
                      outgoingAnyBusy ||
                      !outgoingEntries.length ||
                      !candidateCollection ||
                      !candidateDocId ||
                      Boolean(sendingStepValue)
                    }
                    title="Barcha yuborilgan linklarni o‘chirish"
                  >
                    {outgoingBulkBusy ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : null}
                    <span>Hammasini o‘chirish</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {DOCUMENT_TEMPLATES.map((tpl) => {
                    const st = getOutgoingDocState(tpl.id);
                    const checked = Boolean(st?.enabled);
                    const busy = Boolean(outgoingBusyById?.[tpl.id]);
                    const disabled =
                      busy ||
                      !candidateCollection ||
                      !candidateDocId ||
                      Boolean(sendingStepValue);
                    return (
                      <div
                        key={tpl.id}
                        className="rounded-xl border border-base-300 bg-base-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to={tpl.to}
                              className="link link-hover font-semibold truncate inline-flex items-center gap-2"
                              title="Template'ni ochish"
                            >
                              <span className="truncate">{tpl.title}</span>
                              <FaExternalLinkAlt className="opacity-70" />
                            </Link>
                            {tpl.description ? (
                              <div className="text-xs text-base-content/60 mt-1">
                                {tpl.description}
                              </div>
                            ) : null}
                            {String(st?.url || "").trim() ? (
                              <div className="text-xs text-base-content/60 mt-1">
                                Upload:{" "}
                                <a
                                  className="link"
                                  href={String(st.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Link
                                </a>
                              </div>
                            ) : null}
                            {tpl.id === "beratungsvertrag" && checked ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() =>
                                    handleToggleOutgoingDoc(tpl, true, {
                                      forceRegenerate: true,
                                    })
                                  }
                                  disabled={disabled}
                                  title="PDF'ni qayta yaratish va qayta upload qilish"
                                >
                                  Qayta generatsiya
                                </button>
                              </div>
                            ) : null}
                            {tpl.id === "vermittlungsvertrag" && checked ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() =>
                                    handleToggleOutgoingDoc(tpl, true, {
                                      forceRegenerate: true,
                                    })
                                  }
                                  disabled={disabled}
                                  title="PDF'ni qayta yaratish va qayta upload qilish"
                                >
                                  Qayta generatsiya
                                </button>
                              </div>
                            ) : null}
                            {tpl.id === "vollmacht" && checked ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() =>
                                    handleToggleOutgoingDoc(tpl, true, {
                                      forceRegenerate: true,
                                    })
                                  }
                                  disabled={disabled}
                                  title="PDF'ni qayta yaratish va qayta upload qilish"
                                >
                                  Qayta generatsiya
                                </button>
                              </div>
                            ) : null}
                          </div>

                          <label className="flex items-center gap-2 shrink-0">
                            {busy ? (
                              <span className="loading loading-spinner loading-sm" />
                            ) : null}
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              checked={checked}
                              onChange={(e) =>
                                handleToggleOutgoingDoc(tpl, e.target.checked)
                              }
                              disabled={disabled}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {DOCUMENT_TEMPLATES.length === 0 ? (
                    <div className="text-sm opacity-70">
                      Hozircha template yo‘q.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 shadow-xl">
              <div className="card-body">
                <div>
                  <h3 className="card-title">Yuborilgan hujjatlar (linklar)</h3>
                  <p className="text-sm text-base-content/70">
                    Upload bo‘lgan fayl linklari shu yerda chiqadi.
                  </p>
                </div>

                {(() => {
                  const entries = Object.entries(outgoingDocs || {}).filter(
                    ([, v]) =>
                      v && typeof v === "object" && String(v?.url || "").trim()
                  );
                  if (entries.length === 0) {
                    return (
                      <div className="text-sm opacity-70">
                        Hozircha upload qilingan hujjat yo‘q.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {entries.map(([docId, v]) => {
                        const tpl =
                          DOCUMENT_TEMPLATES.find((t) => t.id === docId) ||
                          null;
                        const title = tpl?.title || docId;
                        const url = String(v?.url || "").trim();
                        const busy = Boolean(outgoingBusyById?.[docId]);
                        const disabled =
                          busy ||
                          !candidateCollection ||
                          !candidateDocId ||
                          Boolean(sendingStepValue);
                        return (
                          <div
                            key={docId}
                            className="rounded-xl border border-base-300 bg-base-100 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {title}
                                </div>
                                <div className="text-xs text-base-content/60 mt-1 break-all">
                                  {url}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  className="btn btn-sm btn-outline"
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline"
                                  onClick={async () => {
                                    try {
                                      if (
                                        navigator?.clipboard &&
                                        typeof navigator.clipboard.writeText ===
                                          "function"
                                      ) {
                                        await navigator.clipboard.writeText(
                                          url
                                        );
                                        toast.success("Link nusxalandi.");
                                      } else {
                                        throw new Error(
                                          "clipboard-unavailable"
                                        );
                                      }
                                    } catch {
                                      try {
                                        const ta =
                                          document.createElement("textarea");
                                        ta.value = url;
                                        ta.style.position = "fixed";
                                        ta.style.opacity = "0";
                                        document.body.appendChild(ta);
                                        ta.focus();
                                        ta.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(ta);
                                        toast.success("Link nusxalandi.");
                                      } catch {
                                        toast.error(
                                          "Fehler beim Kopieren des Links."
                                        );
                                      }
                                    }
                                  }}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline btn-error"
                                  onClick={() => handleDeleteOutgoingDoc(docId)}
                                  disabled={disabled}
                                  title="Linkni o‘chirish (remote va Firestore)"
                                >
                                  {busy ? (
                                    <span className="loading loading-spinner loading-sm" />
                                  ) : (
                                    <FaTrash />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {remoteMode && !loading && !notFound && (
        <div className="mt-6">
          <div className="card bg-base-100 border border-base-300 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Kandidatenstufen</h3>
              <p className="text-sm text-base-content/70">
                Um E-Mails senden zu können, müssen Sie den Kandidaten zuerst in
                den passenden Bereich (Collection/Major){" "}
                <span className="font-semibold">wiederherstellen</span>.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(-1)}
                  disabled={restoreBusy}
                >
                  Zurück
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={restoreFromRemoteMode}
                  disabled={restoreBusy || remoteLoading || !remoteRecord}
                >
                  {restoreBusy ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : null}
                  In Bereich (Major) wiederherstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PhotoModal
        open={isPhotoModalOpen}
        src={photoModalSrc}
        onClose={closePhotoModal}
      />

      <StageEmailModal
        open={isStageEmailModalOpen}
        onClose={closeStageEmailModal}
        title="Status e-mail yuborish"
        subtitle={
          pendingStageStep === "stage_2"
            ? "2-bosqich e-mailida link va sana/vaqt yuborilmaydi."
            : isLimitedAdmin
            ? "Sizda e-mail yuborish uchun ruxsat yo‘q."
            : metaLoading
            ? "Qo‘shimcha ma’lumotlar yuklanmoqda..."
            : "Qabul qilinganda sana/vaqt va link (yoki lokatsiya) e-mailga qo‘shiladi."
        }
        decision={stageDecision}
        setDecision={setStageDecision}
        onSubmit={handleStageEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        previewRows={[]}
        showPreviewWhenAccepted
        showAdditionalInfoEditor={
          !isLimitedAdmin &&
          pendingStageStep !== "stage_2" &&
          stageDecision === "accepted"
        }
        additionalInfoForm={stageAdditionalInfoForm}
        setAdditionalInfoForm={setStageAdditionalInfoForm}
        canGenerateTelegramLink={Boolean(
          pendingStageStep &&
            getTelegramGroupIdForStage(metaInfo, pendingStageStep)
        )}
        autoTelegramGroupLabel={(() => {
          try {
            const gid = pendingStageStep
              ? getTelegramGroupIdForStage(metaInfo, pendingStageStep)
              : "";
            if (!gid) return "";
            return String(telegramGroupNameById?.[gid] || gid).trim();
          } catch {
            return "";
          }
        })()}
        emailPreview={stageEmailPreview}
      />

      <CustomEmailModal
        open={isCustomEmailModalOpen}
        onClose={closeCustomEmailModal}
        onSubmit={handleCustomEmailSubmit}
        isSending={Boolean(sendingStepValue)}
        form={customEmailForm}
        setForm={setCustomEmailForm}
        emailPreview={customEmailPreview}
        placeholders={customEmailDefaults}
      />

      {isMobile && showBirthPlacePicker && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setShowBirthPlacePicker(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="shrink-0 px-4 pb-3 border-b border-base-200">
              <h3 className="font-bold text-lg text-center">Geburtsort</h3>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-1">
                {UZBEK_REGIONS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setFormCv((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          birthPlace: city,
                        },
                      }));
                      setShowBirthPlacePicker(false);
                    }}
                    className={`
                      w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                      active:scale-98
                      ${
                        formCv.personalInfo.birthPlace === city
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 active:bg-base-300"
                      }
                    `}
                  >
                    {city}
                    {formCv.personalInfo.birthPlace === city && (
                      <span className="float-right">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && showMaritalStatusPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setShowMaritalStatusPicker(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="shrink-0 px-4 pb-3 border-b border-base-200">
              <h3 className="font-bold text-lg text-center">Familienstand</h3>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-1">
                {["ledig", "verheiratet", "geschieden", "verwitwet"].map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFormCv((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            maritalStatus: status,
                          },
                        }));
                        setShowMaritalStatusPicker(false);
                      }}
                      className={`
                      w-full text-left px-4 py-4 rounded-xl transition-all text-base font-medium
                      active:scale-98
                      ${
                        formCv.personalInfo.maritalStatus === status
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 active:bg-base-300"
                      }
                    `}
                    >
                      {status}
                      {formCv.personalInfo.maritalStatus === status && (
                        <span className="float-right">✓</span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Generate;
