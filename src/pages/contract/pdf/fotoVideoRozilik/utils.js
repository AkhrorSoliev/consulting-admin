import { Font } from "@react-pdf/renderer";

function getAbsolutePublicUrl(pathname) {
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(pathname, window.location.href).toString();
  } catch {
    return pathname;
  }
}

let interRegistered = false;
export function ensureInterRegistered() {
  if (interRegistered) return;
  interRegistered = true;
  Font.register({
    family: "Inter",
    fonts: [
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBold.ttf"),
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-SemiBoldItalic.ttf"),
        fontWeight: 600,
        fontStyle: "italic",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
      {
        src: getAbsolutePublicUrl("/fonts/inter/Inter-BoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
}

// Translate address/location to Uzbek
export function toUzbekText(text) {
  if (!text) return "";
  let result = String(text);

  // Region translations
  const regionMap = {
    "Jizzakh Region": "Jizzax viloyati",
    "Tashkent Region": "Toshkent viloyati",
    "Samarkand Region": "Samarqand viloyati",
    "Bukhara Region": "Buxoro viloyati",
    "Fergana Region": "Farg'ona viloyati",
    "Andijan Region": "Andijon viloyati",
    "Namangan Region": "Namangan viloyati",
    "Kashkadarya Region": "Qashqadaryo viloyati",
    "Surkhandarya Region": "Surxondaryo viloyati",
    "Khorezm Region": "Xorazm viloyati",
    "Navoi Region": "Navoiy viloyati",
    "Syrdarya Region": "Sirdaryo viloyati",
    "Karakalpakstan": "Qoraqalpog'iston",
    "Tashkent": "Toshkent",
  };

  for (const [en, uz] of Object.entries(regionMap)) {
    result = result.replace(new RegExp(en, "gi"), uz);
  }

  // Country
  result = result.replace(/Usbekistan/gi, "O'zbekiston");
  result = result.replace(/Uzbekistan/gi, "O'zbekiston");

  // Street - strase/strasse -> ko'chasi (with space before)
  result = result.replace(/(\S)straße/gi, "$1 ko'chasi");
  result = result.replace(/(\S)strasse/gi, "$1 ko'chasi");
  result = result.replace(/straße/gi, "ko'chasi");
  result = result.replace(/strasse/gi, "ko'chasi");

  return result;
}
