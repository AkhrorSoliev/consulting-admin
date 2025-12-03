import { Navigate } from "react-router-dom";

export const ProtectedRoutes = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};
