import { useEffect, useRef, useState } from "react";
import { FaDownload, FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import PersonalfragebogenPdfDocument from "./contract/pdf/PersonalfragebogenPdfDocument";
import PersonalfragebogenLivePreview from "./contract/components/PersonalfragebogenLivePreview";
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

export default function Personalfragebogen() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => ({
    nachname: "",
    vorname: "",
    wohnadresseDeutschland: "",
    wohnadresseUsbekistan: "",
    geburtsdatum: "",
    geburtsort: "",
    geschlecht: "",
    staatsangehoerigkeit: "usbekisch",
    schuhgroesse: "",
    kleidergroesse: "",
    steueridentifikationsnummer: "",
    krankenversicherung: "",
    bankName: "",
    iban: "",
    bic: "",
    visaArt: "",
    visaNummer: "",
    visaGueltigkeit: "",
    datum: todayDdMmYyyy(),
  }));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const TEMPLATE_COLLECTION = "template_documents";
  const TEMPLATE_ID = "personalfragebogen";

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
      const fullName = [form.nachname, form.vorname].filter(Boolean).join(" ");
      const fileBase = fullName
        ? `Personalfragebogen ${fullName}`
        : "Personalfragebogen";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Personalfragebogen";
      const blob = await pdf(
        <PersonalfragebogenPdfDocument form={form} />
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
              <li className="opacity-70">Personalfragebogen</li>
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
              Personalfragebogen
            </h2>
            <p className="text-sm opacity-70">
              Ishchi haqidagi ma'lumotnoma. Generate sahifasida kandidat ma'lumotlari avtomatik to'ldiriladi.
            </p>

            <div className="divider divider-start font-bold text-base-content/80">
              👤 Shaxsiy ma'lumotlar
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="Nachname (Familiya)"
                placeholder="Masalan: Sobirova"
                value={form.nachname}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nachname: e.target.value }))
                }
              />

              <FormInput
                label="Vorname (Ism)"
                placeholder="Masalan: Sevarakhon"
                value={form.vorname}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vorname: e.target.value }))
                }
              />

              <FormInput
                label="Wohnadresse in Deutschland"
                placeholder="Germaniyaga kelgandan so'ng yashash manzili"
                value={form.wohnadresseDeutschland}
                onChange={(e) =>
                  setForm((p) => ({ ...p, wohnadresseDeutschland: e.target.value }))
                }
              />

              <FormInput
                label="Wohnadresse in Usbekistan"
                placeholder="O'zbekistondagi yashash manzili"
                value={form.wohnadresseUsbekistan}
                onChange={(e) =>
                  setForm((p) => ({ ...p, wohnadresseUsbekistan: e.target.value }))
                }
              />

              <FormInput
                label="Geburtsdatum (Tug'ilgan sana)"
                type="date"
                value={toInputDate(form.geburtsdatum)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    geburtsdatum: fromInputDate(e.target.value),
                  }))
                }
              />

              <FormInput
                label="Geburtsort (Tug'ilgan joy)"
                placeholder="Masalan: Tashkent"
                value={form.geburtsort}
                onChange={(e) =>
                  setForm((p) => ({ ...p, geburtsort: e.target.value }))
                }
              />

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Geschlecht (Jins)</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={form.geschlecht}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, geschlecht: e.target.value }))
                  }
                >
                  <option value="">Tanlang...</option>
                  <option value="männlich">männlich (Erkak)</option>
                  <option value="weiblich">weiblich (Ayol)</option>
                </select>
              </div>

              <FormInput
                label="Staatsangehörigkeit (Fuqarolik)"
                placeholder="Masalan: usbekisch"
                value={form.staatsangehoerigkeit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, staatsangehoerigkeit: e.target.value }))
                }
              />

              <FormInput
                label="Schuhgröße (Oyoq kiyim razmeri)"
                placeholder="Masalan: 42"
                value={form.schuhgroesse}
                onChange={(e) =>
                  setForm((p) => ({ ...p, schuhgroesse: e.target.value }))
                }
              />

              <FormInput
                label="Kleidergröße (Kiyim razmeri)"
                placeholder="Masalan: M"
                value={form.kleidergroesse}
                onChange={(e) =>
                  setForm((p) => ({ ...p, kleidergroesse: e.target.value }))
                }
              />
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              💰 Soliq
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="Steueridentifikationsnummer"
                placeholder="Soliq raqami (agar mavjud bo'lsa)"
                value={form.steueridentifikationsnummer}
                onChange={(e) =>
                  setForm((p) => ({ ...p, steueridentifikationsnummer: e.target.value }))
                }
              />
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              🏥 Tibbiyot sug'urtasi
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="Krankenversicherung"
                placeholder="Tibbiyot sug'urtasi nomi va raqami"
                value={form.krankenversicherung}
                onChange={(e) =>
                  setForm((p) => ({ ...p, krankenversicherung: e.target.value }))
                }
              />
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              🏦 Bank ma'lumotlari
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="Name der Bank (Bank nomi)"
                placeholder="Masalan: Deutsche Bank"
                value={form.bankName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankName: e.target.value }))
                }
              />

              <FormInput
                label="IBAN"
                placeholder="IBAN nomeri"
                value={form.iban}
                onChange={(e) =>
                  setForm((p) => ({ ...p, iban: e.target.value }))
                }
              />

              <FormInput
                label="BIC"
                placeholder="BIC nomeri"
                value={form.bic}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bic: e.target.value }))
                }
              />
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              🛂 Viza ma'lumotlari
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="Art des Visums (Viza turi)"
                placeholder="Masalan: Arbeitsvisum"
                value={form.visaArt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, visaArt: e.target.value }))
                }
              />

              <FormInput
                label="Nummer des Visums (Viza nomeri)"
                placeholder="Viza nomeri"
                value={form.visaNummer}
                onChange={(e) =>
                  setForm((p) => ({ ...p, visaNummer: e.target.value }))
                }
              />

              <FormInput
                label="Gültigkeit des Visums (Amal qilish sanasi)"
                placeholder="Masalan: 01.01.2025 - 01.01.2026"
                value={form.visaGueltigkeit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, visaGueltigkeit: e.target.value }))
                }
              />
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              📅 Sana
            </div>

            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <FormInput
                label="Datum (Sana)"
                type="date"
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

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Eslatma</div>
              <div className="opacity-70">
                Generate sahifasida kandidat ma'lumotlari (ism, familiya, tug'ilgan sana,
                tug'ilgan joy, jins, manzil) avtomatik olinadi. Sana esa hujjat generate
                bo'lgan vaqt bo'ladi.
              </div>
            </div>
          </div>
        </section>

        <PersonalfragebogenLivePreview form={form} />
      </div>
    </div>
  );
}
