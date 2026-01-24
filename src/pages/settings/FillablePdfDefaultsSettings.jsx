import { useEffect, useState } from "react";
import { FaSave, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import useUserRole from "../../hooks/useUserRole";
import {
  FILLABLE_PDF_TEMPLATE_IDS,
  FILLABLE_PDF_TEMPLATE_LABELS,
  subscribeToFillablePdfDefaults,
  saveFillablePdfDefaults,
  clearFillablePdfDefaults,
} from "../../utils/fillablePdfDefaults";
import FormInput from "../../components/FormInput";

const TEMPLATE_FIELD_CONFIGS = {
  erklaerung_beschaeftigung: [
    { key: "txtf_10_Firma", label: "Firma/Name", type: "text" },
    { key: "txtf_11_Strasse", label: "Straße", type: "text" },
    { key: "txtf_12_Hausnummer", label: "Hausnummer", type: "text" },
    { key: "txtf_13_Postleitzahl", label: "Postleitzahl", type: "text" },
    { key: "txtf_14_Ort", label: "Ort", type: "text" },
    { key: "txtf_15_Kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "txtf_16_Telefon", label: "Telefon", type: "text" },
    { key: "txtf_17_E-Mail", label: "E-Mail", type: "email" },
    { key: "txtf_18_Telefax", label: "Telefax", type: "text" },
    { key: "txtf_19_Betriebsnummer", label: "Betriebsnummer", type: "text" },
    { key: "txtf_57_Ort", label: "Unterschrift Ort", type: "text" },
  ],
  zusatzblatt_a: [
    { key: "txtf_4_Anerkennungsbehoerde", label: "Anerkennungsbehörde Name", type: "text" },
    { key: "txtf_5_Strasse", label: "Straße", type: "text" },
    { key: "txtf_6_Hausnummer", label: "Hausnummer", type: "text" },
    { key: "txtf_7_PLZ", label: "Postleitzahl", type: "text" },
    { key: "txtf_8_Ort", label: "Ort", type: "text" },
    { key: "txtf_20_Ort", label: "Unterschrift Ort", type: "text" },
  ],
  zusatzblatt_b: [
    { key: "txtf_5_aufnehmende_niederlassung", label: "Aufnehmende Niederlassung", type: "text" },
    { key: "txtf_6_strasse", label: "Straße (aufnehmend)", type: "text" },
    { key: "txtf_7_hausnummer", label: "Hausnummer (aufnehmend)", type: "text" },
    { key: "txtf_8_plz", label: "PLZ (aufnehmend)", type: "text" },
    { key: "txtf_9_ort", label: "Ort (aufnehmend)", type: "text" },
    { key: "txtf_10_entsendende_niederlassung", label: "Entsendende Niederlassung", type: "text" },
    { key: "txtf_11_strasse", label: "Straße (entsendend)", type: "text" },
    { key: "txtf_12_hausnummer", label: "Hausnummer (entsendend)", type: "text" },
    { key: "txtf_13_plz", label: "PLZ (entsendend)", type: "text" },
    { key: "txtf_14_ort", label: "Ort (entsendend)", type: "text" },
    { key: "txtf_15_staat", label: "Staat", type: "text" },
    { key: "txtf_18_erklarung_ort", label: "Unterschrift Ort", type: "text" },
  ],
  zusatzblatt_c: [
    { key: "txtf_13_grundqualifikationsstaat", label: "Grundqualifikationsstaat", type: "text" },
    { key: "txtf_26_erklarung_ort", label: "Unterschrift Ort", type: "text" },
  ],
  zusatzblatt_d: [
    { key: "txtf_11_erklarung_ort", label: "Unterschrift Ort", type: "text" },
  ],
};

function formatUpdatedAt(value) {
  if (!value) return "";
  try {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "";
  }
}

function TemplateDefaultsCard({ templateId, label, savedData, onSave, onClear }) {
  const fields = TEMPLATE_FIELD_CONFIGS[templateId] || [];
  const [form, setForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = savedData?.[f.key] || "";
    });
    setForm(initial);
  }, [savedData, fields]);

  const hasAnyValue = Object.values(form).some((v) => v && String(v).trim());
  const hasSavedData = savedData && Object.keys(savedData).some((k) => k !== "updatedAt" && savedData[k]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(templateId, form);
      toast.success("Standardwerte gespeichert");
    } catch (err) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    if (!window.confirm("Möchten Sie alle Standardwerte für dieses Template löschen?")) return;
    setIsClearing(true);
    try {
      await onClear(templateId);
      setForm({});
      toast.success("Standardwerte gelöscht");
    } catch (err) {
      toast.error(err.message || "Fehler beim Löschen");
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-base-200/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{label}</h3>
          <p className="text-sm text-base-content/60">
            {hasSavedData ? (
              <>
                <span className="text-success">● Standardwerte gespeichert</span>
                {savedData?.updatedAt && (
                  <span className="ml-2 text-xs">
                    (zuletzt: {formatUpdatedAt(savedData.updatedAt)})
                  </span>
                )}
              </>
            ) : (
              <span className="text-base-content/40">Keine Standardwerte</span>
            )}
          </p>
        </div>
        <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {expanded && (
        <div className="border-t border-base-300 p-4 space-y-4">
          {fields.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Keine konfigurierbaren Felder für dieses Template.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((field) => (
                <FormInput
                  key={field.key}
                  label={field.label}
                  type={field.type || "text"}
                  value={form[field.key] || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={isSaving || !hasAnyValue}
            >
              <FaSave className="w-3 h-3" />
              {isSaving ? "Speichern..." : "Speichern"}
            </button>
            {hasSavedData && (
              <button
                type="button"
                className="btn btn-sm btn-outline btn-error"
                onClick={handleClear}
                disabled={isClearing}
              >
                <FaTrash className="w-3 h-3" />
                {isClearing ? "Löschen..." : "Löschen"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FillablePdfDefaultsSettings() {
  const { role, loadingRole } = useUserRole({ forceRefresh: true });
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const canAccess = isSuperAdmin || isAdmin;

  const [defaultsMap, setDefaultsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return undefined;
    }
    const unsub = subscribeToFillablePdfDefaults((map) => {
      setDefaultsMap(map || {});
      setLoading(false);
    });
    return () => unsub?.();
  }, [canAccess]);

  if (loadingRole || loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/60">Wird geladen...</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="alert alert-warning">
        <span>
          Diese Funktion ist nur für Administratoren verfügbar.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Fillable PDF Standardwerte</h2>
        <p className="text-sm text-base-content/60">
          Hier können Sie Standardwerte für die ausfüllbaren PDF-Formulare festlegen.
          Diese Werte werden automatisch in die Formulare eingetragen, wenn ein
          Kandidat das Dokument öffnet.
        </p>
      </div>

      <div className="space-y-3">
        {FILLABLE_PDF_TEMPLATE_IDS.map((templateId) => (
          <TemplateDefaultsCard
            key={templateId}
            templateId={templateId}
            label={FILLABLE_PDF_TEMPLATE_LABELS[templateId]}
            savedData={defaultsMap[templateId]}
            onSave={saveFillablePdfDefaults}
            onClear={clearFillablePdfDefaults}
          />
        ))}
      </div>
    </div>
  );
}
