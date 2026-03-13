import FormInput from "../../../components/FormInput";
import { fromInputDate, toInputDate } from "../../../utils";

export default function ContractFormFields({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        👤 Auftraggeber
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Persönliche Angaben
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Vorname"
            placeholder="Vorname"
            value={form.firstName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firstName: e.target.value }))
            }
          />
          <FormInput
            label="Nachname"
            placeholder="Nachname"
            value={form.lastName}
            onChange={(e) =>
              setForm((p) => ({ ...p, lastName: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Vertragsdaten
        </h3>
        <div className="space-y-4">
          <FormInput
            label="Datum"
            type="date"
            placeholder="YYYY-MM-DD"
            value={toInputDate(form.contractDate)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                contractDate: fromInputDate(e.target.value),
              }))
            }
            helperText={
              <span className="text-xs opacity-70">
                Im Vertrag als{" "}
                <span className="font-semibold">dd.mm.yyyy</span>{" "}
                verwendet.
              </span>
            }
          />
          <FormInput
            label="Ort (Unterschrift)"
            placeholder="z.B. Berlin"
            value={form.signatureCity}
            onChange={(e) =>
              setForm((p) => ({ ...p, signatureCity: e.target.value }))
            }
            helperText={
              <span className="text-xs opacity-70">
                Wird unten als{" "}
                <span className="font-semibold">{"\u201EOrt, Datum\u201C"}</span>{" "}
                angezeigt.
              </span>
            }
          />
        </div>
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-secondary rounded-full"></span>
          Kandidatendaten (Pass-Seite)
        </h3>
        <div className="space-y-4">
          <FormInput
            label="Ort (Kandidat) — für Pass-Seite"
            placeholder="z.B. Tashkent"
            value={form.candidateCity}
            onChange={(e) =>
              setForm((p) => ({ ...p, candidateCity: e.target.value }))
            }
            helperText={
              <span className="text-xs opacity-70">
                Wird unter dem Passbild als{" "}
                <span className="font-semibold">{"\u201EDatum: Ort, Datum\u201C"}</span>{" "}
                angezeigt.
              </span>
            }
          />
          <FormInput
            label="PDF generiert am"
            type="date"
            placeholder="YYYY-MM-DD"
            value={toInputDate(form.pdfGeneratedDate)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                pdfGeneratedDate: fromInputDate(e.target.value),
              }))
            }
            helperText={
              <span className="text-xs opacity-70">
                Standard: heute. Wird unter dem Passbild angezeigt.
              </span>
            }
          />
        </div>
      </div>
    </>
  );
}
