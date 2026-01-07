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
  { value: "stage_2_result", label: "Stufe 2 Ergebnis" },
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

function formatUpdatedAt(value) {
  if (!value) return "";
  try {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("uz-UZ", {
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

  const previewHtml = useMemo(() => {
    if (!inlineBodyHtml) return "";
    // Make email preview responsive on tablet/mobile.
    // Note: this does NOT change the actual sent email HTML, only the settings preview.
    const style = `
      <style>
        html, body { max-width: 100%; overflow-x: hidden; }
        table { max-width: 100% !important; width: 100% !important; }
        img { max-width: 100% !important; height: auto !important; }
        td, div, p, span { word-break: break-word; }
        a { word-break: break-all; }
      </style>
    `;
    return `${style}${inlineBodyHtml}`;
  }, [inlineBodyHtml]);

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
          <div className="w-full p-4 overflow-x-auto">
            <div
              className="min-h-full"
              // Smooth preview (no iframe reload): render email body HTML inline.
              // This is used only in Settings -> Template Emaillar page.
              dangerouslySetInnerHTML={{ __html: previewHtml }}
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
  const [baselineForm, setBaselineForm] = useState(() =>
    buildDefaultForm("stage_1", "accepted")
  );
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState("html"); // html | text
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
      setBaselineForm(base);
      return;
    }
    const next = {
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
    };
    setForm(next);
    setBaselineForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, activeTemplate]);

  const preview = useMemo(() => {
    try {
      const additionalInfo =
        stage === "stage_2" || stage === "stage_2_result"
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
      return {
        to: "candidate@example.com",
        subject: "",
        message: "",
        htmlContent: "",
      };
    }
  }, [stage, decision, debouncedForm]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(form) !== JSON.stringify(baselineForm);
    } catch {
      return true;
    }
  }, [form, baselineForm]);

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
      setBaselineForm(form);
    } catch (e) {
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">
            E-Mail-Vorlagen
          </h2>
          <p className="text-sm text-base-content/60">
            Passen Sie Texte für Status-E-Mails pro Stufe/Entscheidung an.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
          {activeTemplate ? (
            <span className="badge badge-primary badge-outline">
              Überschreibung aktiv
            </span>
          ) : (
            <span className="badge badge-ghost">Standard aktiv</span>
          )}
          {isDirty && (
            <span className="badge badge-warning badge-outline">
              Ungespeicherte Änderungen
            </span>
          )}
        </div>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col md:flex-row gap-3 md:items-end min-w-0">
            <label className="form-control w-full md:w-56">
              <div className="label py-0">
                <span className="label-text text-sm font-medium">Stufe</span>
              </div>
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
            </label>

            <label className="form-control w-full md:w-56">
              <div className="label py-0">
                <span className="label-text text-sm font-medium">
                  Entscheidung
                </span>
              </div>
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
            </label>

            <div className="text-xs text-base-content/60 md:pb-1 min-w-0">
              {activeTemplate?.updatedAt ? (
                <div className="truncate">
                  Letzte Änderung:{" "}
                  <span className="font-medium">
                    {formatUpdatedAt(activeTemplate.updatedAt)}
                  </span>
                  {activeTemplate?.updatedBy ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-mono">
                        {String(activeTemplate.updatedBy)}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="truncate">
                  Keine gespeicherte Überschreibung für diese Kombination.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
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
              disabled={saving || loading || !isDirty}
              title={
                isDirty
                  ? "Speichert diese Vorlage."
                  : "Keine Änderungen zum Speichern."
              }
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
        </div>
      </div>

      {loading ? (
        <div className="rounded-box border border-base-300 bg-base-100 p-4">
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner loading-sm" />
            <div className="text-sm text-base-content/70">
              Vorlagen werden geladen...
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-3 min-w-0">
            <div className="rounded-box border border-base-300 bg-base-200/30 p-3 sm:p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <label className="form-control w-full">
                  <div className="label py-0">
                    <span className="label-text text-sm font-medium">
                      E-Mail-Titel (HTML-Überschrift)
                    </span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    value={form.emailTitle}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, emailTitle: e.target.value }))
                    }
                    disabled={saving}
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label py-0">
                    <span className="label-text text-sm font-medium">
                      Betreff
                    </span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject: e.target.value }))
                    }
                    disabled={saving}
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label py-0">
                    <span className="label-text text-sm font-medium">
                      Status (optional)
                    </span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    placeholder="z. B.: Stufe 1 (internes Interview)"
                    value={form.statusLabel}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, statusLabel: e.target.value }))
                    }
                    disabled={saving}
                  />
                  <div className="label">
                    <span className="label-text-alt text-xs text-base-content/60">
                      Wenn leer, wird die Standard-Statusbezeichnung verwendet.
                    </span>
                  </div>
                </label>

                <label className="form-control w-full">
                  <div className="label py-0">
                    <span className="label-text text-sm font-medium">
                      Haupttext
                    </span>
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full min-h-[110px]"
                    value={form.mainText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, mainText: e.target.value }))
                    }
                    disabled={saving}
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label py-0">
                    <span className="label-text text-sm font-medium">
                      Hinweis zum nächsten Schritt
                    </span>
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full min-h-[110px]"
                    value={form.nextStepNote}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nextStepNote: e.target.value }))
                    }
                    disabled={saving}
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label py-0">
                    <span className="label-text text-sm font-medium">
                      Text für Kontaktkanäle
                    </span>
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full min-h-[90px]"
                    value={form.channelsText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, channelsText: e.target.value }))
                    }
                    disabled={saving}
                  />
                </label>

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
                    title={
                      activeTemplate
                        ? "Löscht die Überschreibung (Standardtexte werden wiederhergestellt)."
                        : "Keine Überschreibung vorhanden."
                    }
                  >
                    Auf Standard zurücksetzen (Überschreibung löschen)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 min-w-0 lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="font-semibold shrink-0">Vorschau</div>
              <div className="text-xs text-base-content/60 flex-1 min-w-0 text-right truncate">
                Diese Vorschau verwendet nur Beispieldaten.
              </div>
            </div>

            <div className="tabs tabs-boxed w-full">
              <button
                type="button"
                className={`tab ${previewMode === "html" ? "tab-active" : ""}`}
                onClick={() => setPreviewMode("html")}
              >
                HTML
              </button>
              <button
                type="button"
                className={`tab ${previewMode === "text" ? "tab-active" : ""}`}
                onClick={() => setPreviewMode("text")}
              >
                Text
              </button>
            </div>

            {previewMode === "html" ? (
              <div className="max-h-[70vh] overflow-auto rounded-box">
                <EmailPreview
                  to={preview?.to}
                  subject={preview?.subject}
                  htmlContent={preview?.htmlContent}
                  message={preview?.message}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-base-300 bg-base-100 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs opacity-60">An</div>
                    <div className="font-medium wrap-break-word">
                      {String(preview?.to || "").trim() || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Betreff</div>
                    <div className="font-medium wrap-break-word">
                      {String(preview?.subject || "").trim() || "—"}
                    </div>
                  </div>
                </div>
                <div className="divider my-3" />
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {String(preview?.message || "").trim() || "—"}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
