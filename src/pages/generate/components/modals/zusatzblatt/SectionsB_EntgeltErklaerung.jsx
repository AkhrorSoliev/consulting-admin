import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";
import { toInputDate, fromInputDate } from "./modalUtils";

/**
 * ZusatzblattB - Section E (Personalaustausch) + Section F (Arbeitsentgelt) + Section G (Erklärung)
 */
export default function SectionsB_EntgeltErklaerung({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      {/* Section E */}
      <SectionDivider>E. Personalaustausch</SectionDivider>
      <SectionCard>
        <RadioGroup
          name="modal_rbtn_24_Arbeitnehmer_de"
          label="24 Es werden auch Arbeitnehmerinnen und/oder Arbeitnehmer des deutschen Unternehmens/Unternehmensteils im ausländischen Unternehmen/in ausländischen Unternehmensteilen eingesetzt:"
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={form.rbtn_24_Arbeitnehmer_de}
          onChange={(v) => setForm((p) => ({ ...p, rbtn_24_Arbeitnehmer_de: v }))}
        />
        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">
              25 Wie viele Arbeitnehmerinnen und/oder Arbeitnehmer des deutschen
              Unternehmens/Unternehmensteils wurden (für mindestens 3
              zusammenhängende Monate) in eines der ausländischen
              Unternehmen/Unternehmensteile entsendet?
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="Letztes Kalenderjahr"
            value={form.txtf_25_letztes_Kalenderjahr}
            onChange={set("txtf_25_letztes_Kalenderjahr")}
          />
          <FormInput
            label="Vorletztes Kalenderjahr"
            value={form.txtf_25_vorletztes_Kalenderjahr}
            onChange={set("txtf_25_vorletztes_Kalenderjahr")}
          />
        </div>
      </SectionCard>

      {/* Section F */}
      <SectionDivider>F. Arbeitsentgelt</SectionDivider>
      <SectionCard>
        <div className="alert alert-info">
          <span className="label-text whitespace-normal">
            <strong>Hinweis</strong> Bitte Bruttobeträge angeben und Nachweis
            vorlegen, zum Beispiel Abordnungsschreiben.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="label-text whitespace-normal font-medium">26 Grundgehalt</span>
          <input
            type="text"
            className="input input-bordered input-sm w-40"
            value={form.txtf_26_Grundgehalt}
            onChange={set("txtf_26_Grundgehalt")}
          />
          <span className="label-text whitespace-normal">Euro pro Monat</span>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">27 Zulagen (bitte Zweckbestimmung angeben)</span>
            <span className="label-text whitespace-normal">Euro pro Monat</span>
          </label>
          <div className="space-y-2">
            {[2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex items-center gap-2">
                <input type="text" className="input input-bordered input-sm flex-1" placeholder="Zweckbestimmung"
                  value={form[`txtf_27_Tabelle_Z${row}_S1`]} onChange={(e) => setForm((p) => ({ ...p, [`txtf_27_Tabelle_Z${row}_S1`]: e.target.value }))} />
                <input type="text" className="input input-bordered input-sm w-32" placeholder="Betrag"
                  value={form[`txtf_27_Tabelle_Z${row}_S2`]} onChange={(e) => setForm((p) => ({ ...p, [`txtf_27_Tabelle_Z${row}_S2`]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">28 Sonstige Bestandteile</span>
            <span className="label-text whitespace-normal">Euro pro Monat</span>
          </label>
          <div className="space-y-2">
            {[2, 3].map((row) => (
              <div key={row} className="flex items-center gap-2">
                <input type="text" className="input input-bordered input-sm flex-1" placeholder="Zweckbestimmung"
                  value={form[`txtf_28_Tabelle_Z${row}_S1`]} onChange={(e) => setForm((p) => ({ ...p, [`txtf_28_Tabelle_Z${row}_S1`]: e.target.value }))} />
                <input type="text" className="input input-bordered input-sm w-32" placeholder="Betrag"
                  value={form[`txtf_28_Tabelle_Z${row}_S2`]} onChange={(e) => setForm((p) => ({ ...p, [`txtf_28_Tabelle_Z${row}_S2`]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">29 Das Arbeitsentgelt setzt sich anderweitig zusammen (bitte erläutern)</span>
          </label>
          <textarea className="textarea textarea-bordered w-full h-20"
            value={form.txtf_29_Arbeitsentgelt} onChange={set("txtf_29_Arbeitsentgelt")} />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text whitespace-normal font-medium">30 Feld für ergänzende Angaben</span>
          </label>
          <textarea className="textarea textarea-bordered w-full h-20"
            value={form.txtf_30_Ergaenzug} onChange={set("txtf_30_Ergaenzug")} />
        </div>

        <div className="text-sm opacity-80 space-y-3 mt-4">
          <p className="whitespace-normal">Bitte hier insbesondere die vollständige Postanschrift angeben, an die gegebenenfalls eine im Wege des Vorabprüfungsverfahrens getroffene Entscheidung versandt werden soll.</p>
          <div>
            <p className="font-medium whitespace-normal">Mobiler-ICT-Karte:</p>
            <p className="whitespace-normal">Wenn die ausländische Arbeitnehmerin/der ausländische Arbeitnehmer im Besitz der ICT-Karte eines anderen Mitgliedstaates der EU ist und für mehr als 90 Tage nach Deutschland weiterentsandt werden soll, bitte Kopie der ICT-Karte des anderen EU-Staates vorlegen.</p>
          </div>
          <div>
            <p className="font-medium whitespace-normal">Bei Verlängerungen:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className="whitespace-normal">Zusätzlich zu den Lohn-/Gehaltsabrechnungen der ersten zwei und der letzten zwei Beschäftigungsmonate in Kopie gegebenenfalls auch Nachweise über geleistete Lohn-/Gehaltszahlungen, die aus Lohn-/Gehaltsabrechnungen nicht ersichtlich sind (zum Beispiel durch Kopie der Überweisung).</li>
              <li className="whitespace-normal">Kopie des aktuellen Aufenthaltstitels gegebenenfalls mit Zusatzblatt.</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Section G */}
      <SectionDivider>G. Erklärung</SectionDivider>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="31. Ort" value={form.txtf_31_Ort} onChange={set("txtf_31_Ort")} />
          <FormInput label="32. Datum" type="date"
            value={toInputDate(form.txtf_32_Datum)}
            onChange={(e) => setForm((p) => ({ ...p, txtf_32_Datum: fromInputDate(e.target.value) }))} />
        </div>
      </SectionCard>
    </>
  );
}
