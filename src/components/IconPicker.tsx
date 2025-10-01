import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

const emojiCategories = {
  Science: [
    "🧪", "🔬", "🧬", "⚗️", "🔭", "🧫", "💉", "🩺", "⚡", "🔋"
  ],
  Technology: [
    "💻", "🖥️", "⚙️", "🔧", "🛠️", "🤖", "📡", "🔌", "💾", "📱"
  ],
  Nature: [
    "🌱", "🌿", "🌳", "🌲", "🌾", "🍃", "🌺", "🌸", "🌻", "🌼"
  ],
  Environment: [
    "🌍", "🌎", "🌏", "🌊", "🔥", "💧", "🌬️", "⛰️", "🏔️", "☀️"
  ],
  Medical: [
    "🩺", "💊", "💉", "🏥", "⚕️", "🧬", "🦠", "🧠", "🫀", "🫁"
  ],
  Research: [
    "🎯", "📊", "📈", "📉", "🔍", "🔎", "📝", "📋", "📌", "🏆"
  ],
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <Tabs defaultValue="Science" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        {Object.keys(emojiCategories).map((category) => (
          <TabsTrigger key={category} value={category} className="text-xs">
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(emojiCategories).map(([category, emojis]) => (
        <TabsContent key={category} value={category}>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="grid grid-cols-6 gap-2">
              {emojis.map((emoji) => {
                return (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(emoji)}
                    className={cn(
                      "h-10 w-10 text-2xl",
                      value === emoji && "bg-accent ring-2 ring-primary"
                    )}
                  >
                    {emoji}
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
