import FormInput from "../../../components/FormInput";
import { toInputDate, fromInputDate } from "../utils/dateHelpers";

export default function AdditionalSections({ form, setForm }) {
  return (
    <>
      <div className="divider divider-start font-bold text-base-content/80">
        💰 Soliq
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Steueridentifikationsnummer"
          placeholder="Soliq raqami (agar mavjud bo'lsa)"
          value={form.steueridentifikationsnummer}
          onChange={(e) =>
            setForm((p) => ({ ...p, steueridentifikationsnummer: e.target.value }))
          }
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        🏥 Tibbiyot sug'urtasi
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Krankenversicherung"
          placeholder="Tibbiyot sug'urtasi nomi va raqami"
          value={form.krankenversicherung}
          onChange={(e) =>
            setForm((p) => ({ ...p, krankenversicherung: e.target.value }))
          }
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        🏦 Bank ma'lumotlari
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Name der Bank (Bank nomi)"
          placeholder="Masalan: Deutsche Bank"
          value={form.bankName}
          onChange={(e) =>
            setForm((p) => ({ ...p, bankName: e.target.value }))
          }
        />

        <FormInput
          label="IBAN"
          placeholder="IBAN nomeri"
          value={form.iban}
          onChange={(e) =>
            setForm((p) => ({ ...p, iban: e.target.value }))
          }
        />

        <FormInput
          label="BIC"
          placeholder="BIC nomeri"
          value={form.bic}
          onChange={(e) =>
            setForm((p) => ({ ...p, bic: e.target.value }))
          }
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        🛂 Viza ma'lumotlari
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Art des Visums (Viza turi)"
          placeholder="Masalan: Arbeitsvisum"
          value={form.visaArt}
          onChange={(e) =>
            setForm((p) => ({ ...p, visaArt: e.target.value }))
          }
        />

        <FormInput
          label="Nummer des Visums (Viza nomeri)"
          placeholder="Viza nomeri"
          value={form.visaNummer}
          onChange={(e) =>
            setForm((p) => ({ ...p, visaNummer: e.target.value }))
          }
        />

        <FormInput
          label="Gültigkeit des Visums (Amal qilish sanasi)"
          placeholder="Masalan: 01.01.2025 - 01.01.2026"
          value={form.visaGueltigkeit}
          onChange={(e) =>
            setForm((p) => ({ ...p, visaGueltigkeit: e.target.value }))
          }
        />
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        📅 Sana
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <FormInput
          label="Datum (Sana)"
          type="date"
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
          Generate sahifasida kandidat ma'lumotlari (ism, familiya, tug'ilgan sana,
          tug'ilgan joy, jins, manzil) avtomatik olinadi. Sana esa hujjat generate
          bo'lgan vaqt bo'ladi.
        </div>
      </div>
    </>
  );
}
