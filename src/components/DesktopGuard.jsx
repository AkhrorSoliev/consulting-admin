import { useLocation } from "react-router-dom";
import { useDesktopOnly } from "../hooks/useDesktopOnly";
import DesktopOnlyBlockedPage from "./DesktopOnlyBlockedPage";

export default function DesktopGuard({ children }) {
  const location = useLocation();
  const { isDesktop, isChecking } = useDesktopOnly();

  const publicRoutes = ["/create", "/dataExchange"];
  const isPublicRoute = publicRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (isChecking) {
    return null;
  }

  if (!isDesktop && !isPublicRoute) {
    return <DesktopOnlyBlockedPage />;
  }

  return children;
}
