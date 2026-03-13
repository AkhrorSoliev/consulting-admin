import { lazy, Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { ProtectedRoutes } from "../components/ProtectedRoutes";
import { RouterErrorBoundary } from "../components/ErrorBoundary";
import DesktopOnlyWrapper from "./DesktopOnlyWrapper";

// Eagerly loaded (needed on first paint)
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";

// Lazy loaded pages
const Statistics = lazy(() => import("../pages/Statistics"));
const CollectionCv = lazy(() => import("../pages/CollectionCv"));
const Create = lazy(() => import("../pages/Create"));
const Generate = lazy(() => import("../pages/Generate"));
const Profile = lazy(() => import("../pages/Profile"));
const Contract = lazy(() => import("../pages/Contract"));
const DataExchange = lazy(() => import("../pages/DataExchange"));

// Settings
const SettingsLayout = lazy(() => import("../pages/settings/SettingsLayout"));
const AdminsSettings = lazy(() => import("../pages/settings/AdminsSettings"));
const TemplateEmailsSettings = lazy(() => import("../pages/settings/TemplateEmailsSettings"));
const DocumentsSettings = lazy(() => import("../pages/settings/DocumentsSettings"));
const SettingsIndexRedirect = lazy(() => import("../pages/settings/SettingsIndexRedirect"));
const TelegramGroupsSettings = lazy(() => import("../pages/settings/TelegramGroupsSettings"));
const TelegramChannelsSettings = lazy(() => import("../pages/settings/TelegramChannelsSettings"));
const DirectionsSettings = lazy(() => import("../pages/settings/DirectionsSettings"));
const FillablePdfDefaultsSettings = lazy(() => import("../pages/settings/FillablePdfDefaultsSettings"));

// Candidates
const CandidatesLayout = lazy(() => import("../pages/candidates/CandidatesLayout"));
const CandidatesIndexRedirect = lazy(() => import("../pages/candidates/CandidatesIndexRedirect"));
const CandidatesAllUsers = lazy(() => import("../pages/candidates/CandidatesAllUsers"));
const CandidatesArchivedUsers = lazy(() => import("../pages/candidates/archivedUsers"));
const CandidatesDeletedUsers = lazy(() => import("../pages/candidates/CandidatesDeletedUsers"));
const CandidatesArchivedDirections = lazy(() => import("../pages/candidates/CandidatesArchivedDirections"));

// Documents (heavy PDF pages)
const Vermittlungsvertrag = lazy(() => import("../pages/Vermittlungsvertrag"));
const Vollmacht = lazy(() => import("../pages/Vollmacht"));
const VollmachtArbeitgeber = lazy(() => import("../pages/VollmachtArbeitgeber"));
const RozilikXati = lazy(() => import("../pages/RozilikXati"));
const NomzodRozilikXati = lazy(() => import("../pages/NomzodRozilikXati"));
const Mitarbeiterwohnung = lazy(() => import("../pages/Mitarbeiterwohnung"));
const Sprachsbestaetigung = lazy(() => import("../pages/Sprachsbestaetigung"));
const Einwilligungserklaerung = lazy(() => import("../pages/Einwilligungserklaerung"));
const FotoVideoRozilik = lazy(() => import("../pages/FotoVideoRozilik"));
const Personalfragebogen = lazy(() => import("../pages/Personalfragebogen"));
const ErklaerungBeschaeftigung = lazy(() => import("../pages/ErklaerungBeschaeftigung"));
const ZusatzblattA = lazy(() => import("../pages/ZusatzblattA"));
const ZusatzblattB = lazy(() => import("../pages/ZusatzblattB"));
const ZusatzblattC = lazy(() => import("../pages/ZusatzblattC"));
const ZusatzblattD = lazy(() => import("../pages/ZusatzblattD"));
const Beschaeftigungsverhaeltnis = lazy(() => import("../pages/beschaeftigungsverhaeltnis"));
const DocumentsLegacyRedirect = lazy(() => import("./DocumentsLegacyRedirect"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}

function Lazy({ children }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

export function buildRoutes(user) {
  return [
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
        { index: true, element: <Home /> },
        { path: "statistics", element: <Lazy><Statistics /></Lazy> },
        { path: "profile", element: <Lazy><Profile /></Lazy> },
        { path: "documents/:templateId", element: <Lazy><DocumentsLegacyRedirect /></Lazy> },
        {
          path: "settings",
          element: <Lazy><SettingsLayout /></Lazy>,
          children: [
            { index: true, element: <Lazy><SettingsIndexRedirect /></Lazy> },
            { path: "admins", element: <Lazy><AdminsSettings /></Lazy> },
            { path: "telegram-groups", element: <Lazy><TelegramGroupsSettings /></Lazy> },
            { path: "telegram-channels", element: <Lazy><TelegramChannelsSettings /></Lazy> },
            { path: "directions", element: <Lazy><DirectionsSettings /></Lazy> },
            { path: "template-emails", element: <Lazy><TemplateEmailsSettings /></Lazy> },
            { path: "fillable-pdf-defaults", element: <Lazy><FillablePdfDefaultsSettings /></Lazy> },
            {
              path: "documents",
              element: <Outlet />,
              children: [
                { index: true, element: <Lazy><DocumentsSettings /></Lazy> },
                { path: "beratungsvertrag", element: <Lazy><Contract /></Lazy> },
                { path: "vermittlungsvertrag", element: <Lazy><Vermittlungsvertrag /></Lazy> },
                { path: "vollmacht", element: <Lazy><Vollmacht /></Lazy> },
                { path: "vollmacht-arbeitgeber", element: <Lazy><VollmachtArbeitgeber /></Lazy> },
                { path: "rozilik-xati", element: <Lazy><RozilikXati /></Lazy> },
                { path: "nomzod-rozilik-xati", element: <Lazy><NomzodRozilikXati /></Lazy> },
                { path: "mitarbeiterwohnung", element: <Lazy><Mitarbeiterwohnung /></Lazy> },
                { path: "sprachsbestaetigung", element: <Lazy><Sprachsbestaetigung /></Lazy> },
                { path: "einwilligungserklaerung", element: <Lazy><Einwilligungserklaerung /></Lazy> },
                { path: "foto-video-rozilik", element: <Lazy><FotoVideoRozilik /></Lazy> },
                { path: "personalfragebogen", element: <Lazy><Personalfragebogen /></Lazy> },
                { path: "erklaerung-beschaeftigung", element: <Lazy><ErklaerungBeschaeftigung /></Lazy> },
                { path: "zusatzblatt-a", element: <Lazy><ZusatzblattA /></Lazy> },
                { path: "zusatzblatt-b", element: <Lazy><ZusatzblattB /></Lazy> },
                { path: "zusatzblatt-c", element: <Lazy><ZusatzblattC /></Lazy> },
                { path: "zusatzblatt-d", element: <Lazy><ZusatzblattD /></Lazy> },
                { path: "beschaeftigungsverhaeltnis", element: <Lazy><Beschaeftigungsverhaeltnis /></Lazy> },
              ],
            },
          ],
        },
        { path: "collectionCv/:major", element: <Lazy><CollectionCv /></Lazy> },
        { path: "generate/:major/:id", element: <Lazy><Generate /></Lazy> },
        {
          path: "candidates",
          element: <Lazy><CandidatesLayout /></Lazy>,
          children: [
            { index: true, element: <Lazy><CandidatesIndexRedirect /></Lazy> },
            { path: "all", element: <Lazy><CandidatesAllUsers /></Lazy> },
            { path: "archived", element: <Lazy><CandidatesArchivedUsers /></Lazy> },
            { path: "deleted", element: <Lazy><CandidatesDeletedUsers /></Lazy> },
            { path: "archived-directions", element: <Lazy><CandidatesArchivedDirections /></Lazy> },
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
    { path: "/create", element: <Lazy><Create /></Lazy> },
    { path: "/dataExchange/:id", element: <Lazy><DataExchange /></Lazy> },
    { path: "*", element: <NotFound /> },
  ];
}
