import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DadJokeCard } from "@/components/DadJokeCard";
import { LabFatePredictor } from "@/components/LabFatePredictor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Coffee, Gamepad2, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * The joke, the Lab Fate Predictor and the three lab games, moved off the dashboard.
 * Reached only from the "Need a break?" line there.
 *
 * The games were easter eggs gated on sessionStorage flags set by hidden triggers
 * (Equipment page, shake on Schedule, ...). Linking to them from here would bounce straight
 * back off those gates, so the links set the flag first. The gates stay in place for the
 * hidden routes.
 */
const GAMES: { path: string; flag?: string; title: string; blurb: string; mobileOnly?: boolean }[] = [
  { path: "/cottontail", title: "Cottontail", blurb: "Everglades night detail. Grab pythons behind the head, bag them, load the cannon." },
  { path: "/microbe-blaster", flag: "microbeBlasterUnlocked", title: "Microbe Blaster", blurb: "Point and shoot. Keep the plate clean." },
  { path: "/zombie-lunch", flag: "zombieLunchUnlocked", title: "Zombie Lunch Defense", blurb: "The lab fridge has turned. Click fast." },
  { path: "/ar-microbe-shooter", flag: "arMicrobeUnlocked", title: "AR Microbe Shooter", blurb: "Microbes in the room around you. Phone only.", mobileOnly: true },
];

const Break = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const play = (g: (typeof GAMES)[number]) => {
    try {
      if (g.flag) sessionStorage.setItem(g.flag, "true");
    } catch {
      // Storage blocked: the game's own gate will explain itself.
    }
    navigate(g.path);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-8 animate-fade-in flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
              <Coffee className="w-8 h-8 text-primary" />
              Take a break
            </h1>
            <p className="text-muted-foreground">Two minutes, then back to the bench.</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <DadJokeCard />
          <LabFatePredictor />

          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" /> Lab games
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Scores are between you and your conscience.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GAMES.map((g) => {
                const blocked = g.mobileOnly && !isMobile;
                return (
                  <button
                    key={g.path}
                    type="button"
                    disabled={blocked}
                    onClick={() => play(g)}
                    className="text-left rounded-lg border p-4 hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={blocked ? "Open this page on your phone to play" : undefined}
                  >
                    <div className="font-medium flex items-center gap-2">
                      {g.title}
                      {g.mobileOnly && <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{g.blurb}</div>
                    {blocked && <div className="text-xs text-muted-foreground mt-2">Phone only</div>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Break;
