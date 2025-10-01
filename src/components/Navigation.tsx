import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Settings, History, Wrench, BarChart3, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";

export const Navigation = () => {
  const location = useLocation();
  const { user, userRole, permissions, signOut } = useAuth();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/quick-add", label: "Quick Add", icon: Clock },
    { path: "/equipment", label: "Equipment", icon: Wrench, requirePermission: 'canManageEquipment' },
    { path: "/analytics", label: "Analytics", icon: BarChart3, requirePermission: 'canViewAnalytics' },
    { path: "/history", label: "History", icon: History },
    { path: "/settings", label: "Settings", icon: Settings, requirePermission: 'canManageUsers' },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-xl block">Dutton Lab</span>
              <span className="text-xs text-muted-foreground">University of Florida</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {navItems.map((item) => {
                if (item.requirePermission && !permissions[item.requirePermission as keyof typeof permissions]) {
                  return null;
                }
                
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right">
                <div className="text-sm font-medium">{user?.email}</div>
                {userRole && userRole !== 'user' && (
                  <Badge variant="secondary" className="text-xs">{ROLE_LABELS[userRole]}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
