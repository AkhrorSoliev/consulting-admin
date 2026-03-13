import FormInput from "../../../components/FormInput";
import { toInputDate, fromInputDate } from "../utils/dateHelpers";

export default function SprachsbestaetigungForm({ form, setForm }) {
  return (
    <section className="card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto">
      <div className="card-body space-y-4 grow-0">
        <h2 className="card-title text-2xl font-bold">
          Sprachsbest&auml;tigung (Deutschkenntnisse)
        </h2>
        <p className="text-sm opacity-70">
          Best&auml;tigung der Deutschkenntnisse nach Online-Vorstellungsgespr&auml;ch.
          Template da kiritilgan qiymatlar butun loyiha bo&apos;ylab default
          sifatida ishlatiladi.
        </p>

        <div className="divider divider-start font-bold text-base-content/80">
          🏢 Firma ma&apos;lumotlari
        </div>

        <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
          <FormInput
            label="Firma nomi"
            placeholder="Masalan: Erlebnispark Tripsdrill GmbH & Co.KG"
            value={form.firmaName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firmaName: e.target.value }))
            }
          />

          <FormInput
            label="Bo'lim (Abteilung)"
            placeholder="Masalan: Human Resources"
            value={form.abteilung}
            onChange={(e) =>
              setForm((p) => ({ ...p, abteilung: e.target.value }))
            }
          />

          <FormInput
            label="Kontakt shaxs"
            placeholder="Masalan: Nupel Kara"
            value={form.kontaktPerson}
            onChange={(e) =>
              setForm((p) => ({ ...p, kontaktPerson: e.target.value }))
            }
          />
        </div>

        <div className="divider divider-start font-bold text-base-content/80">
          📍 Manzil
        </div>

        <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
          <FormInput
            label="Ko'cha (Straße)"
            placeholder="Masalan: Erlebnispark-Tripsdrill-Straße 1"
            value={form.strasse}
            onChange={(e) =>
              setForm((p) => ({ ...p, strasse: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="PLZ"
              placeholder="74389"
              value={form.plz}
              onChange={(e) =>
                setForm((p) => ({ ...p, plz: e.target.value }))
              }
            />
            <FormInput
              label="Shahar (Ort)"
              placeholder="Cleebronn"
              value={form.ort}
              onChange={(e) =>
                setForm((p) => ({ ...p, ort: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="divider divider-start font-bold text-base-content/80">
          📞 Aloqa
        </div>

        <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
          <FormInput
            label="Telefon (ixtiyoriy)"
            placeholder="+49 7135 999 307"
            value={form.telefon}
            onChange={(e) =>
              setForm((p) => ({ ...p, telefon: e.target.value }))
            }
          />

          <FormInput
            label="E-Mail (ixtiyoriy)"
            placeholder="nupel.kara@tripsdrill.de"
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
          />
        </div>

        <div className="divider divider-start font-bold text-base-content/80">
          👤 Kandidat ma&apos;lumotlari
        </div>

        <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
          <FormInput
            label="Kandidat ism-familyasi"
            placeholder="Masalan: Kurvonaliev Mansurbek"
            value={form.kandidatName}
            onChange={(e) =>
              setForm((p) => ({ ...p, kandidatName: e.target.value }))
            }
          />
          <p className="text-xs text-base-content/60">
            Generate sahifasida kandidat ism-familyasi avtomatik qo&apos;yiladi
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
            Generate sahifasida joriy sana avtomatik qo&apos;yiladi
          </p>
        </div>

        <div className="divider divider-start font-bold text-base-content/80">
          📝 Hujjat mazmuni
        </div>

        <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
          <FormInput
            label="Praktikum turi"
            placeholder="Masalan: Weiterbildungspraktikum"
            value={form.praktikumsart}
            onChange={(e) =>
              setForm((p) => ({ ...p, praktikumsart: e.target.value }))
            }
          />
        </div>

        <div className="divider" />
        <div className="text-sm">
          <div className="font-semibold mb-1">Eslatma</div>
          <div className="opacity-70">
            Template da saqlangan qiymatlar (firma nomi, manzil, praktikum
            turi) Generate sahifasida default sifatida ishlatiladi. Kandidat
            ism-familyasi va sana esa avtomatik olinadi.
          </div>
        </div>
      </div>
    </section>
  );
}
