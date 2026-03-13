import FormInput from "../../../components/FormInput";

function parseMoneyEur(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/\D+/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export default function ContractFormPricing({ form, setForm }) {
  const restEur = (() => {
    const total = parseMoneyEur(form.feeTotalEur);
    const adv = parseMoneyEur(form.feeAdvanceEur);
    if (total == null || adv == null) return "";
    const r = total - adv;
    if (!Number.isFinite(r)) return "";
    return String(Math.max(0, Math.trunc(r)));
  })();

  return (
    <>
      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full"></span>
          PDF Einstellungen
        </h3>
        <FormInput
          label="PDF link (test)"
          placeholder="https://example.com/file.pdf"
          value={form.pdfUrl}
          onChange={(e) =>
            setForm((p) => ({ ...p, pdfUrl: e.target.value }))
          }
          helperText={
            <span className="text-xs opacity-70">
              Faqat PDF URL'ni qo'ying (console error matnini emas). CORS
              bo'lsa, proxy orqali aylanib o'tamiz.
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
      </div>

      <div className="divider divider-start font-bold text-base-content/80">
        💰 Vergütung (Preis)
      </div>

      <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
          <span className="w-1 h-4 bg-success rounded-full"></span>
          Honorar Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Honorar gesamt (€)"
            placeholder="z.B. 1200"
            inputMode="numeric"
            pattern="\\d*"
            value={form.feeTotalEur}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                feeTotalEur: String(e.target.value || "").replace(
                  /\D+/g,
                  ""
                ),
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
                feeAdvanceEur: String(e.target.value || "").replace(
                  /\D+/g,
                  ""
                ),
              }))
            }
          />
        </div>
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
              Wird automatisch als{" "}
              <span className="font-semibold">Gesamt − Anzahlung</span>{" "}
              berechnet.
            </span>
          }
        />
      </div>

      <div className="divider" />
      <div className="text-sm">
        <div className="font-semibold mb-1">Tipp</div>
        <div className="opacity-70">
          Wenn Name leer bleibt, werden im Vertrag Platzhalter‑Linien
          angezeigt.
        </div>
      </div>
    </>
  );
}
