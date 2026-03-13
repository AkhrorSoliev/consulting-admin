import { useCallback } from "react";
import toast from "react-hot-toast";
import RequiredLabel from "../../../components/RequiredLabel";
import { imageFileToBase64 } from "../../../utils";

function RequiredField({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

/**
 * Photo upload + preview field.
 */
export default function PersonalInfoPhotoField({
  register, errors, setValue, clearErrors,
  watchPhoto, photoSizeError, setPhotoSizeError,
  getSuccessClass, REQUIRED_STAR_CLASS, MAX_PHOTO_BYTES,
}) {
  const handlePhotoFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) { setPhotoSizeError(false); return; }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Foto darf maximal 250 KB gro\u00DF sein.");
      setPhotoSizeError(true);
      try { e.target.value = ""; } catch { /* ignore */ }
      setValue("personalInfo.photo", "", { shouldDirty: true, shouldValidate: true });
      return;
    }
    setPhotoSizeError(false);
    try {
      const base64 = await imageFileToBase64(file, {
        maxWidth: 1200, maxHeight: 1200, quality: 0.9, mimeType: "image/jpeg",
      });
      clearErrors("personalInfo.photo");
      setValue("personalInfo.photo", base64, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } catch (err) { /* ignore */ }
  }, [setValue, clearErrors, setPhotoSizeError, MAX_PHOTO_BYTES]);

  return (
    <RequiredField className="md:col-span-2">
      <label className="label flex-col items-start gap-1" htmlFor="personalInfo-photo-file">
        <RequiredLabel className={`label-text ${REQUIRED_STAR_CLASS} line-clamp-1`}>
          Ihr eigenes Foto(JPEG/PNG)
        </RequiredLabel>
        <span className="label-text-alt text-xs text-base-content/70">
          Eigenes 3\u00D74\u2011Passfoto. Bis 250 KB
        </span>
      </label>
      <input type="hidden" {...register("personalInfo.photo", { required: "Foto ist erforderlich" })} />
      <input
        id="personalInfo-photo-file" type="file" accept="image/*"
        className={`file-input file-input-bordered w-full ${errors?.personalInfo?.photo ? "file-input-error" : getSuccessClass("personalInfo.photo", watchPhoto, "file")}`}
        onChange={handlePhotoFileChange}
      />
      {photoSizeError ? (
        <p className="text-error text-sm mt-1">
          Foto ist zu gro\u00DF. Komprimieren:{" "}
          <a className="link link-primary" href="https://imagecompressor.com/" target="_blank" rel="noopener noreferrer">imagecompressor.com</a>
        </p>
      ) : null}
    </RequiredField>
  );
}
