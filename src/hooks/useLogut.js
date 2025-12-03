import { signOut } from "firebase/auth";
import { useDispatch } from "react-redux";
import { auth } from "../firebase/config";
import { logout } from "../features/authSlice";
import toast from "react-hot-toast";
import { useState } from "react";

export const useLogout = () => {
  const dispatch = useDispatch();
  const [isPending, setIsPending] = useState(false);

  const logoutUser = () => {
    setIsPending(true);
    try {
      signOut(auth).then(() => {
        // Sign-out successful.
        dispatch(logout());
        setIsPending(false);
        toast.success("Abmeldung erfolgreich.");
      });
    } catch (error) {
      console.log(error.message);
      setIsPending(false);
      toast.error("Fehler bei der Abmeldung.");
    }
  };

  return { logoutUser, isPending };
};
