import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DadJokeCard } from "@/components/DadJokeCard";
import { LabFatePredictor } from "@/components/LabFatePredictor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coffee } from "lucide-react";

/** The joke and the Lab Fate Predictor, moved off the dashboard. Reached only from the "Need a break?" line there. */
const Break = () => (
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
      </div>
    </main>
    <Footer />
  </div>
);

export default Break;
