import { Navigate, Outlet } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Statistics from "../pages/Statistics";
import CollectionCv from "../pages/CollectionCv";
import { ProtectedRoutes } from "../components/ProtectedRoutes";
import Create from "../pages/Create";
import Generate from "../pages/Generate";
import Profile from "../pages/Profile";
import Contract from "../pages/Contract";
import SettingsLayout from "../pages/settings/SettingsLayout";
import AdminsSettings from "../pages/settings/AdminsSettings";
import TemplateEmailsSettings from "../pages/settings/TemplateEmailsSettings";
import DocumentsSettings from "../pages/settings/DocumentsSettings";
import SettingsIndexRedirect from "../pages/settings/SettingsIndexRedirect";
import TelegramGroupsSettings from "../pages/settings/TelegramGroupsSettings";
import TelegramChannelsSettings from "../pages/settings/TelegramChannelsSettings";
import DirectionsSettings from "../pages/settings/DirectionsSettings";
import FillablePdfDefaultsSettings from "../pages/settings/FillablePdfDefaultsSettings";
import CandidatesLayout from "../pages/candidates/CandidatesLayout";
import CandidatesIndexRedirect from "../pages/candidates/CandidatesIndexRedirect";
import CandidatesAllUsers from "../pages/candidates/CandidatesAllUsers";
import CandidatesArchivedUsers from "../pages/candidates/archivedUsers";
import CandidatesDeletedUsers from "../pages/candidates/CandidatesDeletedUsers";
import CandidatesArchivedDirections from "../pages/candidates/CandidatesArchivedDirections";
import Vermittlungsvertrag from "../pages/Vermittlungsvertrag";
import Vollmacht from "../pages/Vollmacht";
import VollmachtArbeitgeber from "../pages/VollmachtArbeitgeber";
import RozilikXati from "../pages/RozilikXati";
import NomzodRozilikXati from "../pages/NomzodRozilikXati";
import Mitarbeiterwohnung from "../pages/Mitarbeiterwohnung";
import Sprachsbestaetigung from "../pages/Sprachsbestaetigung";
import Einwilligungserklaerung from "../pages/Einwilligungserklaerung";
import FotoVideoRozilik from "../pages/FotoVideoRozilik";
import Personalfragebogen from "../pages/Personalfragebogen";
import ErklaerungBeschaeftigung from "../pages/ErklaerungBeschaeftigung";
import ZusatzblattA from "../pages/ZusatzblattA";
import ZusatzblattB from "../pages/ZusatzblattB";
import ZusatzblattC from "../pages/ZusatzblattC";
import ZusatzblattD from "../pages/ZusatzblattD";
import Beschaeftigungsverhaeltnis from "../pages/beschaeftigungsverhaeltnis";
import DataExchange from "../pages/DataExchange";
import NotFound from "../pages/NotFound";
import { RouterErrorBoundary } from "../components/ErrorBoundary";
import Login from "../pages/Login";
import DocumentsLegacyRedirect from "./DocumentsLegacyRedirect";
import DesktopOnlyWrapper from "./DesktopOnlyWrapper";

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
        { path: "statistics", element: <Statistics /> },
        { path: "profile", element: <Profile /> },
        { path: "documents/:templateId", element: <DocumentsLegacyRedirect /> },
        {
          path: "settings",
          element: <SettingsLayout />,
          children: [
            { index: true, element: <SettingsIndexRedirect /> },
            { path: "admins", element: <AdminsSettings /> },
            { path: "telegram-groups", element: <TelegramGroupsSettings /> },
            { path: "telegram-channels", element: <TelegramChannelsSettings /> },
            { path: "directions", element: <DirectionsSettings /> },
            { path: "template-emails", element: <TemplateEmailsSettings /> },
            { path: "fillable-pdf-defaults", element: <FillablePdfDefaultsSettings /> },
            {
              path: "documents",
              element: <Outlet />,
              children: [
                { index: true, element: <DocumentsSettings /> },
                { path: "beratungsvertrag", element: <Contract /> },
                { path: "vermittlungsvertrag", element: <Vermittlungsvertrag /> },
                { path: "vollmacht", element: <Vollmacht /> },
                { path: "vollmacht-arbeitgeber", element: <VollmachtArbeitgeber /> },
                { path: "rozilik-xati", element: <RozilikXati /> },
                { path: "nomzod-rozilik-xati", element: <NomzodRozilikXati /> },
                { path: "mitarbeiterwohnung", element: <Mitarbeiterwohnung /> },
                { path: "sprachsbestaetigung", element: <Sprachsbestaetigung /> },
                { path: "einwilligungserklaerung", element: <Einwilligungserklaerung /> },
                { path: "foto-video-rozilik", element: <FotoVideoRozilik /> },
                { path: "personalfragebogen", element: <Personalfragebogen /> },
                { path: "erklaerung-beschaeftigung", element: <ErklaerungBeschaeftigung /> },
                { path: "zusatzblatt-a", element: <ZusatzblattA /> },
                { path: "zusatzblatt-b", element: <ZusatzblattB /> },
                { path: "zusatzblatt-c", element: <ZusatzblattC /> },
                { path: "zusatzblatt-d", element: <ZusatzblattD /> },
                { path: "beschaeftigungsverhaeltnis", element: <Beschaeftigungsverhaeltnis /> },
              ],
            },
          ],
        },
        { path: "collectionCv/:major", element: <CollectionCv /> },
        { path: "generate/:major/:id", element: <Generate /> },
        {
          path: "candidates",
          element: <CandidatesLayout />,
          children: [
            { index: true, element: <CandidatesIndexRedirect /> },
            { path: "all", element: <CandidatesAllUsers /> },
            { path: "archived", element: <CandidatesArchivedUsers /> },
            { path: "deleted", element: <CandidatesDeletedUsers /> },
            { path: "archived-directions", element: <CandidatesArchivedDirections /> },
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
    { path: "/create", element: <Create /> },
    { path: "/dataExchange/:id", element: <DataExchange /> },
    { path: "*", element: <NotFound /> },
  ];
}
