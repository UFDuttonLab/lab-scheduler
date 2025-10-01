import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

const emojiCategories = {
  // Animals - Farm
  "Farm Animals": [
    "🐄", "🐷", "🐖", "🐗", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘",
    "🦏", "🦛", "🐎", "🐴", "🦓", "🦬", "🐃", "🐂", "🐮", "🦆", "🐓", "🐔"
  ],
  // Animals - Wild
  "Wild Animals": [
    "🦁", "🐯", "🐅", "🐆", "🦌", "🦏", "🦍", "🦧", "🐒", "🦊", "🦝", "🐻",
    "🐻‍❄️", "🐼", "🦘", "🦡", "🦫", "🦦", "🦨", "🦔", "🐾", "🦥", "🦦", "🦇"
  ],
  // Animals - Marine
  "Marine Life": [
    "🐟", "🐠", "🐡", "🦈", "🐙", "🦑", "🦐", "🦞", "🦀", "🐚", "🐳", "🐋",
    "🐬", "🦭", "🦈", "🐢", "🦦", "🐊", "🦈", "🐸", "🦎", "🐍", "🦕", "🦖"
  ],
  // Animals - Birds
  "Birds": [
    "🦅", "🦆", "🦢", "🦉", "🦚", "🦜", "🦩", "🦤", "🐦", "🐧", "🕊️", "🦃",
    "🦆", "🦅", "🦇", "🐓", "🐔", "🐣", "🐤", "🐥", "🦆", "🦢", "🦉", "🦚"
  ],
  // Animals - Insects & Small
  "Insects & Small": [
    "🐛", "🦋", "🐌", "🐞", "🐜", "🦗", "🕷️", "🕸️", "🦂", "🦟", "🦠", "🐝",
    "🐿️", "🦔", "🐀", "🐁", "🐭", "🐹", "🐰", "🐇", "🦫", "🦨", "🦡", "🦦"
  ],
  // Animals - Reptiles
  "Reptiles": [
    "🐊", "🐢", "🦎", "🐍", "🦕", "🦖", "🐲", "🐉", "🦴", "🐸", "🦗", "🦂"
  ],
  // Science - Expanded
  "Science": [
    "🧪", "🔬", "🧬", "🦠", "🧫", "⚗️", "🔭", "⚛️", "🧲", "🌡️", "📊", "📈",
    "📉", "🧮", "🔍", "📐", "📏", "⚙️", "🛠️", "🔧", "🔩", "⚡", "💡", "🔋"
  ],
  // Medical - Expanded
  "Medical": [
    "💊", "💉", "🩺", "🩹", "🩼", "🦷", "🫀", "🫁", "🧠", "👁️", "🦴", "🩸",
    "🏥", "⚕️", "🔬", "🧬", "🧫", "🦠", "🌡️", "💊", "🩺", "🔬", "🧪", "⚗️"
  ],
  // Nature - Expanded
  "Nature": [
    "🌱", "🌿", "🍀", "🌾", "🌵", "🌲", "🌳", "🌴", "🌻", "🌺", "🌸", "🌼",
    "🌷", "🍎", "🥕", "🌽", "🥦", "🍅", "🫑", "🥬", "🥒", "🫐", "🌰", "🌾"
  ],
  // Technology
  "Technology": [
    "💻", "🖥️", "⌨️", "🖱️", "🖨️", "📱", "📲", "☎️", "📞", "📟", "📠", "🔋",
    "🔌", "💾", "💿", "📀", "🎮", "🕹️", "🎯", "🎲", "🎰", "🎪", "🎨", "🎭"
  ]
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <Tabs defaultValue="Farm Animals" className="w-full">
      <ScrollArea className="w-full">
        <TabsList className="w-full flex-wrap h-auto justify-start">
          {Object.keys(emojiCategories).map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
      
      {Object.entries(emojiCategories).map(([category, icons]) => (
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
