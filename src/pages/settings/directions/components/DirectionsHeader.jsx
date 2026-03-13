export default function DirectionsHeader() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Richtungen Verwaltung</h2>
      <p className="text-base-content/70 mb-3">
        Gelöschte Richtungen wiederherstellen oder dauerhaft löschen
      </p>
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div className="text-sm">
          <p className="font-semibold">Wie es funktioniert:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>
              Zum Löschen einer Richtung die <strong>Sidebar</strong>{" "}
              verwenden
            </li>
            <li>
              Gelöschte Richtungen erscheinen hier im{" "}
              <strong>"Gelöscht"</strong> Tab
            </li>
            <li>
              Mit dem <strong>"Wiederherstellen"</strong> Button die Richtung
              reaktivieren
            </li>
            <li>
              <strong>"Dauerhaft löschen"</strong> - nur bei Bedarf! (kann
              nicht rückgängig gemacht werden)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
