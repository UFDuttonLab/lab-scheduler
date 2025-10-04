import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Settings, History, Wrench, BarChart3, Clock, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const MobileNavigation = () => {
  const location = useLocation();
  const { permissions } = useAuth();
  const isZombieUnlocked = sessionStorage.getItem('zombieLunchUnlocked') === 'true';
  const isARMicrobeUnlocked = sessionStorage.getItem('arMicrobeUnlocked') === 'true';

  const baseNavItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/quick-add", label: "Add", icon: Clock },
    { path: "/equipment", label: "Equipment", icon: Wrench, requirePermission: 'canManageEquipment' },
    { path: "/analytics", label: "Stats", icon: BarChart3, requirePermission: 'canViewAnalytics' },
    { path: "/history", label: "History", icon: History },
    { path: "/activity-log", label: "Activity", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings, requirePermission: 'canManageUsers' },
    { path: "/help", label: "Help", icon: HelpCircle },
  ];

  // Add AR Microbe game if unlocked
  if (isARMicrobeUnlocked) {
    baseNavItems.splice(3, 0, { 
      path: "/ar-microbe-shooter", 
      label: "AR Game", 
      icon: (() => <span className="text-xl">🦠</span>) as any
    });
  }

  const navItems = baseNavItems.filter(item => !item.requirePermission || permissions[item.requirePermission as keyof typeof permissions]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom overflow-x-auto">
      <div className="flex items-center justify-start min-w-max h-16 px-2 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-3 rounded-lg transition-all",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {typeof Icon === 'function' && item.path === '/ar-microbe-shooter' ? (
                <Icon />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
