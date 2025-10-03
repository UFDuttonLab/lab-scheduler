import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface PowerUpProps {
  type: string;
  endTime: number;
}

export const PowerUp = ({ type, endTime }: PowerUpProps) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [endTime]);

  const powerUpInfo = {
    freeze: { name: "Freeze Time", icon: "❄️", color: "text-blue-500" },
    rapid: { name: "Rapid Fire", icon: "⚡", color: "text-yellow-500" },
    double: { name: "Double Points", icon: "✨", color: "text-purple-500" },
    shield: { name: "Shield", icon: "🛡️", color: "text-green-500" },
  }[type] || { name: "Unknown", icon: "❓", color: "text-gray-500" };

  return (
    <Card className="absolute top-4 right-4 p-4 bg-primary/95 backdrop-blur-sm border-2 border-primary">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{powerUpInfo.icon}</span>
        <div>
          <div className="font-bold text-primary-foreground">{powerUpInfo.name}</div>
          <div className="text-sm text-primary-foreground/80">{timeLeft}s remaining</div>
        </div>
      </div>
    </Card>
  );
};
