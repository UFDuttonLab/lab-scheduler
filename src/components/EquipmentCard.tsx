import { Equipment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect?: (equipment: Equipment) => void;
}

export const EquipmentCard = ({ equipment, onSelect }: EquipmentCardProps) => {
  const statusConfig = {
    available: { label: "Available", className: "bg-success text-success-foreground" },
    "in-use": { label: "In Use", className: "bg-warning text-warning-foreground" },
    maintenance: { label: "Maintenance", className: "bg-destructive text-destructive-foreground" },
  };

  const status = statusConfig[equipment.status];

  return (
    <Card 
      className={cn(
        "p-6 hover:shadow-md transition-all cursor-pointer animate-fade-in",
        onSelect && "hover:border-primary"
      )}
      onClick={() => onSelect?.(equipment)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{equipment.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span>{equipment.location}</span>
            </div>
          </div>
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>
      
      {equipment.description && (
        <p className="text-sm text-muted-foreground">{equipment.description}</p>
      )}
    </Card>
  );
};
