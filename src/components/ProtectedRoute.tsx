import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireManager?: boolean;
}

export const ProtectedRoute = ({ children, requireManager = false }: ProtectedRouteProps) => {
  const { user, isManager, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (requireManager && !isManager) {
        navigate("/");
      }
    }
  }, [user, isManager, loading, navigate, requireManager]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (requireManager && !isManager)) {
    return null;
  }

  return <>{children}</>;
};
