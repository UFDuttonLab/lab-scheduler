import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Settings, History, Wrench, BarChart3, LogOut, Clock, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNavigation } from "./MobileNavigation";
import { MobileHeader } from "./MobileHeader";

export const Navigation = () => {
  const location = useLocation();
  const { user, userRole, permissions, signOut } = useAuth();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <MobileNavigation />
      </>
    );
  }

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/quick-add", label: "Quick Add", icon: Clock },
    { path: "/equipment", label: "Equipment", icon: Wrench, requirePermission: 'canManageEquipment' },
    { path: "/analytics", label: "Analytics", icon: BarChart3, requirePermission: 'canViewAnalytics' },
    { path: "/history", label: "History", icon: History },
    { path: "/activity-log", label: "Activity Log", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings, requirePermission: 'canManageUsers' },
    { path: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-16 gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base block">Dutton Lab</span>
              <span className="text-xs text-muted-foreground">University of Florida</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 flex-1 justify-end">
            <div className="flex gap-2">
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
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l flex-shrink-0">
              <div className="text-right max-w-[200px]">
                <div className="text-sm font-medium truncate">{user?.email}</div>
                {userRole && userRole !== 'user' && (
                  <Badge variant="secondary" className="text-xs mt-0.5">{ROLE_LABELS[userRole]}</Badge>
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
