import { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import { fromInputDate, toInputDate } from "../utils";
import VermittlungsvertragPdfDocument from "./contract/pdf/VermittlungsvertragPdfDocument";
import VermittlungsvertragLivePreview from "./contract/components/VermittlungsvertragLivePreview";
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

function getTodayDate() {
  return new Date();
}

function addYearsToDate(date, years) {
  try {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  } catch {
    return new Date();
  }
}

function formatDateToDdMmYyyy(date) {
  try {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return "";
  }
}

export default function Vermittlungsvertrag() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate = !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => ({
    candidateName: "",
    contractDurationYears: 2,
    signatureDate: todayDdMmYyyy(),
    signatureCity: "Taschkent",
  }));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const TEMPLATE_COLLECTION = "template_documents";
  const TEMPLATE_ID = "vermittlungsvertrag";

  async function loadTemplate() {
    try {
      setIsLoadingTemplate(true);
      const ref = doc(db, TEMPLATE_COLLECTION, TEMPLATE_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
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
      toast.error("Fehler beim Laden der Vorlage.");
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
      if (!silent) toast.error("Fehler beim Speichern der Vorlage.");
      return false;
    } finally {
      saveInFlightRef.current = false;
      setIsSavingTemplate(false);
    }
  }

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    const json = JSON.stringify(form);
    const isDirty = json !== lastSavedJsonRef.current;
    setHasUnsavedTemplate(isDirty);
  }, [form, canWriteTemplate]);

  // No longer needed - contract duration is now calculated dynamically

  const candidateFullName = useMemo(() => {
    return String(form.candidateName || "").trim();
  }, [form.candidateName]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = candidateFullName
        ? `Vermittlungsvertrag ${candidateFullName}`
        : "Vermittlungsvertrag";
      const safeFileName = fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vermittlungsvertrag";
      const blob = await pdf(
        <VermittlungsvertragPdfDocument form={form} />
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
              <li className="opacity-70">Vermittlungsvertrag</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/60 hidden sm:inline">
              {isLoadingTemplate
                ? "Template yuklanmoqda..."
                : isSavingTemplate
                ? "Saqlanmoqda..."
                : hasUnsavedTemplate
                ? "O'zgarish bor"
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
                  ? "O'zgarish yo'q"
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
      <div className="h-20 print:hidden" />

      <div className={layoutClass}>
        <section className={formCard}>
          <div className="card-body space-y-4">
            <h2 className="card-title text-2xl font-bold">Vermittlungsvertrag ausfüllen</h2>
            <p className="text-sm opacity-70">
              Füllen Sie die erforderlichen Felder aus: <span className="font-semibold">Name</span>,{" "}
              <span className="font-semibold">Vertragsdauer</span>,{" "}
              <span className="font-semibold">Datum</span>.
            </p>

            <div className="divider">Auftraggeber / Bewerber</div>

            <FormInput
              label="Name des Auftraggebers / Bewerbers"
              placeholder="Vollständiger Name"
              value={form.candidateName}
              onChange={(e) =>
                setForm((p) => ({ ...p, candidateName: e.target.value }))
              }
            />

            <div className="divider">Vertragsdauer</div>

            <FormInput
              label="Vertragsdauer (Jahre)"
              type="number"
              min="1"
              max="10"
              placeholder="z.B. 2"
              value={form.contractDurationYears}
              onChange={(e) =>
                setForm((p) => ({ ...p, contractDurationYears: parseInt(e.target.value) || 2 }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Vertrag beginnt am <span className="font-semibold">heutigen Datum</span> und endet nach {form.contractDurationYears} Jahr{form.contractDurationYears !== 1 ? 'en' : ''}.
                </span>
              }
            />

            <div className="divider">Unterschrift</div>

            <FormInput
              label="Ort (Unterschrift)"
              placeholder="z.B. Taschkent"
              value={form.signatureCity}
              onChange={(e) =>
                setForm((p) => ({ ...p, signatureCity: e.target.value }))
              }
            />

            <FormInput
              label="Datum (Unterschrift)"
              type="date"
              placeholder="YYYY-MM-DD"
              value={toInputDate(form.signatureDate)}
              onChange={(e) =>
                setForm((p) => ({ ...p, signatureDate: fromInputDate(e.target.value) }))
              }
              helperText={
                <span className="text-xs opacity-70">
                  Wird unten als <span className="font-semibold">„Ort / Datum"</span> angezeigt.
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

        <VermittlungsvertragLivePreview form={form} />
      </div>
    </div>
  );
}

