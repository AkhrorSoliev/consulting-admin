export default function PhotoUploadField({
  fileInputBase,
  handlePhotoFileChange,
}) {
  return (
    <div className="md:col-span-2 form-control w-full">
      <label
        className="label pb-1 flex-col items-start gap-1"
        htmlFor="g-photo-file"
      >
        <span className="label-text font-medium">
          Foto hochladen (JPEG/PNG) (Ihr eigenes Foto)
        </span>
        <span className="label-text-alt text-xs text-base-content/70">
          Eigenes 3x4-Passfoto. Bis 250 KB
        </span>
      </label>
      <input
        id="g-photo-file"
        type="file"
        accept="image/*"
        className={fileInputBase}
        onChange={handlePhotoFileChange}
      />
    </div>
  );
}
