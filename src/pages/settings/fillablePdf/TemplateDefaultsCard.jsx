import { useEffect, useState } from "react";
import { FaSave, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import FormInput from "../../../components/FormInput";
import TEMPLATE_FIELD_CONFIGS from "./templateFieldConfigs";

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

export default function TemplateDefaultsCard({ templateId, label, savedData, onSave, onClear }) {
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
