import FormInput from "../../../components/FormInput";
import { fromInputDate, toInputDate } from "../../../utils";

export default function RozilikXatiForm({ form, setForm }) {
  return (
    <div className="card-body space-y-4 grow-0">
      <h2 className="card-title text-2xl font-bold ">
        Rozilik xati to'ldirish
      </h2>
      <p className="text-sm opacity-70">
        Nomzod ma'lumotlarini to'ldiring. Rozilik xati beruvchi shaxs
        ma'lumotlari qo'lda to'ldiriladi.
      </p>

      <div className="divider divider-start font-bold text-base-content/80">
        👤 Nomzod ma'lumotlari
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Shaxsiy ma'lumotlar
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Ismi"
            placeholder="Masalan: Alisher"
            value={form.nomzodIsm}
            onChange={(e) =>
              setForm((p) => ({ ...p, nomzodIsm: e.target.value }))
            }
          />
          <FormInput
            label="Familyasi"
            placeholder="Masalan: Navoiy"
            value={form.nomzodFamilya}
            onChange={(e) =>
              setForm((p) => ({ ...p, nomzodFamilya: e.target.value }))
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <span className="label-text font-medium">Jinsi</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.nomzodJinsi}
              onChange={(e) =>
                setForm((p) => ({ ...p, nomzodJinsi: e.target.value }))
              }
            >
              <option value="">Tanlang...</option>
              <option value="Erkak">Erkak</option>
              <option value="Ayol">Ayol</option>
            </select>
          </div>
          <FormInput
            label="Tug'ilgan sanasi"
            type="date"
            placeholder="YYYY-MM-DD"
            value={toInputDate(form.nomzodTugilganSana)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                nomzodTugilganSana: fromInputDate(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Aloqa ma'lumotlari
        </h3>
        <FormInput
          label="Manzili"
          placeholder="Masalan: Toshkent sh., Chilonzor t."
          value={form.nomzodManzil}
          onChange={(e) =>
            setForm((p) => ({ ...p, nomzodManzil: e.target.value }))
          }
        />
        <FormInput
          label="O'qish joyi"
          placeholder="Masalan: Toshkent Davlat Universiteti"
          value={form.nomzodOqishJoyi}
          onChange={(e) =>
            setForm((p) => ({ ...p, nomzodOqishJoyi: e.target.value }))
          }
        />
        <FormInput
          label="Telefon raqami"
          placeholder="Masalan: +998 90 123 45 67"
          value={form.nomzodTelefon}
          onChange={(e) =>
            setForm((p) => ({ ...p, nomzodTelefon: e.target.value }))
          }
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        📍 Joy va sana
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full"></span>
          Imzo qismi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Joy (Geburtsort)"
            placeholder="Masalan: Toshkent"
            value={form.joy}
            onChange={(e) =>
              setForm((p) => ({ ...p, joy: e.target.value }))
            }
          />
          <FormInput
            label="Sana"
            type="date"
            placeholder="YYYY-MM-DD"
            value={toInputDate(form.sana)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                sana: fromInputDate(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="divider" />
      <div className="text-sm">
        <div className="font-semibold mb-1">Eslatma</div>
        <div className="opacity-70">
          "Nomzodga rozilik xati beruvchi shaxs" qismi bo'sh qoladi va
          qo'lda to'ldiriladi.
        </div>
      </div>
    </div>
  );
}
