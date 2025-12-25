import { useEffect, useMemo, useState } from "react";
import { updateProfile } from "firebase/auth";
import { useSelector } from "react-redux";
import { auth } from "../firebase/config";
import { uploadFileToConsulting } from "../utils";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

function Profile() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.photoURL || "/default-avatar.png"
  );

  useEffect(() => {
    setFormData({
      displayName: user?.displayName || "",
    });
    setAvatarPreview(user?.photoURL || "/default-avatar.png");
  }, [user]);

  useEffect(() => {
    if (selectedFile) {
      const blobUrl = URL.createObjectURL(selectedFile);
      setAvatarPreview(blobUrl);
      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    }
    return undefined;
  }, [selectedFile]);

  const contactDetails = useMemo(
    () => [
      {
        key: "displayName",
        label: "Name",
        value: user?.displayName || "—",
        editable: true,
      },
      {
        key: "email",
        label: "Email",
        value: user?.email || "—",
        editable: false,
      },
    ],
    [user]
  );

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      if (!user) throw new Error("Avvalo tizimga kiring");
      const updates = {};
      if (formData.displayName && formData.displayName !== user.displayName) {
        updates.displayName = formData.displayName;
      }
      if (selectedFile) {
        const uploadedUrl = await uploadFileToConsulting(selectedFile);
        updates.photoURL = uploadedUrl;
      }
      if (Object.keys(updates).length > 0) {
        await updateProfile(auth.currentUser, updates);
        setStatusMessage({ type: "success", text: "Ma’lumotlar yangilandi" });
        if (updates.photoURL) {
          setAvatarPreview(updates.photoURL);
        }
        setSelectedFile(null);
      } else {
        setStatusMessage({
          type: "info",
          text: "Hech qanday o‘zgarish topilmadi",
        });
      }
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const statusClasses = {
    success: "text-success",
    info: "text-info",
    error: "text-error",
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-box border border-base-300 bg-bg-base-300 shadow-lg shadow-base-300">
          <div className="px-6 py-8 space-y-6">
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
                  src={avatarPreview}
                  alt="Profile avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-semibold">
                  {user?.displayName || "Foydalanuvchi"}
                </h1>
                <p className="text-sm text-base-content/60">
                  {user?.email || "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Kontakt ma’lumotlar</h2>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => setIsEditing((prev) => !prev)}
                >
                  {isEditing ? "Bekor qilish" : "O‘zgartirish"}
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
                  <label className="label-text text-sm font-semibold">
                    Avatar
                  </label>
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
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
