import FormInput from "../../../components/FormInput";
import { UZBEK_MONTHS, toInputDate, fromInputDate } from "../utils/constants";

export default function NomzodRozilikXatiForm({ form, setForm }) {
  return (
    <div className="card-body space-y-4 grow-0">
      <h2 className="card-title text-2xl font-bold">Nomzod rozilik xati</h2>
      <p className="text-sm opacity-70">
        Nomzodning o'zi yozadigan rozilik xati. Template da kiritilgan
        qiymatlar butun loyiha bo'ylab default sifatida ishlatiladi.
      </p>

      <div className="divider divider-start font-bold text-base-content/80">
        📅 Sana
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Hujjat sanasi"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.sana)}
          onChange={(e) => setForm((p) => ({ ...p, sana: fromInputDate(e.target.value) }))}
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        👤 Nomzod ma'lumotlari
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Nomzod ism-familyasi"
          placeholder="Masalan: Alisher Navoiy"
          value={form.nomzodIsmFamilya}
          onChange={(e) => setForm((p) => ({ ...p, nomzodIsmFamilya: e.target.value }))}
        />
        <p className="text-xs text-base-content/60">
          Generate sahifasida kandidat ism-familyasi avtomatik qo'yiladi
        </p>
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        🏢 Ish beruvchi ma'lumotlari
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Ish beruvchi nomi (default)"
          placeholder="Masalan: ABC GmbH"
          value={form.ishBeruvchiNomi}
          onChange={(e) => setForm((p) => ({ ...p, ishBeruvchiNomi: e.target.value }))}
        />
        <p className="text-xs text-base-content/60">
          Bu qiymat butun loyiha bo'ylab default sifatida ishlatiladi
        </p>
        <FormInput
          label="Kasb yo'nalishi (default)"
          placeholder="Masalan: Fachkraft für Lagerlogistik"
          value={form.kasb}
          onChange={(e) => setForm((p) => ({ ...p, kasb: e.target.value }))}
        />
        <p className="text-xs text-base-content/60">
          Bu qiymat butun loyiha bo'ylab default sifatida ishlatiladi
        </p>
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        📆 Dastur boshlanish sanasi
      </div>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Dastur boshlanish sanasi"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.dasturSana)}
          onChange={(e) => setForm((p) => ({ ...p, dasturSana: fromInputDate(e.target.value) }))}
        />
        <div>
          <label className="label">
            <span className="label-text font-medium">Oy nomi (o'zbek tilida)</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={form.oyNomi}
            onChange={(e) => setForm((p) => ({ ...p, oyNomi: e.target.value }))}
          >
            <option value="">Tanlang...</option>
            {UZBEK_MONTHS.map((m) => (
              <option key={m.value} value={m.label}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="divider" />
      <div className="text-sm">
        <div className="font-semibold mb-1">Eslatma</div>
        <div className="opacity-70">
          Template da saqlangan qiymatlar (ish beruvchi nomi, kasb, sana,
          oy) Generate sahifasida default sifatida ishlatiladi. Nomzod
          ism-familyasi esa kandidat ma'lumotlaridan avtomatik olinadi.
        </div>
      </div>
    </div>
  );
}
