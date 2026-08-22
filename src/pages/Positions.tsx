import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Users, ExternalLink } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { settleWrite } from "@/lib/dbWrite";
import {
  POSITION_STATUSES,
  POSITION_STATUS_CLASSES,
  POSITION_STATUS_HELP,
  POSITION_STATUS_LABELS,
  PositionStatus,
} from "@/lib/recruiting";
import { cn } from "@/lib/utils";

/**
 * #/positions - where a mentor writes and manages their own listings.
 *
 * Two rules from the RLS policies that this page has to mirror exactly, or it will offer
 * an action the database silently refuses (see the 2026-07-25 audit - a zero-row write
 * comes back as error: null and looks like success):
 *
 *   * A mentor may only insert rows where mentor_id = their own id, and only if they hold
 *     one of pi / postdoc / grad_student / manager / pi_external. That is `canManageRecruitingPositions`.
 *   * A mentor may only update or delete their own rows. The PI may do either to any row.
 *
 * Every write goes through settleWrite() so a policy disagreement shows up as a message
 * rather than a green toast over nothing.
 */

const MAX_DESCRIPTION = 400;

interface PositionRow {
  id: string;
  project_id: string;
  mentor_id: string;
  title: string;
  description: string;
  tasks: string[];
  requirements: string[];
  hours_per_week: number;
  min_block_hours: number;
  semesters_needed: number;
  outcome: string;
  max_mentees: number;
  status: PositionStatus;
  cycle: string;
  mentorName: string | null;
  projectName: string | null;
  applicantCount: number;
}

interface ProjectRow { id: string; name: string; active: boolean }
interface CycleRow { cycle: string; label: string; active: boolean }

interface Draft {
  id: string | null;
  project_id: string;
  title: string;
  description: string;
  tasks: string;
  requirements: string;
  hours_per_week: string;
  min_block_hours: string;
  semesters_needed: string;
  outcome: string;
  max_mentees: string;
  status: PositionStatus;
  cycle: string;
}

const emptyDraft = (cycle: string): Draft => ({
  id: null, project_id: "", title: "", description: "",
  tasks: "", requirements: "",
  hours_per_week: "8", min_block_hours: "3", semesters_needed: "2",
  outcome: "", max_mentees: "2", status: "draft", cycle,
});

const linesOf = (text: string) =>
  text.split("\n").map((l) => l.trim()).filter(Boolean);

const Positions = () => {
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<PositionRow | null>(null);

  const isPI = permissions.canAdminRecruiting;

  const load = useCallback(async () => {
    setLoading(true);

    const [positionsResult, projectsResult, cyclesResult] = await Promise.all([
      supabase
        .from("recruiting_positions")
        .select(
          "id, project_id, mentor_id, title, description, tasks, requirements, hours_per_week, min_block_hours, semesters_needed, outcome, max_mentees, status, cycle, profiles!recruiting_positions_mentor_id_fkey(full_name), recruiting_projects(name), recruiting_application_positions(count)",
        )
        .order("cycle", { ascending: false })
        .order("title"),
      supabase.from("recruiting_projects").select("id, name, active").order("name"),
      supabase.from("recruiting_cycles").select("cycle, label, active").order("opens_at", { ascending: false }),
    ]);

    if (positionsResult.error) {
      toast.error("Could not load positions.");
      setLoading(false);
      return;
    }

    const mapped: PositionRow[] = (positionsResult.data ?? []).map((row) => {
      const mentor = row.profiles as unknown as { full_name: string | null } | null;
      const project = row.recruiting_projects as unknown as { name: string } | null;
      const counts = row.recruiting_application_positions as unknown as { count: number }[] | null;
      return {
        id: row.id,
        project_id: row.project_id,
        mentor_id: row.mentor_id,
        title: row.title,
        description: row.description,
        tasks: row.tasks ?? [],
        requirements: row.requirements ?? [],
        hours_per_week: row.hours_per_week,
        min_block_hours: row.min_block_hours,
        semesters_needed: row.semesters_needed,
        outcome: row.outcome,
        max_mentees: row.max_mentees,
        status: row.status as PositionStatus,
        cycle: row.cycle,
        mentorName: mentor?.full_name ?? null,
        projectName: project?.name ?? null,
        applicantCount: counts?.[0]?.count ?? 0,
      };
    });

    // The SELECT policy lets any lab member read every listing, which the review queue
    // needs. This page is about ownership, so it narrows to the signed-in mentor unless
    // they are the PI - showing a grad student a listing they cannot edit would just be a
    // row of disabled controls.
    setRows(isPI ? mapped : mapped.filter((r) => r.mentor_id === user?.id));
    setProjects(projectsResult.data ?? []);
    setCycles(cyclesResult.data ?? []);
    setLoading(false);
  }, [isPI, user?.id]);

  useEffect(() => { load(); }, [load]);

  const defaultCycle = useMemo(
    () => cycles.find((c) => c.active)?.cycle ?? cycles[0]?.cycle ?? "",
    [cycles],
  );

  const openCreate = () => setDraft(emptyDraft(defaultCycle));

  const openEdit = (row: PositionRow) =>
    setDraft({
      id: row.id,
      project_id: row.project_id,
      title: row.title,
      description: row.description,
      tasks: row.tasks.join("\n"),
      requirements: row.requirements.join("\n"),
      hours_per_week: String(row.hours_per_week),
      min_block_hours: String(row.min_block_hours),
      semesters_needed: String(row.semesters_needed),
      outcome: row.outcome,
      max_mentees: String(row.max_mentees),
      status: row.status,
      cycle: row.cycle,
    });

  const draftProblem = (d: Draft): string | null => {
    if (!d.project_id) return "Choose a project.";
    if (!d.cycle) return "Choose a cycle.";
    if (d.title.trim().length < 4) return "Give the role a title of at least 4 characters.";
    if (d.description.trim().length < 20) return "The description needs at least 20 characters.";
    if (d.description.length > MAX_DESCRIPTION) return `Keep the description under ${MAX_DESCRIPTION} characters.`;
    const tasks = linesOf(d.tasks);
    if (tasks.length < 3 || tasks.length > 5) return "List between 3 and 5 tasks, one per line.";
    const requirements = linesOf(d.requirements);
    if (requirements.length < 1 || requirements.length > 8) return "List between 1 and 8 requirements, one per line.";
    if (d.outcome.trim().length < 10) return "Say what the student walks away with.";
    const hours = Number(d.hours_per_week);
    if (!Number.isInteger(hours) || hours < 1 || hours > 40) return "Hours per week must be between 1 and 40.";
    const block = Number(d.min_block_hours);
    if (!Number.isInteger(block) || block < 1 || block > 12) return "Minimum block must be between 1 and 12 hours.";
    if (block > hours) return "The minimum block cannot be longer than the weekly hours.";
    const semesters = Number(d.semesters_needed);
    if (!Number.isInteger(semesters) || semesters < 1 || semesters > 8) return "Semesters must be between 1 and 8.";
    const mentees = Number(d.max_mentees);
    if (!Number.isInteger(mentees) || mentees < 1 || mentees > 20) return "Maximum mentees must be between 1 and 20.";
    return null;
  };

  const save = async () => {
    if (!draft || !user) return;
    const problem = draftProblem(draft);
    if (problem) { toast.error(problem); return; }

    setSaving(true);
    const payload = {
      project_id: draft.project_id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      tasks: linesOf(draft.tasks),
      requirements: linesOf(draft.requirements),
      hours_per_week: Number(draft.hours_per_week),
      min_block_hours: Number(draft.min_block_hours),
      semesters_needed: Number(draft.semesters_needed),
      outcome: draft.outcome.trim(),
      max_mentees: Number(draft.max_mentees),
      status: draft.status,
      cycle: draft.cycle,
    };

    if (draft.id) {
      const result = await settleWrite(
        supabase.from("recruiting_positions").update(payload).eq("id", draft.id).select("id"),
        "You can only edit your own listings.",
      );
      setSaving(false);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success("Listing updated.");
    } else {
      // mentor_id is set here, not chosen: the INSERT policy requires it to equal
      // auth.uid(), so anything else is rejected outright.
      const { error } = await supabase
        .from("recruiting_positions")
        .insert({ ...payload, mentor_id: user.id });
      setSaving(false);
      if (error) {
        toast.error(
          error.code === "23505"
            ? "You already have a listing with that title in this cycle."
            : error.message,
        );
        return;
      }
      toast.success("Listing created as a draft.");
    }

    setDraft(null);
    load();
  };

  const setStatus = async (row: PositionRow, status: PositionStatus) => {
    const result = await settleWrite(
      supabase.from("recruiting_positions").update({ status }).eq("id", row.id).select("id"),
      "You can only change your own listings.",
    );
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(
      status === "open"
        ? "Listing is now public on the application page."
        : `Listing set to ${POSITION_STATUS_LABELS[status].toLowerCase()}.`,
    );
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const result = await settleWrite(
      supabase.from("recruiting_positions").delete().eq("id", deleting.id).select("id"),
      "You can only delete your own listings.",
    );
    if (!result.ok) {
      toast.error(
        deleting.applicantCount > 0
          ? "This listing has applications ranked to it and cannot be deleted. Set it to closed instead."
          : result.message,
      );
      setDeleting(null);
      return;
    }
    toast.success("Listing deleted.");
    setDeleting(null);
    load();
  };

  if (!permissions.canManageRecruitingPositions) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
          <Card className="p-6">
            <h1 className="font-semibold text-lg">Positions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Undergraduate listings are managed by the PI, postdocs and graduate students.
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
            <h1 className="text-2xl font-bold tracking-tight">Undergraduate positions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPI
                ? "Every listing in the lab. Drafts are private until someone opens them."
                : "Your listings. Drafts are private until you open them."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="#/join" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" aria-hidden="true" />
                View public page
              </a>
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
              New listing
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin motion-reduce:animate-none text-primary" />
            <span className="sr-only">Loading</span>
          </div>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No listings yet. Create one and it will start as a draft that only you and the
              PI can see.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Project</TableHead>
                    {isPI && <TableHead className="hidden lg:table-cell">Mentor</TableHead>}
                    <TableHead className="hidden sm:table-cell">Cycle</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Hrs/wk</TableHead>
                    <TableHead className="text-right">Applicants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium max-w-[22rem]">
                        <span className="block truncate">{row.title}</span>
                        <span className="md:hidden text-xs text-muted-foreground block truncate">
                          {row.projectName}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {row.projectName}
                      </TableCell>
                      {isPI && (
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {row.mentorName ?? "—"}
                        </TableCell>
                      )}
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {row.cycle}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums">
                        {row.hours_per_week}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.applicantCount > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                            {row.applicantCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.status}
                          onValueChange={(v) => setStatus(row, v as PositionStatus)}
                        >
                          <SelectTrigger
                            className="h-8 w-[7.5rem]"
                            aria-label={`Status for ${row.title}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POSITION_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {POSITION_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost" size="sm" onClick={() => openEdit(row)}
                          aria-label={`Edit ${row.title}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" onClick={() => setDeleting(row)}
                          aria-label={`Delete ${row.title}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {rows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {POSITION_STATUSES.map((s) => (
              <span key={s} className="mr-4 inline-block">
                <Badge variant="outline" className={cn("mr-1.5", POSITION_STATUS_CLASSES[s])}>
                  {POSITION_STATUS_LABELS[s]}
                </Badge>
                {POSITION_STATUS_HELP[s]}
              </span>
            ))}
          </p>
        )}
      </main>

      <Footer />

      {/* max-h + overflow-y-auto on DialogContent, NOT a ScrollArea: Radix's ScrollArea
          viewport is height:100% and does not resolve inside a flex DialogContent in this
          repo, so it clips with no scrollbar. See supabase/../ui_dialog_scrolling notes. */}
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit listing" : "New listing"}</DialogTitle>
            <DialogDescription>
              A listing is private while it is a draft. Setting it to open publishes it on
              the public application page.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-5 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pos-project">Project</Label>
                  <Select
                    value={draft.project_id}
                    onValueChange={(v) => setDraft({ ...draft, project_id: v })}
                  >
                    <SelectTrigger id="pos-project">
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}{p.active ? "" : " (inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pos-cycle">Cycle</Label>
                  <Select
                    value={draft.cycle}
                    onValueChange={(v) => setDraft({ ...draft, cycle: v })}
                  >
                    <SelectTrigger id="pos-cycle">
                      <SelectValue placeholder="Choose a cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map((c) => (
                        <SelectItem key={c.cycle} value={c.cycle}>
                          {c.label}{c.active ? " (open)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pos-title">Role title</Label>
                <p className="text-xs text-muted-foreground">
                  What the student would be, not what the project is called.
                </p>
                <Input
                  id="pos-title" value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pos-description">Description</Label>
                <p className="text-xs text-muted-foreground">
                  One sentence a second-year could follow.
                </p>
                <Textarea
                  id="pos-description" rows={3} value={draft.description}
                  maxLength={MAX_DESCRIPTION}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground text-right" aria-live="polite">
                  {draft.description.length} / {MAX_DESCRIPTION}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pos-tasks">Tasks</Label>
                <p className="text-xs text-muted-foreground">
                  3 to 5 concrete tasks, one per line. "DNA extraction from fecal samples",
                  not "help with lab work".
                </p>
                <Textarea
                  id="pos-tasks" rows={5} value={draft.tasks}
                  onChange={(e) => setDraft({ ...draft, tasks: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {linesOf(draft.tasks).length} of 3–5
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pos-requirements">Requirements</Label>
                <p className="text-xs text-muted-foreground">
                  One per line: coursework, trainings, transportation, sample handling.
                </p>
                <Textarea
                  id="pos-requirements" rows={4} value={draft.requirements}
                  onChange={(e) => setDraft({ ...draft, requirements: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pos-hours">Hours/week</Label>
                  <Input
                    id="pos-hours" type="number" min={1} max={40} value={draft.hours_per_week}
                    onChange={(e) => setDraft({ ...draft, hours_per_week: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pos-block">Min block</Label>
                  <Input
                    id="pos-block" type="number" min={1} max={12} value={draft.min_block_hours}
                    onChange={(e) => setDraft({ ...draft, min_block_hours: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pos-semesters">Semesters</Label>
                  <Input
                    id="pos-semesters" type="number" min={1} max={8} value={draft.semesters_needed}
                    onChange={(e) => setDraft({ ...draft, semesters_needed: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pos-mentees">Max mentees</Label>
                  <Input
                    id="pos-mentees" type="number" min={1} max={20} value={draft.max_mentees}
                    onChange={(e) => setDraft({ ...draft, max_mentees: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pos-outcome">What they walk away with</Label>
                <Textarea
                  id="pos-outcome" rows={2} value={draft.outcome}
                  onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pos-status">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v as PositionStatus })}
                >
                  <SelectTrigger id="pos-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{POSITION_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {POSITION_STATUS_HELP[draft.status]}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && (
                <Loader2
                  className="w-4 h-4 mr-1.5 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              {deleting?.applicantCount
                ? `${deleting.applicantCount} application(s) are ranked to "${deleting?.title}". It cannot be deleted while that is true - set it to closed instead.`
                : `"${deleting?.title}" will be removed. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={Boolean(deleting?.applicantCount)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Positions;
