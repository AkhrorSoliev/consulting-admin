import {
  CANDIDATE_STATUS_OPTIONS,
} from "../../../../constants/candidateStatus";
import {
  inferLinkType,
  createEmptyStageInfo,
} from "../../utils";

/**
 * Build normalised interview info for a given stage step.
 */
export function getStageAdditionalInfo(metaInfo, stepValue) {
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
  if (v === "stage_2") {
    return normalizeInterview(
      metaInfo?.interviewLeadership || metaInfo?.interviewInternal,
    );
  }
  if (v === "stage_2_result") {
    return createEmptyStageInfo();
  }
  if (v === "stage_3") {
    return normalizeInterview(metaInfo?.interviewEmployer);
  }
  return createEmptyStageInfo();
}

/**
 * Strip the default intro paragraph from custom email preview text.
 */
export function stripDefaultIntroFromCustomPreview(value) {
  const raw = String(value || "");
  if (!raw) return raw;
  const intros = [
    "Arizangiz holatini yangiladik. Quyidagi sharh va keyingi qadamlarni diqqat bilan ko'rib chiqing:",
    "Wir haben den Status Ihrer Bewerbung aktualisiert. Bitte lesen Sie die folgenden Hinweise und nächsten Schritte sorgfältig durch:",
  ];
  let out = raw;
  for (const intro of intros) {
    out = out
      .replace(
        new RegExp(
          `<p[^>]*>\\s*${intro.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          )}\\s*<\\/p>\\s*`,
          "g",
        ),
        "",
      )
      .replace(
        new RegExp(
          `\\s*${intro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
          "g",
        ),
        "",
      );
  }
  return out.trim();
}

/**
 * Strip the "Holat: <strong>...</strong>" / "Status: ..." line from custom emails.
 */
export function stripStatusLineFromCustomEmail(value) {
  const raw = String(value || "");
  if (!raw) return raw;
  const htmlOut = raw.replace(
    /<div[^>]*>\s*(?:Holat|Status):\s*<strong>[\s\S]*?<\/strong>\s*<\/div>\s*/gi,
    "",
  );
  return htmlOut
    .replace(/\n?(?:Holat|Status):\s*.*(\n|$)/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normalise raw stage form info into a consistent shape.
 */
export function normalizeStageFormInfo(raw) {
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

/**
 * Whether the stage's accepted-email needs date/time/link/location fields.
 * stage_2_result va stage_2 example1 — bular faqat natija xabari, suhbat
 * rejalashtirmaydi, shuning uchun qo'shimcha ma'lumot talab qilmaydi.
 */
export function stageRequiresAdditionalInfo(stage, selectedExample) {
  const s = String(stage || "").trim();
  if (s === "stage_2_result") return false;
  if (s === "stage_2" && selectedExample !== "example2") return false;
  return true;
}

/**
 * Given a step value, return the next step value in the pipeline.
 */
export function getNextStepValue(value, options = {}) {
  const { withLeadership = false } = options;

  if (value === "stage_2" && withLeadership) {
    return "stage_2_result";
  }
  if (value === "stage_2_result") {
    return "stage_3";
  }

  const steps = CANDIDATE_STATUS_OPTIONS.filter((s) => {
    if (s.value === "stage_2_result" && !withLeadership) {
      return false;
    }
    return true;
  });
  const idx = steps.findIndex((s) => s.value === value);
  if (idx === -1) return null;
  return steps[idx + 1]?.value || null;
}
