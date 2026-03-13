import FormInput from "../../../../../components/FormInput";
import { toInputDate, fromInputDate } from "./dateUtils";

export default function SectionC({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        C. Erklärung und Unterschrift
      </div>
      <p className="text-sm opacity-70">
        Die Richtigkeit der Angaben wird durch Datum und Unterschrift
        bestätigt.
      </p>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="10 Ort"
            value={form.txtf_10_Ort}
            onChange={(e) =>
              setForm((p) => ({ ...p, txtf_10_Ort: e.target.value }))
            }
          />
          <FormInput
            label="11 Datum"
            type="date"
            value={toInputDate(form.txtf_11_Datum)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                txtf_11_Datum: fromInputDate(e.target.value),
              }))
            }
          />
        </div>
      </div>
    </>
  );
}
