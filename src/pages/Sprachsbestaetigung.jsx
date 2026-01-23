import { useEffect, useRef, useState } from "react";
import { FaDownload, FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import SprachsbestaetigungPdfDocument from "./contract/pdf/SprachsbestaetigungPdfDocument";
import SprachsbestaetigungLivePreview from "./contract/components/SprachsbestaetigungLivePreview";
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

export default function Sprachsbestaetigung() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => ({
    // Company info (header)
    firmaName: "Erlebnispark Tripsdrill GmbH & Co.KG",
    abteilung: "Human Resources",
    kontaktPerson: "Nupel Kara",
    strasse: "Erlebnispark-Tripsdrill-Straße 1",
    plz: "74389",
    ort: "Cleebronn",
    telefon: "+49 7135 999 307",
    email: "nupel.kara@tripsdrill.de",
    // Candidate info
    kandidatName: "",
    datum: todayDdMmYyyy(),
    // Content
    praktikumsart: "Weiterbildungspraktikum",
  }));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const TEMPLATE_COLLECTION = "template_documents";
  const TEMPLATE_ID = "sprachsbestaetigung";

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
        data &&
        typeof data === "object" &&
        data.form &&
        typeof data.form === "object"
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

      await setDoc(doc(db, TEMPLATE_COLLECTION, TEMPLATE_ID), payload, {
        merge: true,
      });

      lastSavedJsonRef.current = JSON.stringify(form);
      setHasUnsavedTemplate(false);
      if (!silent) toast.success("Template saqlandi.");
      return true;
    } catch (e) {
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

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = form.kandidatName
        ? `Sprachsbestaetigung ${form.kandidatName}`
        : "Sprachsbestaetigung";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Sprachsbestaetigung";
      const blob = await pdf(
        <SprachsbestaetigungPdfDocument form={form} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ConsultingUz ${safeFileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF wurde erstellt.");
    } catch (e) {
      toast.error("Fehler beim Erstellen der PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
  const formCard =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  return (
    <div className="p-2 min-h-screen">
      {/* Fixed action bar under the global navbar (hidden on print) */}
      <div className="fixed inset-x-0 top-16 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link
                  to="/settings/documents"
                  className="link flex items-center gap-2"
                >
                  <FaArrowLeft /> Zurück
                </Link>
              </li>
              <li className="opacity-70">Sprachsbestätigung</li>
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
              disabled={
                isLoadingTemplate ||
                isSavingTemplate ||
                !hasUnsavedTemplate ||
                !canWriteTemplate
              }
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

      <div className={layoutClass}>
        <section className={formCard}>
          <div className="card-body space-y-4 grow-0">
            <h2 className="card-title text-2xl font-bold">
              Sprachsbestätigung (Deutschkenntnisse)
            </h2>
            <p className="text-sm opacity-70">
              Bestätigung der Deutschkenntnisse nach Online-Vorstellungsgespräch.
              Template da kiritilgan qiymatlar butun loyiha bo'ylab default
              sifatida ishlatiladi.
            </p>

            <div className="divider divider-start font-bold text-base-content/80">
              🏢 Firma ma'lumotlari
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
              👤 Kandidat ma'lumotlari
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
                Generate sahifasida kandidat ism-familyasi avtomatik qo'yiladi
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

        <SprachsbestaetigungLivePreview form={form} />
      </div>
    </div>
  );
}
