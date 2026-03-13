import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import useProfile from "./profile/useProfile";
import ProfileContactForm from "./profile/ProfileContactForm";

function Profile() {
  const navigate = useNavigate();
  const p = useProfile();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-base-200/90 px-6 py-8 space-y-6 rounded-box border border-base-300 max-w-3xl w-full">
        <div className="flex justify-start">
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-2 normal-case px-3"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={14} />
            Zurück
          </button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="h-32 w-32 rounded-full border-4 border-base-200 bg-base-200 shadow-xl">
            <img
              src={p.avatarPreview}
              alt="Profilbild"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              {p.user?.displayName || "Benutzer"}
            </h1>
            <p className="text-sm text-base-content/60">{p.user?.email || "—"}</p>
          </div>
        </div>

        <ProfileContactForm
          isEditing={p.isEditing}
          setIsEditing={p.setIsEditing}
          statusMessage={p.statusMessage}
          isSaving={p.isSaving}
          formData={p.formData}
          selectedFile={p.selectedFile}
          setSelectedFile={p.setSelectedFile}
          contactDetails={p.contactDetails}
          handleInputChange={p.handleInputChange}
          handleSave={p.handleSave}
        />
      </div>
    </div>
  );
}

export default Profile;
