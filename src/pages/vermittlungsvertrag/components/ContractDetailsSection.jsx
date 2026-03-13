import FormInput from "../../../components/FormInput";
import { fromInputDate, toInputDate } from "../../../utils";

export default function ContractDetailsSection({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        📋 Vertragsdauer
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-secondary rounded-full"></span>
          Vertragsdetails
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Vertragsdauer (Jahre)"
            type="number"
            min="1"
            max="10"
            placeholder="z.B. 2"
            value={form.contractDurationYears}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                contractDurationYears: parseInt(e.target.value) || 2,
              }))
            }
          />
          <FormInput
            label="Vertragsstrafe (%)"
            type="number"
            min="1"
            max="100"
            placeholder="z.B. 50"
            value={form.contractPenaltyPercent}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                contractPenaltyPercent: e.target.value,
              }))
            }
          />
          <div className="sm:col-span-2">
            <FormInput
              label="Umgehungsschutz (Monate)"
              type="number"
              min="1"
              max="24"
              placeholder="z.B. 6"
              value={form.contractProtectionMonths}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  contractProtectionMonths: e.target.value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <FormInput
              label="Vertragsstrafe Maximum (EUR)"
              placeholder="z.B. 2.000"
              value={form.contractPenaltyMaxEur}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  contractPenaltyMaxEur: e.target.value,
                }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Vorschau/PDF matni:{" "}
                  <span className="font-semibold">
                    „{form.contractPenaltyPercent || "50"} % ... jedoch
                    maximal {form.contractPenaltyMaxEur || "2.000"} EUR"
                  </span>
                </span>
              }
            />
          </div>
        </div>
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        ✍️ Unterschrift
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full"></span>
          Unterschriftsdetails
        </h3>
        <FormInput
          label="Ort (Unterschrift)"
          placeholder="z.B. Taschkent"
          value={form.signatureCity}
          onChange={(e) =>
            setForm((p) => ({ ...p, signatureCity: e.target.value }))
          }
        />

        <FormInput
          label="Datum (Unterschrift)"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.signatureDate)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              signatureDate: fromInputDate(e.target.value),
            }))
          }
          helperText={
            <span className="text-xs opacity-70">
              Wird unten als{" "}
              <span className="font-semibold">„Ort / Datum"</span>{" "}
              angezeigt.
            </span>
          }
        />
      </div>
    </>
  );
}
