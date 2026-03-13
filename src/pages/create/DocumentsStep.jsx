import { FaFileAlt } from "react-icons/fa";
import PassportUpload from "./components/documents/PassportUpload";
import LangCertUpload from "./components/documents/LangCertUpload";
import DiplomaUpload from "./components/documents/DiplomaUpload";

export default function DocumentsStep({
  passportFiles,
  setPassportFiles,
  passportError,
  setPassportError,
  passportSizeError,
  setPassportSizeError,
  langCertFiles,
  setLangCertFiles,
  langCertSizeError,
  setLangCertSizeError,
  langCertTypeError,
  setLangCertTypeError,
  noLanguageCertificates,
  setNoLanguageCertificates,
  diplomaFiles,
  setDiplomaFiles,
  diplomaError,
  setDiplomaError,
  diplomaSizeError,
  setDiplomaSizeError,
  langCertTypes,
}) {
  return (
    <>
      <div className="divider mt-0">
        <span className="mx-auto inline-flex items-center gap-2">
          <FaFileAlt className="opacity-70" aria-hidden="true" />
          <span>Dokumente</span>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <PassportUpload
          passportFiles={passportFiles}
          setPassportFiles={setPassportFiles}
          passportError={passportError}
          setPassportError={setPassportError}
          passportSizeError={passportSizeError}
          setPassportSizeError={setPassportSizeError}
        />
        <LangCertUpload
          langCertFiles={langCertFiles}
          setLangCertFiles={setLangCertFiles}
          langCertSizeError={langCertSizeError}
          setLangCertSizeError={setLangCertSizeError}
          langCertTypeError={langCertTypeError}
          setLangCertTypeError={setLangCertTypeError}
          noLanguageCertificates={noLanguageCertificates}
          setNoLanguageCertificates={setNoLanguageCertificates}
          langCertTypes={langCertTypes}
        />
        <DiplomaUpload
          diplomaFiles={diplomaFiles}
          setDiplomaFiles={setDiplomaFiles}
          diplomaError={diplomaError}
          setDiplomaError={setDiplomaError}
          diplomaSizeError={diplomaSizeError}
          setDiplomaSizeError={setDiplomaSizeError}
        />
      </div>
    </>
  );
}
