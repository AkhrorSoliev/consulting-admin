import FormInput from "../../../components/FormInput";
import { fromInputDate, toInputDate } from "../../../utils";

export default function CandidateInfoSection({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        👤 Auftraggeber / Bewerber
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Persönliche Angaben
        </h3>
        <div className="space-y-4">
          <FormInput
            label="Vorname"
            placeholder="z.B. Mustafa"
            value={form.candidateFirstName}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidateFirstName: e.target.value,
              }))
            }
          />

          <FormInput
            label="Nachname"
            placeholder="z.B. Schmidt"
            value={form.candidateLastName}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidateLastName: e.target.value,
              }))
            }
          />

          <FormInput
            label="Geburtsdatum"
            type="date"
            value={toInputDate(form.candidateBirthDate)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidateBirthDate: fromInputDate(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Adresse
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormInput
              label="Straße"
              placeholder="z.B. Hauptstraße"
              value={form.candidateStreet}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  candidateStreet: e.target.value,
                }))
              }
            />
          </div>
          <FormInput
            label="Hausnummer"
            placeholder="z.B. 123"
            value={form.candidateHouseNumber}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidateHouseNumber: e.target.value,
              }))
            }
          />
          <FormInput
            label="PLZ"
            placeholder="z.B. 12345"
            value={form.candidatePLZ}
            onChange={(e) =>
              setForm((p) => ({ ...p, candidatePLZ: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Weitere Bewerberdaten
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Geburtsort"
            placeholder="z.B. Berlin"
            value={form.candidateBirthPlace}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidateBirthPlace: e.target.value,
              }))
            }
          />
          <FormInput
            label="Staatsangehörigkeit"
            placeholder="z.B. usbekisch"
            value={form.candidateNationality}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidateNationality: e.target.value,
              }))
            }
          />
          <FormInput
            label="Reisepass-Nr."
            placeholder="z.B. AA1234567"
            value={form.candidatePassportNr}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                candidatePassportNr: e.target.value,
              }))
            }
          />
          <FormInput
            label="Land"
            placeholder="z.B. Deutschland"
            value={form.candidateLand}
            onChange={(e) =>
              setForm((p) => ({ ...p, candidateLand: e.target.value }))
            }
          />
        </div>
      </div>
    </>
  );
}
