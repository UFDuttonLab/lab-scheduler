import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend, trendUp, className }: StatsCardProps) => {
  return (
    <Card className={cn("p-6 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2",
              trendUp ? "text-success" : "text-destructive"
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
};
