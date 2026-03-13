import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import { functions } from "../../../firebase/config";

const call = (name) => httpsCallable(functions, name);

export default function useUserActions({ roleDrafts, setRoleDrafts, setLoading, loadUsers }) {
  const [pwModalUser, setPwModalUser] = useState(null);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const closePwModal = () => {
    const el = document.getElementById("set_password_modal");
    el?.close?.();
    setPwModalUser(null);
    setPw1("");
    setPw2("");
    setShowPw1(false);
    setShowPw2(false);
  };

  const handleRoleChange = (uid, value) => {
    if (!uid) return;
    setRoleDrafts((prev) => ({ ...prev, [uid]: value }));
  };

  const handleSetRole = async (uid) => {
    if (!uid) return;
    const role = roleDrafts[uid];
    if (!role) {
      toast.error("Rolle auswählen.");
      return;
    }
    setLoading(true);
    try {
      await call("setUserRole")({ uid, role });
      toast.success("Rolle wurde aktualisiert.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Rolle konnte nicht aktualisiert werden.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      await call("disableUser")({ uid });
      toast.success("Benutzer wurde deaktiviert.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Deaktivieren fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      await call("enableUser")({ uid });
      toast.success("Benutzer wurde aktiviert.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Aktivieren fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid) => {
    if (!uid) return;
    const ok = window.confirm(
      "Möchten Sie diesen Benutzer wirklich dauerhaft löschen?"
    );
    if (!ok) return;
    setLoading(true);
    try {
      await call("deleteUser")({ uid });
      toast.success("Benutzer wurde gelöscht.");
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Löschen fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const openPwModal = (uid, userEmail) => {
    if (!uid) return;
    setPwModalUser({ uid, email: userEmail || null });
    setPw1("");
    setPw2("");
    setShowPw1(false);
    setShowPw2(false);
    const el = document.getElementById("set_password_modal");
    el?.showModal?.();
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (!pwModalUser?.uid) return;

    const p1 = String(pw1 || "");
    const p2 = String(pw2 || "");

    if (p1.trim().length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    if (p1 !== p2) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      await call("setUserPassword")({ uid: pwModalUser.uid, password: p1 });
      toast.success("Passwort wurde aktualisiert.");
      closePwModal();
    } catch (err) {
      toast.error(err?.message || "Passwort ändern fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return {
    pwModalUser,
    pw1, setPw1,
    pw2, setPw2,
    showPw1, setShowPw1,
    showPw2, setShowPw2,
    handleRoleChange,
    handleSetRole,
    handleDisable,
    handleEnable,
    handleDelete,
    openPwModal,
    closePwModal,
    handlePwSubmit,
  };
}
