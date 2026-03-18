export default function ErklaerungFormList({
  formCv,
  onOpenErklaerung,
  onOpenZusatzblattA,
  onOpenZusatzblattB,
  onOpenZusatzblattC,
  onOpenZusatzblattD,
}) {
  return (
    <>
      <div className="divider text-sm font-medium opacity-70 mt-6">
        Erklärung zum Beschäftigungsverhältnis
      </div>
      <p className="text-xs text-base-content/60 mb-3">
        Klicken Sie auf &quot;Öffnen&quot;, um das Formular mit Kandidatendaten zu öffnen und PDF herunterzuladen.
      </p>
      <div className="space-y-2">
        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Erklärung zum Beschäftigungsverhältnis</div>
              <p className="text-xs text-base-content/60 mt-1">
                Hauptformular für die Bundesagentur für Arbeit
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onOpenErklaerung}
              disabled={!formCv.personalInfo.firstName || !formCv.personalInfo.lastName}
            >
              Öffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt A - Anerkennungsverfahren</div>
              <p className="text-xs text-base-content/60 mt-1">
                Beschäftigung im Rahmen des Anerkennungsverfahrens
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattA}>
              Öffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt B - ICT / Personalaustausch</div>
              <p className="text-xs text-base-content/60 mt-1">
                Unternehmensinterner Transfer (ICT)
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattB}>
              Öffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt C - Berufskraftfahrer</div>
              <p className="text-xs text-base-content/60 mt-1">
                Beschäftigung als Berufskraftfahrer/in
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattC}>
              Öffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt D - Kurzfristige Beschäftigung</div>
              <p className="text-xs text-base-content/60 mt-1">
                Kurzfristige Beschäftigung (max. 70 Tage)
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattD}>
              Öffnen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
