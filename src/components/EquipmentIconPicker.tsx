import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EquipmentIconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

const equipmentCategories = {
  "Robots": [
    "🤖", "🦾", "🦿", "⚙️", "🔧", "🔩", "🛠️", "⚡", "🔌", "🔋", "💡", "🎯",
    "🎮", "🕹️", "🦾", "🤖", "⚙️", "🔧", "🛠️", "⚡", "🔋", "💡", "🔩", "🎯"
  ],
  "Lab Equipment": [
    "🧪", "⚗️", "🔬", "🧫", "🌡️", "⚖️", "💊", "💉", "🩺", "🔍", "📏", "📐",
    "🧮", "📊", "📈", "📉", "🗂️", "📋", "📝", "🩹", "🧬", "🦠", "⚕️", "💊"
  ],
  "PCR & Molecular": [
    "🧬", "🧫", "🦠", "🔬", "🧪", "⚗️", "🌡️", "💉", "💊", "🩺", "⚕️", "🧮",
    "🔍", "📊", "📈", "📉", "🧲", "⚛️", "💡", "⚡", "🔋", "🔌", "📡", "📈"
  ],
  "Quantification": [
    "📊", "📈", "📉", "📐", "📏", "⚖️", "🧮", "🔢", "💯", "📋", "📝", "🗂️",
    "📑", "📂", "🔍", "📊", "📈", "📉", "💹", "📊", "🎯", "🎲", "🔢", "💯"
  ],
  "Computing": [
    "💻", "🖥️", "⌨️", "🖱️", "🖨️", "📱", "💾", "💿", "📀", "🔋", "🔌", "📡",
    "🛰️", "📶", "📊", "📈", "⚙️", "🔧", "🛠️", "⚡", "💡", "🔋", "📊", "💻"
  ]
};

export function EquipmentIconPicker({ value, onChange }: EquipmentIconPickerProps) {
  return (
    <Tabs defaultValue="Robots" className="w-full">
      <TabsList className="w-full">
        {Object.keys(equipmentCategories).map((category) => (
          <TabsTrigger key={category} value={category} className="text-xs">
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {Object.entries(equipmentCategories).map(([category, icons]) => (
        <TabsContent key={category} value={category}>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="grid grid-cols-8 gap-2">
              {icons.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={value === icon ? "default" : "outline"}
                  className="h-10 w-10 p-0 text-xl"
                  onClick={() => onChange(icon)}
                >
                  {icon}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
