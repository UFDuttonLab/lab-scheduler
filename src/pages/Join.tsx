import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionBody, readFunctionError, readFunctionStatus } from "@/lib/dbWrite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PositionCard, PublicPosition } from "@/components/recruiting/PositionCard";
import { AvailabilityGrid } from "@/components/recruiting/AvailabilityGrid";
import { TurnstileWidget } from "@/components/recruiting/TurnstileWidget";
import {
  Availability,
  COURSEWORK_OPTIONS,
  CREDIT_TYPES,
  CREDIT_TYPE_LABELS,
  CreditType,
  R_EXPERIENCE_LABELS,
  RExperience,
  STUDENT_YEARS,
  STUDENT_YEAR_LABELS,
  StudentYear,
  TURNSTILE_SITE_KEY,
  formatCycleDate,
  longestBlockHours,
  totalAvailableHours,
} from "@/lib/recruiting";

/**
 * #/join - the public application page.
 *
 * The ONLY unauthenticated page in this application. Two things follow from that and both
 * are load-bearing:
 *
 *  1. It renders its own layout. <Navigation> calls useAuth() and prints the signed-in
 *     user's email, so putting it on this page would show a visitor either a crash or
 *     somebody's address.
 *
 *  2. Every query filters explicitly on status and cycle even though RLS already does.
 *     A signed-in lab member visiting this page carries their JWT, and the authenticated
 *     SELECT policy on recruiting_positions is USING (true) - so without the client-side
 *     filter a mentor previewing the page would see their own drafts sitting in the public
 *     list and reasonably conclude they had been published.
 */

const MAX_STATEMENT = 1500;

interface CycleRow {
  cycle: string;
  label: string;
  opens_at: string;
  closes_at: string;
  min_hours_per_week: number;
  min_semesters: number;
  trial_weeks: number;
  pi_contact_email: string;
  intro_md: string | null;
  next_cycle_note: string | null;
  /**
   * Which door this form submits through. false (the normal state today) means the page
   * calls recruiting_submit_application_public() directly with the publishable key - no
   * edge function, no Turnstile. true means Turnstile is configured, the database refuses
   * the direct call, and the page must post to the submit-application edge function.
   *
   * The flag lives on the cycle row rather than in the bundle so that turning Turnstile on
   * takes effect for everyone immediately, and so the client cannot choose the weaker door.
   */
  require_turnstile: boolean;
}

interface FormState {
  full_name: string;
  email: string;
  year: StudentYear | "";
  major: string;
  expected_graduation: string;
  prior_lab_experience: string;
  conflicts: string;
  prior_contact: string;
  coursework: string[];
  r_experience: RExperience | "";
  hours_available: string;
  longest_block_hours: string;
  availability: Availability;
  semesters_available: string;
  credit_type: CreditType | "";
  animal_samples_ok: boolean | null;
  field_local_ok: boolean | null;
  field_intl_interest: boolean | null;
  has_transportation: boolean | null;
  choices: (string | null)[];
  statement: string;
  policy_min_hours: string;
  policy_min_semesters: string;
  policy_trial_weeks: string;
  policy_ehs: string;
}

const EMPTY_FORM: FormState = {
  full_name: "", email: "", year: "", major: "", expected_graduation: "",
  prior_lab_experience: "", conflicts: "", prior_contact: "",
  coursework: [], r_experience: "",
  hours_available: "", longest_block_hours: "", availability: {},
  semesters_available: "", credit_type: "",
  animal_samples_ok: null, field_local_ok: null, field_intl_interest: null,
  has_transportation: null,
  choices: [null, null, null], statement: "",
  policy_min_hours: "", policy_min_semesters: "", policy_trial_weeks: "", policy_ehs: "",
};

const UFL_EMAIL = /^[^@\s]+@([a-z0-9-]+\.)*ufl\.edu$/i;

type Errors = Record<string, string>;

/** Build a small multiple-choice set that always contains the right answer. */
const numericOptions = (correct: number, distractors: number[]) =>
  [...new Set([correct, ...distractors])].sort((a, b) => a - b);

/** Field wrapper: label, control, and an error tied to the input by aria-describedby. */
const Field = ({
  id, label, hint, error, required, children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
      </Label>
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && (
        <p id={errorId} className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

/** A yes/no pair. Radios rather than a switch, because "no" is a real answer here. */
const YesNo = ({
  id, label, hint, value, error, onChange,
}: {
  id: string; label: string; hint?: string;
  value: boolean | null; error?: string;
  onChange: (v: boolean) => void;
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset
      className="space-y-1.5"
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-sm font-medium">
        {label}<span className="text-destructive ml-0.5" aria-hidden="true">*</span>
      </legend>
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      <RadioGroup
        className="flex gap-4 pt-0.5"
        value={value === null ? "" : value ? "yes" : "no"}
        onValueChange={(v) => onChange(v === "yes")}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${id}-yes`} />
          <Label htmlFor={`${id}-yes`} className="font-normal">Yes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="font-normal">No</Label>
        </div>
      </RadioGroup>
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
};

const STEP_TITLES = [
  "About you",
  "Coursework and skills",
  "Availability and logistics",
  "Positions and statement",
];

const Join = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<CycleRow | null>(null);
  const [positions, setPositions] = useState<PublicPosition[]>([]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const confirmationRef = useRef<HTMLDivElement | null>(null);

  /**
   * When this page was opened. Sent as elapsed_ms and checked server-side: the four-step
   * form cannot be filled in honestly in under twenty seconds, so anything faster is a
   * script. Forgeable on its own, which is why it is one of four anti-abuse checks rather
   * than the only one.
   */
  const openedAtRef = useRef<number>(Date.now());

  /**
   * Honeypot. Visually hidden and aria-hidden, so no human and no screen reader ever fills
   * it in; anything that does is a form-filling bot. autoComplete="off" and tabIndex={-1}
   * keep browsers and keyboard users away from it too.
   */
  const [honeypot, setHoneypot] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ---- load ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // recruiting_open_cycle() is SECURITY DEFINER and readable by anon; it is the same
      // function the RLS policy uses, so the page and the database agree on "open".
      const { data: openCycle, error: cycleError } = await supabase.rpc("recruiting_open_cycle");
      if (cancelled) return;
      if (cycleError) {
        setLoadError("We could not load the application page. Please try again shortly.");
        setLoading(false);
        return;
      }
      if (!openCycle) {
        setCycle(null);
        setLoading(false);
        return;
      }

      const [{ data: cycleRow }, { data: positionRows }] = await Promise.all([
        supabase
          .from("recruiting_cycles")
          .select(
            "cycle, label, opens_at, closes_at, min_hours_per_week, min_semesters, trial_weeks, pi_contact_email, intro_md, next_cycle_note, require_turnstile",
          )
          .eq("cycle", openCycle)
          .maybeSingle(),
        supabase
          .from("recruiting_positions")
          .select(
            "id, title, description, tasks, requirements, hours_per_week, min_block_hours, semesters_needed, outcome, recruiting_projects(name, blurb)",
          )
          // Explicit, even though RLS says the same for anon. See the note at the top.
          .eq("status", "open")
          .eq("cycle", openCycle)
          .order("title"),
      ]);
      if (cancelled) return;

      setCycle((cycleRow as CycleRow) ?? null);
      setPositions(
        (positionRows ?? []).map((row) => {
          const project = row.recruiting_projects as unknown as
            | { name: string; blurb: string }
            | null;
          return {
            id: row.id,
            title: row.title,
            description: row.description,
            tasks: row.tasks ?? [],
            requirements: row.requirements ?? [],
            hours_per_week: row.hours_per_week,
            min_block_hours: row.min_block_hours,
            semesters_needed: row.semesters_needed,
            outcome: row.outcome,
            projectName: project?.name ?? null,
            projectBlurb: project?.blurb ?? null,
          };
        }),
      );
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Move focus to the new step's heading. Without this, a keyboard or screen-reader user
  // presses Next and their focus stays on a button that has just been replaced.
  useEffect(() => {
    if (!submitted) stepHeadingRef.current?.focus();
  }, [step, submitted]);

  useEffect(() => {
    if (submitted) confirmationRef.current?.focus();
  }, [submitted]);

  const positionsById = useMemo(
    () => Object.fromEntries(positions.map((p) => [p.id, p])),
    [positions],
  );

  // ---- validation ---------------------------------------------------------------------
  const validateStep = (which: number): Errors => {
    const e: Errors = {};
    if (which === 0) {
      if (form.full_name.trim().length < 2) e.full_name = "Please give your full name.";
      if (!UFL_EMAIL.test(form.email.trim())) {
        e.email = "Please use your UF email address, ending in ufl.edu.";
      }
      if (!form.year) e.year = "Please choose your year.";
      if (form.major.trim().length < 2) e.major = "Please give your major.";
      if (form.expected_graduation.trim().length < 4) {
        e.expected_graduation = 'Please give a term and year, for example "Spring 2028".';
      }
    }
    if (which === 1) {
      if (!form.r_experience) e.r_experience = "Please choose one.";
    }
    if (which === 2) {
      const hours = Number(form.hours_available);
      if (!Number.isInteger(hours) || hours < 1 || hours > 40) {
        e.hours_available = "Please give a whole number of hours between 1 and 40.";
      }
      const block = Number(form.longest_block_hours);
      if (!Number.isInteger(block) || block < 1 || block > 12) {
        e.longest_block_hours = "Please give a block length between 1 and 12 hours.";
      } else if (Number.isInteger(hours) && block > hours) {
        e.longest_block_hours = "Your longest block cannot be longer than your weekly total.";
      }
      if (totalAvailableHours(form.availability) === 0) {
        e.availability = "Please mark at least one hour you are free.";
      }
      const semesters = Number(form.semesters_available);
      if (!Number.isInteger(semesters) || semesters < 1 || semesters > 8) {
        e.semesters_available = "Please give a number of semesters between 1 and 8.";
      }
      if (!form.credit_type) e.credit_type = "Please choose one.";
      for (const key of [
        "animal_samples_ok", "field_local_ok", "field_intl_interest", "has_transportation",
      ] as const) {
        if (form[key] === null) e[key] = "Please answer yes or no.";
      }
    }
    if (which === 3) {
      const picked = form.choices.filter(Boolean) as string[];
      if (picked.length === 0) e.choices = "Please choose at least one position.";
      else if (new Set(picked).size !== picked.length) {
        e.choices = "Each position can only be chosen once.";
      } else if (form.choices[0] === null) {
        e.choices = "Please fill your first choice before your second or third.";
      } else if (form.choices[1] === null && form.choices[2] !== null) {
        e.choices = "Please fill your second choice before your third.";
      }
      if (form.statement.trim().length === 0) e.statement = "Please write a short statement.";
      if (form.statement.length > MAX_STATEMENT) {
        e.statement = `Please keep this under ${MAX_STATEMENT} characters.`;
      }
      for (const [key, label] of [
        ["policy_min_hours", "minimum hours"],
        ["policy_min_semesters", "minimum semesters"],
        ["policy_trial_weeks", "trial period"],
        ["policy_ehs", "safety training"],
      ] as const) {
        if (!form[key]) e[key] = `Please answer the ${label} question.`;
      }
    }
    return e;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  // ---- submit ---------------------------------------------------------------------------
  const submit = async () => {
    const allErrors: Errors = {};
    for (let i = 0; i <= 3; i++) Object.assign(allErrors, validateStep(i));
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Send the applicant back to the earliest step that still has a problem rather than
      // showing an error next to a field they cannot see.
      for (let i = 0; i <= 3; i++) {
        if (Object.keys(validateStep(i)).length > 0) { setStep(i); break; }
      }
      setFormError("Some answers still need attention.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const choices = (form.choices
      .map((id, index) => (id ? { position_id: id, rank: index + 1 } : null))
      .filter(Boolean)) as { position_id: string; rank: number }[];

    const payload = {
        turnstile_token: turnstileToken ?? "",
        website: honeypot,
        elapsed_ms: Date.now() - openedAtRef.current,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        year: form.year,
        major: form.major.trim(),
        expected_graduation: form.expected_graduation.trim(),
        coursework: form.coursework,
        r_experience: form.r_experience,
        prior_lab_experience: form.prior_lab_experience.trim() || null,
        hours_available: Number(form.hours_available),
        longest_block_hours: Number(form.longest_block_hours),
        availability: form.availability,
        semesters_available: Number(form.semesters_available),
        credit_type: form.credit_type,
        animal_samples_ok: form.animal_samples_ok,
        field_local_ok: form.field_local_ok,
        field_intl_interest: form.field_intl_interest,
        has_transportation: form.has_transportation,
        conflicts: form.conflicts.trim() || null,
        prior_contact: form.prior_contact.trim() || null,
        statement: form.statement.trim(),
        policy_answers: {
          min_hours: Number(form.policy_min_hours),
          min_semesters: Number(form.policy_min_semesters),
          trial_weeks: Number(form.policy_trial_weeks),
          ehs_required: form.policy_ehs === "yes",
        },
        choices,
    };

    // ---- the direct database door -----------------------------------------------------
    //
    // While the cycle does not require Turnstile, the page talks to the database function
    // instead of the edge function. It is the same insert underneath - the public function
    // is SECURITY DEFINER and calls recruiting_submit_application() internally - so every
    // CHECK constraint and the one-per-address rule still apply. What differs is that it
    // needs no deployed function and no secrets, and it answers with the same
    // { ok, error, fields } shape the form already knows how to render.
    if (!cycle.require_turnstile) {
      const { data: result, error: rpcError } = await supabase.rpc(
        "recruiting_submit_application_public",
        { _payload: payload },
      );
      setSubmitting(false);

      if (rpcError) {
        setFormError("Something went wrong sending your application. Please try again.");
        return;
      }

      const body = (result ?? {}) as { ok?: boolean; error?: string; fields?: Errors };
      if (body.ok) { setSubmitted(true); return; }

      if (body.fields && Object.keys(body.fields).length > 0) {
        setErrors(body.fields);
        for (let i = 0; i <= 3; i++) {
          const stepFields = Object.keys(validateStep(i));
          if (Object.keys(body.fields).some((f) => stepFields.includes(f))) { setStep(i); break; }
        }
      }
      setFormError(body.error ?? "Something went wrong. Please try again.");
      return;
    }

    // ---- the edge-function door -------------------------------------------------------
    const { data, error } = await supabase.functions.invoke("submit-application", {
      body: payload,
    });

    setSubmitting(false);

    if (error) {
      // A non-2xx arrives as { data: null, error } whose message is the useless constant
      // "Edge Function returned a non-2xx status code" - the real body is on error.context.
      const body = await readFunctionBody(error);
      const status = readFunctionStatus(error);
      const fields = (body?.fields ?? {}) as Errors;

      if (Object.keys(fields).length > 0) {
        setErrors(fields);
        for (let i = 0; i <= 3; i++) {
          const stepFields = Object.keys(validateStep(i));
          if (Object.keys(fields).some((f) => stepFields.includes(f))) { setStep(i); break; }
        }
      }
      const message =
        (body?.error as string | undefined) ?? (await readFunctionError(error));
      setFormError(status === 409 ? message : message);
      // Turnstile tokens are single-use; a rejected submission must get a fresh one.
      setTurnstileToken(null);
      window.turnstile?.reset();
      return;
    }

    if (data && (data as { ok?: boolean }).ok === false) {
      setFormError((data as { error?: string }).error ?? "Something went wrong.");
      setTurnstileToken(null);
      window.turnstile?.reset();
      return;
    }

    setSubmitted(true);
  };

  // ---- render ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin motion-reduce:animate-none text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  const header = (
    <header className="border-b border-border bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary shrink-0" aria-hidden="true" />
          <div className="leading-tight">
            <span className="font-bold text-lg block">Dutton Lab</span>
            <span className="text-sm text-muted-foreground">University of Florida</span>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Undergraduate research positions
        </h1>
        {cycle?.intro_md && (
          <p className="mt-3 text-muted-foreground leading-relaxed">{cycle.intro_md}</p>
        )}
        {cycle && (
          <p className="mt-4 text-sm">
            <span className="font-medium">{cycle.label} applications</span>{" "}
            <span className="text-muted-foreground">
              are open from {formatCycleDate(cycle.opens_at)} to {formatCycleDate(cycle.closes_at)}.
            </span>
          </p>
        )}
      </div>
    </header>
  );

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Card className="p-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm">{loadError}</p>
          </Card>
        </main>
      </div>
    );
  }

  // No open cycle, or a cycle with nothing published in it.
  if (!cycle || positions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold text-lg">No positions are open right now</h2>
            <p className="text-sm text-muted-foreground">
              {cycle?.next_cycle_note
                ?? "Applications open once a cycle, usually a few weeks before the semester starts."}
            </p>
            <p className="text-sm">
              <a
                className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4"
                href={`mailto:${cycle?.pi_contact_email ?? "duttonc@ufl.edu"}`}
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                {cycle?.pi_contact_email ?? "duttonc@ufl.edu"}
              </a>
            </p>
          </Card>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Card
            className="p-6 space-y-4"
            ref={confirmationRef}
            tabIndex={-1}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-lg">Your application is in</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Thank you for applying to the {cycle.label} cycle.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <p className="font-medium">What happens next</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  Applications close on {formatCycleDate(cycle.closes_at)}. The mentors whose
                  positions you ranked read them after that.
                </li>
                <li>
                  If they would like to talk further, they will email you to arrange a short
                  conversation.
                </li>
                <li>
                  You will hear either way by email. There is nothing else you need to do in
                  the meantime.
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              We do not send a confirmation email. This page is your confirmation, so take a
              screenshot if you would like a record of it. To change or add to what you sent,
              email{" "}
              <a
                className="text-primary underline underline-offset-4"
                href={`mailto:${cycle.pi_contact_email}`}
              >
                {cycle.pi_contact_email}
              </a>
              .
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const hourOptions = numericOptions(cycle.min_hours_per_week, [3, 6, 10, 15]);
  const semesterOptions = numericOptions(cycle.min_semesters, [1, 2, 3, 4]);
  const trialOptions = numericOptions(cycle.trial_weeks, [1, 2, 4, 8]);

  const chosen = form.choices.filter(Boolean) as string[];
  const availableFor = (index: number) =>
    positions.filter((p) => !chosen.includes(p.id) || form.choices[index] === p.id);

  return (
    <div className="min-h-screen bg-background">
      {header}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* 2. Expectations ------------------------------------------------------------ */}
        <section aria-labelledby="expectations-heading">
          <h2 id="expectations-heading" className="text-xl font-semibold mb-3">
            What we expect
          </h2>
          <Card className="p-5">
            <ul className="space-y-2.5 text-sm">
              <li className="flex gap-2.5">
                <span className="text-primary font-semibold shrink-0" aria-hidden="true">·</span>
                <span>
                  At least <strong>{cycle.min_hours_per_week} hours a week</strong>, in blocks
                  long enough to finish a procedure once it is started.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-primary font-semibold shrink-0" aria-hidden="true">·</span>
                <span>
                  At least <strong>{cycle.min_semesters} semesters</strong>. Training takes
                  most of the first one, so a single semester does not work for either side.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-primary font-semibold shrink-0" aria-hidden="true">·</span>
                <span>
                  A <strong>{cycle.trial_weeks}-week trial</strong> that either side may end,
                  with no hard feelings and no explanation owed.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-primary font-semibold shrink-0" aria-hidden="true">·</span>
                <span>
                  <strong>EHS lab safety and BSL-2 training</strong> completed before any bench
                  work. This is not optional and cannot be done retroactively.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-primary font-semibold shrink-0" aria-hidden="true">·</span>
                <span>
                  <strong>Animal contact occupational health clearance</strong> for any project
                  involving live animals.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        {/* 3. Open positions --------------------------------------------------------- */}
        <section aria-labelledby="positions-heading">
          <h2 id="positions-heading" className="text-xl font-semibold mb-3">
            Open positions
          </h2>
          <div className="space-y-3">
            {positions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        </section>

        {/* 4. Form ------------------------------------------------------------------- */}
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="text-xl font-semibold mb-3">Apply</h2>

          <Card className="p-5 sm:p-6">
            <ol className="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-xs" aria-label="Progress">
              {STEP_TITLES.map((title, index) => (
                <li
                  key={title}
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5",
                    index === step ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full grid place-items-center text-[10px] font-semibold",
                      index === step
                        ? "bg-primary text-primary-foreground"
                        : index < step
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  {title}
                </li>
              ))}
            </ol>

            <h3
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-base font-semibold mb-4 focus-visible:outline-none"
            >
              Step {step + 1} of 4 · {STEP_TITLES[step]}
            </h3>

            <form
              onSubmit={(event) => { event.preventDefault(); if (step === 3) submit(); else goNext(); }}
              noValidate
            >
              {/* ---- Step 1 ---------------------------------------------------------- */}
              {step === 0 && (
                <div className="space-y-5">
                  <Field id="full_name" label="Full name" error={errors.full_name} required>
                    {({ id, describedBy, invalid }) => (
                      <Input
                        id={id} value={form.full_name} autoComplete="name"
                        aria-describedby={describedBy} aria-invalid={invalid || undefined}
                        onChange={(e) => set("full_name", e.target.value)}
                      />
                    )}
                  </Field>

                  <Field
                    id="email" label="UF email address" required error={errors.email}
                    hint="Must end in ufl.edu. This is where you will hear back."
                  >
                    {({ id, describedBy, invalid }) => (
                      <Input
                        id={id} type="email" value={form.email} autoComplete="email"
                        aria-describedby={describedBy} aria-invalid={invalid || undefined}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    )}
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="year" label="Year" required error={errors.year}>
                      {({ id, describedBy, invalid }) => (
                        <Select
                          value={form.year}
                          onValueChange={(v) => set("year", v as StudentYear)}
                        >
                          <SelectTrigger
                            id={id} aria-describedby={describedBy}
                            aria-invalid={invalid || undefined}
                          >
                            <SelectValue placeholder="Choose one" />
                          </SelectTrigger>
                          <SelectContent>
                            {STUDENT_YEARS.map((y) => (
                              <SelectItem key={y} value={y}>{STUDENT_YEAR_LABELS[y]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>

                    <Field id="major" label="Major" required error={errors.major}>
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id} value={form.major}
                          aria-describedby={describedBy} aria-invalid={invalid || undefined}
                          onChange={(e) => set("major", e.target.value)}
                        />
                      )}
                    </Field>
                  </div>

                  <Field
                    id="expected_graduation" label="Expected graduation" required
                    hint='Term and year, for example "Spring 2028".'
                    error={errors.expected_graduation}
                  >
                    {({ id, describedBy, invalid }) => (
                      <Input
                        id={id} value={form.expected_graduation}
                        aria-describedby={describedBy} aria-invalid={invalid || undefined}
                        onChange={(e) => set("expected_graduation", e.target.value)}
                      />
                    )}
                  </Field>

                  <Field
                    id="prior_lab_experience" label="Prior lab experience"
                    hint="Any research, teaching lab, or hands-on work. None is a fine answer."
                  >
                    {({ id }) => (
                      <Textarea
                        id={id} rows={3} value={form.prior_lab_experience}
                        onChange={(e) => set("prior_lab_experience", e.target.value)}
                      />
                    )}
                  </Field>

                  <Field
                    id="conflicts" label="Other commitments"
                    hint="Other jobs, athletics, other labs, clinical hours - anything that competes for the same time."
                  >
                    {({ id }) => (
                      <Textarea
                        id={id} rows={3} value={form.conflicts}
                        onChange={(e) => set("conflicts", e.target.value)}
                      />
                    )}
                  </Field>

                  <Field
                    id="prior_contact" label="Have you already spoken to anyone in the lab?"
                    hint="Their name, if so. It helps us connect your application to the conversation."
                  >
                    {({ id }) => (
                      <Input
                        id={id} value={form.prior_contact}
                        onChange={(e) => set("prior_contact", e.target.value)}
                      />
                    )}
                  </Field>
                </div>
              )}

              {/* ---- Step 2 ---------------------------------------------------------- */}
              {step === 1 && (
                <div className="space-y-6">
                  <fieldset>
                    <legend className="text-sm font-medium mb-1">
                      Which of these have you taken or are you taking?
                    </legend>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tick everything that applies. Missing one is not disqualifying.
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {COURSEWORK_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-start gap-2.5">
                          <Checkbox
                            id={`cw-${option.value}`}
                            className="mt-0.5"
                            checked={form.coursework.includes(option.value)}
                            onCheckedChange={(checked) =>
                              set(
                                "coursework",
                                checked
                                  ? [...form.coursework, option.value]
                                  : form.coursework.filter((c) => c !== option.value),
                              )
                            }
                          />
                          <Label htmlFor={`cw-${option.value}`} className="font-normal leading-snug">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset
                    aria-describedby={errors.r_experience ? "r_experience-error" : undefined}
                    aria-invalid={errors.r_experience ? true : undefined}
                  >
                    <legend className="text-sm font-medium mb-1">
                      Experience with R
                      <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                    </legend>
                    <RadioGroup
                      className="space-y-2 pt-1"
                      value={form.r_experience}
                      onValueChange={(v) => set("r_experience", v as RExperience)}
                    >
                      {(Object.keys(R_EXPERIENCE_LABELS) as RExperience[]).map((key) => (
                        <div key={key} className="flex items-center gap-2.5">
                          <RadioGroupItem value={key} id={`r-${key}`} />
                          <Label htmlFor={`r-${key}`} className="font-normal">
                            {R_EXPERIENCE_LABELS[key]}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.r_experience && (
                      <p id="r_experience-error" className="text-xs text-destructive mt-1.5">
                        {errors.r_experience}
                      </p>
                    )}
                  </fieldset>
                </div>
              )}

              {/* ---- Step 3 ---------------------------------------------------------- */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field
                      id="hours_available" label="Hours per week" required
                      error={errors.hours_available}
                    >
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id} type="number" inputMode="numeric" min={1} max={40}
                          value={form.hours_available}
                          aria-describedby={describedBy} aria-invalid={invalid || undefined}
                          onChange={(e) => set("hours_available", e.target.value)}
                        />
                      )}
                    </Field>
                    <Field
                      id="longest_block_hours" label="Longest single block" required
                      hint="Uninterrupted hours."
                      error={errors.longest_block_hours}
                    >
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id} type="number" inputMode="numeric" min={1} max={12}
                          value={form.longest_block_hours}
                          aria-describedby={describedBy} aria-invalid={invalid || undefined}
                          onChange={(e) => set("longest_block_hours", e.target.value)}
                        />
                      )}
                    </Field>
                    <Field
                      id="semesters_available" label="Semesters available" required
                      error={errors.semesters_available}
                    >
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id} type="number" inputMode="numeric" min={1} max={8}
                          value={form.semesters_available}
                          aria-describedby={describedBy} aria-invalid={invalid || undefined}
                          onChange={(e) => set("semesters_available", e.target.value)}
                        />
                      )}
                    </Field>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      When are you free?
                      <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                    </Label>
                    <p id="availability-hint" className="text-xs text-muted-foreground">
                      Click hours you could reliably be in the lab. Click a day name to select
                      or clear the whole column.
                    </p>
                    <AvailabilityGrid
                      value={form.availability}
                      onChange={(next) => set("availability", next)}
                      describedBy={
                        errors.availability ? "availability-hint availability-error" : "availability-hint"
                      }
                      invalid={Boolean(errors.availability)}
                    />
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {totalAvailableHours(form.availability)} hours marked, longest block{" "}
                      {longestBlockHours(form.availability)} hours.
                    </p>
                    {errors.availability && (
                      <p id="availability-error" className="text-xs text-destructive">
                        {errors.availability}
                      </p>
                    )}
                  </div>

                  <Field
                    id="credit_type" label="How would you like this to count?" required
                    error={errors.credit_type}
                  >
                    {({ id, describedBy, invalid }) => (
                      <Select
                        value={form.credit_type}
                        onValueChange={(v) => set("credit_type", v as CreditType)}
                      >
                        <SelectTrigger
                          id={id} aria-describedby={describedBy}
                          aria-invalid={invalid || undefined}
                        >
                          <SelectValue placeholder="Choose one" />
                        </SelectTrigger>
                        <SelectContent>
                          {CREDIT_TYPES.map((c) => (
                            <SelectItem key={c} value={c}>{CREDIT_TYPE_LABELS[c]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <YesNo
                      id="animal_samples_ok" label="Comfortable handling animal samples?"
                      hint="Faeces, blood, swabs from live or wild animals."
                      value={form.animal_samples_ok} error={errors.animal_samples_ok}
                      onChange={(v) => set("animal_samples_ok", v)}
                    />
                    <YesNo
                      id="field_local_ok" label="Available for local field work?"
                      hint="Early mornings, heat, boats."
                      value={form.field_local_ok} error={errors.field_local_ok}
                      onChange={(v) => set("field_local_ok", v)}
                    />
                    <YesNo
                      id="field_intl_interest" label="Interested in international field work?"
                      hint="Not offered to every student, and not in a first semester."
                      value={form.field_intl_interest} error={errors.field_intl_interest}
                      onChange={(v) => set("field_intl_interest", v)}
                    />
                    <YesNo
                      id="has_transportation" label="Do you have transportation?"
                      hint="Some projects need travel off campus."
                      value={form.has_transportation} error={errors.has_transportation}
                      onChange={(v) => set("has_transportation", v)}
                    />
                  </div>
                </div>
              )}

              {/* ---- Step 4 ---------------------------------------------------------- */}
              {step === 3 && (
                <div className="space-y-6">
                  <fieldset
                    aria-describedby={
                      ["choices-hint", errors.choices ? "choices-error" : ""].filter(Boolean).join(" ")
                    }
                    aria-invalid={errors.choices ? true : undefined}
                  >
                    <legend className="text-sm font-medium mb-1">
                      Rank the positions you want
                      <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                    </legend>
                    <p id="choices-hint" className="text-xs text-muted-foreground mb-3">
                      One to three, in order. A position can only appear once.
                    </p>
                    <div className="space-y-3">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="space-y-1">
                          <Label htmlFor={`choice-${index}`} className="text-xs">
                            {["First choice", "Second choice (optional)", "Third choice (optional)"][index]}
                          </Label>
                          <Select
                            value={form.choices[index] ?? "none"}
                            onValueChange={(v) => {
                              const next = [...form.choices];
                              next[index] = v === "none" ? null : v;
                              set("choices", next);
                            }}
                          >
                            <SelectTrigger id={`choice-${index}`}>
                              <SelectValue placeholder="Choose a position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No choice</SelectItem>
                              {availableFor(index).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.title} · {p.hours_per_week} hrs/wk, {p.min_block_hours} hr blocks
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.choices[index] && positionsById[form.choices[index] as string] && (
                            <p className="text-xs text-muted-foreground">
                              {positionsById[form.choices[index] as string].hours_per_week} hours a
                              week, in blocks of at least{" "}
                              {positionsById[form.choices[index] as string].min_block_hours} hours.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.choices && (
                      <p id="choices-error" className="text-xs text-destructive mt-2">
                        {errors.choices}
                      </p>
                    )}
                  </fieldset>

                  <Field
                    id="statement" label="Your statement" required
                    hint="Why these positions, and what you want out of the semester."
                    error={errors.statement}
                  >
                    {({ id, describedBy, invalid }) => (
                      <>
                        <Textarea
                          id={id} rows={8} value={form.statement} maxLength={MAX_STATEMENT}
                          aria-describedby={describedBy} aria-invalid={invalid || undefined}
                          onChange={(e) => set("statement", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground text-right" aria-live="polite">
                          {form.statement.length} / {MAX_STATEMENT}
                        </p>
                      </>
                    )}
                  </Field>

                  {/* Policy comprehension. Answers are graded on the server against the
                      cycle row - the numbers are all stated above, so this is a reading
                      check, not a quiz, and getting one wrong does not block anything. */}
                  <div className="rounded-lg border border-border p-4 space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold">A few questions about the expectations</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The answers are all on this page. Getting one wrong will not stop your
                        application.
                      </p>
                    </div>

                    <fieldset aria-invalid={errors.policy_min_hours ? true : undefined}>
                      <legend className="text-sm">Minimum hours a week?</legend>
                      <RadioGroup
                        className="flex flex-wrap gap-4 pt-1.5"
                        value={form.policy_min_hours}
                        onValueChange={(v) => set("policy_min_hours", v)}
                      >
                        {hourOptions.map((h) => (
                          <div key={h} className="flex items-center gap-2">
                            <RadioGroupItem value={String(h)} id={`pol-hours-${h}`} />
                            <Label htmlFor={`pol-hours-${h}`} className="font-normal">{h}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.policy_min_hours && (
                        <p className="text-xs text-destructive mt-1">{errors.policy_min_hours}</p>
                      )}
                    </fieldset>

                    <fieldset aria-invalid={errors.policy_min_semesters ? true : undefined}>
                      <legend className="text-sm">Minimum number of semesters?</legend>
                      <RadioGroup
                        className="flex flex-wrap gap-4 pt-1.5"
                        value={form.policy_min_semesters}
                        onValueChange={(v) => set("policy_min_semesters", v)}
                      >
                        {semesterOptions.map((s) => (
                          <div key={s} className="flex items-center gap-2">
                            <RadioGroupItem value={String(s)} id={`pol-sem-${s}`} />
                            <Label htmlFor={`pol-sem-${s}`} className="font-normal">{s}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.policy_min_semesters && (
                        <p className="text-xs text-destructive mt-1">{errors.policy_min_semesters}</p>
                      )}
                    </fieldset>

                    <fieldset aria-invalid={errors.policy_trial_weeks ? true : undefined}>
                      <legend className="text-sm">How long is the trial period, in weeks?</legend>
                      <RadioGroup
                        className="flex flex-wrap gap-4 pt-1.5"
                        value={form.policy_trial_weeks}
                        onValueChange={(v) => set("policy_trial_weeks", v)}
                      >
                        {trialOptions.map((w) => (
                          <div key={w} className="flex items-center gap-2">
                            <RadioGroupItem value={String(w)} id={`pol-trial-${w}`} />
                            <Label htmlFor={`pol-trial-${w}`} className="font-normal">{w}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.policy_trial_weeks && (
                        <p className="text-xs text-destructive mt-1">{errors.policy_trial_weeks}</p>
                      )}
                    </fieldset>

                    <fieldset aria-invalid={errors.policy_ehs ? true : undefined}>
                      <legend className="text-sm">
                        Is EHS lab safety training required before bench work?
                      </legend>
                      <RadioGroup
                        className="flex gap-4 pt-1.5"
                        value={form.policy_ehs}
                        onValueChange={(v) => set("policy_ehs", v)}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="pol-ehs-yes" />
                          <Label htmlFor="pol-ehs-yes" className="font-normal">Yes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="pol-ehs-no" />
                          <Label htmlFor="pol-ehs-no" className="font-normal">No</Label>
                        </div>
                      </RadioGroup>
                      {errors.policy_ehs && (
                        <p className="text-xs text-destructive mt-1">{errors.policy_ehs}</p>
                      )}
                    </fieldset>
                  </div>

                  {/* Honeypot. Not display:none - some bots skip hidden inputs, and a
                      few browsers skip them on autofill. Pushed off-screen instead, with
                      aria-hidden and tabIndex=-1 so no assistive technology and no
                      keyboard user ever reaches it. Empty is the only human answer. */}
                  <div
                    aria-hidden="true"
                    className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden"
                  >
                    <label htmlFor="website">Website (leave this blank)</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {cycle.require_turnstile && (
                    <div className="space-y-1.5">
                      {TURNSTILE_SITE_KEY ? (
                        <TurnstileWidget onToken={setTurnstileToken} />
                      ) : (
                        <Card className="p-4 flex gap-3 border-warning/40 bg-warning/5">
                          <AlertTriangle
                            className="w-5 h-5 text-warning shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <p className="text-sm">
                            This form is not finished being set up and cannot accept
                            submissions yet. Please email{" "}
                            <a
                              className="text-primary underline underline-offset-4"
                              href={`mailto:${cycle.pi_contact_email}`}
                            >
                              {cycle.pi_contact_email}
                            </a>{" "}
                            and we will make sure your interest is recorded.
                          </p>
                        </Card>
                      )}
                      {errors.turnstile && (
                        <p className="text-xs text-destructive">{errors.turnstile}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex gap-2.5"
                >
                  <AlertTriangle
                    className="w-4 h-4 text-destructive shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-border">
                <Button
                  type="button" variant="ghost" onClick={goBack}
                  disabled={step === 0 || submitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  Back
                </Button>

                {step < 3 ? (
                  <Button type="submit">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting || (cycle.require_turnstile && !TURNSTILE_SITE_KEY)}
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          className="w-4 h-4 mr-1.5 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                        Sending
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Submit application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </section>

        <footer className="text-center text-xs text-muted-foreground pb-4">
          Questions? Email{" "}
          <a className="text-primary underline underline-offset-4" href={`mailto:${cycle.pi_contact_email}`}>
            {cycle.pi_contact_email}
          </a>
        </footer>
      </main>
    </div>
  );
};

export default Join;
