import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { toast } from "sonner";

/**
 * Cottontail: the python-wrangling game from the robot rabbit fleet monitor.
 *
 * The game itself is a self-contained static page (public/cottontail.html) shown in an
 * iframe; it was written as one HTML file and is left that way. When a run ends it posts
 * {type:'cottontail:gameover', score, caught, longest, wave, seconds} to this page, which
 * writes a row to game_scores (game_type 'cottontail') so it shares the lab leaderboard.
 * Column mapping, since game_scores was designed for the microbe games:
 *   score -> score, caught -> microbes_eliminated, longest (ft) -> accuracy_percentage,
 *   wave -> combo_max, seconds -> game_duration_seconds. Leaderboard.tsx relabels them.
 */
const GAME_URL = `${import.meta.env.BASE_URL}cottontail.html`;

interface GameOverMsg {
  type: "cottontail:gameover";
  score: number;
  caught: number;
  longest: number;
  wave: number;
  seconds: number;
}

const Cottontail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastRun, setLastRun] = useState<GameOverMsg | null>(null);
  // Guards against a duplicate message for the same run.
  const savingRef = useRef(false);

  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      const data = e.data as Partial<GameOverMsg> | undefined;
      if (!data || data.type !== "cottontail:gameover") return;
      const run = data as GameOverMsg;
      setLastRun(run);

      const reply = (ok: boolean, reason?: string) =>
        frameRef.current?.contentWindow?.postMessage({ type: "cottontail:saved", ok, reason }, window.location.origin);

      if (!user) { reply(false, "Sign in to log scores"); return; }
      if (!Number.isFinite(run.score) || run.score <= 0) { reply(false, "Nothing to log"); return; }
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        const { error } = await supabase.from("game_scores").insert({
          user_id: user.id,
          game_type: "cottontail",
          score: Math.round(run.score),
          microbes_eliminated: Math.round(run.caught || 0),
          accuracy_percentage: Number(run.longest) || 0,
          combo_max: Math.round(run.wave || 1),
          game_duration_seconds: Math.round(run.seconds || 0),
        });
        if (error) throw error;
        reply(true);
        toast.success(`Logged ${run.score} ft to the lab board`);
      } catch (err) {
        console.error("Cottontail score save failed", err);
        reply(false, "Could not save");
        toast.error("Could not save your score");
      } finally {
        savingRef.current = false;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#040d11] text-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">🐇 Cottontail</h1>
            <p className="text-sm text-slate-300">Everglades night detail. Grab pythons behind the head and bag them.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-white hover:text-white" onClick={() => navigate("/break")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button variant="outline" onClick={() => setShowLeaderboard((v) => !v)}>
              <Trophy className="w-4 h-4 mr-2" /> {showLeaderboard ? "Game" : "Leaderboard"}
            </Button>
          </div>
        </div>

        {showLeaderboard ? (
          <Card className="p-4">
            <Leaderboard gameType="cottontail" />
          </Card>
        ) : (
          <div className="rounded-lg overflow-hidden border border-slate-700" style={{ height: "calc(100vh - 140px)", minHeight: 520 }}>
            <iframe
              ref={frameRef}
              src={GAME_URL}
              title="Cottontail"
              className="w-full h-full block bg-[#040d11]"
            />
          </div>
        )}

        {lastRun && !showLeaderboard && (
          <p className="text-xs text-slate-400 mt-2">
            Last run: {lastRun.score} ft, {lastRun.caught} bagged, longest {lastRun.longest} ft, wave {lastRun.wave}.
          </p>
        )}
      </div>
    </div>
  );
};

export default Cottontail;
