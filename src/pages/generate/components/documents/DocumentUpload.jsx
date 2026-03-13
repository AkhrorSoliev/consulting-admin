export default function DocumentUpload({
  selectedDocumentType,
  setSelectedDocumentType,
  handleDocumentFileChange,
  selectBase,
  fileInputBase,
}) {
  return (
    <div className="mb-2">
      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-80">
        Neues Dokument hochladen
      </h4>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className={selectBase}
          value={selectedDocumentType}
          onChange={(e) => setSelectedDocumentType(e.target.value)}
        >
          <option value="">Dokumenttyp wählen</option>
          <option value="passport">Reisepass</option>
          <option value="diplomas">Diplome</option>
          <option value="certificates">Zertifikate</option>
        </select>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className={fileInputBase}
          onChange={handleDocumentFileChange}
          disabled={!selectedDocumentType}
        />
      </div>
      {selectedDocumentType && (
        <div className="mt-2 text-xs opacity-70">
          Akzeptierte Formate: PDF, JPG, PNG, WEBP
        </div>
      )}
    </div>
  );
}
