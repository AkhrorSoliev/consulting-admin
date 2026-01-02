import { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FormInput from "../components/FormInput";
import { fromInputDate, toInputDate } from "../utils";
import VollmachtArbeitgeberPdfDocument from "./contract/pdf/VollmachtArbeitgeberPdfDocument";
import VollmachtArbeitgeberLivePreview from "./contract/components/VollmachtArbeitgeberLivePreview";
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

function migrateLegacyCandidateFields(form) {
  const next = { ...form };

  const normalize = (value) => String(value || "").trim();

  if (
    !normalize(next.candidateFirstName) &&
    !normalize(next.candidateLastName)
  ) {
    const fullName = normalize(next.candidateFullName);
    if (fullName) {
      const parts = fullName.split(/\s+/);
      const first = parts.shift() || "";
      next.candidateFirstName = first;
      next.candidateLastName = parts.join(" ");
    }
  }

  if (!normalize(next.candidateBirthCountry) && normalize(next.candidateLand)) {
    next.candidateBirthCountry = normalize(next.candidateLand);
  }

  if (
    !normalize(next.candidateBirthDate) ||
    !normalize(next.candidateBirthPlace) ||
    !normalize(next.candidateBirthCountry)
  ) {
    const legacyBirth = normalize(next.candidateBirthInfo);
    if (legacyBirth) {
      const segments = legacyBirth
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!normalize(next.candidateBirthDate) && segments[0])
        next.candidateBirthDate = segments[0];
      if (!normalize(next.candidateBirthPlace) && segments[1])
        next.candidateBirthPlace = segments[1];
      if (!normalize(next.candidateBirthCountry) && segments[2])
        next.candidateBirthCountry = segments.slice(2).join(", ");
    }
  }

  const legacyStreet = normalize(
    next.candidateStreetLegacy || next.candidateStreet
  );
  if (legacyStreet && !normalize(next.candidateHouseNumber)) {
    const match = legacyStreet.match(/^(.*?)[\s,]+(\d+\w*)$/);
    if (match) {
      if (!normalize(next.candidateStreet))
        next.candidateStreet = match[1].trim();
      next.candidateHouseNumber = match[2].trim();
    } else if (!normalize(next.candidateStreet)) {
      next.candidateStreet = legacyStreet;
    }
  }

  const legacyCity = normalize(next.candidateCityLegacy || next.candidateCity);
  if (legacyCity) {
    const parts = legacyCity.split(/\s+/).filter(Boolean);
    if (parts.length >= 1 && !normalize(next.candidatePostalCode)) {
      const maybePostal = parts[0];
      if (/^\d{4,6}$/.test(maybePostal)) {
        next.candidatePostalCode = maybePostal;
        parts.shift();
      }
    }
    if (parts.length >= 1 && !normalize(next.candidateCountry)) {
      const maybeCountry = parts[parts.length - 1];
      next.candidateCountry = maybeCountry;
      parts.pop();
    }
    if (parts.length && !normalize(next.candidateCity)) {
      next.candidateCity = parts.join(" ");
    }
  }

  if (!normalize(next.candidatePostalCode) && normalize(next.candidatePLZ)) {
    next.candidatePostalCode = normalize(next.candidatePLZ);
  }

  if (!normalize(next.candidateCountry) && normalize(next.candidateLand)) {
    next.candidateCountry = normalize(next.candidateLand);
  }

  return next;
}

const OPTIONAL_FIELDS = [
  "candidateFirstName",
  "candidateLastName",
  "candidateBirthDate",
  "candidateBirthPlace",
  "candidateBirthCountry",
  "candidateStreet",
  "candidateHouseNumber",
  "candidatePostalCode",
  "candidateCity",
  "candidateCountry",
  "candidatePhone",
  "candidateEmail",
  "candidatePlaceDate",
  "employerCompany",
  "employerLocation",
  "employerRepName",
  "employerRepAddress",
  "employerRepPhone",
  "employerRepEmail",
  "employerPlaceDate",
  "employerDesignation",
  "employerRepFullName",
  // legacy
  "candidateFullName",
  "candidateBirthInfo",
];

function getOmitKey(fieldKey) {
  if (!fieldKey) return "";
  return `omit${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`;
}

function createInitialFormState() {
  const state = {
    // Vollmachtgeber (Candidate) fields
    candidateFirstName: "",
    candidateLastName: "",
    candidateBirthDate: "",
    candidateBirthPlace: "",
    candidateBirthCountry: "",
    candidateStreet: "",
    candidateHouseNumber: "",
    candidatePostalCode: "",
    candidateCity: "",
    candidateCountry: "",
    candidatePhone: "",
    candidateEmail: "",
    candidatePlaceDate: todayDdMmYyyy(),

    // Arbeitgeber (Employer) fields
    employerCompanyName: "",
    employerStreet: "",
    employerHouseNumber: "",
    employerPostalCode: "",
    employerCity: "",
    employerCountry: "",
    employerRepFirstName: "",
    employerRepLastName: "",
    employerRepStreet: "",
    employerRepHouseNumber: "",
    employerRepPostalCode: "",
    employerRepCity: "",
    employerRepCountry: "",
    employerRepPhone: "",
    employerRepEmail: "",
    employerPlaceDate: todayDdMmYyyy(),

    // Dynamic text fields
    employerDesignation: "",
    employerRepFullName: "",

    // Legacy fallbacks (will be migrated if present)
    candidateFullName: "",
    candidateBirthInfo: "",
    candidateStreetLegacy: "",
    candidateCityLegacy: "",
  };

  OPTIONAL_FIELDS.forEach((key) => {
    const omitKey = getOmitKey(key);
    if (omitKey) {
      state[omitKey] = false;
    }
  });

  return state;
}

export default function VollmachtArbeitgeber() {
  const { role, loadingRole } = useUserRole();
  const canWriteTemplate =
    !loadingRole && (role === "super_admin" || role === "admin");
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(() => createInitialFormState());

  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
  const lastSavedJsonRef = useRef("");
  const didHydrateRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const TEMPLATE_COLLECTION = "template_documents";
  const TEMPLATE_ID = "vollmacht_arbeitgeber";

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
        const normalizedSaved = {
          ...createInitialFormState(),
          ...savedForm,
        };
        const migrated = migrateLegacyCandidateFields(normalizedSaved);
        setForm((prev) => {
          const merged = { ...prev, ...migrated };
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
    const first = String(form.candidateFirstName || "").trim();
    const last = String(form.candidateLastName || "").trim();
    return [first, last].filter(Boolean).join(" ");
  }, [form.candidateFirstName, form.candidateLastName]);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const fileBase = fullName
        ? `Vollmacht Arbeitgeber ${fullName}`
        : "Vollmacht Arbeitgeber";
      const safeFileName =
        fileBase.replace(/[\\/:*?"<>|]/g, "").trim() || "Vollmacht Arbeitgeber";
      const blob = await pdf(
        <VollmachtArbeitgeberPdfDocument form={form} />
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

  const handleFieldChange = (fieldKey, value) => {
    setForm((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleOmitToggle = (fieldKey, checked) => {
    const omitKey = getOmitKey(fieldKey);
    if (!omitKey) return;
    setForm((prev) => {
      const next = { ...prev, [omitKey]: checked };
      if (checked) {
        next[fieldKey] = "";
      }
      return next;
    });
  };

  const renderField = ({
    key,
    label,
    placeholder,
    helperText,
    type = "text",
    allowOmit = true,
  }) => {
    const omitKey = getOmitKey(key);
    const omitted = allowOmit ? Boolean(form[omitKey]) : false;
    const toggleControl = allowOmit ? (
      <label className="inline-flex items-center gap-2 whitespace-nowrap">
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={omitted}
          onChange={(e) => handleOmitToggle(key, e.target.checked)}
        />
        <span>Ma'lumot yo'q</span>
      </label>
    ) : null;

    let helperContent = helperText ?? null;
    if (allowOmit) {
      helperContent = helperText ? (
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>{helperText}</span>
          {toggleControl}
        </span>
      ) : (
        <span className="flex justify-end">{toggleControl}</span>
      );
    }

    const inputValue =
      type === "date" ? toInputDate(String(form[key] || "")) : form[key];

    const handleChange = (e) => {
      const raw = e.target.value;
      const nextValue = type === "date" ? fromInputDate(raw) : raw;
      handleFieldChange(key, nextValue);
    };

    return (
      <FormInput
        key={key}
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        helperText={allowOmit ? helperContent : helperText}
        type={type}
        disabled={omitted}
      />
    );
  };

  const candidateNameFields = [
    {
      key: "candidateFirstName",
      label: "Vorname",
      placeholder: "z.B. Max",
    },
    {
      key: "candidateLastName",
      label: "Nachname",
      placeholder: "z.B. Mustermann",
    },
  ];

  const candidateBirthFields = [
    {
      key: "candidateBirthDate",
      label: "Geburtsdatum",
      type: "date",
    },
    {
      key: "candidateBirthPlace",
      label: "Geburtsort",
      placeholder: "z.B. Taschkent",
    },
    {
      key: "candidateBirthCountry",
      label: "Geburtsland",
      placeholder: "z.B. Usbekistan",
    },
  ];

  const candidateAddressFields = [
    {
      key: "candidateStreet",
      label: "Straße",
      placeholder: "z.B. Musterstraße",
    },
    {
      key: "candidateHouseNumber",
      label: "Hausnummer",
      placeholder: "z.B. 123",
    },
    {
      key: "candidatePostalCode",
      label: "PLZ",
      placeholder: "z.B. 12345",
    },
    {
      key: "candidateCity",
      label: "Ort",
      placeholder: "z.B. Taschkent",
    },
    {
      key: "candidateCountry",
      label: "Land",
      placeholder: "z.B. Usbekistan",
    },
  ];

  const candidateContactFields = [
    {
      key: "candidatePhone",
      label: "Telefonnummer",
      placeholder: "z.B. +998 90 123 45 67",
    },
    {
      key: "candidateEmail",
      label: "E-Mail",
      placeholder: "z.B. max@example.com",
      type: "email",
    },
  ];

  const candidateSignatureFields = [
    {
      key: "candidatePlaceDate",
      label: "Ort, Datum (Unterschrift)",
      placeholder: "z.B. Taschkent, 27.12.2025",
    },
  ];

  const employerBasicFields = [
    {
      key: "employerCompanyName",
      label: "Firmenname (Firma nomi)",
      placeholder: "z.B.: Heinrich Pott GmbH & Co. KG",
    },
    {
      key: "employerStreet",
      label: "Straße (Ko'cha)",
      placeholder: "z.B.: Bergkirchener Str.",
    },
    {
      key: "employerHouseNumber",
      label: "Hausnummer (Uy raqami)",
      placeholder: "z.B.: 99",
    },
    {
      key: "employerPostalCode",
      label: "PLZ (Pochta indeksi)",
      placeholder: "z.B.: 32429",
    },
    {
      key: "employerCity",
      label: "Ort (Shahar)",
      placeholder: "z.B.: Minden",
    },
    {
      key: "employerCountry",
      label: "Land (Davlat)",
      placeholder: "z.B.: Deutschland",
    },
  ];

  const employerRepresentativeFields = [
    {
      key: "employerRepFirstName",
      label: "Vorname (Ism)",
      placeholder: "z.B.: Patrick",
    },
    {
      key: "employerRepLastName",
      label: "Nachname (Familiya)",
      placeholder: "z.B.: Pott",
    },
    {
      key: "employerRepStreet",
      label: "Straße (Ko'cha)",
      placeholder: "z.B.: Musterstraße",
    },
    {
      key: "employerRepHouseNumber",
      label: "Hausnummer (Uy raqami)",
      placeholder: "z.B.: 1",
    },
    {
      key: "employerRepPostalCode",
      label: "PLZ (Pochta indeksi)",
      placeholder: "z.B.: 10115",
    },
    {
      key: "employerRepCity",
      label: "Ort (Shahar)",
      placeholder: "z.B.: Berlin",
    },
    {
      key: "employerRepCountry",
      label: "Land (Davlat)",
      placeholder: "z.B.: Deutschland",
    },
    {
      key: "employerRepPhone",
      label: "Telefonnummer (Vertreter)",
      placeholder: "z.B. +49 30 123456",
    },
    {
      key: "employerRepEmail",
      label: "E-Mail (Vertreter)",
      placeholder: "z.B. schmidt@firma.de",
      type: "email",
    },
  ];

  const employerSignatureFields = [
    {
      key: "employerPlaceDate",
      label: "Ort, Datum (Unterschrift)",
      placeholder: "z.B. Berlin, 27.12.2025",
    },
  ];

  const dynamicFields = [
    {
      key: "employerDesignation",
      label: "Bezeichnung des Arbeitgebers",
      placeholder: "z.B. Musterfirma GmbH",
      helperText: 'Wird im Text "Hiermit bevollmächtige ich [...]" verwendet',
    },
    {
      key: "employerRepFullName",
      label: "Name der bevollmächtigten Person",
      placeholder: "z.B. Hans Schmidt",
      helperText: 'Wird im Text "vertreten durch [...]" verwendet',
    },
  ];

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
              <li className="opacity-70">Vollmacht an Arbeitgeber</li>
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
          <div className="card-body space-y-4">
            <h2 className="card-title text-2xl font-bold">
              Vollmacht an Arbeitgeber ausfüllen
            </h2>
            <p className="text-sm opacity-70">
              Füllen Sie alle erforderlichen Felder für die Vollmacht nach § 81a
              Abs. 1 AufenthG aus.
            </p>

            <div className="divider divider-start font-bold text-base-content/80">
              👤 Vollmachtgeber (Kandidat)
            </div>

            {/* Personal Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Persönliche Angaben
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidateNameFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            {/* Birth Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Geburtsdaten
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {candidateBirthFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Adresse
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  {renderField(candidateAddressFields[0])}
                </div>
                {renderField(candidateAddressFields[1])}
                {renderField(candidateAddressFields[2])}
                <div className="sm:col-span-2 lg:col-span-1">
                  {renderField(candidateAddressFields[3])}
                </div>
                {renderField(candidateAddressFields[4])}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Kontaktdaten
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidateContactFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            {/* Signature Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Unterschrift
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {candidateSignatureFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              🏢 Arbeitgeber
            </div>

            {/* Company Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-secondary rounded-full"></span>
                Firmenangaben
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employerBasicFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            {/* Representative Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-secondary rounded-full"></span>
                Vertretungsberechtigte Person
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {employerRepresentativeFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            {/* Employer Signature */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-secondary rounded-full"></span>
                Unterschrift
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {employerSignatureFields.map((cfg) => renderField(cfg))}
              </div>
            </div>

            <div className="divider divider-start font-bold text-base-content/80">
              ⚙️ Dynamische Textfelder
            </div>
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full"></span>
                Zusätzliche Texte
              </h3>
              {dynamicFields.map(renderField)}
            </div>

            <div className="divider" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Tipp</div>
              <div className="opacity-70">
                Wenn Felder leer bleiben, werden in der Vollmacht
                Platzhalter‑Linien angezeigt.
              </div>
            </div>
          </div>
        </section>

        <VollmachtArbeitgeberLivePreview form={form} />
      </div>
    </div>
  );
}
