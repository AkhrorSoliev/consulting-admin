import React from "react";
import { FaTimes } from "react-icons/fa";

function LanguageSwitch({ language, setLanguage, switchLabel }) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <span className="text-sm font-medium text-base-content/70">
        {switchLabel}
      </span>
      <div className="flex items-center gap-1 bg-base-200 rounded-lg p-1">
        <button
          type="button"
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            language === "de"
              ? "bg-primary text-primary-content shadow-sm"
              : "text-base-content/60 hover:text-base-content"
          }`}
          onClick={() => setLanguage("de")}
        >
          Deutsch
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            language === "uz"
              ? "bg-primary text-primary-content shadow-sm"
              : "text-base-content/60 hover:text-base-content"
          }`}
          onClick={() => setLanguage("uz")}
        >
          O'zbek
        </button>
      </div>
    </div>
  );
}

function DocumentItem({ item, idx }) {
  const Icon = item.icon;
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-base-300 bg-base-200/40 hover:bg-base-200/60 transition-colors">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-content text-xs font-bold">
            {idx + 1}
          </span>
          <h3 className="font-semibold text-base-content">
            {item.title}
          </h3>
        </div>
        <p className="text-sm text-base-content/70 leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}

export default function ModalBody({ t, language, setLanguage, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="shrink-0 border-b border-base-300 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-base-content mb-1">
              {t.title}
            </h2>
            <p className="text-sm text-base-content/70">{t.subtitle}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle shrink-0"
            onClick={onClose}
            aria-label="Schließen"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        <LanguageSwitch
          language={language}
          setLanguage={setLanguage}
          switchLabel={t.switchLabel}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
        <div className="space-y-3">
          {t.items.map((item, idx) => (
            <DocumentItem key={idx} item={item} idx={idx} />
          ))}
        </div>

        {/* Note */}
        <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-sm text-base-content/80 leading-relaxed">
            <span className="font-semibold text-warning mr-1">💡</span>
            {t.note}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-base-300 px-6 py-4">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onClose}
        >
          {t.buttonText}
        </button>
      </div>
    </>
  );
}
