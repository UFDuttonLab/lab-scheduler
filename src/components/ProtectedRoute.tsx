import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requirePermission?: 'canManageUsers' | 'canManageProjects' | 'canManageEquipment' | 'canViewAnalytics';
}

export const ProtectedRoute = ({ children, requirePermission }: ProtectedRouteProps) => {
  const { user, permissions, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (requirePermission && !permissions[requirePermission]) {
        navigate("/");
      }
    }
  }, [user, permissions, loading, navigate, requirePermission]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (requirePermission && !permissions[requirePermission])) {
    return null;
  }

  return <>{children}</>;
};
