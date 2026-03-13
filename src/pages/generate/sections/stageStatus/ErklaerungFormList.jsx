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
        Erkl\u00e4rung zum Besch\u00e4ftigungsverh\u00e4ltnis
      </div>
      <p className="text-xs text-base-content/60 mb-3">
        Klicken Sie auf &quot;\u00d6ffnen&quot;, um das Formular mit Kandidatendaten zu \u00f6ffnen und PDF herunterzuladen.
      </p>
      <div className="space-y-2">
        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Erkl\u00e4rung zum Besch\u00e4ftigungsverh\u00e4ltnis</div>
              <p className="text-xs text-base-content/60 mt-1">
                Hauptformular f\u00fcr die Bundesagentur f\u00fcr Arbeit
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onOpenErklaerung}
              disabled={!formCv.personalInfo.firstName || !formCv.personalInfo.lastName}
            >
              \u00d6ffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt A - Anerkennungsverfahren</div>
              <p className="text-xs text-base-content/60 mt-1">
                Besch\u00e4ftigung im Rahmen des Anerkennungsverfahrens
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattA}>
              \u00d6ffnen
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
              \u00d6ffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt C - Berufskraftfahrer</div>
              <p className="text-xs text-base-content/60 mt-1">
                Besch\u00e4ftigung als Berufskraftfahrer/in
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattC}>
              \u00d6ffnen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Zusatzblatt D - Kurzfristige Besch\u00e4ftigung</div>
              <p className="text-xs text-base-content/60 mt-1">
                Kurzfristige Besch\u00e4ftigung (max. 70 Tage)
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={onOpenZusatzblattD}>
              \u00d6ffnen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
