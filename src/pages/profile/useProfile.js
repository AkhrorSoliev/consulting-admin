import { useEffect, useMemo, useState } from "react";
import { updateProfile } from "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { auth } from "../../firebase/config";
import { uploadFileToFirebase } from "../../utils";
import { login } from "../../features/authSlice";
import { syncUserToFirestore } from "../../utils/userSync";

export default function useProfile() {
  const dispatch = useDispatch();
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
      if (!user) throw new Error("Bitte melden Sie sich zuerst an");
      const updates = {};
      if (formData.displayName && formData.displayName !== user.displayName) {
        updates.displayName = formData.displayName;
      }
      if (selectedFile) {
        const uploadedUrl = await uploadFileToFirebase(selectedFile, "avatars");
        updates.photoURL = uploadedUrl;
      }
      if (Object.keys(updates).length > 0) {
        await updateProfile(auth.currentUser, updates);
        dispatch(login(auth.currentUser));
        await syncUserToFirestore(auth.currentUser);
        setStatusMessage({ type: "success", text: "Daten aktualisiert" });
        if (updates.photoURL) {
          setAvatarPreview(updates.photoURL);
        }
        setSelectedFile(null);
      } else {
        setStatusMessage({
          type: "info",
          text: "Keine Änderungen gefunden",
        });
      }
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return {
    user,
    isEditing,
    setIsEditing,
    statusMessage,
    isSaving,
    formData,
    selectedFile,
    setSelectedFile,
    avatarPreview,
    contactDetails,
    handleInputChange,
    handleSave,
  };
}
