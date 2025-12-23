import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import {
  buildStatusEmailTemplate,
  getStatusEmailCopy,
} from "../../utils/statusEmail";
import {
  deleteEmailTemplate,
  makeEmailTemplateId,
  saveEmailTemplate,
  subscribeToEmailTemplates,
} from "../../utils/emailTemplates";

const STAGES = [
  { value: "stage_1", label: "Stufe 1" },
  { value: "stage_2", label: "Stufe 2" },
  { value: "stage_3", label: "Stufe 3" },
  { value: "stage_4", label: "Stufe 4" },
];

const DECISIONS = [
  { value: "accepted", label: "Angenommen" },
  { value: "rejected", label: "Abgelehnt" },
];

function buildDefaultForm(stage, decision) {
  const copy = getStatusEmailCopy(stage, decision);
  return {
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "",
    subject: String(copy?.subject || ""),
    mainText: String(copy?.mainText || ""),
    nextStepNote: String(copy?.nextStepNote || ""),
    channelsText: String(copy?.channelsText || ""),
    emphasizeMainText: true,
  };
}

function EmailPreview({ subject, to, htmlContent, message }) {
  const safeSubject = String(subject || "").trim();
  const safeTo = String(to || "").trim();
  const safeHtml = String(htmlContent || "").trim();
  const safeMsg = String(message || "").trim();

  const inlineBodyHtml = useMemo(() => {
    if (!safeHtml) return "";
    // Prefer DOMParser (browser) to extract <body> content for smooth preview updates.
    try {
      if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(safeHtml, "text/html");
        const body = doc?.body;
        const inner = body?.innerHTML;
        if (typeof inner === "string") return inner;
      }
    } catch {
      // ignore and fallback below
    }
    // Fallback: best-effort regex extract body.
    const m = safeHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (m && typeof m[1] === "string") return m[1];
    return safeHtml;
  }, [safeHtml]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs opacity-60">An</div>
          <div className="font-medium wrap-break-word">{safeTo || "—"}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Betreff</div>
          <div className="font-medium wrap-break-word">
            {safeSubject || "—"}
          </div>
        </div>
      </div>

      {safeHtml ? (
        <div className="rounded-lg border border-base-300 bg-white overflow-hidden">
          <div className="w-full p-4">
            <div
              className="min-h-full"
              // Smooth preview (no iframe reload): render email body HTML inline.
              // This is used only in Settings -> Template Emaillar page.
              dangerouslySetInnerHTML={{ __html: inlineBodyHtml }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="text-xs opacity-60 mb-2">
            Kein HTML (Textvorschau)
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {safeMsg || "—"}
          </pre>
        </div>
      )}
    </div>
  );
}

function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function TemplateEmailsSettings() {
  const user = useSelector((s) => s.auth?.user);
  const [templatesMap, setTemplatesMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [stage, setStage] = useState("stage_1");
  const [decision, setDecision] = useState("accepted");

  const [form, setForm] = useState(() =>
    buildDefaultForm("stage_1", "accepted")
  );
  const [saving, setSaving] = useState(false);
  const debouncedForm = useDebouncedValue(form, 300);

  useEffect(() => {
    const unsub = subscribeToEmailTemplates((map) => {
      setTemplatesMap(map || {});
      setLoading(false);
    });
    return () => unsub?.();
  }, []);

  const templateId = useMemo(
    () => makeEmailTemplateId(stage, decision),
    [stage, decision]
  );

  const activeTemplate = templatesMap?.[templateId] || null;

  useEffect(() => {
    // Load defaults first, then overlay template values (if any).
    const base = buildDefaultForm(stage, decision);
    if (!activeTemplate) {
      setForm(base);
      return;
    }
    setForm({
      ...base,
      emailTitle:
        activeTemplate.emailTitle !== undefined
          ? String(activeTemplate.emailTitle || "")
          : base.emailTitle,
      statusLabel:
        activeTemplate.statusLabel !== undefined
          ? String(activeTemplate.statusLabel || "")
          : base.statusLabel,
      subject:
        activeTemplate.subject !== undefined
          ? String(activeTemplate.subject || "")
          : base.subject,
      mainText:
        activeTemplate.mainText !== undefined
          ? String(activeTemplate.mainText || "")
          : base.mainText,
      nextStepNote:
        activeTemplate.nextStepNote !== undefined
          ? String(activeTemplate.nextStepNote || "")
          : base.nextStepNote,
      channelsText:
        activeTemplate.channelsText !== undefined
          ? String(activeTemplate.channelsText || "")
          : base.channelsText,
      emphasizeMainText:
        activeTemplate.emphasizeMainText !== undefined
          ? Boolean(activeTemplate.emphasizeMainText)
          : base.emphasizeMainText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, activeTemplate]);

  const preview = useMemo(() => {
    try {
      const additionalInfo =
        stage === "stage_2"
          ? null
          : {
              dateTime: "2025-12-23T15:30",
              linkType: "zoom",
              link: "https://zoom.us/j/123456789",
              locationName: "ConsultingUZ ofisi",
              locationUrl: "https://maps.app.goo.gl/example",
            };

      const { subject, message, htmlContent } = buildStatusEmailTemplate({
        statusValue: stage,
        firstName: "Ali",
        lastName: "Valiyev",
        stageDecision: decision,
        decisionNote: "",
        additionalInfo,
        copyOverrides: {
          emailTitle: debouncedForm.emailTitle,
          statusLabel: debouncedForm.statusLabel,
          subject: debouncedForm.subject,
          mainText: debouncedForm.mainText,
          nextStepNote: debouncedForm.nextStepNote,
          channelsText: debouncedForm.channelsText,
          emphasizeMainText: debouncedForm.emphasizeMainText,
        },
      });
      return {
        to: "candidate@example.com",
        subject,
        message,
        htmlContent,
      };
    } catch (e) {
      console.error("template preview error:", e);
      return {
        to: "candidate@example.com",
        subject: "",
        message: "",
        htmlContent: "",
      };
    }
  }, [stage, decision, debouncedForm]);

  async function handleSave() {
    if (!templateId) return;
    setSaving(true);
    try {
      await saveEmailTemplate(stage, decision, {
        stage,
        decision,
        emailTitle: String(form.emailTitle || ""),
        statusLabel: String(form.statusLabel || ""),
        subject: String(form.subject || ""),
        mainText: String(form.mainText || ""),
        nextStepNote: String(form.nextStepNote || ""),
        channelsText: String(form.channelsText || ""),
        emphasizeMainText: Boolean(form.emphasizeMainText),
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || "admin",
      });
      toast.success("Vorlage gespeichert.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Fehler beim Speichern der Vorlage.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToDefault() {
    if (!templateId) return;
    const ok = window.confirm(
      "Möchten Sie diese Überschreibung löschen? (Standardtexte werden wiederhergestellt)"
    );
    if (!ok) return;
    setSaving(true);
    try {
      await deleteEmailTemplate(stage, decision);
      toast.success("Auf Standard zurückgesetzt.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Fehler beim Löschen.");
    } finally {
      setSaving(false);
    }
  }

  function handleLoadDefaultsIntoForm() {
    setForm(buildDefaultForm(stage, decision));
    toast(
      "Standardtexte wurden in das Formular geladen (noch nicht gespeichert)."
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-auto flex flex-col gap-1">
              <div className="text-sm font-medium">Stufe</div>
              <select
                className="select select-bordered w-full"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                disabled={saving}
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto flex flex-col gap-1">
              <div className="text-sm font-medium">Entscheidung</div>
              <select
                className="select select-bordered w-full"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={saving}
              >
                {DECISIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden md:block flex-1 min-w-[240px]" />

            <button
              type="button"
              className="btn btn-outline w-full sm:w-auto"
              onClick={handleLoadDefaultsIntoForm}
              disabled={saving || loading}
              title="Lädt Standardtexte in das Formular (ohne zu speichern)."
            >
              Standard laden
            </button>

            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Wird gespeichert...
                </>
              ) : (
                "Speichern"
              )}
            </button>
          </div>

          <div className="rounded-box border border-base-300 bg-base-200/30 p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">
                  E-Mail-Titel (HTML-Überschrift)
                </div>
                <input
                  className="input input-bordered w-full"
                  value={form.emailTitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, emailTitle: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">Betreff</div>
                <input
                  className="input input-bordered w-full"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">Status</div>
                <input
                  className="input input-bordered w-full"
                  placeholder="z. B.: Stufe 1 (internes Interview)"
                  value={form.statusLabel}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, statusLabel: e.target.value }))
                  }
                  disabled={saving}
                />
                <p className="text-xs opacity-60 mt-1">
                  Wenn leer, wird die Standard-Statusbezeichnung verwendet.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">Haupttext</div>
                <textarea
                  className="textarea textarea-bordered w-full min-h-[90px] sm:min-h-[110px]"
                  value={form.mainText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, mainText: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">
                  Hinweis zum nächsten Schritt
                </div>
                <textarea
                  className="textarea textarea-bordered w-full min-h-[90px] sm:min-h-[110px]"
                  value={form.nextStepNote}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nextStepNote: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">
                  Text für Kontaktkanäle
                </div>
                <textarea
                  className="textarea textarea-bordered w-full min-h-[90px]"
                  value={form.channelsText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, channelsText: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <label className="flex items-center gap-3 pt-1 select-none">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={Boolean(form.emphasizeMainText)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      emphasizeMainText: e.target.checked,
                    }))
                  }
                  disabled={saving}
                />
                <span className="text-sm">
                  Haupttext <span className="font-semibold">fett</span>{" "}
                  darstellen
                </span>
              </label>

              <div className="flex justify-stretch sm:justify-end">
                <button
                  type="button"
                  className="btn btn-error btn-outline w-full sm:w-auto whitespace-normal h-auto leading-snug"
                  onClick={handleResetToDefault}
                  disabled={saving || !activeTemplate}
                >
                  Auf Standard zurücksetzen (Überschreibung löschen)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="font-semibold shrink-0">Vorschau</div>
            <div className="text-xs text-base-content/60 flex-1 min-w-0 text-right truncate">
              Diese Vorschau verwendet nur Beispieldaten.
            </div>
          </div>
          <EmailPreview
            to={preview?.to}
            subject={preview?.subject}
            htmlContent={preview?.htmlContent}
            message={preview?.message}
          />
        </div>
      </div>
    </div>
  );
}
