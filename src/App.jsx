import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import { login, setAuthReady } from "./features/authSlice";
import { syncUserToFirestore } from "./utils/userSync";
import { buildRoutes } from "./app/routeConfig";

function App() {
  const dispatch = useDispatch();
  const { authReady, user } = useSelector((state) => state.auth);
  const routes = createBrowserRouter(buildRoutes(user));

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(login(user));
        try {
          await syncUserToFirestore(user);
        } catch (error) {
          // Silent error handling
        }
      }
      dispatch(setAuthReady());
    });
  }, [dispatch]);

  return <>{authReady && <RouterProvider router={routes} />}</>;
}

export default App;
