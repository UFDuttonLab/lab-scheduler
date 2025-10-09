import { PROJECT_COLORS } from "@/lib/projectColors";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  usedColors?: Set<string>;
}

export function ColorPicker({ value, onChange, usedColors = new Set() }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {PROJECT_COLORS.map((color) => {
        const isSelected = value === color;
        const isUsed = usedColors.has(color) && !isSelected;
        
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "w-8 h-8 rounded-md border-2 transition-all hover:scale-110 relative",
              isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground/30",
              isUsed && "opacity-40"
            )}
            style={{ backgroundColor: color }}
            title={isUsed ? `${color} (in use)` : color}
          >
            {isSelected && (
              <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-lg" />
            )}
            {isUsed && !isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white shadow-lg" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
