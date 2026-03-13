import { useDesktopOnly } from "../hooks/useDesktopOnly";
import DesktopOnlyBlockedPage from "../components/DesktopOnlyBlockedPage";

export default function DesktopOnlyWrapper({ children }) {
  const { isDesktop, isChecking } = useDesktopOnly();

  if (isChecking) {
    return null;
  }

  if (!isDesktop) {
    return <DesktopOnlyBlockedPage />;
  }

  return children;
}
