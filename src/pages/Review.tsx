import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  Filter,
  Loader2,
  Mail,
  Star,
  UserPlus,
  X,
  Copy,
  Link2,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { readFunctionError, settleWrite } from "@/lib/dbWrite";
import { AvailabilityView } from "@/components/recruiting/AvailabilityGrid";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_CLASSES,
  APPLICATION_STATUS_LABELS,
  Availability,
  ApplicationStatus,
  COURSEWORK_LABELS,
  CREDIT_TYPES,
  CREDIT_TYPE_LABELS,
  CreditType,
  R_EXPERIENCE_LABELS,
  REVIEW_DECISION_LABELS,
  RExperience,
  ReviewDecision,
  STUDENT_YEAR_LABELS,
  StudentYear,
  parseAvailability,
} from "@/lib/recruiting";
import { cn } from "@/lib/utils";

/**
 * #/review - the queue of applications ranked to the signed-in mentor's positions.
 *
 * Every row here arrived through RLS: recruiting_can_review(auth.uid(), id) is the only
 * thing that decides what this page can see, and it is the same predicate on applications
 * and on their ranked choices, so a half-visible application is not possible.
 *
 * There are no notification emails in this module by design. This page IS the
 * notification, which is why the unreviewed count is shown prominently and why "new"
 * means "you personally have not written a review yet" rather than a shared read flag -
 * two mentors sharing an applicant each need their own sense of what they have looked at.
 */

interface ChoiceRow {
  rank: number;
  positionId: string;
  positionTitle: string;
  mentorId: string;
  mentorName: string | null;
}

interface ReviewRow {
  id: string;
  reviewer_id: string;
  score: number | null;
  notes: string | null;
  decision: ReviewDecision | null;
  interview_at: string | null;
}

interface ApplicationRow {
  id: string;
  cycle: string;
  full_name: string;
  email: string;
  year: StudentYear;
  major: string;
  expected_graduation: string;
  coursework: string[];
  r_experience: RExperience;
  prior_lab_experience: string | null;
  hours_available: number;
  longest_block_hours: number;
  availability: Availability;
  semesters_available: number;
  credit_type: CreditType;
  animal_samples_ok: boolean;
  field_local_ok: boolean;
  field_intl_interest: boolean;
  has_transportation: boolean;
  conflicts: string | null;
  prior_contact: string | null;
  statement: string;
  policy_check_score: number;
  status: ApplicationStatus;
  created_at: string;
  /** The lab account created for this person, once the PI has made one. */
  profileId: string | null;
  profileName: string | null;
  profileEmail: string | null;
  choices: ChoiceRow[];
  reviews: ReviewRow[];
  /** Best (lowest) rank this applicant gave to a position the viewer owns. */
  myRank: number;
}

interface Filters {
  status: string;
  creditType: string;
  minSemesters: string;
  minBlock: string;
  cycle: string;
}

const EMPTY_FILTERS: Filters = {
  status: "all", creditType: "all", minSemesters: "any", minBlock: "any", cycle: "all",
};

const YesNoBadge = ({ value, label }: { value: boolean; label: string }) => (
  <Badge
    variant="outline"
    className={cn(
      "font-normal",
      value
        ? "bg-success/10 text-success border-success/20"
        : "bg-muted text-muted-foreground border-border",
    )}
  >
    {label}: {value ? "yes" : "no"}
  </Badge>
);

const Review = () => {
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [archiveCycle, setArchiveCycle] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [openCycle, setOpenCycle] = useState<string | null>(null);

  // Turning an accepted applicant into a lab account. Kept deliberately explicit rather
  // than firing on a status change: creating an account is not something to do by accident.
  const [accountFor, setAccountFor] = useState<ApplicationRow | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

  // Draft of the viewer's own review for the open application.
  const [score, setScore] = useState<string>("");
  const [decision, setDecision] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [interviewAt, setInterviewAt] = useState<string>("");

  const isPI = permissions.canAdminRecruiting;

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: cycleName }, { data, error }] = await Promise.all([
      supabase.rpc("recruiting_open_cycle"),
      supabase
        .from("recruiting_applications")
        .select(
          "*, recruiting_application_positions(rank, position_id, recruiting_positions(id, title, mentor_id, profiles!recruiting_positions_mentor_id_fkey(full_name))), recruiting_reviews(id, reviewer_id, score, notes, decision, interview_at), profiles!recruiting_applications_profile_id_fkey(id, full_name, email)",
        )
        .order("created_at", { ascending: true }),
    ]);

    if (error) {
      toast.error("Could not load the review queue.");
      setLoading(false);
      return;
    }

    setOpenCycle((cycleName as string) ?? null);

    const mapped: ApplicationRow[] = (data ?? []).map((row) => {
      const choiceRows = (row.recruiting_application_positions ?? []) as unknown as {
        rank: number;
        position_id: string;
        recruiting_positions: {
          id: string; title: string; mentor_id: string;
          profiles: { full_name: string | null } | null;
        } | null;
      }[];

      const choices: ChoiceRow[] = choiceRows
        .map((c) => ({
          rank: c.rank,
          positionId: c.position_id,
          positionTitle: c.recruiting_positions?.title ?? "(listing removed)",
          mentorId: c.recruiting_positions?.mentor_id ?? "",
          mentorName: c.recruiting_positions?.profiles?.full_name ?? null,
        }))
        .sort((a, b) => a.rank - b.rank);

      const mine = choices.filter((c) => c.mentorId === user?.id).map((c) => c.rank);

      return {
        id: row.id,
        cycle: row.cycle,
        full_name: row.full_name,
        email: row.email,
        year: row.year as StudentYear,
        major: row.major,
        expected_graduation: row.expected_graduation,
        coursework: row.coursework ?? [],
        r_experience: row.r_experience as RExperience,
        prior_lab_experience: row.prior_lab_experience,
        hours_available: row.hours_available,
        longest_block_hours: row.longest_block_hours,
        availability: parseAvailability(row.availability),
        semesters_available: row.semesters_available,
        credit_type: row.credit_type as CreditType,
        animal_samples_ok: row.animal_samples_ok,
        field_local_ok: row.field_local_ok,
        field_intl_interest: row.field_intl_interest,
        has_transportation: row.has_transportation,
        conflicts: row.conflicts,
        prior_contact: row.prior_contact,
        statement: row.statement,
        policy_check_score: row.policy_check_score,
        status: row.status as ApplicationStatus,
        created_at: row.created_at,
        profileId: row.profile_id ?? null,
        profileName: (row.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
        profileEmail: (row.profiles as unknown as { email: string } | null)?.email ?? null,
        choices,
        reviews: (row.recruiting_reviews ?? []) as unknown as ReviewRow[],
        // A PI sees applications that rank nobody's position they own. Sorting those to
        // the end rather than to rank 1 keeps a mentor's own queue at the top.
        myRank: mine.length ? Math.min(...mine) : 99,
      };
    });

    // Spec 5.2: rank ascending, then submission time.
    mapped.sort(
      (a, b) => a.myRank - b.myRank || a.created_at.localeCompare(b.created_at),
    );
    setRows(mapped);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const cycles = useMemo(
    () => [...new Set(rows.map((r) => r.cycle))].sort().reverse(),
    [rows],
  );

  const myReviewFor = useCallback(
    (row: ApplicationRow) => row.reviews.find((r) => r.reviewer_id === user?.id) ?? null,
    [user?.id],
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.status !== "all" && row.status !== filters.status) return false;
        if (filters.creditType !== "all" && row.credit_type !== filters.creditType) return false;
        if (filters.minSemesters !== "any" && row.semesters_available < Number(filters.minSemesters)) return false;
        if (filters.minBlock !== "any" && row.longest_block_hours < Number(filters.minBlock)) return false;
        if (filters.cycle !== "all" && row.cycle !== filters.cycle) return false;
        return true;
      }),
    [rows, filters],
  );

  const unreviewed = useMemo(
    () => rows.filter((r) => !myReviewFor(r)).length,
    [rows, myReviewFor],
  );

  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  // Load the viewer's existing review into the draft whenever the detail opens.
  useEffect(() => {
    if (!open) return;
    const mine = myReviewFor(open);
    setScore(mine?.score ? String(mine.score) : "");
    setDecision(mine?.decision ?? "");
    setNotes(mine?.notes ?? "");
    setInterviewAt(mine?.interview_at ? mine.interview_at.slice(0, 16) : "");
  }, [open, myReviewFor]);

  const saveReview = async () => {
    if (!open || !user) return;
    setSavingReview(true);

    const payload = {
      application_id: open.id,
      reviewer_id: user.id,
      score: score ? Number(score) : null,
      decision: decision ? (decision as ReviewDecision) : null,
      notes: notes.trim() || null,
      interview_at: interviewAt ? new Date(interviewAt).toISOString() : null,
    };

    const existing = myReviewFor(open);
    // Two statements rather than an upsert: the INSERT and UPDATE policies are different
    // (INSERT additionally requires recruiting_can_review), and an upsert that falls
    // through to the wrong one fails in a way that is hard to read.
    if (existing) {
      const result = await settleWrite(
        supabase.from("recruiting_reviews").update(payload).eq("id", existing.id).select("id"),
        "You can only change your own review.",
      );
      setSavingReview(false);
      if (!result.ok) { toast.error(result.message); return; }
    } else {
      const { error } = await supabase.from("recruiting_reviews").insert(payload);
      setSavingReview(false);
      if (error) { toast.error(error.message); return; }
    }

    toast.success("Review saved.");
    load();
  };

  const setStatus = async (row: ApplicationRow, status: ApplicationStatus) => {
    // Only `status` is granted to authenticated at column level, so this update must not
    // carry any other field - PostgREST rejects the whole statement if it does.
    const result = await settleWrite(
      supabase.from("recruiting_applications").update({ status }).eq("id", row.id).select("id"),
      "You can only change applications ranked to your own positions.",
    );
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(`Moved to ${APPLICATION_STATUS_LABELS[status].toLowerCase()}.`);
    load();
  };

  /**
   * Look for a profile that already uses this address before offering to create one.
   * manage-users would refuse a duplicate anyway, but with a raw auth error; better to
   * offer to link the existing person instead.
   */
  const openAccountDialog = async (row: ApplicationRow) => {
    setNewPassword(null);
    setExistingProfileId(null);
    setAccountFor(row);
    const { data } = await supabase
      .from("profiles").select("id").eq("email", row.email).maybeSingle();
    if (data?.id) setExistingProfileId(data.id);
  };

  /** Attach an application to a profile that already exists. PI only, by trigger. */
  const linkExisting = async () => {
    if (!accountFor || !existingProfileId) return;
    const result = await settleWrite(
      supabase.from("recruiting_applications")
        .update({ profile_id: existingProfileId }).eq("id", accountFor.id).select("id"),
      "Only the PI can link an application to a lab account.",
    );
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Linked to the existing account.");
    setAccountFor(null);
    load();
  };

  /**
   * Create the lab account through the SAME manage-users function Settings uses, so there
   * is one way accounts come into existence and it stays audited - manage-users writes its
   * own activity_logs row. Then record the link, which is the whole point: from here on,
   * this person's bookings, usage records and skill sign-offs are reachable from the
   * application they arrived on.
   */
  const createAccount = async () => {
    if (!accountFor) return;
    setCreatingAccount(true);

    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: {
        action: "create",
        email: accountFor.email,
        fullName: accountFor.full_name,
        role: "undergrad_student",
      },
    });

    if (error) {
      setCreatingAccount(false);
      toast.error(await readFunctionError(error, "Could not create the account."));
      return;
    }

    const created = data as { user?: { id: string }; password?: string };
    if (!created?.user?.id) {
      setCreatingAccount(false);
      toast.error("The account was not created.");
      return;
    }

    const result = await settleWrite(
      supabase.from("recruiting_applications")
        .update({ profile_id: created.user.id }).eq("id", accountFor.id).select("id"),
      "The account was created, but linking it to this application failed.",
    );
    setCreatingAccount(false);

    if (!result.ok) {
      // Be precise: the account DOES exist now. Saying "failed" would send the PI off to
      // create a second one.
      toast.error(`${result.message} The account exists - link it from Settings.`);
    }
    setNewPassword(created.password ?? null);
    load();
  };

  const archive = async () => {
    if (!archiveCycle) return;
    setArchiving(true);

    // Export first, delete second - and only delete if the export actually produced rows.
    const { data, error } = await supabase
      .from("recruiting_applications")
      .select(
        "*, recruiting_application_positions(rank, position_id), recruiting_reviews(reviewer_id, score, notes, decision, interview_at)",
      )
      .eq("cycle", archiveCycle);

    if (error || !data) {
      setArchiving(false);
      toast.error("Could not read the applications to archive. Nothing was deleted.");
      return;
    }
    if (data.length === 0) {
      setArchiving(false);
      toast.info("There are no applications in that cycle.");
      setArchiveCycle(null);
      return;
    }

    const blob = new Blob(
      [JSON.stringify({ cycle: archiveCycle, exported_at: new Date().toISOString(), applications: data }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recruiting-${archiveCycle}-archive.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    // Qualified DELETE. An unqualified one would be rejected outright: Supabase preloads
    // `safeupdate` into the authenticator role.
    const result = await settleWrite(
      supabase.from("recruiting_applications").delete().eq("cycle", archiveCycle).select("id"),
      "Only the PI can archive a cycle, and only once it is no longer the open one.",
    );
    setArchiving(false);
    setArchiveCycle(null);

    if (!result.ok) {
      toast.error(`${result.message} The export was downloaded; nothing was deleted.`);
      return;
    }
    toast.success(`Exported and deleted ${result.rowCount} application(s).`);
    load();
  };

  if (!permissions.canReviewApplications) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
          <Card className="p-6">
            <h1 className="font-semibold text-lg">Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Undergraduate applications are reviewed by the mentors whose positions they
              were sent to.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Undergraduate applications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPI
                ? "Every application in the lab, ranked by how the applicant ordered your listings first."
                : "Applications ranked to your listings, best rank first."}
            </p>
          </div>
          {isPI && cycles.filter((c) => c !== openCycle).length > 0 && (
            <Button variant="outline" onClick={() => setArchiveCycle(cycles.find((c) => c !== openCycle) ?? null)}>
              <Archive className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Archive a closed cycle
            </Button>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center" aria-live="polite">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {unreviewed} waiting on you
            </Badge>
            <span className="text-xs text-muted-foreground">
              of {rows.length} you can see
            </span>
          </div>
        )}

        {/* Filters ------------------------------------------------------------------- */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Filters</h2>
            {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
              <Button
                variant="ghost" size="sm" className="ml-auto h-7"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <X className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label htmlFor="f-status" className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger id="f-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-credit" className="text-xs">Credit type</Label>
              <Select value={filters.creditType} onValueChange={(v) => setFilters({ ...filters, creditType: v })}>
                <SelectTrigger id="f-credit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {CREDIT_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>{CREDIT_TYPE_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-semesters" className="text-xs">Semesters available</Label>
              <Select value={filters.minSemesters} onValueChange={(v) => setFilters({ ...filters, minSemesters: v })}>
                <SelectTrigger id="f-semesters"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-block" className="text-xs">Longest block</Label>
              <Select value={filters.minBlock} onValueChange={(v) => setFilters({ ...filters, minBlock: v })}>
                <SelectTrigger id="f-block"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {[2, 3, 4, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}+ hours</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-cycle" className="text-xs">Cycle</Label>
              <Select value={filters.cycle} onValueChange={(v) => setFilters({ ...filters, cycle: v })}>
                <SelectTrigger id="f-cycle"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cycles</SelectItem>
                  {cycles.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Queue --------------------------------------------------------------------- */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin motion-reduce:animate-none text-primary" />
            <span className="sr-only">Loading</span>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "No applications have been sent to your listings yet."
                : "No applications match these filters."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const mine = myReviewFor(row);
              return (
                <Card key={row.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <div className="flex-1 min-w-[14rem]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{row.full_name}</h3>
                        <Badge
                          variant="outline"
                          className={cn("font-normal", APPLICATION_STATUS_CLASSES[row.status])}
                        >
                          {APPLICATION_STATUS_LABELS[row.status]}
                        </Badge>
                        {!mine && (
                          <Badge className="bg-primary text-primary-foreground font-normal">
                            New to you
                          </Badge>
                        )}
                        {row.profileId && (
                          <Badge
                            variant="outline"
                            className="font-normal bg-success/10 text-success border-success/20 gap-1"
                          >
                            <Link2 className="w-3 h-3" aria-hidden="true" />
                            Has an account
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {STUDENT_YEAR_LABELS[row.year]} · {row.major} · graduating{" "}
                        {row.expected_graduation}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {row.choices.map((choice) => (
                          <Badge
                            key={choice.positionId}
                            variant="outline"
                            className={cn(
                              "font-normal",
                              choice.mentorId === user?.id && "border-primary/40 text-primary",
                            )}
                          >
                            #{choice.rank} {choice.positionTitle}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-right space-y-0.5 min-w-[9rem]">
                      <p>
                        <span className="font-medium tabular-nums">{row.hours_available}</span>{" "}
                        <span className="text-muted-foreground">hrs/wk</span>
                      </p>
                      <p className="text-muted-foreground">
                        <span className="tabular-nums">{row.longest_block_hours}</span> hr block ·{" "}
                        <span className="tabular-nums">{row.semesters_available}</span> sem
                      </p>
                      <p className="text-muted-foreground">
                        {CREDIT_TYPE_LABELS[row.credit_type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Policy check {row.policy_check_score}/4
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {mine?.decision && (
                        <Badge variant="secondary" className="font-normal">
                          You: {REVIEW_DECISION_LABELS[mine.decision]}
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setOpenId(row.id)}>
                        Open
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Detail ---------------------------------------------------------------------- */}
      <Dialog open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpenId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.full_name}</DialogTitle>
                <DialogDescription>
                  {STUDENT_YEAR_LABELS[open.year]} · {open.major} · graduating{" "}
                  {open.expected_graduation} · applied{" "}
                  {new Date(open.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <a
                    className="text-sm text-primary underline underline-offset-4 inline-flex items-center gap-1.5"
                    href={`mailto:${open.email}`}
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    {open.email}
                  </a>
                  <Badge variant="outline" className="font-normal">
                    Policy check {open.policy_check_score}/4
                  </Badge>
                </div>

                <section>
                  <h4 className="text-sm font-semibold mb-2">Positions ranked</h4>
                  <ol className="space-y-1 text-sm">
                    {open.choices.map((choice) => (
                      <li key={choice.positionId} className="flex flex-wrap gap-x-2">
                        <span className="font-medium tabular-nums">#{choice.rank}</span>
                        <span>{choice.positionTitle}</span>
                        <span className="text-muted-foreground">
                          ({choice.mentorId === user?.id ? "yours" : choice.mentorName ?? "another mentor"})
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h4 className="text-sm font-semibold mb-2">Statement</h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{open.statement}</p>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold mb-1.5">Coursework</h4>
                    {open.coursework.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None listed.</p>
                    ) : (
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        {open.coursework.map((c) => (
                          <li key={c}>{COURSEWORK_LABELS[c] ?? c}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm mt-2">
                      <span className="font-medium">R:</span>{" "}
                      <span className="text-muted-foreground">
                        {R_EXPERIENCE_LABELS[open.r_experience]}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Logistics</h4>
                    <p className="text-sm text-muted-foreground">
                      {open.hours_available} hrs/week · longest block{" "}
                      {open.longest_block_hours} hrs · {open.semesters_available} semesters ·{" "}
                      {CREDIT_TYPE_LABELS[open.credit_type]}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <YesNoBadge value={open.animal_samples_ok} label="Animal samples" />
                      <YesNoBadge value={open.field_local_ok} label="Local field" />
                      <YesNoBadge value={open.field_intl_interest} label="International" />
                      <YesNoBadge value={open.has_transportation} label="Transport" />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold mb-2">Availability</h4>
                  <AvailabilityView value={open.availability} />
                </section>

                {(open.prior_lab_experience || open.conflicts || open.prior_contact) && (
                  <section className="space-y-3">
                    {open.prior_lab_experience && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Prior lab experience</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {open.prior_lab_experience}
                        </p>
                      </div>
                    )}
                    {open.conflicts && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Other commitments</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {open.conflicts}
                        </p>
                      </div>
                    )}
                    {open.prior_contact && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Already spoken to</h4>
                        <p className="text-sm text-muted-foreground">{open.prior_contact}</p>
                      </div>
                    )}
                  </section>
                )}

                {/* Review controls ------------------------------------------------- */}
                <section className="rounded-lg border border-border p-4 space-y-4">
                  <h4 className="text-sm font-semibold">Your review</h4>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rev-score">Score</Label>
                      <Select value={score} onValueChange={setScore}>
                        <SelectTrigger id="rev-score">
                          <SelectValue placeholder="Not scored" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              <span className="inline-flex items-center gap-1">
                                <Star className="w-3 h-3" aria-hidden="true" />{n}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rev-decision">Decision</Label>
                      <Select value={decision} onValueChange={setDecision}>
                        <SelectTrigger id="rev-decision">
                          <SelectValue placeholder="Not decided" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(REVIEW_DECISION_LABELS) as ReviewDecision[]).map((d) => (
                            <SelectItem key={d} value={d}>{REVIEW_DECISION_LABELS[d]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rev-interview">Interview</Label>
                      <Input
                        id="rev-interview" type="datetime-local" value={interviewAt}
                        onChange={(e) => setInterviewAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rev-notes">Notes</Label>
                    <Textarea
                      id="rev-notes" rows={3} value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={saveReview} disabled={savingReview}>
                      {savingReview && (
                        <Loader2
                          className="w-4 h-4 mr-1.5 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                      )}
                      Save review
                    </Button>
                    {isPI && open.reviews.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {open.reviews.length} review(s) on file
                      </span>
                    )}
                  </div>

                  {isPI && open.reviews.filter((r) => r.reviewer_id !== user?.id).length > 0 && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Other reviewers
                      </h5>
                      {open.reviews
                        .filter((r) => r.reviewer_id !== user?.id)
                        .map((r) => (
                          <p key={r.id} className="text-sm text-muted-foreground">
                            {r.decision ? REVIEW_DECISION_LABELS[r.decision] : "No decision"}
                            {r.score ? ` · ${r.score}/5` : ""}
                            {r.notes ? ` · ${r.notes}` : ""}
                          </p>
                        ))}
                    </div>
                  )}
                </section>

                {/* Lab account. This is the join between recruiting and the rest of the
                    scheduler: once profile_id is set, this person's bookings, usage records
                    and skill sign-offs all hang off the same id. */}
                <section className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="text-sm font-semibold">Lab account</h4>
                  {open.profileId ? (
                    <p className="text-sm text-muted-foreground">
                      Linked to{" "}
                      <span className="font-medium text-foreground">
                        {open.profileName ?? open.profileEmail}
                      </span>
                      . Their bookings, equipment usage and skill sign-offs are tracked
                      against this application.
                    </p>
                  ) : isPI ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        No lab account yet. Creating one lets them book equipment and start
                        collecting skill sign-offs.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => openAccountDialog(open)}>
                        <UserPlus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Create lab account
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No lab account yet. The PI creates these.
                    </p>
                  )}
                </section>

                <section className="space-y-1.5">
                  <Label htmlFor="app-status">Application status</Label>
                  <Select
                    value={open.status}
                    onValueChange={(v) => setStatus(open, v as ApplicationStatus)}
                  >
                    <SelectTrigger id="app-status" className="sm:w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Shared with every mentor this applicant ranked.
                  </p>
                </section>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenId(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create or link a lab account ---------------------------------------------------- */}
      <Dialog
        open={accountFor !== null}
        onOpenChange={(isOpen) => { if (!isOpen) { setAccountFor(null); setNewPassword(null); } }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {newPassword ? "Account created" : "Create a lab account"}
            </DialogTitle>
            <DialogDescription>
              {newPassword
                ? "Pass these details on. The password is shown once and is not stored anywhere you can read it again."
                : `This uses the same account creation as Settings, with the role set to Undergraduate Student.`}
            </DialogDescription>
          </DialogHeader>

          {accountFor && !newPassword && (
            <div className="space-y-3 py-1 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {accountFor.full_name}</p>
                <p><span className="text-muted-foreground">Email:</span> {accountFor.email}</p>
                <p><span className="text-muted-foreground">Role:</span> Undergraduate Student</p>
              </div>
              {existingProfileId && (
                <div className="rounded-lg border border-warning/40 bg-warning/5 p-3">
                  <p>
                    An account already uses this address. Link this application to it instead
                    of creating a second one.
                  </p>
                </div>
              )}
            </div>
          )}

          {newPassword && (
            <div className="space-y-2 py-1">
              <Label htmlFor="new-account-password">Temporary password</Label>
              <div className="flex gap-2">
                <Input id="new-account-password" readOnly value={newPassword} className="font-mono text-xs" />
                <Button
                  variant="outline" size="icon" aria-label="Copy password"
                  onClick={() => {
                    navigator.clipboard?.writeText(newPassword)
                      .then(() => toast.success("Copied."))
                      .catch(() => toast.error("Could not copy - select it by hand."));
                  }}
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ask them to change it once they have signed in.
              </p>
            </div>
          )}

          <DialogFooter>
            {newPassword ? (
              <Button onClick={() => { setAccountFor(null); setNewPassword(null); }}>Done</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setAccountFor(null)} disabled={creatingAccount}>
                  Cancel
                </Button>
                {existingProfileId ? (
                  <Button onClick={linkExisting}>
                    <Link2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Link to the existing account
                  </Button>
                ) : (
                  <Button onClick={createAccount} disabled={creatingAccount}>
                    {creatingAccount && (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    )}
                    Create account
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive ---------------------------------------------------------------------- */}
      <Dialog open={archiveCycle !== null} onOpenChange={(isOpen) => !isOpen && setArchiveCycle(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archive a closed cycle</DialogTitle>
            <DialogDescription>
              Downloads every application in the cycle as JSON, then deletes the rows. The
              database refuses to delete the cycle that is currently open.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="archive-cycle">Cycle</Label>
            <Select value={archiveCycle ?? ""} onValueChange={setArchiveCycle}>
              <SelectTrigger id="archive-cycle"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cycles.filter((c) => c !== openCycle).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              Check the downloaded file before you close this tab. The rows are gone
              afterwards.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveCycle(null)} disabled={archiving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={archive} disabled={archiving}>
              {archiving ? (
                <Loader2
                  className="w-4 h-4 mr-1.5 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
              )}
              Export and delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Review;
