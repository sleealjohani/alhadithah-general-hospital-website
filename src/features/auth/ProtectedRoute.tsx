import { Navigate } from "react-router-dom";
import type { AdminRole } from "../../types";
import { useAuth } from "./AuthContext";
import { AdminSetupNotice } from "../admin/AdminSetupContent";
import { SkeletonPage } from "../../components/ui/Skeleton";

export function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}) {
  const { status, profile } = useAuth();

  if (status === "loading") {
    return <SkeletonPage />;
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
