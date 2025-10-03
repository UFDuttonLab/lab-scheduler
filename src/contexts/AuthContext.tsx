import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AppRole, getRolePermissions, RolePermissions } from "@/lib/permissions";
import { toast } from "sonner";

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
  const lastUserIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  const logAuthActivity = async (action: 'login' | 'logout', userId: string) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action_type: action,
        entity_type: 'user',
        entity_id: userId,
        entity_name: 'Authentication'
      });
    } catch (error) {
      console.error(`Failed to log ${action}:`, error);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      // First check if user is active
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // If user is inactive, sign them out
      if (profile && !profile.active) {
        await signOut();
        toast.error("Your account has been deactivated");
        return;
      }

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
        // Update ref BEFORE updating state
        if (session?.user) {
          lastUserIdRef.current = session.user.id;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log authentication events
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            logAuthActivity('login', session.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Use the ref to get the last authenticated user ID
          const userIdToLog = lastUserIdRef.current;
          if (userIdToLog) {
            setTimeout(() => {
              logAuthActivity('logout', userIdToLog);
            }, 0);
          }
          // Clear the ref after logging
          lastUserIdRef.current = null;
        }
        
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
    const currentUserId = user?.id;
    
    // Log logout BEFORE clearing state
    if (currentUserId) {
      try {
        await logAuthActivity('logout', currentUserId);
      } catch (error) {
        console.error("Failed to log logout activity:", error);
      }
    }
    
    try {
      // Clear local state
      setSession(null);
      setUser(null);
      setUserRole(null);
      setPermissions(getRolePermissions(null));
      setIsManager(false);
      
      // Attempt server logout (may fail if session is invalid)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn("Server logout failed, but local state cleared:", error.message);
        // Clear any remaining localStorage auth data
        localStorage.removeItem('sb-ypaobygipbnkvnismhyy-auth-token');
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Force clear local storage on any error
      localStorage.removeItem('sb-ypaobygipbnkvnismhyy-auth-token');
    } finally {
      // Always navigate to auth page regardless of outcome
      navigate("/auth");
    }
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
