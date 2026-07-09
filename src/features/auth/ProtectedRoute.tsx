import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import type { AdminRole } from "../../types";
import { useAuth } from "./AuthContext";
import { AdminSetupNotice } from "../admin/AdminSetupContent";

export function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}) {
  const { status, profile } = useAuth();

  if (status === "loading") {
    return (
      <main className="loading-page">
        <Loader2 className="spin" />
      </main>
    );
  }

  if (status === "no-profile") {
    return <AdminSetupNotice />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
