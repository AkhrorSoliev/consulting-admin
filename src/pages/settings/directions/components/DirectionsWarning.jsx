export default function DirectionsWarning() {
  return (
    <div className="alert alert-warning">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 className="font-bold">Wichtige Informationen!</h3>
        <div className="text-sm space-y-1">
          <p>{"\u2705"} Gelöschte Richtungen werden in Stats nicht angezeigt</p>
          <p>{"\u2705"} Kandidaten bleiben erhalten und gehen nicht verloren</p>
          <p>
            {"\u2705"} Bei Wiederherstellung der Richtung kommen alle Kandidaten
            zurück
          </p>
          <p>
            {"\u26a0\ufe0f"} "Dauerhaft löschen" löscht das Meta-Dokument vollständig
            (Kandidaten bleiben erhalten)
          </p>
        </div>
      </div>
    </div>
  );
}
