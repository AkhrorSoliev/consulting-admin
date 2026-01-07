import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useParams,
  useLocation,
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
import { syncUserToFirestore } from "./utils/userSync";
import Create from "./pages/Create";
import Generate from "./pages/Generate";
import Profile from "./pages/Profile";
import Contract from "./pages/Contract";
import SettingsLayout from "./pages/settings/SettingsLayout";
import AdminsSettings from "./pages/settings/AdminsSettings";
import TemplateEmailsSettings from "./pages/settings/TemplateEmailsSettings";
import DocumentsSettings from "./pages/settings/DocumentsSettings";
import SettingsIndexRedirect from "./pages/settings/SettingsIndexRedirect";
import TelegramGroupsSettings from "./pages/settings/TelegramGroupsSettings";
import DirectionsSettings from "./pages/settings/DirectionsSettings";
import CandidatesLayout from "./pages/candidates/CandidatesLayout";
import CandidatesIndexRedirect from "./pages/candidates/CandidatesIndexRedirect";
import CandidatesAllUsers from "./pages/candidates/CandidatesAllUsers";
import CandidatesArchivedUsers from "./pages/candidates/CandidatesArchivedUsers";
import CandidatesDeletedUsers from "./pages/candidates/CandidatesDeletedUsers";
import CandidatesArchivedDirections from "./pages/candidates/CandidatesArchivedDirections";
import Vermittlungsvertrag from "./pages/Vermittlungsvertrag";
import Vollmacht from "./pages/Vollmacht";
import VollmachtArbeitgeber from "./pages/VollmachtArbeitgeber";
import DataExchange from "./pages/DataExchange";
import NotFound from "./pages/NotFound";
import { useDesktopOnly } from "./hooks/useDesktopOnly";
import DesktopOnlyBlockedPage from "./components/DesktopOnlyBlockedPage";
import { RouterErrorBoundary } from "./components/ErrorBoundary";

function DocumentsLegacyRedirect() {
  const { templateId } = useParams();
  const t = String(templateId || "").trim();
  return (
    <Navigate
      to={t ? `/settings/documents/${t}` : "/settings/documents"}
      replace
    />
  );
}

function DesktopOnlyWrapper({ children }) {
  const { isDesktop, isChecking } = useDesktopOnly();

  if (isChecking) {
    return null;
  }

  if (!isDesktop) {
    return <DesktopOnlyBlockedPage />;
  }

  return children;
}

function App() {
  const dispatch = useDispatch();
  const { authReady, user } = useSelector((state) => state.auth);
  const routes = createBrowserRouter([
    {
      path: "/",
      errorElement: <RouterErrorBoundary />,
      element: (
        <DesktopOnlyWrapper>
          <ProtectedRoutes user={user}>
            <MainLayout />
          </ProtectedRoutes>
        </DesktopOnlyWrapper>
      ),
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "profile",
          element: <Profile />,
        },
        {
          // legacy/short links
          path: "documents/:templateId",
          element: <DocumentsLegacyRedirect />,
        },
        {
          path: "settings",
          element: <SettingsLayout />,
          children: [
            { index: true, element: <SettingsIndexRedirect /> },
            { path: "admins", element: <AdminsSettings /> },
            { path: "telegram-groups", element: <TelegramGroupsSettings /> },
            { path: "directions", element: <DirectionsSettings /> },
            { path: "template-emails", element: <TemplateEmailsSettings /> },
            {
              path: "documents",
              element: <Outlet />,
              children: [
                { index: true, element: <DocumentsSettings /> },
                { path: "beratungsvertrag", element: <Contract /> },
                {
                  path: "vermittlungsvertrag",
                  element: <Vermittlungsvertrag />,
                },
                { path: "vollmacht", element: <Vollmacht /> },
                {
                  path: "vollmacht-arbeitgeber",
                  element: <VollmachtArbeitgeber />,
                },
              ],
            },
          ],
        },
        {
          path: "collectionCv/:major",
          element: <CollectionCv />,
        },
        {
          path: "generate/:major/:id",
          element: <Generate />,
        },
        {
          path: "candidates",
          element: <CandidatesLayout />,
          children: [
            { index: true, element: <CandidatesIndexRedirect /> },
            { path: "all", element: <CandidatesAllUsers /> },
            { path: "archived", element: <CandidatesArchivedUsers /> },
            { path: "deleted", element: <CandidatesDeletedUsers /> },
            {
              path: "archived-directions",
              element: <CandidatesArchivedDirections />,
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      element: (
        <DesktopOnlyWrapper>
          {user ? <Navigate to="/" /> : <Login />}
        </DesktopOnlyWrapper>
      ),
    },
    {
      path: "/create",
      element: <Create />,
    },
    {
      path: "/dataExchange/:id",
      element: <DataExchange />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(login(user));
        // Sync user data to Firestore users collection
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
