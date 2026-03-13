import { Font } from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let arimoRegistered = false;
export function ensureArimoRegistered() {
  if (arimoRegistered) return;
  arimoRegistered = true;
  Font.register({
    family: "Arimo",
    fonts: [
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-Italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-SemiBoldItalic.ttf"),
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/arimo/Arimo-BoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

export function hasValue(v) {
  return String(v || "").trim().length > 0;
}

export function getOmitKey(fieldKey) {
  if (!fieldKey) return "";
  return `omit${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`;
}

export function buildRepAddressLine(form) {
  const street = String(form?.employerRepStreet || "").trim();
  const house = String(form?.employerRepHouseNumber || "").trim();
  const plz = String(form?.employerRepPostalCode || "").trim();
  const city = String(form?.employerRepCity || "").trim();

  let line = "";

  if (street) {
    line += street;
  }
  if (house) {
    line += (line ? ". " : "") + house;
  }
  if (plz) {
    line += (line ? ", " : "") + plz;
  }
  if (city) {
    // two spaces before Ort as requested ("PLZ  Ort")
    line += (plz ? "  " : line ? " " : "") + city;
  }

  return line;
}

export function buildEmployerAddressLine(form) {
  const street = String(form?.employerStreet || "").trim();
  const house = String(form?.employerHouseNumber || "").trim();
  const plz = String(form?.employerPostalCode || "").trim();
  const city = String(form?.employerCity || "").trim();

  let line = "";

  if (street) {
    line += street;
  }
  if (house) {
    line += (line ? ". " : "") + house;
  }
  if (plz) {
    line += (line ? ", " : "") + plz;
  }
  if (city) {
    // two spaces before Ort as requested ("PLZ  Ort")
    line += (plz ? "  " : line ? " " : "") + city;
  }

  return line;
}
