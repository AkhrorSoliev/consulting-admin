import { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import { fromInputDate, toInputDate } from "../utils";
import RozilikXatiPdfDocument from "./contract/pdf/RozilikXatiPdfDocument";
import RozilikXatiLivePreview from "./contract/components/RozilikXatiLivePreview";
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

export default function RozilikXati() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => ({
    // Nomzod ma'lumotlari
    nomzodIsm: "",
    nomzodFamilya: "",
    nomzodJinsi: "",
    nomzodTugilganSana: "",
    nomzodManzil: "",
    nomzodOqishJoyi: "",
    nomzodTelefon: "",
    // Joy va sana
    joy: "",
    sana: todayDdMmYyyy(),
  }));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const TEMPLATE_COLLECTION = "template_documents";
  const TEMPLATE_ID = "rozilik_xati";

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

  const fullName = useMemo(() => {
    const first = String(form.nomzodIsm || "").trim();
    const last = String(form.nomzodFamilya || "").trim();
    return [first, last].filter(Boolean).join(" ");
  }, [form.nomzodIsm, form.nomzodFamilya]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = fullName ? `Rozilik xati ${fullName}` : "Rozilik xati";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Rozilik xati";
      const blob = await pdf(<RozilikXatiPdfDocument form={form} />).toBlob();
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
              <li className="opacity-70">Rozilik xati</li>
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
            <h2 className="card-title text-2xl font-bold ">
              Rozilik xati to'ldirish
            </h2>
            <p className="text-sm opacity-70">
              Nomzod ma'lumotlarini to'ldiring. Rozilik xati beruvchi shaxs
              ma'lumotlari qo'lda to'ldiriladi.
            </p>

            <div className="divider divider-start font-bold text-base-content/80">
              👤 Nomzod ma'lumotlari
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Shaxsiy ma'lumotlar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Ismi"
                  placeholder="Masalan: Alisher"
                  value={form.nomzodIsm}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nomzodIsm: e.target.value }))
                  }
                />
                <FormInput
                  label="Familyasi"
                  placeholder="Masalan: Navoiy"
                  value={form.nomzodFamilya}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nomzodFamilya: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Jinsi</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={form.nomzodJinsi}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nomzodJinsi: e.target.value }))
                    }
                  >
                    <option value="">Tanlang...</option>
                    <option value="Erkak">Erkak</option>
                    <option value="Ayol">Ayol</option>
                  </select>
                </div>
                <FormInput
                  label="Tug'ilgan sanasi"
                  type="date"
                  placeholder="YYYY-MM-DD"
                  value={toInputDate(form.nomzodTugilganSana)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      nomzodTugilganSana: fromInputDate(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Aloqa ma'lumotlari
              </h3>
              <FormInput
                label="Manzili"
                placeholder="Masalan: Toshkent sh., Chilonzor t."
                value={form.nomzodManzil}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nomzodManzil: e.target.value }))
                }
              />
              <FormInput
                label="O'qish joyi"
                placeholder="Masalan: Toshkent Davlat Universiteti"
                value={form.nomzodOqishJoyi}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nomzodOqishJoyi: e.target.value }))
                }
              />
              <FormInput
                label="Telefon raqami"
                placeholder="Masalan: +998 90 123 45 67"
                value={form.nomzodTelefon}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nomzodTelefon: e.target.value }))
                }
              />
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              📍 Joy va sana
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full"></span>
                Imzo qismi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Joy (Geburtsort)"
                  placeholder="Masalan: Toshkent"
                  value={form.joy}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, joy: e.target.value }))
                  }
                />
                <FormInput
                  label="Sana"
                  type="date"
                  placeholder="YYYY-MM-DD"
                  value={toInputDate(form.sana)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sana: fromInputDate(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Eslatma</div>
              <div className="opacity-70">
                "Nomzodga rozilik xati beruvchi shaxs" qismi bo'sh qoladi va
                qo'lda to'ldiriladi.
              </div>
            </div>
          </div>
        </section>

        <RozilikXatiLivePreview form={form} />
      </div>
    </div>
  );
}
