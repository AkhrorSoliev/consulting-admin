import FormInput from "../../../components/FormInput";
import { toInputDate, fromInputDate } from "../utils/helpers";

export default function FotoVideoFormSection({ form, setForm }) {
  return (
    <div className="card-body space-y-4 grow-0">
      <h2 className="card-title text-2xl font-bold">
        Foto/Video Rozilik
      </h2>
      <p className="text-sm opacity-70">
        Foto va video tasvirlardan foydalanishga rozilik arizasi.
        Template da kiritilgan qiymatlar butun loyiha bo'ylab default
        sifatida ishlatiladi.
      </p>

      <div className="divider divider-start font-bold text-base-content/80">
        👤 Shaxs ma'lumotlari
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Ism-sharif (Name der Person / Shaxsning ismi-sharifi)"
          placeholder="Masalan: Sobirova Sevarakhon"
          value={form.fullName}
          onChange={(e) =>
            setForm((p) => ({ ...p, fullName: e.target.value }))
          }
        />

        <FormInput
          label="Tug'ilgan sana (Geburtsdatum)"
          type="date"
          placeholder="YYYY-MM-DD"
          value={toInputDate(form.geburtsdatum)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              geburtsdatum: fromInputDate(e.target.value),
            }))
          }
        />

        <FormInput
          label="Manzil (Adresse)"
          placeholder="Masalan: Tashkent, Uzbekistan"
          value={form.adresse}
          onChange={(e) =>
            setForm((p) => ({ ...p, adresse: e.target.value }))
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
          Ort/Joy maydoniga kandidatning Geburtsort qo'yiladi
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

      <div className="divider divider-start font-bold text-base-content/80">
        📧 Aloqa
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="E-Mail (bekor qilish uchun)"
          placeholder="Masalan: orif.ahmadaliyev@hotmail.de"
          value={form.email}
          onChange={(e) =>
            setForm((p) => ({ ...p, email: e.target.value }))
          }
        />
      </div>

      <div className="divider" />
      <div className="text-sm">
        <div className="font-semibold mb-1">Eslatma</div>
        <div className="opacity-70">
          Generate sahifasida kandidat ma'lumotlari (ism-sharif, tug'ilgan sana,
          manzil, tug'ilgan joy) avtomatik olinadi. Sana esa hujjat generate
          bo'lgan vaqt bo'ladi.
        </div>
      </div>
    </div>
  );
}
