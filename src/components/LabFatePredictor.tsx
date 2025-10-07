import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRandomLabFate, getRandomSpinIcon, LabFate } from "@/lib/labFates";

interface LabFatePredictorProps {
  className?: string;
}

export const LabFatePredictor = ({ className = "" }: LabFatePredictorProps) => {
  const [spinning, setSpinning] = useState(false);
  const [currentOutcome, setCurrentOutcome] = useState<LabFate | null>(null);
  const [displayIcon, setDisplayIcon] = useState("🔮");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (spinning) {
      // Rapidly cycle through icons during spin
      interval = setInterval(() => {
        setDisplayIcon(getRandomSpinIcon());
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [spinning]);

  const predictFate = () => {
    setSpinning(true);
    setCurrentOutcome(null);
    
    // Spin for 1.5-2 seconds
    const spinDuration = 1500 + Math.random() * 500;
    
    setTimeout(() => {
      const fate = getRandomLabFate();
      setCurrentOutcome(fate);
      setDisplayIcon(fate.icon);
      setSpinning(false);
    }, spinDuration);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "neutral":
        return "text-amber-600 dark:text-amber-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "rare":
        return "text-purple-600 dark:text-purple-400 font-bold";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                Lab Fate Predictor
              </h3>
              
              {/* Icon Display */}
              <div className="my-4">
                <span className={`text-5xl sm:text-6xl ${spinning ? 'animate-pulse' : ''}`}>
                  {displayIcon}
                </span>
              </div>
              
              {/* Status/Result Text */}
              {spinning && (
                <p className="text-sm sm:text-base text-muted-foreground animate-pulse">
                  Consulting the Science Gods...
                </p>
              )}
              
              {currentOutcome && !spinning && (
                <p className={`text-sm sm:text-base font-medium animate-fade-in ${getCategoryColor(currentOutcome.category)}`}>
                  {currentOutcome.text}
                </p>
              )}
              
              {!currentOutcome && !spinning && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  Dare to discover your experimental destiny?
                </p>
              )}
            </div>
          </div>
          
          {/* Action Button */}
          <Button
            onClick={predictFate}
            disabled={spinning}
            className="w-full sm:w-auto"
            variant="default"
          >
            {currentOutcome && !spinning ? "Try Again" : "Predict Your Lab Fate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
