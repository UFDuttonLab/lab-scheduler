import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Availability,
  DAY_KEYS,
  DAY_LABELS,
  DAY_SHORT,
  DayKey,
  GRID_END_HOUR,
  GRID_START_HOUR,
  formatSlot,
  hoursToRanges,
  rangesToHours,
} from "@/lib/recruiting";

const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => GRID_START_HOUR + i,
);

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${suffix}`;
};

interface EditableProps {
  value: Availability;
  onChange: (next: Availability) => void;
  /** Wired to aria-describedby / aria-invalid by the step that owns the error text. */
  describedBy?: string;
  invalid?: boolean;
}

/**
 * Weekly availability picker.
 *
 * Each cell is a real <button type="button">, not a div with a click handler: it has to be
 * reachable by keyboard and announce its own state, and a form full of clickable divs is
 * exactly the pattern that makes a page unusable without a mouse. aria-pressed carries the
 * selected state; the visible ring comes from the app's --ring token.
 *
 * type="button" matters more than it looks. Inside a <form>, a bare <button> defaults to
 * type="submit", so tabbing into the grid and pressing space would submit the application.
 */
export const AvailabilityGrid = ({ value, onChange, describedBy, invalid }: EditableProps) => {
  const selected = useMemo(() => {
    const map = {} as Record<DayKey, Set<number>>;
    for (const day of DAY_KEYS) map[day] = rangesToHours(value[day]);
    return map;
  }, [value]);

  const toggle = useCallback(
    (day: DayKey, hour: number) => {
      const hours = new Set(selected[day]);
      if (hours.has(hour)) hours.delete(hour);
      else hours.add(hour);
      const ranges = hoursToRanges([...hours]);
      const next: Availability = { ...value };
      if (ranges.length) next[day] = ranges;
      else delete next[day];
      onChange(next);
    },
    [selected, value, onChange],
  );

  const toggleDay = useCallback(
    (day: DayKey) => {
      const next: Availability = { ...value };
      if ((value[day] ?? []).length) delete next[day];
      else next[day] = [[GRID_START_HOUR, GRID_END_HOUR]];
      onChange(next);
    },
    [value, onChange],
  );

  return (
    <div
      className="overflow-x-auto -mx-1 px-1"
      role="group"
      aria-label="Weekly availability"
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
    >
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-1">
          <div aria-hidden="true" />
          {DAY_KEYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground rounded px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={`Select or clear all of ${DAY_LABELS[day]}`}
            >
              {DAY_SHORT[day]}
            </button>
          ))}

          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="text-[11px] text-muted-foreground text-right pr-1 leading-7 tabular-nums">
                {hourLabel(hour)}
              </div>
              {DAY_KEYS.map((day) => {
                const on = selected[day].has(hour);
                return (
                  <button
                    key={`${day}-${hour}`}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${DAY_LABELS[day]} ${hourLabel(hour)} to ${hourLabel(hour + 1)}`}
                    onClick={() => toggle(day, hour)}
                    className={cn(
                      "h-7 rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      on
                        ? "bg-primary border-primary"
                        : "bg-muted/40 border-border hover:bg-muted",
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Read-only week view for the review queue. Same geometry as the picker so a reviewer who
 * has seen the form recognises it, but rendered as a table with row and column headers so
 * it is legible to a screen reader instead of being a wall of coloured cells.
 */
export const AvailabilityView = ({ value }: { value: Availability }) => {
  const selected = useMemo(() => {
    const map = {} as Record<DayKey, Set<number>>;
    for (const day of DAY_KEYS) map[day] = rangesToHours(value[day]);
    return map;
  }, [value]);

  const anything = DAY_KEYS.some((d) => (value[d] ?? []).length > 0);
  if (!anything) {
    return <p className="text-sm text-muted-foreground">No availability given.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-[520px] border-separate border-spacing-1">
          <caption className="sr-only">Weekly availability</caption>
          <thead>
            <tr>
              <th scope="col" className="w-14" />
              {DAY_KEYS.map((day) => (
                <th key={day} scope="col" className="text-xs font-medium text-muted-foreground">
                  {DAY_SHORT[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <th
                  scope="row"
                  className="text-[11px] font-normal text-muted-foreground text-right pr-1 tabular-nums"
                >
                  {hourLabel(hour)}
                </th>
                {DAY_KEYS.map((day) => (
                  <td
                    key={`${day}-${hour}`}
                    className={cn(
                      "h-5 rounded border",
                      selected[day].has(hour)
                        ? "bg-primary border-primary"
                        : "bg-muted/30 border-border",
                    )}
                  >
                    <span className="sr-only">
                      {selected[day].has(hour) ? "Available" : "Not available"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The same information in words. The grid is a summary; this is what a reviewer
          actually reads out to schedule a shift. */}
      <ul className="text-sm space-y-0.5">
        {DAY_KEYS.filter((d) => (value[d] ?? []).length > 0).map((day) => (
          <li key={day}>
            <span className="font-medium">{DAY_LABELS[day]}:</span>{" "}
            <span className="text-muted-foreground">
              {(value[day] ?? []).map(formatSlot).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
