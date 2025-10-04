import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ARCamera, ARCameraHandle } from "@/components/game/ARCamera";
import { ARMicrobeCanvas } from "@/components/game/ARMicrobeCanvas";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Play, Pause, Trophy, X, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useGyroscope } from "@/hooks/useGyroscope";
import { useIsMobile } from "@/hooks/use-mobile";

type GameState = "menu" | "requesting-permissions" | "playing" | "paused" | "gameover";

const ARMicrobeShooter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const cameraRef = useRef<ARCameraHandle>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [microbesEliminated, setMicrobesEliminated] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const { requestPermission: requestMotionPermission } = useDeviceMotion();
  const { requestPermission: requestOrientationPermission } = useDeviceOrientation();
  const gyro = useGyroscope();

  const startGame = useCallback(async () => {
    console.log("🎮 Starting AR Microbe Shooter - Requesting Permissions");
    setGameState("requesting-permissions");
    setPermissionError(null);

    try {
      // Step 1: Request camera permission
      if (!cameraRef.current) {
        throw new Error("Camera component not ready");
      }
      await cameraRef.current.startCamera();
      console.log("✅ Camera permission granted");

      // Step 2: Request motion/orientation permissions
      const motionGranted = await requestMotionPermission();
      const orientationGranted = await requestOrientationPermission();
      const gyroGranted = await gyro.requestPermission();
      
      if (!motionGranted && !orientationGranted && !gyroGranted) {
        toast.warning("Motion sensors not available - using touch controls only");
      } else {
        console.log("✅ Sensor permissions granted");
        // Wait for sensors to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log("✅ All permissions granted - Starting game");
      
      // Initialize game state
      setScore(0);
      setLives(3);
      setCombo(0);
      setMicrobesEliminated(0);
      setTotalTaps(0);
      gameStartTimeRef.current = Date.now();
      setGameState("playing");
    } catch (err: any) {
      console.error("❌ Permission error:", err);
      const errorMsg = err.message || "Failed to get required permissions";
      setPermissionError(errorMsg);
      setGameState("menu");
      toast.error("Permission Denied", { description: errorMsg });
    }
  }, [requestMotionPermission, requestOrientationPermission, gyro]);

  // Check unlock status and device capability
  useEffect(() => {
    // Add small delay to ensure sessionStorage is readable
    const checkUnlock = setTimeout(() => {
      const isUnlocked = sessionStorage.getItem("arMicrobeUnlocked") === "true";
      
      if (!isUnlocked) {
        toast.error("AR Microbe Shooter is locked", {
          description: "Shake your phone on the Schedule page to unlock!",
          action: {
            label: "Go to Schedule",
            onClick: () => navigate("/schedule")
          }
        });
        navigate("/schedule");
        return;
      }

      // Check if device is mobile
      if (!isMobile) {
        toast.error("AR Microbe Shooter requires a mobile device", {
          action: {
            label: "Go to Schedule",
            onClick: () => navigate("/schedule")
          }
        });
        navigate("/schedule");
        return;
      }

      // Check if camera and motion sensors are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access is not available on this device", {
          action: {
            label: "Go to Schedule",
            onClick: () => navigate("/schedule")
          }
        });
        navigate("/schedule");
        return;
      }

      if (typeof DeviceMotionEvent === "undefined" || typeof DeviceOrientationEvent === "undefined") {
        toast.error("Motion sensors are not available on this device", {
          action: {
            label: "Go to Schedule",
            onClick: () => navigate("/schedule")
          }
        });
        navigate("/schedule");
        return;
      }
    }, 100); // Small delay to ensure sessionStorage is ready

    return () => clearTimeout(checkUnlock);
  }, [navigate, isMobile]);


  const pauseGame = () => {
    setGameState("paused");
  };

  const resumeGame = () => {
    setGameState("playing");
  };

  const endGame = useCallback(async () => {
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
  }, [user, score, microbesEliminated, totalTaps, combo]);

  const handleLifeLost = useCallback(() => {
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame();
      }
      return newLives;
    });
  }, [endGame]);

  const handleMicrobeEliminated = useCallback(() => {
    setMicrobesEliminated((prev) => prev + 1);
    setTotalTaps((prev) => prev + 1);
  }, []);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const handleComboChange = useCallback((newCombo: number) => {
    setCombo(newCombo);
  }, []);

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
          
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
            <p className="font-semibold">📱 Permissions Required:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Camera access for AR view</li>
              <li>Device orientation for aiming (or use touch controls)</li>
            </ul>
          </div>

          {permissionError && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">{permissionError}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Please allow camera and sensor permissions to play.
              </p>
            </div>
          )}
          
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

  if (gameState === "requesting-permissions") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-medium">Requesting permissions...</p>
          <p className="text-sm text-muted-foreground">Please allow camera and sensor access</p>
        </div>
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
    <ARCamera ref={cameraRef}>
      <ARMicrobeCanvas
        onScoreChange={handleScoreChange}
        onLifeLost={handleLifeLost}
        onMicrobeEliminated={handleMicrobeEliminated}
        onComboChange={handleComboChange}
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

      {/* Pause Button - Fixed z-index and simplified touch handling */}
      <Button 
        onClick={pauseGame}
        onTouchEnd={(e) => {
          e.preventDefault();
          pauseGame();
        }}
        size="icon" 
        variant="secondary" 
        className="absolute bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-lg pointer-events-auto"
      >
        <Pause className="h-6 w-6" />
      </Button>

    </ARCamera>
  );
};

export default ARMicrobeShooter;
