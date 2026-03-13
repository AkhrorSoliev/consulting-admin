import FormInput from "../../../components/FormInput";
import { toInputDate, fromInputDate } from "../utils/dateHelpers";

export default function PersonalDataSection({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        👤 Shaxsiy ma'lumotlar
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Nachname (Familiya)"
          placeholder="Masalan: Sobirova"
          value={form.nachname}
          onChange={(e) =>
            setForm((p) => ({ ...p, nachname: e.target.value }))
          }
        />

        <FormInput
          label="Vorname (Ism)"
          placeholder="Masalan: Sevarakhon"
          value={form.vorname}
          onChange={(e) =>
            setForm((p) => ({ ...p, vorname: e.target.value }))
          }
        />

        <FormInput
          label="Wohnadresse in Deutschland"
          placeholder="Germaniyaga kelgandan so'ng yashash manzili"
          value={form.wohnadresseDeutschland}
          onChange={(e) =>
            setForm((p) => ({ ...p, wohnadresseDeutschland: e.target.value }))
          }
        />

        <FormInput
          label="Wohnadresse in Usbekistan"
          placeholder="O'zbekistondagi yashash manzili"
          value={form.wohnadresseUsbekistan}
          onChange={(e) =>
            setForm((p) => ({ ...p, wohnadresseUsbekistan: e.target.value }))
          }
        />

        <FormInput
          label="Geburtsdatum (Tug'ilgan sana)"
          type="date"
          value={toInputDate(form.geburtsdatum)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              geburtsdatum: fromInputDate(e.target.value),
            }))
          }
        />

        <FormInput
          label="Geburtsort (Tug'ilgan joy)"
          placeholder="Masalan: Tashkent"
          value={form.geburtsort}
          onChange={(e) =>
            setForm((p) => ({ ...p, geburtsort: e.target.value }))
          }
        />

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-medium">Geschlecht (Jins)</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={form.geschlecht}
            onChange={(e) =>
              setForm((p) => ({ ...p, geschlecht: e.target.value }))
            }
          >
            <option value="">Tanlang...</option>
            <option value="männlich">männlich (Erkak)</option>
            <option value="weiblich">weiblich (Ayol)</option>
          </select>
        </div>

        <FormInput
          label="Staatsangehörigkeit (Fuqarolik)"
          placeholder="Masalan: usbekisch"
          value={form.staatsangehoerigkeit}
          onChange={(e) =>
            setForm((p) => ({ ...p, staatsangehoerigkeit: e.target.value }))
          }
        />

        <FormInput
          label="Schuhgröße (Oyoq kiyim razmeri)"
          placeholder="Masalan: 42"
          value={form.schuhgroesse}
          onChange={(e) =>
            setForm((p) => ({ ...p, schuhgroesse: e.target.value }))
          }
        />

        <FormInput
          label="Kleidergröße (Kiyim razmeri)"
          placeholder="Masalan: M"
          value={form.kleidergroesse}
          onChange={(e) =>
            setForm((p) => ({ ...p, kleidergroesse: e.target.value }))
          }
        />
      </div>
    </>
  );
}
