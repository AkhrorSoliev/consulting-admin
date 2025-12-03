import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { login } from "../features/authSlice";

function useLogin() {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const dispatch = useDispatch();

  const loginUser = async (email, password) => {
    setIsPending(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (!res.user) {
        throw new Error(
          "Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten."
        );
      }

      const user = res.user;
      dispatch(login(user));
      toast.success("Login erfolgreich!");
    } catch (err) {
      toast.error("Login fehlgeschlagen. Bitte versuchen Sie es erneut.");
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return { error, isPending, loginUser };
}

export default useLogin;
