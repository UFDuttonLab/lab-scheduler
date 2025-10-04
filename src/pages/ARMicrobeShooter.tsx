import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ARCamera } from "@/components/game/ARCamera";
import { ARMicrobeCanvas } from "@/components/game/ARMicrobeCanvas";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Play, Pause, Trophy, X, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useIsMobile } from "@/hooks/use-mobile";

type GameState = "menu" | "playing" | "paused" | "gameover";

const ARMicrobeShooter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [microbesEliminated, setMicrobesEliminated] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const gameStartTimeRef = useRef<number>(0);
  const { requestPermission: requestMotionPermission } = useDeviceMotion();
  const { requestPermission: requestOrientationPermission } = useDeviceOrientation();

  // Check unlock status and device capability
  useEffect(() => {
    const isUnlocked = sessionStorage.getItem("arMicrobeUnlocked") === "true";
    
    if (!isUnlocked) {
      toast.error("AR Microbe Shooter is locked. Shake your phone on the Schedule page to unlock!");
      navigate("/schedule");
      return;
    }

    // Check if device is mobile
    if (!isMobile) {
      toast.error("AR Microbe Shooter requires a mobile device with camera and motion sensors");
      navigate("/schedule");
      return;
    }

    // Check if camera and motion sensors are available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access is not available on this device");
      navigate("/schedule");
      return;
    }

    if (typeof DeviceMotionEvent === "undefined" || typeof DeviceOrientationEvent === "undefined") {
      toast.error("Motion sensors are not available on this device");
      navigate("/schedule");
      return;
    }
  }, [navigate, isMobile]);

  const startGame = async () => {
    // Request sensor permissions
    const motionGranted = await requestMotionPermission();
    const orientationGranted = await requestOrientationPermission();

    if (!motionGranted || !orientationGranted) {
      toast.error("Motion sensor permissions are required to play");
      return;
    }

    setGameState("playing");
    setScore(0);
    setLives(3);
    setCombo(0);
    setMicrobesEliminated(0);
    setTotalTaps(0);
    gameStartTimeRef.current = Date.now();
  };

  const pauseGame = () => {
    setGameState("paused");
  };

  const resumeGame = () => {
    setGameState("playing");
  };

  const endGame = async () => {
    setGameState("gameover");

    if (!user) return;

    const gameDuration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const accuracy = totalTaps > 0 ? (microbesEliminated / totalTaps) * 100 : 0;

    // Calculate bonus
    let finalScore = score;
    if (accuracy > 90) {
      finalScore = Math.floor(finalScore * 1.2);
      toast.success("+20% accuracy bonus!");
    } else if (accuracy > 80) {
      finalScore = Math.floor(finalScore * 1.1);
      toast.success("+10% accuracy bonus!");
    }

    const survivalBonus = Math.floor(gameDuration / 60) * 100;
    finalScore += survivalBonus;

    try {
      const { error } = await supabase.from("game_scores").insert({
        user_id: user.id,
        game_type: "ar_microbe",
        score: finalScore,
        microbes_eliminated: microbesEliminated,
        accuracy_percentage: accuracy,
        combo_max: combo,
        game_duration_seconds: gameDuration,
      });

      if (error) throw error;
      toast.success(`Final score: ${finalScore} (${Math.floor(accuracy)}% accuracy)`);
    } catch (error) {
      console.error("Failed to save score:", error);
      toast.error("Failed to save score");
    }
  };

  const handleLifeLost = () => {
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame();
      }
      return newLives;
    });
  };

  const handleMicrobeEliminated = () => {
    setMicrobesEliminated((prev) => prev + 1);
    setTotalTaps((prev) => prev + 1);
  };

  const handleTap = () => {
    setTotalTaps((prev) => prev + 1);
  };

  // Block access on desktop
  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">📱 Mobile Only</h1>
          <p className="text-muted-foreground mb-6">
            AR Microbe Shooter requires a mobile device with camera and motion sensors.
          </p>
          <Button onClick={() => navigate("/schedule")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        </Card>
      </div>
    );
  }

  if (gameState === "menu") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-primary/10 p-6">
        <Card className="max-w-md p-8 text-center space-y-6">
          <h1 className="text-4xl font-bold text-primary">🦠 AR Microbe Shooter</h1>
          <p className="text-muted-foreground">
            Use your camera to hunt down microbes in augmented reality! Move your phone to aim and tap to shoot.
          </p>
          
          <div className="space-y-3">
            <Button onClick={startGame} size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
            <Button onClick={() => setShowLeaderboard(!showLeaderboard)} variant="outline" className="w-full">
              <Trophy className="mr-2 h-4 w-4" />
              {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
            </Button>
            <Button onClick={() => navigate("/schedule")} variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Back to Schedule
            </Button>
          </div>

          {showLeaderboard && (
            <div className="mt-6">
              <Leaderboard gameType="ar_microbe" />
            </div>
          )}

          <div className="text-left text-sm space-y-2 pt-6 border-t">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Move your phone to look around</li>
              <li>Tap microbes to shoot them</li>
              <li>Different microbes have different health/points</li>
              <li>Collect power-ups for special abilities</li>
              <li>Build combos for score multipliers</li>
              <li>You have 3 lives - don't let microbes escape!</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === "paused") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black/80 p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">⏸️ Paused</h2>
          <div className="space-y-2">
            <p className="text-xl">Score: {score}</p>
            <p className="text-lg">Microbes Eliminated: {microbesEliminated}</p>
          </div>
          <div className="space-y-3 pt-4">
            <Button onClick={resumeGame} size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" />
              Resume
            </Button>
            <Button onClick={endGame} variant="outline" className="w-full">
              End Game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === "gameover") {
    const gameDuration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const accuracy = totalTaps > 0 ? ((microbesEliminated / totalTaps) * 100).toFixed(1) : "0";

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-destructive/10 p-6">
        <Card className="max-w-md p-8 text-center space-y-6">
          <h2 className="text-4xl font-bold text-destructive">💀 Game Over</h2>
          
          <div className="space-y-3 text-lg">
            <p className="text-3xl font-bold text-primary">{score} points</p>
            <div className="space-y-1 text-muted-foreground">
              <p>🦠 Microbes Eliminated: {microbesEliminated}</p>
              <p>🎯 Accuracy: {accuracy}%</p>
              <p>🔥 Max Combo: {combo}</p>
              <p>⏱️ Duration: {Math.floor(gameDuration / 60)}:{(gameDuration % 60).toString().padStart(2, "0")}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={startGame} size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" />
              Play Again
            </Button>
            <Button onClick={() => setShowLeaderboard(!showLeaderboard)} variant="outline" className="w-full">
              <Trophy className="mr-2 h-4 w-4" />
              {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
            </Button>
            <Button onClick={() => navigate("/schedule")} variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Back to Schedule
            </Button>
          </div>

          {showLeaderboard && (
            <div className="mt-6">
              <Leaderboard gameType="ar_microbe" />
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Playing state - AR view
  return (
    <ARCamera>
      <ARMicrobeCanvas
        onScoreChange={setScore}
        onLifeLost={handleLifeLost}
        onMicrobeEliminated={handleMicrobeEliminated}
        onComboChange={setCombo}
        lives={lives}
        isPaused={false}
      />

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start text-white pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
          <p className="text-2xl font-bold">{score}</p>
          <p className="text-xs">SCORE</p>
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`h-6 w-6 ${i < lives ? "fill-red-500 text-red-500" : "fill-gray-500 text-gray-500"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
        {combo > 0 && (
          <div className="bg-primary/90 backdrop-blur-sm rounded-full px-6 py-2 text-white font-bold text-xl animate-pulse">
            {combo}x COMBO!
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
        <Button onClick={pauseGame} size="icon" variant="secondary" className="rounded-full h-12 w-12">
          <Pause className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-sm">
          <p>🦠 {microbesEliminated}</p>
        </div>
      </div>
    </ARCamera>
  );
};

export default ARMicrobeShooter;
