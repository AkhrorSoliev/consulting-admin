import { useMemo } from "react";

/**
 * Builds the previewCv object from watched form fields and CV state.
 * Extracted from the ~120-line useMemo in the original Create component.
 */
export default function usePreviewCv({
  cv,
  noCollege,
  noUniversity,
  watchName,
  watchLastName,
  watchGender,
  watchBirthDate,
  watchBirthPlace,
  watchMaritalStatus,
  watchChildrenCount,
  watchNoChildren,
  watchHasDrivingLicense,
  watchDrivingLicenseType,
  watchAddress,
  watchPhone,
  watchEmail,
  watchPassportNumber,
  watchPhoto,
}) {
  return useMemo(() => {
    const drivingTypeRaw = watchDrivingLicenseType;
    const drivingLicenseType = Array.isArray(drivingTypeRaw)
      ? drivingTypeRaw
          .map((s) => String(s || "").trim().toUpperCase())
          .filter(Boolean)
          .join(", ")
      : String(drivingTypeRaw || "")
          .split(",")
          .map((s) => String(s || "").trim().toUpperCase())
          .filter(Boolean)
          .join(", ");

    const address = String(watchAddress || "").trim();

    // Convert education object to array for LivePreview
    const educationArray = [];
    if (cv.education?.schule) {
      const schule = cv.education.schule;
      if (schule.startDate || schule.endDate || schule.institution || schule.degree) {
        educationArray.push({
          startDate: schule.startDate || "",
          endDate: schule.endDate || "",
          institution: schule.institution || "",
          degree: schule.degree || "",
        });
      }
    }
    if (cv.education?.kollej && !noCollege) {
      const kollej = cv.education.kollej;
      if (kollej.startDate || kollej.endDate || kollej.institution || kollej.degree) {
        educationArray.push({
          startDate: kollej.startDate || "",
          endDate: kollej.endDate || "",
          institution: kollej.institution || "",
          degree: kollej.degree || "",
        });
      }
    }
    if (cv.education?.universitat && !noUniversity) {
      const universitat = cv.education.universitat;
      if (universitat.startDate || universitat.endDate || universitat.institution || universitat.degree) {
        educationArray.push({
          startDate: universitat.startDate || "",
          endDate: universitat.endDate || "",
          institution: universitat.institution || "",
          degree: universitat.degree || "",
        });
      }
    }

    return {
      ...cv,
      education: educationArray,
      personalInfo: {
        ...(cv?.personalInfo || {}),
        name: String(watchName || "").trim(),
        lastName: String(watchLastName || "").trim(),
        gender: String(watchGender || "").trim(),
        address,
        birthDate: String(watchBirthDate || "").trim(),
        birthPlace: String(watchBirthPlace || "").trim(),
        maritalStatus: String(watchMaritalStatus || "").trim(),
        childrenCount: String(watchChildrenCount || "").trim(),
        noChildren: Boolean(watchNoChildren),
        hasDrivingLicense: Boolean(watchHasDrivingLicense),
        drivingLicenseType,
        phone: String(watchPhone || "").trim(),
        email: String(watchEmail || "").trim(),
        passportNumber: String(watchPassportNumber || "").trim(),
        photo: String(watchPhoto || "").trim(),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cv,
    watchName,
    watchLastName,
    watchGender,
    watchBirthDate,
    watchBirthPlace,
    watchMaritalStatus,
    watchChildrenCount,
    watchNoChildren,
    watchHasDrivingLicense,
    watchDrivingLicenseType,
    watchAddress,
    watchPhone,
    watchEmail,
    watchPassportNumber,
    watchPhoto,
    noCollege,
    noUniversity,
  ]);
}
