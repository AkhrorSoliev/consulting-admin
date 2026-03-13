import FormInput from "../../../components/FormInput";
import { toInputDate, fromInputDate } from "../utils/dateHelpers";

export default function EinwilligungForm({ form, setForm }) {
  return (
    <div className="card-body space-y-4 grow-0">
      <h2 className="card-title text-2xl font-bold">
        Einwilligungserklärung DSGVO
      </h2>
      <p className="text-sm opacity-70">
        Einwilligungserklärung gemäß DSGVO in die Verarbeitung von Daten.
        Template da kiritilgan qiymatlar butun loyiha bo'ylab default
        sifatida ishlatiladi.
      </p>

      <div className="divider divider-start font-bold text-base-content/80">
        {"\uD83C\uDFE2"} Firma ma'lumotlari
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Verantwortlicher (Ma'sul shaxs)"
          placeholder="Masalan: Orif Akhmadaliev"
          value={form.verantwortlicher}
          onChange={(e) =>
            setForm((p) => ({ ...p, verantwortlicher: e.target.value }))
          }
        />

        <FormInput
          label="Firma nomi"
          placeholder="Masalan: ConsultingUZ"
          value={form.firmaName}
          onChange={(e) =>
            setForm((p) => ({ ...p, firmaName: e.target.value }))
          }
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        {"\uD83D\uDC64"} Kandidat ma'lumotlari
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-medium">Anpirede (Herr/Frau)</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={form.anpirede}
            onChange={(e) =>
              setForm((p) => ({ ...p, anpirede: e.target.value }))
            }
          >
            <option value="Frau">Frau</option>
            <option value="Herr">Herr</option>
          </select>
        </div>

        <FormInput
          label="Familiya (Nachname)"
          placeholder="Masalan: Sobirova"
          value={form.nachname}
          onChange={(e) =>
            setForm((p) => ({ ...p, nachname: e.target.value }))
          }
        />

        <FormInput
          label="Ism (Vorname)"
          placeholder="Masalan: Sevarakhon"
          value={form.vorname}
          onChange={(e) =>
            setForm((p) => ({ ...p, vorname: e.target.value }))
          }
        />

        <FormInput
          label="Tug'ilgan joy (Geburtsort)"
          placeholder="Masalan: Tashkent"
          value={form.geburtsort}
          onChange={(e) =>
            setForm((p) => ({ ...p, geburtsort: e.target.value }))
          }
        />
        <p className="text-xs text-base-content/60">
          Ort maydoniga kandidatning Geburtsort qo'yiladi
        </p>

        <FormInput
          label="Sana (Datum)"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.datum)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              datum: fromInputDate(e.target.value),
            }))
          }
        />
        <p className="text-xs text-base-content/60">
          Generate sahifasida joriy sana avtomatik qo'yiladi
        </p>
      </div>

      <div className="divider" />
      <div className="text-sm">
        <div className="font-semibold mb-1">Eslatma</div>
        <div className="opacity-70">
          Generate sahifasida kandidat ma'lumotlari (ism, familiya, jins,
          tug'ilgan joy) avtomatik olinadi. Sana esa hujjat generate
          bo'lgan vaqt bo'ladi.
        </div>
      </div>
    </div>
  );
}
