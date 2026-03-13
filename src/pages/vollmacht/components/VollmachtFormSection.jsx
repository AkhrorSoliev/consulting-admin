import FormInput from "../../../components/FormInput";
import { fromInputDate, toInputDate } from "../../../utils";

export default function VollmachtFormSection({ form, setForm }) {
  return (
    <div className="card-body space-y-4 grow-0">
      <h2 className="card-title text-2xl font-bold ">
        Vollmacht ausfüllen
      </h2>
      <p className="text-sm opacity-70">
        Füllen Sie die erforderlichen Felder aus:{" "}
        <span className="font-semibold">Nachname</span>,{" "}
        <span className="font-semibold">Vorname</span>,{" "}
        <span className="font-semibold">Geburtsdatum</span>,{" "}
        <span className="font-semibold">Wohnort</span> und{" "}
        <span className="font-semibold">Datum</span>.
      </p>
      <div className="divider divider-start font-bold text-base-content/80">
        👤 Personendaten
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Persönliche Angaben
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Nachname"
            placeholder="z.B. Mustermann"
            value={form.lastName}
            onChange={(e) =>
              setForm((p) => ({ ...p, lastName: e.target.value }))
            }
          />
          <FormInput
            label="Vorname"
            placeholder="z.B. Max"
            value={form.firstName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firstName: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Geburtsdaten
        </h3>
        <FormInput
          label="Geburtsdatum"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.birthDate)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              birthDate: fromInputDate(e.target.value),
            }))
          }
          helperText={
            <span className="text-xs opacity-70">
              Wird als <span className="font-semibold">{"\u201Egeboren am\u201C"}</span>{" "}
              angezeigt.
            </span>
          }
        />
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Wohnort
        </h3>
        <FormInput
          label="Wohnort"
          placeholder="z.B. Taschkent"
          value={form.city}
          onChange={(e) =>
            setForm((p) => ({ ...p, city: e.target.value }))
          }
        />
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full"></span>
          Unterschrift
        </h3>
        <FormInput
          label="Datum"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.date)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              date: fromInputDate(e.target.value),
            }))
          }
          helperText={
            <span className="text-xs opacity-70">
              Wird unten als{" "}
              <span className="font-semibold">{"\u201EDatum\u201C"}</span> angezeigt.
            </span>
          }
        />
      </div>

      <div className="divider" />
      <div className="text-sm">
        <div className="font-semibold mb-1">Tipp</div>
        <div className="opacity-70">
          Wenn Felder leer bleiben, werden in der Vollmacht
          Platzhalter‑Linien angezeigt.
        </div>
      </div>
    </div>
  );
}
