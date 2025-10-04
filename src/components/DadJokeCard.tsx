import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getRandomJoke, DadJoke } from "@/lib/dadJokes";

interface DadJokeCardProps {
  className?: string;
}

export const DadJokeCard = ({ className = "" }: DadJokeCardProps) => {
  const [joke, setJoke] = useState<DadJoke | null>(null);

  useEffect(() => {
    setJoke(getRandomJoke());
  }, []);

  if (!joke) return null;

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl sm:text-3xl">😄</span>
          <div className="flex-1 space-y-2">
            <p className="text-sm sm:text-base font-medium text-foreground">
              {joke.setup}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              {joke.punchline}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
