import { useState } from "react";
import content from "./content";
import ModalBody from "./ModalBody";

function RequiredDocumentsModal({ open, onClose }) {
  const [language, setLanguage] = useState("de");

  if (!open) return null;

  const t = content[language];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalBody
          t={t}
          language={language}
          setLanguage={setLanguage}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default RequiredDocumentsModal;
