import { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import { fromInputDate, toInputDate } from "../utils";
import ContractLivePreview from "./contract/components/ContractLivePreview";
import BeratungsvertragPdfDocument from "./contract/pdf/BeratungsvertragPdfDocument";
import { db } from "../firebase/config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import useUserRole from "../hooks/useUserRole";
import { useSelector } from "react-redux";

function todayDdMmYyyy() {
  try {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

export default function Contract() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate = !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => ({
    firstName: "",
    lastName: "",
    contractDate: todayDdMmYyyy(),
    // Candidate city (Ort) for the passport page signature block
    candidateCity: "",
    // PDF generation date (defaults to today; can be adjusted)
    pdfGeneratedDate: todayDdMmYyyy(),
    // Pricing (Vergütung)
    feeTotalEur: "1200",
    feeAdvanceEur: "250",
    signatureCity: "",
    pdfUrl: "",
  }));
  const [isDownloading, setIsDownloading] = useState(false);
  const [passportImageDataUrl, setPassportImageDataUrl] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const TEMPLATE_COLLECTION = "template_documents";
  const TEMPLATE_ID = "beratungsvertrag";

  async function loadTemplate() {
    try {
      setIsLoadingTemplate(true);
      const ref = doc(db, TEMPLATE_COLLECTION, TEMPLATE_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // No template saved yet, keep defaults.
        const json = JSON.stringify(form);
        lastSavedJsonRef.current = json;
        setHasUnsavedTemplate(false);
        didHydrateRef.current = true;
        return;
      }

      const data = snap.data() || {};
      const savedForm =
        data && typeof data === "object" && data.form && typeof data.form === "object"
          ? data.form
          : null;

      if (savedForm) {
        setForm((prev) => {
          const merged = { ...prev, ...savedForm };
          const json = JSON.stringify(merged);
          lastSavedJsonRef.current = json;
          setHasUnsavedTemplate(false);
          didHydrateRef.current = true;
          return merged;
        });
      } else {
        const json = JSON.stringify(form);
        lastSavedJsonRef.current = json;
        setHasUnsavedTemplate(false);
        didHydrateRef.current = true;
      }
    } catch (e) {
      console.error(e);
      toast.error("Template yuklashda xatolik.");
      didHydrateRef.current = true;
    } finally {
      setIsLoadingTemplate(false);
    }
  }

  async function saveTemplate({ silent = false } = {}) {
    if (!canWriteTemplate) {
      if (!silent) toast.error("Saqlash uchun admin huquqi kerak.");
      return false;
    }
    if (saveInFlightRef.current) return false;
    try {
      saveInFlightRef.current = true;
      setIsSavingTemplate(true);

      const payload = {
        templateId: TEMPLATE_ID,
        collection: TEMPLATE_COLLECTION,
        form: form,
        updatedAt: serverTimestamp(),
        updatedByUid: user?.uid || null,
        updatedByEmail: user?.email || null,
      };

      await setDoc(doc(db, TEMPLATE_COLLECTION, TEMPLATE_ID), payload, { merge: true });

      lastSavedJsonRef.current = JSON.stringify(form);
      setHasUnsavedTemplate(false);
      if (!silent) toast.success("Template saqlandi.");
      return true;
    } catch (e) {
      console.error(e);
      if (!silent) toast.error("Template saqlashda xatolik.");
      return false;
    } finally {
      saveInFlightRef.current = false;
      setIsSavingTemplate(false);
    }
  }

  useEffect(() => {
    // hydrate from Firestore once
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    const json = JSON.stringify(form);
    const isDirty = json !== lastSavedJsonRef.current;
    setHasUnsavedTemplate(isDirty);
  }, [form, canWriteTemplate]);

  function parseMoneyEur(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;
    // digits-only (inputs are restricted to numbers)
    const cleaned = raw.replace(/\D+/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  const restEur = (() => {
    const total = parseMoneyEur(form.feeTotalEur);
    const adv = parseMoneyEur(form.feeAdvanceEur);
    if (total == null || adv == null) return "";
    const r = total - adv;
    if (!Number.isFinite(r)) return "";
    return String(Math.max(0, Math.trunc(r)));
  })();

  const clientFullName = useMemo(() => {
    const a = String(form.firstName || "").trim();
    const b = String(form.lastName || "").trim();
    return [a, b].filter(Boolean).join(" ").trim();
  }, [form.firstName, form.lastName]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = clientFullName
        ? `Beratungsvertrag ${clientFullName}`
        : "Beratungsvertrag";
      const safeFileName = fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Beratungsvertrag";
      const blob = await pdf(
        <BeratungsvertragPdfDocument
          form={form}
          passportImageDataUrl={passportImageDataUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const layoutClass = "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
  const formCard =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  return (
    <div className="p-2 bg-base-200 min-h-screen">
      {/* Fixed action bar under the global navbar (hidden on print) */}
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link to="/settings/documents" className="link flex items-center gap-2">
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">Beratungsvertrag</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/60 hidden sm:inline">
              {isLoadingTemplate
                ? "Template yuklanmoqda..."
                : isSavingTemplate
                ? "Saqlanmoqda..."
                : hasUnsavedTemplate
                ? "O‘zgarish bor"
                : "Saqlangan"}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => saveTemplate({ silent: false })}
              disabled={isLoadingTemplate || isSavingTemplate || !hasUnsavedTemplate || !canWriteTemplate}
              title={
                !canWriteTemplate
                  ? "Saqlash uchun admin huquqi kerak"
                  : isLoadingTemplate
                  ? "Template yuklanmoqda..."
                  : !hasUnsavedTemplate
                  ? "O‘zgarish yo‘q"
                  : "Saqlash"
              }
            >
              <FaSave />
              {isSavingTemplate ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              <FaDownload />
              {isDownloading ? "Wird geladen..." : "Herunterladen"}
            </button>
          </div>
        </div>
      </div>
      <div className="h-14 print:hidden" />

      <div className={layoutClass}>
        <section className={formCard}>
          <div className="card-body space-y-4">
            <h2 className="card-title text-2xl font-bold">Vertrag ausfüllen</h2>
            <p className="text-sm opacity-70">
              Nur die wichtigsten Felder: <span className="font-semibold">Name</span>,{" "}
              <span className="font-semibold">Nachname</span>,{" "}
              <span className="font-semibold">Datum</span>. Vorschau aktualisiert sofort.
            </p>

            <div className="divider">Auftraggeber</div>

            <FormInput
              label="Vorname"
              placeholder="Vorname"
              value={form.firstName}
              onChange={(e) =>
                setForm((p) => ({ ...p, firstName: e.target.value }))
              }
            />
            <FormInput
              label="Nachname"
              placeholder="Nachname"
              value={form.lastName}
              onChange={(e) =>
                setForm((p) => ({ ...p, lastName: e.target.value }))
              }
            />

            <FormInput
              label="Datum"
              type="date"
              placeholder="YYYY-MM-DD"
              value={toInputDate(form.contractDate)}
              onChange={(e) =>
                setForm((p) => ({ ...p, contractDate: fromInputDate(e.target.value) }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Im Vertrag als <span className="font-semibold">dd.mm.yyyy</span> verwendet.
                </span>
              }
            />

            <FormInput
              label="Ort (Unterschrift)"
              placeholder="z.B. Berlin"
              value={form.signatureCity}
              onChange={(e) =>
                setForm((p) => ({ ...p, signatureCity: e.target.value }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Wird unten als <span className="font-semibold">„Ort, Datum“</span> angezeigt.
                </span>
              }
            />

            <FormInput
              label="Ort (Kandidat) — für Pass-Seite"
              placeholder="z.B. Tashkent"
              value={form.candidateCity}
              onChange={(e) =>
                setForm((p) => ({ ...p, candidateCity: e.target.value }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Wird unter dem Passbild als <span className="font-semibold">„Datum: Ort, Datum“</span> angezeigt.
                </span>
              }
            />

            <FormInput
              label="PDF generiert am"
              type="date"
              placeholder="YYYY-MM-DD"
              value={toInputDate(form.pdfGeneratedDate)}
              onChange={(e) =>
                setForm((p) => ({ ...p, pdfGeneratedDate: fromInputDate(e.target.value) }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Standard: heute. Wird unter dem Passbild angezeigt.
                </span>
              }
            />

            <FormInput
              label="PDF link (test)"
              placeholder="https://example.com/file.pdf"
              value={form.pdfUrl}
              onChange={(e) => setForm((p) => ({ ...p, pdfUrl: e.target.value }))}
              helperText={
                <span className="text-xs opacity-70">
                  Faqat PDF URL’ni qo‘ying (console error matnini emas). CORS bo‘lsa, proxy orqali aylanib o‘tamiz.
                  {String(form.pdfUrl || "").trim() ? (
                    <>
                      {" "}
                      <a
                        className="link"
                        href={form.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </>
                  ) : null}
                </span>
              }
            />

            <div className="divider">Vergütung (Preis)</div>

            <FormInput
              label="Honorar gesamt (€)"
              placeholder="z.B. 1200"
              inputMode="numeric"
              pattern="\\d*"
              value={form.feeTotalEur}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  feeTotalEur: String(e.target.value || "").replace(/\D+/g, ""),
                }))
              }
            />
            <FormInput
              label="Anzahlung (€)"
              placeholder="z.B. 250"
              inputMode="numeric"
              pattern="\\d*"
              value={form.feeAdvanceEur}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  feeAdvanceEur: String(e.target.value || "").replace(/\D+/g, ""),
                }))
              }
            />
            <FormInput
              label="Restbetrag (auto) (€)"
              placeholder="—"
              inputMode="numeric"
              pattern="\\d*"
              value={restEur}
              readOnly
              inputClassName="opacity-70"
              helperText={
                <span className="text-xs opacity-70">
                  Wird automatisch als <span className="font-semibold">Gesamt − Anzahlung</span> berechnet.
                </span>
              }
            />

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Tipp</div>
              <div className="opacity-70">
                Wenn Name leer bleibt, werden im Vertrag Platzhalter‑Linien angezeigt.
              </div>
            </div>
          </div>
        </section>

        <ContractLivePreview
          form={form}
          pdfUrl={form.pdfUrl}
          onPassportPreviewReady={setPassportImageDataUrl}
        />
      </div>
    </div>
  );
}


