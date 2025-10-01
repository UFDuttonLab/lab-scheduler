import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AppRole, getRolePermissions, RolePermissions } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  permissions: RolePermissions;
  isManager: boolean; // Deprecated: use permissions instead
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>(getRolePermissions(null));
  const [isManager, setIsManager] = useState(false); // Deprecated
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      // Role priority: pi > manager > postdoc > grad_student > undergrad_student > user
      const rolePriority: Record<AppRole, number> = {
        pi: 6,
        manager: 5,
        postdoc: 4,
        grad_student: 3,
        undergrad_student: 2,
        user: 1,
      };

      // Get all roles and pick the highest priority one
      const roles = (data || []).map(r => r.role as AppRole);
      const highestRole = roles.length > 0 
        ? roles.reduce((highest, current) => 
            (rolePriority[current] || 0) > (rolePriority[highest] || 0) ? current : highest
          )
        : 'user';

      setUserRole(highestRole);
      setPermissions(getRolePermissions(highestRole));
      setIsManager(highestRole === 'manager' || highestRole === 'pi'); // For backward compatibility
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole(null);
      setPermissions(getRolePermissions(null));
      setIsManager(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check user role
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setPermissions(getRolePermissions(null));
          setIsManager(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, permissions, isManager, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
