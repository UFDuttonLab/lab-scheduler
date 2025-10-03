import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { toast } from "sonner";

interface Score {
  id: string;
  user_id: string;
  score: number;
  microbes_eliminated: number;
  accuracy_percentage: number;
  combo_max: number;
  game_duration_seconds: number;
  created_at: string;
  game_type: string;
  profiles: {
    full_name: string | null;
    spirit_animal: string | null;
  } | null;
}

interface LeaderboardProps {
  gameType?: string;
}

export const Leaderboard = ({ gameType = 'microbe_blaster' }: LeaderboardProps) => {
  const { user } = useAuth();
  const [allTimeScores, setAllTimeScores] = useState<Score[]>([]);
  const [weeklyScores, setWeeklyScores] = useState<Score[]>([]);
  const [personalBest, setPersonalBest] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      // Fetch all-time top scores
      const { data: allTime, error: allTimeError } = await supabase
        .from("game_scores")
        .select("*, profiles(full_name, spirit_animal)")
        .eq("game_type", gameType)
        .order("score", { ascending: false })
        .limit(10);

      if (allTimeError) throw allTimeError;
      setAllTimeScores(allTime || []);

      // Fetch weekly top scores
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weekly, error: weeklyError } = await supabase
        .from("game_scores")
        .select("*, profiles(full_name, spirit_animal)")
        .eq("game_type", gameType)
        .gte("created_at", oneWeekAgo.toISOString())
        .order("score", { ascending: false })
        .limit(10);

      if (weeklyError) throw weeklyError;
      setWeeklyScores(weekly || []);

      // Fetch personal best
      if (user) {
        const { data: personal, error: personalError } = await supabase
          .from("game_scores")
          .select("*, profiles(full_name, spirit_animal)")
          .eq("user_id", user.id)
          .eq("game_type", gameType)
          .order("score", { ascending: false })
          .limit(1)
          .single();

        if (personalError && personalError.code !== "PGRST116") throw personalError;
        setPersonalBest(personal || null);
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("game_scores_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_scores",
        },
        (payload) => {
          // Only refresh if the new score is for this game type
          if ((payload.new as Score).game_type === gameType) {
            fetchScores();
            
            // Show toast for high scores (top 10)
            if (allTimeScores.length < 10 || (payload.new as Score).score > allTimeScores[9].score) {
              toast.success("🏆 New high score on the leaderboard!");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, gameType]);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank + 1}</span>;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderScoreList = (scores: Score[]) => (
    <div className="space-y-3">
      {scores.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No scores yet. Be the first!</p>
      ) : (
        scores.map((score, index) => (
          <Card
            key={score.id}
            className={`p-4 ${
              score.user_id === user?.id ? "bg-primary/10 border-primary" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                {getRankIcon(index)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">
                    {score.profiles?.full_name || "Anonymous"}
                  </p>
                  {score.profiles?.spirit_animal && (
                    <span className="text-sm">{score.profiles.spirit_animal}</span>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>{gameType === 'zombie_lunch' ? '🧟' : '🦠'} {score.microbes_eliminated} eliminated</span>
                  <span>🎯 {score.accuracy_percentage.toFixed(1)}% accuracy</span>
                  <span>🔥 {score.combo_max}x combo</span>
                  <span>⏱️ {formatDuration(score.game_duration_seconds)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{score.score}</div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="alltime" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alltime">All-Time</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="personal">Personal Best</TabsTrigger>
        </TabsList>

        <TabsContent value="alltime" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              All-Time Leaderboard
            </h3>
            {renderScoreList(allTimeScores)}
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-primary" />
              This Week's Top Scores
            </h3>
            {renderScoreList(weeklyScores)}
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Your Personal Best
            </h3>
            {personalBest ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {personalBest.score}
                  </div>
                  <p className="text-muted-foreground">Your Highest Score</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold">{personalBest.microbes_eliminated}</div>
                    <div className="text-sm text-muted-foreground">{gameType === 'zombie_lunch' ? 'Zombies' : 'Microbes'} Eliminated</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold">{personalBest.combo_max}x</div>
                    <div className="text-sm text-muted-foreground">Max Combo</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold">
                      {personalBest.accuracy_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold">
                      {formatDuration(personalBest.game_duration_seconds)}
                    </div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Play your first game to set a personal record!
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
