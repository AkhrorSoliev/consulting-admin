import { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import FormInput from "../../../../components/FormInput";
import { getFillablePdfDefaults } from "../../../../utils/fillablePdfDefaults";

const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || "https://unsincerely-monarchal-alva.ngrok-free.dev";

function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function toInputDate(ddMmYyyy) {
  if (!ddMmYyyy) return "";
  const parts = String(ddMmYyyy).split(".");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

function fromInputDate(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const parts = String(yyyyMmDd).split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${dd}.${mm}.${yyyy}`;
}

export default function ZusatzblattBModal({ open, onClose, candidateData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitialForm = () => ({
    // Section 1 - Art der Beschäftigung
    chbx_1_ICT: false,
    chbx_1_Personalaustausch: false,
    chbx_1_Beschaeftigung: false,

    // Section A - Entsendendes Unternehmen
    txtf_2_Firma: "",
    txtf_3_Vorname: "",
    txtf_4_Nachname: "",
    txtf_5_Strasse: "",
    txtf_6_Hausnummer: "",
    txtf_7_PLZ: "",
    txtf_8_Ort: "",
    txtf_9_Land: "",
    rbtn_10_Sitz_des_Unternehmens: "",

    // Section B - Unternehmensverbund
    chbx_11_Unternehmen: false,
    chbx_11_Unternehmensgruppe: false,
    chbx_11_Konzern: false,
    rbtn_12_Kapital: "",
    rbtn_13_Stimmrechte: "",
    rbtn_14_Mitglieder: "",
    rbtn_15_Mutterunternehmen: "",
    txtf_16_seit: "",

    // Section C - Angaben zur Person
    txtf_17_Vorname: candidateData?.personalInfo?.name || "",
    txtf_18_Nachname: candidateData?.personalInfo?.lastName || "",
    txtf_19_Strasse: "",
    rbtn_20_Entsendung: "",
    rbtn_21_Arbeitsverhaeltnis: "",
    rbtn_22_Beendigung: "",

    // Section D - Beschäftigungszeitraum
    chbx_23_Beschaeftigung: false,
    chbx_23_Verlaengerung: false,
    txtf_23_Neueinreise_ab: "",
    txtf_23_Neueinreise_bis: "",
    txtf_23_Verlaengerung_ab: "",
    txtf_23_Verlaengerung_bis: "",

    // Section E - Personalaustausch
    rbtn_24_Arbeitnehmer_de: "",
    txtf_25_letztes_Kalenderjahr: "",
    txtf_25_vorletztes_Kalenderjahr: "",

    // Section F - Arbeitsentgelt
    txtf_26_Grundgehalt: "",
    txtf_27_Tabelle_Z2_S1: "",
    txtf_27_Tabelle_Z2_S2: "",
    txtf_27_Tabelle_Z3_S1: "",
    txtf_27_Tabelle_Z3_S2: "",
    txtf_27_Tabelle_Z4_S1: "",
    txtf_27_Tabelle_Z4_S2: "",
    txtf_27_Tabelle_Z5_S1: "",
    txtf_27_Tabelle_Z5_S2: "",
    txtf_27_Tabelle_Z6_S1: "",
    txtf_27_Tabelle_Z6_S2: "",
    txtf_28_Tabelle_Z2_S1: "",
    txtf_28_Tabelle_Z2_S2: "",
    txtf_28_Tabelle_Z3_S1: "",
    txtf_28_Tabelle_Z3_S2: "",
    txtf_29_Arbeitsentgelt: "",

    // Section F - Ergänzungen
    txtf_30_Ergaenzug: "",

    // Section G - Unterschrift
    txtf_31_Ort: "",
    txtf_32_Datum: todayDdMmYyyy(),
  });

  const [form, setForm] = useState(getInitialForm);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (open) {
      const baseForm = getInitialForm();
      setForm(baseForm);
      setLoadingDefaults(true);
      getFillablePdfDefaults("zusatzblatt_b")
        .then((defaults) => {
          if (defaults && typeof defaults === "object") {
            setForm((prev) => {
              const merged = { ...prev };
              Object.keys(defaults).forEach((key) => {
                if (key in merged && key !== "updatedAt" && !prev[key]) {
                  merged[key] = defaults[key];
                }
              });
              return merged;
            });
          }
        })
        .catch((err) => console.error("Failed to load defaults:", err))
        .finally(() => setLoadingDefaults(false));
    }
  }, [open, candidateData]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);

      const payload = {
        template: "zusatzblatt_b_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
        data: {
          textFields: {},
          radioGroups: {},
          checkboxes: {},
        },
      };

      Object.entries(form).forEach(([key, value]) => {
        if (key.startsWith("txtf_")) {
          payload.data.textFields[key] = value;
        } else if (key.startsWith("rbtn_") && value) {
          payload.data.radioGroups[key] = value;
        } else if (key.startsWith("chbx_")) {
          payload.data.checkboxes[key] = value;
        }
      });

      const response = await fetch(`${PDF_BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Zusatzblatt_B_${form.txtf_18_Nachname || "Dokument"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error(e.message || "Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 flex flex-col max-h-[90vh]">
          <div className="p-4 sm:p-6 border-b border-base-300 flex items-start justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-lg font-bold">Zusatzblatt B - ICT / Personalaustausch</h3>
              <p className="text-sm opacity-70">
                Kandidat ma'lumotlari bilan to'ldirilgan forma
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                <FaDownload />
                {isDownloading ? "Wird erstellt..." : "PDF"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
            {/* Section 1 - Art der Beschäftigung (vor A) */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">1 Bei der Beschäftigung im Formular „Erklärung zum Beschäftigungsverhältnis" handelt es sich um eine Beschäftigung</span>
                </label>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_1_ICT}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_1_ICT: e.target.checked }))}
                    />
                    <span className="label-text whitespace-normal">für einen Intra Corporate Transferee (ICT) (nur Führungskräfte, Spezialisten und Trainees)</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_1_Personalaustausch}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_1_Personalaustausch: e.target.checked }))}
                    />
                    <span className="label-text">im Rahmen eines internationalen Personalaustauschs</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_1_Beschaeftigung}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_1_Beschaeftigung: e.target.checked }))}
                    />
                    <span className="label-text">sonstige vorübergehende Beschäftigung/Transfers/Entsendung</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section A - Entsendendes Unternehmen im Ausland */}
            <div className="divider divider-start font-bold text-base-content/80 whitespace-normal">
              A. Entsendendes und/oder abordnendes Unternehmen/entsendender und/oder abordnender Unternehmensteil im Ausland
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="2 Firma"
                value={form.txtf_2_Firma}
                onChange={(e) => setForm((p) => ({ ...p, txtf_2_Firma: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="3 Vorname Kontaktperson"
                  value={form.txtf_3_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_3_Vorname: e.target.value }))}
                />
                <FormInput
                  label="4 Nachname Kontaktperson"
                  value={form.txtf_4_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_4_Nachname: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="5 Straße"
                  value={form.txtf_5_Strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_5_Strasse: e.target.value }))}
                />
                <FormInput
                  label="6 Hausnummer"
                  value={form.txtf_6_Hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_6_Hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormInput
                  label="7 Postleitzahl"
                  value={form.txtf_7_PLZ}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_7_PLZ: e.target.value }))}
                />
                <FormInput
                  label="8 Ort"
                  value={form.txtf_8_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_8_Ort: e.target.value }))}
                />
                <FormInput
                  label="9 Land"
                  value={form.txtf_9_Land}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_9_Land: e.target.value }))}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">10 Das Unternehmen oder der Unternehmensteil hat seinen Sitz:</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: "ausserhalb der Europaeischen Union", label: "außerhalb der Europäischen Union" },
                    { value: "innerhalb der Europaeischen Union", label: "innerhalb der Europäischen Union" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_10_Sitz_des_Unternehmens"
                        className="radio radio-primary"
                        checked={form.rbtn_10_Sitz_des_Unternehmens === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_10_Sitz_des_Unternehmens: opt.value }))}
                      />
                      <span className="label-text whitespace-normal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section B - Unternehmensgruppe */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Unternehmensgruppe, international tätiges Unternehmen
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">11 Das Unternehmen/Der Unternehmensteil in Deutschland und das Unternehmen/der Unternehmensteil im Ausland gehören:</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_11_Unternehmen}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_11_Unternehmen: e.target.checked }))}
                    />
                    <span className="label-text whitespace-normal">zum gleichen Unternehmen</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_11_Unternehmensgruppe}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_11_Unternehmensgruppe: e.target.checked }))}
                    />
                    <span className="label-text whitespace-normal">zur gleichen Unternehmensgruppe</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_11_Konzern}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_11_Konzern: e.target.checked }))}
                    />
                    <span className="label-text whitespace-normal">zum gleichen Konzern</span>
                  </label>
                </div>
              </div>

              {["12_Kapital", "13_Stimmrechte", "14_Mitglieder", "15_Mutterunternehmen"].map((field) => (
                <div key={field} className="form-control">
                  <label className="label">
                    <span className="label-text whitespace-normal font-medium">
                      {field === "12_Kapital" && "12 Ein Unternehmen besitzt die Mehrheit des Kapitals (mehr als 50 %) des anderen Unternehmens beziehungsweise der anderen Unternehmen:"}
                      {field === "13_Stimmrechte" && "13 Ein Unternehmen besitzt die Mehrheit der Stimmrechte (mehr als 50 %) des anderen Unternehmens beziehungsweise der anderen Unternehmen:"}
                      {field === "14_Mitglieder" && "14 Ein Unternehmen darf die Mehrheit der Mitglieder des Verwaltungs-, Leitungs- oder Aufsichtsorgans (mehr als 50 %) stellen:"}
                      {field === "15_Mutterunternehmen" && "15 Die Unternehmen beziehungsweise die Unternehmensteile stehen unter der Leitung desselben Mutterunternehmens:"}
                    </span>
                  </label>
                  <div className="flex gap-4">
                    {["ja", "nein"].map((opt) => (
                      <label key={opt} className="label cursor-pointer gap-2">
                        <input
                          type="radio"
                          name={`modal_rbtn_${field}`}
                          className="radio radio-primary"
                          checked={form[`rbtn_${field}`] === opt}
                          onChange={() => setForm((p) => ({ ...p, [`rbtn_${field}`]: opt }))}
                        />
                        <span className="label-text whitespace-normal">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Section C - Angaben zur ausländischen Arbeitnehmerin/zum ausländischen Arbeitnehmer */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zur ausländischen Arbeitnehmerin/zum ausländischen Arbeitnehmer
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">16 Die ausländische Arbeitnehmerin/Der ausländische Arbeitnehmer ist in dem unter A bezeichneten Unternehmen/Unternehmensteil beschäftigt</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="label-text">seit (TT.MM.JJJJ)</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={toInputDate(form.txtf_16_seit)}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_16_seit: fromInputDate(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="17 Vorname"
                  value={form.txtf_17_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_Vorname: e.target.value }))}
                />
                <FormInput
                  label="18 Nachname"
                  value={form.txtf_18_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_18_Nachname: e.target.value }))}
                />
              </div>
              <FormInput
                label="19 derzeitiger Wohnort/Aufenthaltsort"
                value={form.txtf_19_Strasse}
                onChange={(e) => setForm((p) => ({ ...p, txtf_19_Strasse: e.target.value }))}
              />

              {["20_Entsendung", "21_Arbeitsverhaeltnis", "22_Beendigung"].map((field) => (
                <div key={field} className="form-control">
                  <label className="label">
                    <span className="label-text whitespace-normal font-medium">
                      {field === "20_Entsendung" && "20 Die Möglichkeit und die Bedingungen für eine Entsendung/einen Transfer/Personalaustausch sind im Arbeitsvertrag, einer Entsendungsvereinbarung oder einem Abordnungsschreiben geregelt (bitte Nachweis beifügen):"}
                      {field === "21_Arbeitsverhaeltnis" && "21 Das Arbeitsverhältnis mit dem ausländischen Unternehmen/Unternehmensteil besteht für die Dauer der Entsendung/des Transfers/des Personalaustauschs fort:"}
                      {field === "22_Beendigung" && "22 Nach Beendigung der Entsendung/des Transfers/des Personalaustauschs kann die ausländische Arbeitnehmerin/der ausländische Arbeitnehmer in eine Niederlassung des Unternehmens beziehungsweise der Unternehmensgruppe mit Sitz im außereuropäischen Ausland zurückkehren:"}
                    </span>
                  </label>
                  <div className="flex gap-4">
                    {["ja", "nein"].map((opt) => (
                      <label key={opt} className="label cursor-pointer gap-2">
                        <input
                          type="radio"
                          name={`modal_rbtn_${field}`}
                          className="radio radio-primary"
                          checked={form[`rbtn_${field}`] === opt}
                          onChange={() => setForm((p) => ({ ...p, [`rbtn_${field}`]: opt }))}
                        />
                        <span className="label-text whitespace-normal">{opt === "ja" ? "Ja" : "Nein"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Section D - Angaben zur Dauer der Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Angaben zur Dauer der Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">23 Dauer der Beschäftigung in Deutschland:</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form.chbx_23_Beschaeftigung}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_23_Beschaeftigung: e.target.checked }))}
                  />
                  <span className="label-text whitespace-normal">Neueinreise</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="label-text whitespace-nowrap">ab (TT.MM.JJJJ)</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={toInputDate(form.txtf_23_Neueinreise_ab)}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_23_Neueinreise_ab: fromInputDate(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="label-text whitespace-nowrap">bis voraussichtlich (TT.MM.JJJJ)</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={toInputDate(form.txtf_23_Neueinreise_bis)}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_23_Neueinreise_bis: fromInputDate(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form.chbx_23_Verlaengerung}
                    onChange={(e) => setForm((p) => ({ ...p, chbx_23_Verlaengerung: e.target.checked }))}
                  />
                  <span className="label-text whitespace-normal">Verlängerung</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="label-text whitespace-nowrap">ab (TT.MM.JJJJ)</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={toInputDate(form.txtf_23_Verlaengerung_ab)}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_23_Verlaengerung_ab: fromInputDate(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="label-text whitespace-nowrap">bis voraussichtlich (TT.MM.JJJJ)</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={toInputDate(form.txtf_23_Verlaengerung_bis)}
                    onChange={(e) => setForm((p) => ({ ...p, txtf_23_Verlaengerung_bis: fromInputDate(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Section E - Personalaustausch */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Personalaustausch
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">24 Es werden auch Arbeitnehmerinnen und/oder Arbeitnehmer des deutschen Unternehmens/Unternehmensteils im ausländischen Unternehmen/in ausländischen Unternehmensteilen eingesetzt:</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="modal_rbtn_24_Arbeitnehmer_de"
                        className="radio radio-primary"
                        checked={form.rbtn_24_Arbeitnehmer_de === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_24_Arbeitnehmer_de: opt }))}
                      />
                      <span className="label-text whitespace-normal">{opt === "ja" ? "Ja" : "Nein"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">25 Wie viele Arbeitnehmerinnen und/oder Arbeitnehmer des deutschen Unternehmens/Unternehmensteils wurden (für mindestens 3 zusammenhängende Monate) in eines der ausländischen Unternehmen/Unternehmensteile entsendet?</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Letztes Kalenderjahr"
                  value={form.txtf_25_letztes_Kalenderjahr}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_25_letztes_Kalenderjahr: e.target.value }))}
                />
                <FormInput
                  label="Vorletztes Kalenderjahr"
                  value={form.txtf_25_vorletztes_Kalenderjahr}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_25_vorletztes_Kalenderjahr: e.target.value }))}
                />
              </div>
            </div>

            {/* Section F - Arbeitsentgelt */}
            <div className="divider divider-start font-bold text-base-content/80">
              F. Arbeitsentgelt
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="alert alert-info">
                <span className="label-text whitespace-normal"><strong>Hinweis</strong> Bitte Bruttobeträge angeben und Nachweis vorlegen, zum Beispiel Abordnungsschreiben.</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="label-text whitespace-normal font-medium">26 Grundgehalt</span>
                <input
                  type="text"
                  className="input input-bordered input-sm w-40"
                  value={form.txtf_26_Grundgehalt}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_26_Grundgehalt: e.target.value }))}
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
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        placeholder="Zweckbestimmung"
                        value={form[`txtf_27_Tabelle_Z${row}_S1`]}
                        onChange={(e) => setForm((p) => ({ ...p, [`txtf_27_Tabelle_Z${row}_S1`]: e.target.value }))}
                      />
                      <input
                        type="text"
                        className="input input-bordered input-sm w-32"
                        placeholder="Betrag"
                        value={form[`txtf_27_Tabelle_Z${row}_S2`]}
                        onChange={(e) => setForm((p) => ({ ...p, [`txtf_27_Tabelle_Z${row}_S2`]: e.target.value }))}
                      />
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
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        placeholder="Zweckbestimmung"
                        value={form[`txtf_28_Tabelle_Z${row}_S1`]}
                        onChange={(e) => setForm((p) => ({ ...p, [`txtf_28_Tabelle_Z${row}_S1`]: e.target.value }))}
                      />
                      <input
                        type="text"
                        className="input input-bordered input-sm w-32"
                        placeholder="Betrag"
                        value={form[`txtf_28_Tabelle_Z${row}_S2`]}
                        onChange={(e) => setForm((p) => ({ ...p, [`txtf_28_Tabelle_Z${row}_S2`]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">29 Das Arbeitsentgelt setzt sich anderweitig zusammen (bitte erläutern)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-20"
                  value={form.txtf_29_Arbeitsentgelt}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_29_Arbeitsentgelt: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text whitespace-normal font-medium">30 Feld für ergänzende Angaben</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-20"
                  value={form.txtf_30_Ergaenzug}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_30_Ergaenzug: e.target.value }))}
                />
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
            </div>

            {/* Section G - Erklärung */}
            <div className="divider divider-start font-bold text-base-content/80">
              G. Erklärung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="31. Ort"
                  value={form.txtf_31_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_31_Ort: e.target.value }))}
                />
                <FormInput
                  label="32. Datum"
                  type="date"
                  value={toInputDate(form.txtf_32_Datum)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_32_Datum: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
