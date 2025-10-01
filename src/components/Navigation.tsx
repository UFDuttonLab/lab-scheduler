import { Link, useLocation } from "react-router-dom";
import { Calendar, LayoutDashboard, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const location = useLocation();
  
  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/schedule", label: "Schedule", icon: Calendar },
    { to: "/equipment", label: "Equipment", icon: Settings },
    { to: "/history", label: "History", icon: History },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary" />
            <span className="text-xl font-bold">Lab Scheduler</span>
          </div>
          
          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
