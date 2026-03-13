import React from "react";
import CustomEmailForm from "./CustomEmailForm";

export default function CustomEmailModal({
  open,
  onClose,
  onSubmit,
  isSending,
  form,
  setForm,
  emailPreview,
  placeholders,
}) {
  if (!open) return null;

  const safeForm = form || {};
  const safePlaceholders = placeholders || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div
        className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl mx-4">
        <div className="bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Benutzerdefinierte E-Mail senden
              </h3>
              <p className="text-sm opacity-70">
                Schreiben Sie Betreff und Text selbst. Wenn Felder leer bleiben,
                werden die Standardtexte verwendet.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Modal schließen"
            >
              ✕
            </button>
          </div>

          <CustomEmailForm
            onSubmit={onSubmit}
            isSending={isSending}
            onClose={onClose}
            safeForm={safeForm}
            setForm={setForm}
            safePlaceholders={safePlaceholders}
            emailPreview={emailPreview}
          />
        </div>
      </div>
    </div>
  );
}
