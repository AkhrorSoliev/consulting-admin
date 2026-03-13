import { useMemo } from "react";
import {
  commentHtmlToPlainText,
  sortTimelineItemsDesc,
} from "../../../../utils";
import { formatDateDDMMYYYY, softWrapTextLine } from "./utils";

export default function useFormData({ formCv, commentMeta, showComment }) {
  const sortedExperience = sortTimelineItemsDesc(formCv?.experience || []);

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

  const mainContentBottomPadPt = showComment ? 44 : 72;

  return {
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
    commentLines,
    commentDate,
    commentLineEntries,
    hasSoftSkills,
    hasLanguages,
    hasPcSkills,
    showSkillsSection,
    mainContentBottomPadPt,
  };
}
