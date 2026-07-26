import { useState, useEffect, useRef, useCallback } from "react";
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
import { useGyroscope } from "@/hooks/useGyroscope";
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
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("");
  const [awaitingSensors, setAwaitingSensors] = useState(false);
  const [maxCombo, setMaxCombo] = useState(0);
  const gameStartTimeRef = useRef<number>(0);
  // Guards against endGame() running twice and writing two leaderboard rows.
  const endedRef = useRef(false);
  const { requestPermission: requestMotionPermission } = useDeviceMotion();
  const orientation = useDeviceOrientation();
  const gyro = useGyroscope();

  // Live sensor readings. Derived during render, so it always reflects the newest values.
  const sensorsLive =
    (orientation.alpha !== null && orientation.beta !== null) ||
    (gyro.alpha !== null && gyro.beta !== null);

  // Watch for sensor data instead of busy-waiting on it.
  //
  // The old loop read `orientation` from the closure captured when the click handler was
  // created. Sensor events set React state, which produces a NEW object on the next
  // render - the running loop kept re-reading the frozen one, so on a perfectly working
  // phone it polled null for 3s and then declared the sensors dead. Because
  // permissionsGranted stayed false, the Start Game button never appeared and the game
  // was completely unreachable.
  useEffect(() => {
    if (!awaitingSensors || !sensorsLive) return;
    setAwaitingSensors(false);
    setPermissionsGranted(true);
    setPermissionStatus("✅ Sensors active! Ready to play.");
    toast.success("Sensors ready! You can now start the game.");
  }, [awaitingSensors, sensorsLive]);

  // If the sensors never report in, offer touch mode rather than dead-ending. Aiming is
  // fixed forward, but tapping still shoots, so the game remains playable.
  useEffect(() => {
    if (!awaitingSensors) return;
    const timer = setTimeout(() => {
      setAwaitingSensors(false);
      setPermissionsGranted(true);
      setPermissionStatus("⚠️ No motion sensors detected - starting in touch mode. Tap microbes to shoot.");
      toast.info("Sensors unavailable - playing in touch mode");
    }, 3000);
    return () => clearTimeout(timer);
  }, [awaitingSensors]);

  const handleRequestPermissions = async () => {
    setPermissionStatus("Requesting permissions...");

    const motionGranted = await requestMotionPermission();
    const orientationGranted = await orientation.requestPermission();
    const gyroGranted = await gyro.requestPermission();

    console.log('🔐 Permission results:', { motionGranted, orientationGranted, gyroGranted });

    if (motionGranted || orientationGranted || gyroGranted) {
      setPermissionStatus("Waiting for sensor data...");
      setAwaitingSensors(true);
    } else {
      // Permission refused is not fatal either - touch mode still works.
      setPermissionsGranted(true);
      setPermissionStatus("⚠️ Sensor permission denied - starting in touch mode. Tap microbes to shoot.");
      toast.info("Playing in touch mode without motion sensors");
    }
  };

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

  const startGame = async () => {
    // Initialize game state
    endedRef.current = false;
    setGameState("playing");
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
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

  const endGame = useCallback(async () => {
    // Two microbes expiring in the same frame both drove lives to <= 0 and each called
    // endGame(), inserting two leaderboard rows for one game.
    if (endedRef.current) return;
    endedRef.current = true;

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
        combo_max: maxCombo,
        game_duration_seconds: gameDuration,
      });

      if (error) throw error;
      toast.success(`Final score: ${finalScore} (${Math.floor(accuracy)}% accuracy)`);
    } catch (error) {
      console.error("Failed to save score:", error);
      toast.error("Failed to save score");
    }
  }, [user, score, microbesEliminated, totalTaps, maxCombo]);

  const handleLifeLost = useCallback(() => {
    // Compute the new value, then react to it OUTSIDE the updater.
    //
    // endGame does a setState, fires toasts (a setState on a different component) and
    // performs a Supabase insert. Running that inside a setLives updater is work during
    // React's render phase, and a re-invoked updater would have run it twice.
    setLives((prev) => {
      const newLives = Math.max(0, prev - 1);
      return newLives;
    });
  }, []);

  // Ends the game once lives actually reach zero.
  useEffect(() => {
    if (gameState === "playing" && lives <= 0) {
      endGame();
    }
  }, [gameState, lives, endGame]);

  const handleMicrobeEliminated = useCallback(() => {
    setMicrobesEliminated((prev) => prev + 1);
  }, []);

  // Every shot, hit or miss. Previously this was never wired to the canvas, so totalTaps
  // only ever incremented alongside a kill and accuracy was hardcoded at 100%.
  const handleTap = useCallback(() => {
    setTotalTaps((prev) => prev + 1);
  }, []);

  // The canvas zeroes the combo on a 4s inactivity timeout (not on every miss, as an
  // earlier comment here wrongly claimed), so the live value at death is often 0 anyway.
  // Track the peak separately - that is what combo_max is supposed to mean.
  const handleComboChange = useCallback((value: number) => {
    setCombo(value);
    setMaxCombo((prev) => (value > prev ? value : prev));
  }, []);

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
          
          <div className="space-y-3">
            {!permissionsGranted ? (
              <Button onClick={handleRequestPermissions} size="lg" className="w-full">
                🎮 Enable Sensors to Play
              </Button>
            ) : (
              <Button onClick={startGame} size="lg" className="w-full">
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            )}
            
            {permissionStatus && (
              <p className="text-sm text-center text-muted-foreground px-4">{permissionStatus}</p>
            )}
            
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
              <p>🔥 Max Combo: {maxCombo}</p>
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

  // Playing / paused - AR view.
  // Paused deliberately keeps this mounted. Rendering a separate pause screen unmounted
  // ARCamera and ARMicrobeCanvas, so all in-canvas state was destroyed: resuming reset
  // the score to 0, restored 3 lives internally, and tore down and re-requested the
  // camera. isPaused now actually drives the canvas, which is what it was always for.
  const isPausedNow = gameState === "paused";

  return (
    <ARCamera>
      <ARMicrobeCanvas
        onScoreChange={setScore}
        onLifeLost={handleLifeLost}
        onMicrobeEliminated={handleMicrobeEliminated}
        onComboChange={handleComboChange}
        onTap={handleTap}
        lives={lives}
        isPaused={isPausedNow}
      />

      {isPausedNow && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 pointer-events-auto">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
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
      )}

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
      {/* z-20: the game canvas is z-10 in this same stacking context, so without an
          explicit z-index the canvas covered these controls and Pause could not be tapped. */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2 pointer-events-auto">
        <Button onClick={pauseGame} size="icon" variant="secondary" className="rounded-full h-12 w-12">
          <Pause className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-sm">
          <p>🦠 {microbesEliminated}</p>
        </div>
      </div>
    </ARCamera>
  );
};

export default ARMicrobeShooter;
