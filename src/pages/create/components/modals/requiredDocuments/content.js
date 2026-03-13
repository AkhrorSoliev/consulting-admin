import {
  FaPassport,
  FaPhone,
  FaImage,
  FaFileAlt,
  FaCertificate,
  FaGraduationCap,
  FaMapMarkerAlt,
} from "react-icons/fa";

const content = {
  de: {
    title: "Bevor Sie beginnen",
    subtitle: "Bitte bereiten Sie folgende Informationen und Dokumente vor:",
    items: [
      {
        icon: FaPassport,
        title: "Passnummer",
        description: "Format: AA 0000000 (z.B. AD 1234567)",
      },
      {
        icon: FaPhone,
        title: "Telefonnummer",
        description: "Mit Ländervorwahl (z.B. +998 90 123 45 67)",
      },
      {
        icon: FaImage,
        title: "Ihr Foto (3×4 cm)",
        description: "JPEG/PNG Format, maximal 250 KB",
      },
      {
        icon: FaFileAlt,
        title: "Reisepass (PDF)",
        description: "Scan Ihres Reisepasses oder Personalausweises, maximal 2 MB",
      },
      {
        icon: FaCertificate,
        title: "Sprachzertifikate (PDF)",
        description: "Goethe, telc, TestDaF usw. (falls vorhanden), maximal 2 MB pro Datei",
      },
      {
        icon: FaGraduationCap,
        title: "Diplome (PDF)",
        description: "Mindestens Schulzeugnis erforderlich, maximal 2 MB pro Datei",
      },
      {
        icon: FaMapMarkerAlt,
        title: "PLZ (Postleitzahl)",
        description: "6-stellige Postleitzahl Ihres Wohnortes",
      },
    ],
    note: "Hinweis: Alle PDF-Dateien müssen unter 2 MB groß sein. Falls eine Datei zu groß ist, können Sie sie auf ilovepdf.com komprimieren.",
    buttonText: "Verstanden, weiter",
    switchLabel: "Sprache:",
  },
  uz: {
    title: "Boshlashdan oldin",
    subtitle: "Iltimos, quyidagi ma'lumot va hujjatlarni tayyorlab qo'ying:",
    items: [
      {
        icon: FaPassport,
        title: "Pasport raqami",
        description: "Format: AA 0000000 (masalan: AD 1234567)",
      },
      {
        icon: FaPhone,
        title: "Telefon raqami",
        description: "Kod bilan birga (masalan: +998 90 123 45 67)",
      },
      {
        icon: FaImage,
        title: "Rasmingiz (3×4 sm)",
        description: "JPEG/PNG format, maksimal 250 KB",
      },
      {
        icon: FaFileAlt,
        title: "Pasport (PDF)",
        description: "Pasport yoki ID kartangizning skan nusxasi, maksimal 2 MB",
      },
      {
        icon: FaCertificate,
        title: "Til sertifikatlari (PDF)",
        description: "Goethe, telc, TestDaF va h.k. (agar mavjud bo'lsa), har biri maksimal 2 MB",
      },
      {
        icon: FaGraduationCap,
        title: "Diplomlar (PDF)",
        description: "Kamida maktab attestati talab qilinadi, har biri maksimal 2 MB",
      },
      {
        icon: FaMapMarkerAlt,
        title: "PLZ (Pochta indeksi)",
        description: "Yashash manzilingizning 6 raqamli pochta indeksi",
      },
    ],
    note: "Eslatma: Barcha PDF fayllar 2 MB dan kichik bo'lishi kerak. Agar fayl hajmi katta bo'lsa, uni ilovepdf.com saytida siqishingiz mumkin.",
    buttonText: "Tushundim, davom etish",
    switchLabel: "Til:",
  },
};

export default content;
