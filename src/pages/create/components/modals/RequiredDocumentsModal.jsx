import { useState } from "react";
import {
  FaPassport,
  FaPhone,
  FaImage,
  FaFileAlt,
  FaCertificate,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaTimes,
} from "react-icons/fa";

function RequiredDocumentsModal({ open, onClose }) {
  const [language, setLanguage] = useState("de"); // "de" or "uz"

  if (!open) return null;

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

  const t = content[language];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-base-300 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-base-content mb-1">
                {t.title}
              </h2>
              <p className="text-sm text-base-content/70">{t.subtitle}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle shrink-0"
              onClick={onClose}
              aria-label="Schließen"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>

          {/* Language Switch */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-sm font-medium text-base-content/70">
              {t.switchLabel}
            </span>
            <div className="flex items-center gap-1 bg-base-200 rounded-lg p-1">
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  language === "de"
                    ? "bg-primary text-primary-content shadow-sm"
                    : "text-base-content/60 hover:text-base-content"
                }`}
                onClick={() => setLanguage("de")}
              >
                Deutsch
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  language === "uz"
                    ? "bg-primary text-primary-content shadow-sm"
                    : "text-base-content/60 hover:text-base-content"
                }`}
                onClick={() => setLanguage("uz")}
              >
                O'zbek
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="space-y-3">
            {t.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl border border-base-300 bg-base-200/40 hover:bg-base-200/60 transition-colors"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-content text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-base-content">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-base-content/70 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30">
            <p className="text-sm text-base-content/80 leading-relaxed">
              <span className="font-semibold text-warning mr-1">💡</span>
              {t.note}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-base-300 px-6 py-4">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={onClose}
          >
            {t.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequiredDocumentsModal;
