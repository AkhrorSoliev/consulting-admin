export default function PrivacyModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-3xl mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        <div className="bg-base-100 text-base-content rounded-box shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-base-300 bg-base-100/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h3
                id="privacy-title"
                className="text-xl md:text-2xl font-bold truncate"
              >
                Datenschutzrichtlinie
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onClose}
                  aria-label="Schließen"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 overflow-y-auto">
            <div className="space-y-4 text-sm leading-7">
              <p>
                Auf der Plattform <strong>Consultinguz</strong> gelten alle
                eingegebenen personenbezogenen Daten (Name, Kontaktdaten,
                Berufserfahrung, Ausbildung, Lebenslauf u. a.) als vertraulich
                und werden gemäß den geltenden gesetzlichen Bestimmungen sowie
                unseren internen Sicherheitsrichtlinien geschützt.
              </p>
              <p>
                Wir verwenden die von Nutzerinnen und Nutzern übermittelten
                Daten ausschließlich zu einem Zweck –{" "}
                <strong>
                  die Qualifikation und Erfahrung der Kandidatinnen und
                  Kandidaten zu prüfen und sie passenden Arbeitgebern zu
                  empfehlen
                </strong>
                .
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Ihre Daten werden{" "}
                  <strong>
                    niemals an Dritte verkauft oder frei weitergegeben
                  </strong>
                  .
                </li>
                <li>
                  Informationen über eine Kandidatin oder einen Kandidaten
                  werden{" "}
                  <strong>
                    nur in dem für den Arbeitgeber erforderlichen Umfang
                  </strong>{" "}
                  und <strong>auf Grundlage Ihrer Einwilligung</strong>{" "}
                  bereitgestellt.
                </li>
                <li>
                  Alle Daten werden auf sicheren Servern gespeichert und sind
                  vor unbefugtem Zugriff geschützt.
                </li>
              </ul>
              <p>
                Sie können Ihre Daten jederzeit aktualisieren, löschen oder die
                Verarbeitung einschränken, indem Sie sich an{" "}
                <strong>Consultinguz</strong> wenden. Wir schätzen Ihr Vertrauen
                und verarbeiten Ihre Daten sorgfältig und ausschließlich, um
                Ihnen bei der Jobsuche zu helfen.
              </p>
            </div>
          </div>
          <div className="sticky bottom-0 z-10 px-6 py-3 border-t border-base-300 bg-base-100/95 backdrop-blur">
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={onClose}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
