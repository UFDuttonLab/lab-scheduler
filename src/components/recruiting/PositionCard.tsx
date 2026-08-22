import { useId, useState } from "react";
import { ChevronDown, Clock, CalendarRange, Timer, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PublicPosition {
  id: string;
  title: string;
  description: string;
  tasks: string[];
  requirements: string[];
  hours_per_week: number;
  min_block_hours: number;
  semesters_needed: number;
  outcome: string;
  projectName: string | null;
  projectBlurb: string | null;
  /** The scheduler project's emoji, so a listing looks like the project it belongs to. */
  projectIcon: string | null;
}

/**
 * One open position on the public page.
 *
 * Collapsed to title + description on small screens and expandable, per spec 5.1.3. On
 * screens wide enough to show the whole thing at once it starts expanded, because forcing
 * a desktop reader to click five times to compare five roles is worse than a long page.
 *
 * The disclosure is a real button with aria-expanded and aria-controls rather than a
 * styled div, so the state is announced. The chevron rotation is suppressed under
 * prefers-reduced-motion by the transition-transform / motion-reduce pairing.
 */
export const PositionCard = ({
  position,
  defaultOpen = false,
}: {
  position: PublicPosition;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full text-left p-5 flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="flex-1 min-w-0">
          {position.projectName && (
            <div className="text-xs font-medium text-primary mb-1 flex items-center gap-1.5">
              {position.projectIcon && <span aria-hidden="true">{position.projectIcon}</span>}
              {position.projectName}
            </div>
          )}
          <h3 className="font-semibold text-base leading-snug">{position.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{position.description}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {position.hours_per_week} hrs/week
            </Badge>
            <Badge variant="secondary" className="gap-1 font-normal">
              <Timer className="w-3 h-3" aria-hidden="true" />
              {position.min_block_hours} hr blocks
            </Badge>
            <Badge variant="secondary" className="gap-1 font-normal">
              <CalendarRange className="w-3 h-3" aria-hidden="true" />
              {position.semesters_needed} semesters
            </Badge>
          </div>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div id={bodyId} className="px-5 pb-5 pt-0 space-y-4 border-t border-border">
          {position.projectBlurb && (
            <p className="text-sm text-muted-foreground pt-4">{position.projectBlurb}</p>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-1.5">What you would do</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              {position.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-1.5">What you need first</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              {position.requirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 items-start rounded-lg bg-muted/50 p-3">
            <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold">What you walk away with</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{position.outcome}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
