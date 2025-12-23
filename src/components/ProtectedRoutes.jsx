import { Navigate } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";

export const ProtectedRoutes = ({ children, user }) => {
  const { role, loadingRole } = useUserRole();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loadingRole) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg block mx-auto" />
          <p className="text-lg font-medium text-base-content">
            Ma&apos;lumotlar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="max-w-xl text-center space-y-3">
          <h1 className="text-2xl font-semibold text-base-content">
            Eingeschränktes Profil
          </h1>
          <p className="text-base text-base-content/80">
            Für dieses Konto wurde kein Admin-Typ hinterlegt. Daher kannst du
            derzeit keine Inhalte sehen. Bitte kontaktiere eine Administratorin
            oder einen Administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
