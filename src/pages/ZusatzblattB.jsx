import { useState } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";

const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || "http://localhost:3001";

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

export default function ZusatzblattB() {
  const [isDownloading, setIsDownloading] = useState(false);

  const [form, setForm] = useState({
    // Section A - Art der Beschäftigung
    chbx_1_ICT: false,
    chbx_1_Personalaustausch: false,
    chbx_1_Beschaeftigung: false,

    // Section B - Aufnehmendes Unternehmen
    txtf_2_Firma: "",
    txtf_3_Vorname: "",
    txtf_4_Nachname: "",
    txtf_5_Strasse: "",
    txtf_6_Hausnummer: "",
    txtf_7_PLZ: "",
    txtf_8_Ort: "",
    txtf_9_Land: "",
    rbtn_10_Sitz_des_Unternehmens: "",

    // Section C - Unternehmensverbund
    chbx_11_Unternehmen: false,
    chbx_11_Unternehmensgruppe: false,
    chbx_11_Konzern: false,
    rbtn_12_Kapital: "",
    rbtn_13_Stimmrechte: "",
    rbtn_14_Mitglieder: "",
    rbtn_15_Mutterunternehmen: "",
    txtf_16_seit: "",

    // Section D - Entsendende Person
    txtf_17_Vorname: "",
    txtf_18_Nachname: "",
    txtf_19_Strasse: "",
    rbtn_20_Entsendung: "",
    rbtn_21_Arbeitsverhaeltnis: "",
    rbtn_22_Beendigung: "",

    // Section E - Beschäftigungszeitraum
    chbx_23_Beschaeftigung: false,
    txtf_23_Neueinreise_ab: "",
    txtf_23_Neueinreise_bis: "",
    txtf_23_Verlaengerung_ab: "",
    txtf_23_Verlaengerung_bis: "",
    rbtn_24_Arbeitnehmer_de: "",
    txtf_25_letztes_Kalenderjahr: "",
    txtf_25_vorletztes_Kalenderjahr: "",

    // Section F - Entgelt
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

    // Section G - Ergänzungen
    txtf_30_Ergaenzug: "",

    // Section H - Unterschrift
    txtf_31_Ort: "",
    txtf_32_Datum: todayDdMmYyyy(),
  });

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
      link.download = `Zusatzblatt_B_${form.txtf_4_Nachname || "Dokument"}.pdf`;
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

  const formCard = "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full max-w-4xl mx-auto";

  return (
    <div className="p-2 min-h-screen">
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link to="/settings/documents" className="link flex items-center gap-2">
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">Zusatzblatt B</li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            <FaDownload />
            {isDownloading ? "Wird erstellt..." : "PDF Herunterladen"}
          </button>
        </div>
      </div>

      <div className="pt-16">
        <section className={formCard}>
          <div className="card-body space-y-6">
            <div>
              <h2 className="card-title text-2xl font-bold">
                Zusatzblatt B - ICT / Personalaustausch
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Zusatzblatt für unternehmensintern transferierte Arbeitnehmer (ICT) und Personalaustausch
              </p>
            </div>

            {/* Section A - Art der Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              A. Art der Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">1. Art der Beschäftigung</span>
                </label>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_1_ICT}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_1_ICT: e.target.checked }))}
                    />
                    <span className="label-text">ICT (Unternehmensintern transferierter Arbeitnehmer)</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_1_Personalaustausch}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_1_Personalaustausch: e.target.checked }))}
                    />
                    <span className="label-text">Personalaustausch</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_1_Beschaeftigung}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_1_Beschaeftigung: e.target.checked }))}
                    />
                    <span className="label-text">Sonstige Beschäftigung</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section B - Aufnehmendes Unternehmen */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zum aufnehmenden Unternehmen
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="2. Firma/Name"
                value={form.txtf_2_Firma}
                onChange={(e) => setForm((p) => ({ ...p, txtf_2_Firma: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="3. Vorname (Kontaktperson)"
                  value={form.txtf_3_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_3_Vorname: e.target.value }))}
                />
                <FormInput
                  label="4. Nachname (Kontaktperson)"
                  value={form.txtf_4_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_4_Nachname: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="5. Straße"
                  value={form.txtf_5_Strasse}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_5_Strasse: e.target.value }))}
                />
                <FormInput
                  label="6. Hausnummer"
                  value={form.txtf_6_Hausnummer}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_6_Hausnummer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormInput
                  label="7. PLZ"
                  value={form.txtf_7_PLZ}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_7_PLZ: e.target.value }))}
                />
                <FormInput
                  label="8. Ort"
                  value={form.txtf_8_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_8_Ort: e.target.value }))}
                />
                <FormInput
                  label="9. Land"
                  value={form.txtf_9_Land}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_9_Land: e.target.value }))}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">10. Sitz des Unternehmens</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: "ausserhalb der Europaeischen Union", label: "Außerhalb der EU" },
                    { value: "innerhalb der Europaeischen Union", label: "Innerhalb der EU" },
                  ].map((opt) => (
                    <label key={opt.value} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_10_Sitz_des_Unternehmens"
                        className="radio radio-primary"
                        checked={form.rbtn_10_Sitz_des_Unternehmens === opt.value}
                        onChange={() => setForm((p) => ({ ...p, rbtn_10_Sitz_des_Unternehmens: opt.value }))}
                      />
                      <span className="label-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Unternehmensverbund */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Angaben zum Unternehmensverbund
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">11. Art des Verbunds</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_11_Unternehmen}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_11_Unternehmen: e.target.checked }))}
                    />
                    <span className="label-text">Unternehmen</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_11_Unternehmensgruppe}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_11_Unternehmensgruppe: e.target.checked }))}
                    />
                    <span className="label-text">Unternehmensgruppe</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.chbx_11_Konzern}
                      onChange={(e) => setForm((p) => ({ ...p, chbx_11_Konzern: e.target.checked }))}
                    />
                    <span className="label-text">Konzern</span>
                  </label>
                </div>
              </div>

              {["12_Kapital", "13_Stimmrechte", "14_Mitglieder", "15_Mutterunternehmen"].map((field) => (
                <div key={field} className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      {field === "12_Kapital" && "12. Kapitalanteil > 50%?"}
                      {field === "13_Stimmrechte" && "13. Stimmrechte > 50%?"}
                      {field === "14_Mitglieder" && "14. Mehrheit der Mitglieder?"}
                      {field === "15_Mutterunternehmen" && "15. Mutterunternehmen?"}
                    </span>
                  </label>
                  <div className="flex gap-4">
                    {["ja", "nein"].map((opt) => (
                      <label key={opt} className="label cursor-pointer gap-2">
                        <input
                          type="radio"
                          name={`rbtn_${field}`}
                          className="radio radio-primary"
                          checked={form[`rbtn_${field}`] === opt}
                          onChange={() => setForm((p) => ({ ...p, [`rbtn_${field}`]: opt }))}
                        />
                        <span className="label-text">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <FormInput
                label="16. Seit wann besteht der Verbund?"
                type="date"
                value={toInputDate(form.txtf_16_seit)}
                onChange={(e) => setForm((p) => ({ ...p, txtf_16_seit: fromInputDate(e.target.value) }))}
              />
            </div>

            {/* Section D - Entsendende Person */}
            <div className="divider divider-start font-bold text-base-content/80">
              D. Angaben zur entsendenden Person
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="17. Vorname"
                  value={form.txtf_17_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_17_Vorname: e.target.value }))}
                />
                <FormInput
                  label="18. Nachname"
                  value={form.txtf_18_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_18_Nachname: e.target.value }))}
                />
              </div>
              <FormInput
                label="19. Straße"
                value={form.txtf_19_Strasse}
                onChange={(e) => setForm((p) => ({ ...p, txtf_19_Strasse: e.target.value }))}
              />

              {["20_Entsendung", "21_Arbeitsverhaeltnis", "22_Beendigung"].map((field) => (
                <div key={field} className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      {field === "20_Entsendung" && "20. Entsendung?"}
                      {field === "21_Arbeitsverhaeltnis" && "21. Bestehendes Arbeitsverhältnis?"}
                      {field === "22_Beendigung" && "22. Beendigung nach Rückkehr?"}
                    </span>
                  </label>
                  <div className="flex gap-4">
                    {["ja", "nein"].map((opt) => (
                      <label key={opt} className="label cursor-pointer gap-2">
                        <input
                          type="radio"
                          name={`rbtn_${field}`}
                          className="radio radio-primary"
                          checked={form[`rbtn_${field}`] === opt}
                          onChange={() => setForm((p) => ({ ...p, [`rbtn_${field}`]: opt }))}
                        />
                        <span className="label-text">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Section E - Beschäftigungszeitraum */}
            <div className="divider divider-start font-bold text-base-content/80">
              E. Beschäftigungszeitraum
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.chbx_23_Beschaeftigung}
                  onChange={(e) => setForm((p) => ({ ...p, chbx_23_Beschaeftigung: e.target.checked }))}
                />
                <span className="label-text">23. Beschäftigung</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Neueinreise ab"
                  type="date"
                  value={toInputDate(form.txtf_23_Neueinreise_ab)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_23_Neueinreise_ab: fromInputDate(e.target.value) }))}
                />
                <FormInput
                  label="Neueinreise bis"
                  type="date"
                  value={toInputDate(form.txtf_23_Neueinreise_bis)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_23_Neueinreise_bis: fromInputDate(e.target.value) }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Verlängerung ab"
                  type="date"
                  value={toInputDate(form.txtf_23_Verlaengerung_ab)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_23_Verlaengerung_ab: fromInputDate(e.target.value) }))}
                />
                <FormInput
                  label="Verlängerung bis"
                  type="date"
                  value={toInputDate(form.txtf_23_Verlaengerung_bis)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_23_Verlaengerung_bis: fromInputDate(e.target.value) }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">24. Arbeitnehmer in Deutschland?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_24_Arbeitnehmer_de"
                        className="radio radio-primary"
                        checked={form.rbtn_24_Arbeitnehmer_de === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_24_Arbeitnehmer_de: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="25. Letztes Kalenderjahr"
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

            {/* Section F - Entgelt */}
            <div className="divider divider-start font-bold text-base-content/80">
              F. Entgelt
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="26. Grundgehalt (€)"
                value={form.txtf_26_Grundgehalt}
                onChange={(e) => setForm((p) => ({ ...p, txtf_26_Grundgehalt: e.target.value }))}
              />

              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>27. Zulagen</th>
                      <th>Art</th>
                      <th>Betrag (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[2, 3, 4, 5, 6].map((row) => (
                      <tr key={row}>
                        <td>Zeile {row}</td>
                        <td>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={form[`txtf_27_Tabelle_Z${row}_S1`]}
                            onChange={(e) => setForm((p) => ({ ...p, [`txtf_27_Tabelle_Z${row}_S1`]: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={form[`txtf_27_Tabelle_Z${row}_S2`]}
                            onChange={(e) => setForm((p) => ({ ...p, [`txtf_27_Tabelle_Z${row}_S2`]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>28. Abzüge</th>
                      <th>Art</th>
                      <th>Betrag (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[2, 3].map((row) => (
                      <tr key={row}>
                        <td>Zeile {row}</td>
                        <td>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={form[`txtf_28_Tabelle_Z${row}_S1`]}
                            onChange={(e) => setForm((p) => ({ ...p, [`txtf_28_Tabelle_Z${row}_S1`]: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={form[`txtf_28_Tabelle_Z${row}_S2`]}
                            onChange={(e) => setForm((p) => ({ ...p, [`txtf_28_Tabelle_Z${row}_S2`]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">29. Arbeitsentgelt Erläuterung</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-20"
                  value={form.txtf_29_Arbeitsentgelt}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_29_Arbeitsentgelt: e.target.value }))}
                />
              </div>
            </div>

            {/* Section G - Ergänzungen */}
            <div className="divider divider-start font-bold text-base-content/80">
              G. Ergänzungen
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">30. Ergänzungen</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={form.txtf_30_Ergaenzug}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_30_Ergaenzug: e.target.value }))}
                />
              </div>
            </div>

            {/* Section H - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              H. Ort und Datum
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
        </section>
      </div>
    </div>
  );
}
