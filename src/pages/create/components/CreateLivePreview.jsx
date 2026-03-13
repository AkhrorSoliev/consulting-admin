import LivePreview from "../../generate/components/LivePreview";

/**
 * Desktop live-preview sidebar shown to the right of the form.
 *
 * Props:
 *   isSubmitted, previewCv, openPhotoModal
 */
export default function CreateLivePreview({
  isSubmitted,
  previewCv,
  openPhotoModal,
}) {
  if (isSubmitted !== false) return null;

  return (
    <LivePreview
      formCv={previewCv}
      commentMeta={null}
      showDocuments={false}
      showComment={false}
      showCommentDate={false}
      onPhotoClick={openPhotoModal}
      enableClickZoom={true}
      containerClassName="hidden lg:block lg:flex-[0_0_50%] min-w-0 h-full"
    />
  );
}
