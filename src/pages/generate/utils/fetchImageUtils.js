import { buildProxyAssetUrlCandidates, normalizeMaybeUrl } from "./proxyUtils";
import {
  sniffFileKindFromArrayBuffer,
  pdfArrayBufferFirstPageToJpegDataUrlBestEffort,
  blobToJpegDataUrlBestEffort,
} from "./imageProcessing";

export async function fetchUrlAsImageDataUrlBestEffort(url) {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) return "";
  try {
    const proxyCandidates = buildProxyAssetUrlCandidates(safeUrl);
    const rawAttempt = normalizeMaybeUrl(safeUrl);
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
