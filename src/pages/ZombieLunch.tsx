import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ZombieCanvas } from "@/components/game/ZombieCanvas";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Trophy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ZombieLunch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if game is unlocked via sessionStorage
  useEffect(() => {
    const isUnlocked = sessionStorage.getItem('zombieLunchUnlocked') === 'true';
    if (!isUnlocked) {
      toast.error("🔒 Secret game locked! Find the hidden trigger...");
      navigate("/equipment");
    }
  }, [navigate]);

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [zombiesKilled, setZombiesKilled] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setCombo(0);
    setZombiesKilled(0);
    setTotalClicks(0);
    setStartTime(Date.now());
    setShowLeaderboard(false);
  }, []);

  const pauseGame = useCallback(() => {
    setGameState("paused");
  }, []);

  const resumeGame = useCallback(() => {
    setGameState("playing");
  }, []);

  const endGame = useCallback(async () => {
    setGameState("gameover");
    
    const gameDuration = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = totalClicks > 0 ? Math.min(100, (zombiesKilled / totalClicks) * 100) : 0;
    
    // Calculate final score with bonuses
    let finalScore = score;
    if (accuracy > 80) {
      finalScore = Math.floor(finalScore * 1.1); // 10% accuracy bonus
    }
    finalScore += Math.floor(gameDuration / 60) * 100; // Time bonus

    if (user) {
      const { error } = await supabase.from("game_scores").insert({
        user_id: user.id,
        score: finalScore,
        microbes_eliminated: zombiesKilled,
        accuracy_percentage: accuracy,
        combo_max: combo,
        game_duration_seconds: gameDuration,
        game_type: 'zombie_lunch',
      });

      if (error) {
        console.error("Error saving score:", error);
        toast.error("Failed to save score");
      } else {
        toast.success("Score saved!");
        setShowLeaderboard(true);
      }
    }
  }, [user, score, zombiesKilled, totalClicks, combo, startTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🧟 Zombie Lunch Defense</h1>
            <p className="text-muted-foreground">Protect your lunch from the undead!</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/equipment")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Equipment
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          </div>
        </div>

        {showLeaderboard ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setShowLeaderboard(false)}>
              ← Back to Game
            </Button>
            <Leaderboard gameType="zombie_lunch" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Area */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                {gameState === "menu" && (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-6">
                    <div className="text-center space-y-4">
                      <div className="text-6xl mb-4">🧟</div>
                      <h2 className="text-3xl font-bold">Welcome to Zombie Lunch Defense!</h2>
                      <p className="text-muted-foreground max-w-md">
                        Zombies are after your lunch! Click to shoot them before they reach your lunch bag.
                        Collect power-ups and build combos for higher scores!
                      </p>
                    </div>
                    <Button size="lg" onClick={startGame}>
                      <Play className="w-5 h-5 mr-2" />
                      Start Game
                    </Button>
                  </div>
                )}

                {gameState === "paused" && (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-6">
                    <h2 className="text-3xl font-bold">Game Paused</h2>
                    <div className="flex gap-4">
                      <Button onClick={resumeGame}>
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </Button>
                      <Button variant="outline" onClick={startGame}>
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Restart
                      </Button>
                    </div>
                  </div>
                )}

                {gameState === "gameover" && (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-6">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl font-bold">Game Over!</h2>
                      <div className="text-5xl font-bold text-primary">{score}</div>
                      <p className="text-muted-foreground">Final Score</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-2xl font-bold">{zombiesKilled}</div>
                          <div className="text-muted-foreground">Zombies Killed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{combo}</div>
                          <div className="text-muted-foreground">Max Combo</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button onClick={startGame}>
                        <Play className="w-5 h-5 mr-2" />
                        Play Again
                      </Button>
                      <Button variant="outline" onClick={() => setShowLeaderboard(true)}>
                        <Trophy className="w-5 h-5 mr-2" />
                        View Leaderboard
                      </Button>
                    </div>
                  </div>
                )}

                {gameState === "playing" && (
                  <ZombieCanvas
                    onScoreUpdate={setScore}
                    onLivesUpdate={setLives}
                    onComboUpdate={setCombo}
                    onZombiesKilledUpdate={setZombiesKilled}
                    onTotalClicksUpdate={setTotalClicks}
                    onGameOver={endGame}
                  />
                )}
              </Card>
            </div>

            {/* Stats Panel */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Game Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Score</div>
                    <div className="text-3xl font-bold text-primary">{score}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Lives</div>
                    <div className="text-2xl font-bold flex gap-1">
                      {Array.from({ length: lives }).map((_, i) => (
                        <span key={i}>❤️</span>
                      ))}
                      {Array.from({ length: 3 - lives }).map((_, i) => (
                        <span key={i} className="opacity-30">🖤</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Combo</div>
                    <div className="text-2xl font-bold">{combo}x</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Zombies Killed</div>
                    <div className="text-2xl font-bold">{zombiesKilled}</div>
                  </div>
                </div>
              </Card>

              {gameState === "playing" && (
                <Button variant="outline" className="w-full" onClick={pauseGame}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}

              <Card className="p-6 bg-primary/5">
                <h3 className="text-lg font-bold mb-3">How to Play</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>🎯 Click zombies to shoot them</li>
                  <li>🍱 Protect your lunch bag at the center</li>
                  <li>👻 Golden zombies are worth 100 points!</li>
                  <li>⚡ Collect power-ups for special abilities</li>
                  <li>🔥 Build combos for score multipliers</li>
                  <li>❤️ Don't let zombies reach your lunch!</li>
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}