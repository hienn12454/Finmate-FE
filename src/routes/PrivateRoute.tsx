import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactElement } from "react";

interface PrivateRouteProps {
  children: ReactElement;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth to load
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #a8d8ea 0%, #ffaaa7 100%)",
          color: "white",
          fontSize: "1.2rem",
        }}
      >
        Đang tải...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
