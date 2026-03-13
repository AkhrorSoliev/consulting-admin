import { FaInfoCircle } from "react-icons/fa";
import FormInput from "../../../../../components/FormInput";
import {
  RadioGroup,
  CheckboxField,
  SectionDivider,
  SectionCard,
} from "../../../../zusatzblatt/FormFields";

/**
 * ZusatzblattC - Section D: Erwerb von deutscher Fahrerlaubnis und/oder Grundqualifikation
 */
export default function SectionsC_Erwerb({ form, setForm }) {
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const chk = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionDivider>
        D. Erwerb von deutscher Fahrerlaubnis und/oder Grundqualifikation oder
        beschleunigter Grundqualifikation
      </SectionDivider>
      <SectionCard>
        <CheckboxField
          label="Die Teilnahme an dem/den Kurs(en) beziehungsweise Prüfungen zum Erwerb der deutschen Fahrerlaubnis und/oder der Grundqualifikation oder beschleunigten Grundqualifikation und/oder bei Besitzstand nach § 4 BKrFQG der Weiterbildung ist erforderlich und geplant."
          checked={form.chbx_erwerb_fahrerlaubnis_1}
          onChange={chk("chbx_erwerb_fahrerlaubnis_1")}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-sm whitespace-normal">
              15 Die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der
              deutschen Fahrerlaubnis ist für folgenden Zeitraum ab
              Beschäftigungsaufnahme geplant:
            </span>
          </label>
          <div className="flex items-center gap-3 mt-2">
            <FormInput label="Wochen" value={form.txtf_15_erwerb_kurs_wochen}
              onChange={set("txtf_15_erwerb_kurs_wochen")} className="w-24" />
            <span className="text-sm">oder Monate</span>
            <FormInput label="Monate" value={form.txtf_15_erwerb_kurs_monat}
              onChange={set("txtf_15_erwerb_kurs_monat")} className="w-24" />
          </div>
        </div>

        <FormInput
          label="16 Wie viele Wochenstunden wird die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis in Anspruch nehmen?"
          value={form.txtf_16_erwerb_kurs_wochenstunden}
          onChange={set("txtf_16_erwerb_kurs_wochenstunden")}
        />

        <FormInput
          label="17 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der deutschen Fahrerlaubnis freigestellt?"
          value={form.txtf_17_erwerb_kurs_freigestellt}
          onChange={set("txtf_17_erwerb_kurs_freigestellt")}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-sm whitespace-normal">
              18 Die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der
              Grundqualifikation oder beschleunigten Grundqualifikation oder bei
              Besitzstand nach § 4 BKrFQG der Weiterbildung ist für folgenden
              Zeitraum ab Beschäftigungsaufnahme geplant:
            </span>
          </label>
          <div className="flex items-center gap-3 mt-2">
            <FormInput label="Wochen" value={form.txtf_18_beschaeftigungsaufnahme_kurs_wochen}
              onChange={set("txtf_18_beschaeftigungsaufnahme_kurs_wochen")} className="w-24" />
            <span className="text-sm">oder Monate</span>
            <FormInput label="Monate" value={form.txtf_18_beschaeftigungsaufnahme_kurs_monat}
              onChange={set("txtf_18_beschaeftigungsaufnahme_kurs_monat")} className="w-24" />
          </div>
        </div>

        <FormInput
          label="19 Wie viele Wochenstunden wird die Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG der Weiterbildung in Anspruch nehmen?"
          value={form.txtf_19_weiterbildung_kurs_wochenstunden}
          onChange={set("txtf_19_weiterbildung_kurs_wochenstunden")}
        />

        <FormInput
          label="20 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Kurs- beziehungsweise Prüfungsteilnahme zum Erwerb der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG der Weiterbildung freigestellt?"
          value={form.txtf_20_weiterbildung_kurs_freigestellt}
          onChange={set("txtf_20_weiterbildung_kurs_freigestellt")}
        />

        <CheckboxField
          label="Für die oben aufgeführte Kurs- beziehungsweise Prüfungsteilnahme ist der Besuch eines Sprachkurses in Deutschland erforderlich und geplant."
          checked={form.chbx_erwerb_fahrerlaubnis_2}
          onChange={chk("chbx_erwerb_fahrerlaubnis_2")}
        />

        <div className="alert alert-info">
          <FaInfoCircle className="text-lg" />
          <div className="text-sm">
            <strong>Hinweis</strong> Die Prüfungsfragen zum Erwerb der
            beschleunigten Grundqualifikation in Deutsch sind an das
            Sprachniveau B1 angelehnt.
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-sm whitespace-normal">
              21 Die Teilnahme am Sprachkurs ist für folgenden Zeitraum ab
              Beschäftigungsaufnahme geplant:
            </span>
          </label>
          <div className="flex items-center gap-3 mt-2">
            <FormInput label="Wochen" value={form.txtf_21_erwerb_sprachkurs_wochen}
              onChange={set("txtf_21_erwerb_sprachkurs_wochen")} className="w-24" />
            <span className="text-sm">oder Monate</span>
            <FormInput label="Monate" value={form.txtf_21_erwerb_sprachkurs_monat}
              onChange={set("txtf_21_erwerb_sprachkurs_monat")} className="w-24" />
          </div>
        </div>

        <FormInput
          label="22 Wie viele Wochenstunden wird die Teilnahme am Sprachkurs in Anspruch nehmen?"
          value={form.txtf_22_erwerb_sprachkurs_wochenstunden}
          onChange={set("txtf_22_erwerb_sprachkurs_wochenstunden")}
        />

        <FormInput
          label="23 Wie viele Wochenstunden wird die Arbeitnehmerin/der Arbeitnehmer zur Teilnahme am Sprachkurs freigestellt?"
          value={form.txtf_23_erwerb_sprachkurs_freigestellt}
          onChange={set("txtf_23_erwerb_sprachkurs_freigestellt")}
        />

        <RadioGroup
          name="modal_rbtn_24_zeitlicher_ablauf"
          label="24 Erfolgt der Beginn der angegebenen Kurs- beziehungsweise Prüfungsteilnahmen zum Erwerb der deutschen Fahrerlaubnis und/oder der Grundqualifikation oder beschleunigten Grundqualifikation oder bei Besitzstand nach § 4 BKrFQG der Weiterbildung und/oder des angestrebten Sprachniveaus parallel oder aufeinanderfolgend?"
          options={[
            { value: "parallel", label: "parallel" },
            {
              value: "aufeinanderfolgend (nach Abschluss eines Kurses beginnt der nächste)",
              label: "aufeinanderfolgend (nach Abschluss eines Kurses beginnt der nächste)",
            },
          ]}
          value={form.rbtn_24_zeitlicher_ablauf}
          onChange={(v) => setForm((p) => ({ ...p, rbtn_24_zeitlicher_ablauf: v }))}
        />

        <CheckboxField
          label="Keine der genannten Konstellationen trifft zu."
          checked={form.chbx_erwerb_fahrerlaubnis_3}
          onChange={chk("chbx_erwerb_fahrerlaubnis_3")}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">25 Begründung</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            value={form.txtf_25_erwerb_begruendung}
            onChange={set("txtf_25_erwerb_begruendung")}
          />
        </div>
      </SectionCard>
    </>
  );
}
