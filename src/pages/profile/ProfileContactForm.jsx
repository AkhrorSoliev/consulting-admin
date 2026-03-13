const statusClasses = {
  success: "text-success",
  info: "text-info",
  error: "text-error",
};

export default function ProfileContactForm({
  isEditing,
  setIsEditing,
  statusMessage,
  isSaving,
  formData,
  selectedFile,
  setSelectedFile,
  contactDetails,
  handleInputChange,
  handleSave,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kontaktinformationen</h2>
        <button
          type="button"
          className="btn btn-xs btn-outline"
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? "Abbrechen" : "Bearbeiten"}
        </button>
      </div>
      {statusMessage && (
        <p className={`text-sm ${statusClasses[statusMessage.type]}`}>
          {statusMessage.text}
        </p>
      )}
      <form className="space-y-4" onSubmit={handleSave}>
        <div className="grid gap-4 md:grid-cols-2">
          {contactDetails.map((item) => (
            <div key={item.key} className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-base-content/50">
                {item.label}
              </p>
              {isEditing && item.editable ? (
                <input
                  className="input input-bordered w-full"
                  type={item.key === "email" ? "email" : "text"}
                  value={formData[item.key] || ""}
                  onChange={(event) =>
                    handleInputChange(item.key, event.target.value)
                  }
                  disabled={!isEditing}
                />
              ) : (
                <p className="text-base font-medium">{item.value}</p>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="label-text text-sm font-semibold">Avatar</label>
          <input
            type="file"
            accept="image/*"
            disabled={!isEditing}
            className="file-input file-input-bordered w-full"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] || null)
            }
          />
          {selectedFile && (
            <p className="text-xs text-base-content/60">
              {selectedFile.name}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!isEditing || isSaving}
        >
          {isSaving ? "Wird gespeichert..." : "Speichern"}
        </button>
      </form>
    </div>
  );
}
