/**
 * Shared vocabulary for the undergraduate recruiting module.
 *
 * The option lists here are the SAME sets as the CHECK constraints in
 * supabase/migrations/20260822100000_recruiting_schema.sql and the arrays in
 * supabase/functions/submit-application/index.ts. Three copies is two too many, but the
 * database cannot import TypeScript and the edge function runs on Deno with no path to
 * src/. If you add a coursework option or an application status, change all three in the
 * same commit - the database will reject the value otherwise and, because a rejected
 * INSERT surfaces as a generic 500 from the edge function, the form will simply appear to
 * be broken.
 */

export type ApplicationStatus =
  | "new" | "in_review" | "interview" | "accepted" | "declined" | "withdrawn";

export type PositionStatus = "draft" | "open" | "filled" | "closed";

export type CreditType = "volunteer" | "course_credit" | "work_study" | "paid" | "any";

export type StudentYear = "freshman" | "sophomore" | "junior" | "senior" | "post-bacc";

export type RExperience = "none" | "coursework" | "independent";

export type ReviewDecision = "advance" | "hold" | "decline";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "new", "in_review", "interview", "accepted", "declined", "withdrawn",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  in_review: "In review",
  interview: "Interview",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

/** Badge classes built from the app's own tokens - no new palette. */
export const APPLICATION_STATUS_CLASSES: Record<ApplicationStatus, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  in_review: "bg-secondary/10 text-secondary border-secondary/20",
  interview: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  declined: "bg-muted text-muted-foreground border-border",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

export const POSITION_STATUSES: PositionStatus[] = ["draft", "open", "filled", "closed"];

export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  draft: "Draft",
  open: "Open",
  filled: "Filled",
  closed: "Closed",
};

export const POSITION_STATUS_CLASSES: Record<PositionStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-success/10 text-success border-success/20",
  filled: "bg-secondary/10 text-secondary border-secondary/20",
  closed: "bg-muted text-muted-foreground border-border",
};

export const POSITION_STATUS_HELP: Record<PositionStatus, string> = {
  draft: "Only you and the PI can see this.",
  open: "Publicly listed on the application page.",
  filled: "Removed from the public page. Applications already received are kept.",
  closed: "Removed from the public page.",
};

export const CREDIT_TYPES: CreditType[] = ["volunteer", "course_credit", "work_study", "paid", "any"];

export const CREDIT_TYPE_LABELS: Record<CreditType, string> = {
  volunteer: "Volunteer",
  course_credit: "Course credit",
  work_study: "Work study",
  paid: "Paid",
  any: "Any of these",
};

export const STUDENT_YEARS: StudentYear[] = ["freshman", "sophomore", "junior", "senior", "post-bacc"];

export const STUDENT_YEAR_LABELS: Record<StudentYear, string> = {
  freshman: "Freshman",
  sophomore: "Sophomore",
  junior: "Junior",
  senior: "Senior",
  "post-bacc": "Post-bacc",
};

export const R_EXPERIENCE_LABELS: Record<RExperience, string> = {
  none: "None yet",
  coursework: "Used it in a course",
  independent: "Have written my own analyses",
};

export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  advance: "Advance",
  hold: "Hold",
  decline: "Decline",
};

/** Coursework multi-select. Keys are stored; labels are shown. */
export const COURSEWORK_OPTIONS: { value: string; label: string }[] = [
  { value: "bsc2010", label: "BSC2010 (Integrated Principles of Biology 1)" },
  { value: "bsc2011", label: "BSC2011 (Integrated Principles of Biology 2)" },
  { value: "genetics", label: "Genetics" },
  { value: "gen_chem_lab", label: "General chemistry lab" },
  { value: "organic_chem", label: "Organic chemistry" },
  { value: "statistics", label: "Statistics" },
  { value: "microbiology", label: "Microbiology" },
  { value: "ecology", label: "Ecology" },
];

export const COURSEWORK_LABELS: Record<string, string> = Object.fromEntries(
  COURSEWORK_OPTIONS.map((o) => [o.value, o.label]),
);

// ---------------------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------------------

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export const DAY_SHORT: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

/** Hours offered in the grid. Lab days, not the full 24. */
export const GRID_START_HOUR = 8;
export const GRID_END_HOUR = 20;

/** day -> list of [startHour, endHour) pairs. The stored shape. */
export type Availability = Partial<Record<DayKey, [number, number][]>>;

const hour12 = (h: number) => {
  const suffix = h < 12 || h === 24 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${suffix}`;
};

export const formatSlot = ([from, to]: [number, number]) => `${hour12(from)}–${hour12(to)}`;

/** Total hours marked available across the week. */
export const totalAvailableHours = (availability: Availability): number =>
  DAY_KEYS.reduce(
    (sum, day) => sum + (availability[day] ?? []).reduce((d, [from, to]) => d + (to - from), 0),
    0,
  );

/** The longest single uninterrupted block anywhere in the week. */
export const longestBlockHours = (availability: Availability): number =>
  DAY_KEYS.reduce(
    (best, day) =>
      Math.max(best, ...(availability[day] ?? []).map(([from, to]) => to - from), 0),
    0,
  );

/**
 * Turn a set of selected hour cells into merged [start, end) ranges.
 * Adjacent hours become one block, which is what makes longestBlockHours meaningful.
 */
export const hoursToRanges = (hours: number[]): [number, number][] => {
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const ranges: [number, number][] = [];
  for (const hour of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && last[1] === hour) last[1] = hour + 1;
    else ranges.push([hour, hour + 1]);
  }
  return ranges;
};

/** The inverse, for rendering a stored availability back into grid cells. */
export const rangesToHours = (ranges: [number, number][] | undefined): Set<number> => {
  const hours = new Set<number>();
  for (const [from, to] of ranges ?? []) {
    for (let h = from; h < to; h++) hours.add(h);
  }
  return hours;
};

/**
 * Parse whatever came back from a jsonb column into the typed shape, discarding anything
 * that does not fit. The database validates on write, but a row written before a shape
 * change - or by hand - should degrade to "no availability" rather than crash the queue.
 */
export const parseAvailability = (raw: unknown): Availability => {
  const result: Availability = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
  for (const day of DAY_KEYS) {
    const slots = (raw as Record<string, unknown>)[day];
    if (!Array.isArray(slots)) continue;
    const clean = slots.filter(
      (s): s is [number, number] =>
        Array.isArray(s) && s.length === 2 &&
        typeof s[0] === "number" && typeof s[1] === "number" && s[0] < s[1],
    );
    if (clean.length) result[day] = clean;
  }
  return result;
};

export const formatCycleDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

// ---------------------------------------------------------------------------------------
// Turnstile
// ---------------------------------------------------------------------------------------

/**
 * Cloudflare Turnstile SITE key. Public by design - it is meant to appear in the page, and
 * is useless without the secret half, which lives in Supabase function secrets as
 * TURNSTILE_SECRET and must never be given a VITE_ prefix.
 *
 * Empty means "not configured": the form says so and refuses to submit, and
 * submit-application refuses every request. Both halves fail closed together on purpose.
 */
export const TURNSTILE_SITE_KEY: string | undefined =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined;
