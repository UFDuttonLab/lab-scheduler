import { Equipment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect?: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
}

export const EquipmentCard = ({ equipment, onSelect, onEdit, onDelete }: EquipmentCardProps) => {
  const statusConfig = {
    available: { label: "Available", className: "bg-success text-success-foreground" },
    "in-use": { label: "In Use", className: "bg-warning text-warning-foreground" },
    maintenance: { label: "Maintenance", className: "bg-destructive text-destructive-foreground" },
  };

  const status = statusConfig[equipment.status];

  return (
    <Card 
      className={cn(
        "p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer animate-fade-in active:scale-[0.98]",
        onSelect && "hover:border-primary"
      )}
      onClick={() => onSelect?.(equipment)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
            {equipment.icon || "🛠️"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate">{equipment.name}</h3>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{equipment.location}</span>
            </div>
            {equipment.type === "HiPerGator" && (equipment.maxCpuCount || equipment.maxGpuCount) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {equipment.maxCpuCount && <span>CPUs: {equipment.maxCpuCount}</span>}
                {equipment.maxGpuCount && <span>GPUs: {equipment.maxGpuCount}</span>}
              </div>
            )}
          </div>
        </div>
        <Badge className={cn(status.className, "self-start")}>{status.label}</Badge>
      </div>
      
      {equipment.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">{equipment.description}</p>
      )}
      
      {(onEdit || onDelete) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(equipment);
              }}
              className="flex-1 min-h-[44px]"
            >
              <Pencil className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(equipment);
              }}
              className="flex-1 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
