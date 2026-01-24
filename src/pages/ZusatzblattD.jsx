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

export default function ZusatzblattD() {
  const [isDownloading, setIsDownloading] = useState(false);

  const [form, setForm] = useState({
    // Section A - Angaben zur Person
    txtf_1_Vorname: "",
    txtf_2_Nachname: "",
    txtf_3_Wohnsitz: "",

    // Section B - Kurzfristige Beschäftigung
    rbtn_4_Arbeit_90_Tage: "",
    rbtn_5_Arbeit_8_Monate: "",
    rbtn_6_Erntehelfer: "",
    rbtn_7_Arbeit_visumfrei: "",
    rbtn_8_Unternehmen_beschaeftigt: "",
    rbtn_9_Reisekosten: "",

    // Section C - Unterschrift
    txtf_10_Ort: "",
    txtf_11_Datum: todayDdMmYyyy(),
  });

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);

      const payload = {
        template: "zusatzblatt_d_zum_formular_erklaerung_zum_beschaeftigungsverhaeltnis.pdf",
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
      link.download = `Zusatzblatt_D_${form.txtf_2_Nachname || "Dokument"}.pdf`;
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
              <li className="opacity-70">Zusatzblatt D</li>
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
                Zusatzblatt D - Kurzfristige Beschäftigung
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Zusatzblatt für kurzfristige Beschäftigung (bis zu 90 Tage / 8 Monate)
              </p>
            </div>

            {/* Section A - Angaben zur Person */}
            <div className="divider divider-start font-bold text-base-content/80">
              A. Angaben zur Arbeitnehmerin/zum Arbeitnehmer
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="1. Vorname(n)"
                  value={form.txtf_1_Vorname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_1_Vorname: e.target.value }))}
                />
                <FormInput
                  label="2. Nachname"
                  value={form.txtf_2_Nachname}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_2_Nachname: e.target.value }))}
                />
              </div>
              <FormInput
                label="3. Derzeitiger Wohnsitz"
                value={form.txtf_3_Wohnsitz}
                onChange={(e) => setForm((p) => ({ ...p, txtf_3_Wohnsitz: e.target.value }))}
              />
            </div>

            {/* Section B - Kurzfristige Beschäftigung */}
            <div className="divider divider-start font-bold text-base-content/80">
              B. Angaben zur kurzfristigen Beschäftigung
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">4. Beschäftigung bis zu 90 Tage im Kalenderjahr?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_4_Arbeit_90_Tage"
                        className="radio radio-primary"
                        checked={form.rbtn_4_Arbeit_90_Tage === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_4_Arbeit_90_Tage: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">5. Beschäftigung bis zu 8 Monate im Kalenderjahr?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_5_Arbeit_8_Monate"
                        className="radio radio-primary"
                        checked={form.rbtn_5_Arbeit_8_Monate === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_5_Arbeit_8_Monate: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">6. Beschäftigung als Erntehelfer/in?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_6_Erntehelfer"
                        className="radio radio-primary"
                        checked={form.rbtn_6_Erntehelfer === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_6_Erntehelfer: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">7. Visumfreie Einreise möglich?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_7_Arbeit_visumfrei"
                        className="radio radio-primary"
                        checked={form.rbtn_7_Arbeit_visumfrei === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_7_Arbeit_visumfrei: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">8. War die Person bereits bei diesem Unternehmen beschäftigt?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_8_Unternehmen_beschaeftigt"
                        className="radio radio-primary"
                        checked={form.rbtn_8_Unternehmen_beschaeftigt === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_8_Unternehmen_beschaeftigt: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">9. Werden Reisekosten übernommen?</span>
                </label>
                <div className="flex gap-4">
                  {["ja", "nein"].map((opt) => (
                    <label key={opt} className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="rbtn_9_Reisekosten"
                        className="radio radio-primary"
                        checked={form.rbtn_9_Reisekosten === opt}
                        onChange={() => setForm((p) => ({ ...p, rbtn_9_Reisekosten: opt }))}
                      />
                      <span className="label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C - Unterschrift */}
            <div className="divider divider-start font-bold text-base-content/80">
              C. Ort und Datum
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="10. Ort"
                  value={form.txtf_10_Ort}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_10_Ort: e.target.value }))}
                />
                <FormInput
                  label="11. Datum"
                  type="date"
                  value={toInputDate(form.txtf_11_Datum)}
                  onChange={(e) => setForm((p) => ({ ...p, txtf_11_Datum: fromInputDate(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
