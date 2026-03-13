export function NoDataState() {
  return (
    <div className="grid place-items-center py-24">
      <div className="text-center opacity-70">
        <p className="text-lg">Derzeit keine Daten vorhanden.</p>
        <p className="text-sm">
          Die Liste der Kandidaten erscheint hier.
        </p>
      </div>
    </div>
  );
}

export function NoResultsState({ onReset }) {
  return (
    <div className="grid place-items-center py-24">
      <div className="text-center opacity-70">
        <p className="text-lg">Keine Ergebnisse gefunden.</p>
        <p className="text-sm mb-6">
          Versuchen Sie es mit einem anderen Namen.
        </p>
        <button
          className="btn btn-sm btn-outline btn-primary"
          onClick={onReset}
        >
          Zur&uuml;cksetzen
        </button>
      </div>
    </div>
  );
}
