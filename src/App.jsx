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

  if (!authReady) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="navbar bg-base-100 shadow-sm px-4">
          <div className="h-8 w-24 bg-base-300 rounded animate-pulse" />
          <div className="flex-1" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-base-300 rounded animate-pulse" />
            <div className="h-8 w-20 bg-base-300 rounded animate-pulse" />
            <div className="h-8 w-20 bg-base-300 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-6">
          <div className="h-10 w-64 bg-base-300 rounded animate-pulse mb-4" />
          <div className="h-64 bg-base-300 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return <RouterProvider router={routes} />;
}

export default App;
