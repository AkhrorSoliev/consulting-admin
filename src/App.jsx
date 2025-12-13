import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import CollectionCv from "./pages/CollectionCv";
import { useDispatch, useSelector } from "react-redux";
import { ProtectedRoutes } from "./components/ProtectedRoutes";
import Login from "./pages/Login";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import { login, setAuthReady } from "./features/authSlice";
import Create from "./pages/Create";
import Generate from "./pages/Generate";
import Profile from "./pages/Profile";

function App() {
  const dispatch = useDispatch();
  const { authReady, user } = useSelector((state) => state.auth);
  const routes = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoutes user={user}>
          <MainLayout />
        </ProtectedRoutes>
      ),
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/collectionCv/:major",
          element: <CollectionCv />,
        },
        {
          path: "/generate/:major/:id",
          element: <Generate />,
        },
      ],
    },
    {
      path: "/login",
      element: user ? <Navigate to="/" /> : <Login />,
    },
    {
      path: "/create",
      element: <Create />,
    },
  ]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(login(user));
      }
      dispatch(setAuthReady());
    });
  }, []);

  return <>{authReady && <RouterProvider router={routes} />}</>;
}

export default App;
