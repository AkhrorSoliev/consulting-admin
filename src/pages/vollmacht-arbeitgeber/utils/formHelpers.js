export function todayDdMmYyyy() {
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

export function migrateLegacyCandidateFields(form) {
  const next = { ...form };

  const normalize = (value) => String(value || "").trim();

  if (
    !normalize(next.candidateFirstName) &&
    !normalize(next.candidateLastName)
  ) {
    const fullName = normalize(next.candidateFullName);
    if (fullName) {
      const parts = fullName.split(/\s+/);
      const first = parts.shift() || "";
      next.candidateFirstName = first;
      next.candidateLastName = parts.join(" ");
    }
  }

  if (!normalize(next.candidateBirthCountry) && normalize(next.candidateLand)) {
    next.candidateBirthCountry = normalize(next.candidateLand);
  }

  if (
    !normalize(next.candidateBirthDate) ||
    !normalize(next.candidateBirthPlace) ||
    !normalize(next.candidateBirthCountry)
  ) {
    const legacyBirth = normalize(next.candidateBirthInfo);
    if (legacyBirth) {
      const segments = legacyBirth
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!normalize(next.candidateBirthDate) && segments[0])
        next.candidateBirthDate = segments[0];
      if (!normalize(next.candidateBirthPlace) && segments[1])
        next.candidateBirthPlace = segments[1];
      if (!normalize(next.candidateBirthCountry) && segments[2])
        next.candidateBirthCountry = segments.slice(2).join(", ");
    }
  }

  const legacyStreet = normalize(
    next.candidateStreetLegacy || next.candidateStreet
  );
  if (legacyStreet && !normalize(next.candidateHouseNumber)) {
    const match = legacyStreet.match(/^(.*?)[\s,]+(\d+\w*)$/);
    if (match) {
      if (!normalize(next.candidateStreet))
        next.candidateStreet = match[1].trim();
      next.candidateHouseNumber = match[2].trim();
    } else if (!normalize(next.candidateStreet)) {
      next.candidateStreet = legacyStreet;
    }
  }

  const legacyCity = normalize(next.candidateCityLegacy || next.candidateCity);
  if (legacyCity) {
    const parts = legacyCity.split(/\s+/).filter(Boolean);
    if (parts.length >= 1 && !normalize(next.candidatePostalCode)) {
      const maybePostal = parts[0];
      if (/^\d{4,6}$/.test(maybePostal)) {
        next.candidatePostalCode = maybePostal;
        parts.shift();
      }
    }
    if (parts.length >= 1 && !normalize(next.candidateCountry)) {
      const maybeCountry = parts[parts.length - 1];
      next.candidateCountry = maybeCountry;
      parts.pop();
    }
    if (parts.length && !normalize(next.candidateCity)) {
      next.candidateCity = parts.join(" ");
    }
  }

  if (!normalize(next.candidatePostalCode) && normalize(next.candidatePLZ)) {
    next.candidatePostalCode = normalize(next.candidatePLZ);
  }

  if (!normalize(next.candidateCountry) && normalize(next.candidateLand)) {
    next.candidateCountry = normalize(next.candidateLand);
  }

  return next;
}

export const OPTIONAL_FIELDS = [
  "candidateFirstName",
  "candidateLastName",
  "candidateBirthDate",
  "candidateBirthPlace",
  "candidateBirthCountry",
  "candidateStreet",
  "candidateHouseNumber",
  "candidatePostalCode",
  "candidateCity",
  "candidateCountry",
  "candidatePhone",
  "candidateEmail",
  "candidatePlaceDate",
  "employerCompany",
  "employerLocation",
  "employerRepName",
  "employerRepAddress",
  "employerRepPhone",
  "employerRepEmail",
  "employerPlaceDate",
  "employerDesignation",
  "employerRepFullName",
  // legacy
  "candidateFullName",
  "candidateBirthInfo",
];

export function getOmitKey(fieldKey) {
  if (!fieldKey) return "";
  return `omit${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`;
}

export function createInitialFormState() {
  const state = {
    // Vollmachtgeber (Candidate) fields
    candidateFirstName: "",
    candidateLastName: "",
    candidateBirthDate: "",
    candidateBirthPlace: "",
    candidateBirthCountry: "",
    candidateStreet: "",
    candidateHouseNumber: "",
    candidatePostalCode: "",
    candidateCity: "",
    candidateCountry: "",
    candidatePhone: "",
    candidateEmail: "",
    candidatePlaceDate: todayDdMmYyyy(),

    // Arbeitgeber (Employer) fields
    employerCompanyName: "",
    employerStreet: "",
    employerHouseNumber: "",
    employerPostalCode: "",
    employerCity: "",
    employerCountry: "",
    employerRepFirstName: "",
    employerRepLastName: "",
    employerRepStreet: "",
    employerRepHouseNumber: "",
    employerRepPostalCode: "",
    employerRepCity: "",
    employerRepCountry: "",
    employerRepPhone: "",
    employerRepEmail: "",
    employerPlaceDate: todayDdMmYyyy(),

    // Dynamic text fields
    employerDesignation: "",
    employerRepFullName: "",

    // Legacy fallbacks (will be migrated if present)
    candidateFullName: "",
    candidateBirthInfo: "",
    candidateStreetLegacy: "",
    candidateCityLegacy: "",
  };

  OPTIONAL_FIELDS.forEach((key) => {
    const omitKey = getOmitKey(key);
    if (omitKey) {
      state[omitKey] = false;
    }
  });

  return state;
}
