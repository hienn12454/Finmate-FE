import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactElement } from "react";

interface AdminRouteProps {
  children: ReactElement;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0e27",
          color: "white",
          fontSize: "1.2rem",
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role
  const userAny = user as any;
  const role = userAny?.role || userAny?.userRole || "";
  if (role.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
