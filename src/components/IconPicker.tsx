import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

const iconCategories = {
  Animals: [
    "Cat", "Dog", "Fish", "Bird", "Rabbit", "Squirrel", "Bug", "Turtle",
    "Snail", "BugOff", "PawPrint"
  ],
  Environment: [
    "Mountain", "Waves", "Sun", "Cloud", "Leaf", "Flower", "Globe",
    "Trees", "Wind", "Snowflake", "Droplets", "Cloudy"
  ],
  Science: [
    "Microscope", "TestTube", "Flask", "Atom", "Dna", "Beaker",
    "ActivitySquare", "FlaskConical", "FlaskRound", "Pipette"
  ],
  Technology: [
    "Cpu", "HardDrive", "Smartphone", "Monitor", "Wifi", "Battery",
    "Laptop", "Usb", "Bluetooth", "Radio", "Server"
  ],
  General: [
    "Star", "Heart", "Diamond", "Zap", "Target", "Award", "Bookmark",
    "Lightbulb", "Flame", "Sparkles", "Crown", "Trophy"
  ],
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <Tabs defaultValue="Animals" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        {Object.keys(iconCategories).map((category) => (
          <TabsTrigger key={category} value={category} className="text-xs">
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(iconCategories).map(([category, icons]) => (
        <TabsContent key={category} value={category}>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="grid grid-cols-6 gap-2">
              {icons.map((iconName) => {
                const Icon = Icons[iconName as keyof typeof Icons] as LucideIcon;
                if (!Icon) return null;
                return (
                  <Button
                    key={iconName}
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(iconName)}
                    className={cn(
                      "h-10 w-10",
                      value === iconName && "bg-accent"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
