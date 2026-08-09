import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SkillDetailDialog } from "@/components/SkillDetailDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  GraduationCap,
  EyeOff,
  Eye,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSkillsModule } from "@/hooks/useSkillsModule";
import { settleWrite } from "@/lib/dbWrite";
import {
  Skill,
  SkillCategory,
  ChecklistItem,
  UserSkill,
  SkillSignoff,
  SkillStage,
  STAGE_RANK,
  STAGE_LABELS,
  STAGE_SHORT,
  STAGE_CLASSES,
  RISK_CLASSES,
  RiskLevel,
  ReadingRef,
  isLapsed,
  isExpired,
  recertLabel,
} from "@/lib/skills";

interface ProfileLite {
  id: string;
  fullName: string | null;
  email: string;
}

const Skills = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const {
    visibleToAll,
    allowlist,
    canSeeModule,
    canAdminModule,
    loading: flagLoading,
    refresh,
  } = useSkillsModule();

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [signoffs, setSignoffs] = useState<SkillSignoff[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [prereqPairs, setPrereqPairs] = useState<{ skillId: string; prereqId: string }[]>([]);
  const [skillEquip, setSkillEquip] = useState<{ skillId: string; equipmentName: string }[]>([]);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [matrixCat, setMatrixCat] = useState<string>("");
  const [addViewerId, setAddViewerId] = useState<string>("");

  // Sign-off dialog state
  const [signOffOpen, setSignOffOpen] = useState(false);
  const [soTrainee, setSoTrainee] = useState<string>("");
  const [soSkillId, setSoSkillId] = useState<string>("");
  const [soStage, setSoStage] = useState<SkillStage>("competent");
  const [soChecks, setSoChecks] = useState<Record<string, boolean>>({});
  const [soComments, setSoComments] = useState("");
  const [soWaiverReason, setSoWaiverReason] = useState("");
  const [soSubmitting, setSoSubmitting] = useState(false);

  // Nobody but pi/manager reaches this page while the module is hidden.
  useEffect(() => {
    if (!flagLoading && !canSeeModule) navigate("/");
  }, [flagLoading, canSeeModule, navigate]);

  useEffect(() => {
    if (canSeeModule) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeModule]);

  const fetchAll = async () => {
    try {
      const [cats, sk, cl, us, so, pr, pre, se] = await Promise.all([
        supabase.from("skill_categories").select("*").order("sort_order"),
        supabase.from("skills").select("*").order("sort_order"),
        supabase.from("skill_checklist_items").select("*").order("sort_order"),
        supabase.from("user_skills").select("*"),
        supabase.from("skill_signoffs").select("*").order("observed_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email").eq("active", true),
        supabase.from("skill_prerequisites").select("*"),
        supabase.from("skill_equipment").select("skill_id, equipment(name)"),
      ]);

      const firstError =
        cats.error || sk.error || cl.error || us.error || so.error || pr.error || pre.error || se.error;
      if (firstError) throw firstError;

      setCategories(
        (cats.data || []).map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description,
          icon: c.icon,
          sortOrder: c.sort_order,
          active: c.active,
        }))
      );
      setSkills(
        (sk.data || []).map((s: any) => ({
          id: s.id,
          categoryId: s.category_id,
          code: s.code,
          name: s.name,
          summary: s.summary,
          instructionsMd: s.instructions_md,
          instructionsVersion: s.instructions_version,
          readingRefs: (s.reading_refs as ReadingRef[]) ?? [],
          requiresReading: s.requires_reading,
          requiresPractical: s.requires_practical,
          // ?? not ||: 0 is a real value and `0 || undefined` silently erases it.
          estTrainMinutes: s.est_train_minutes ?? undefined,
          recertMonths: s.recert_months ?? undefined,
          externalRef: s.external_ref,
          riskLevel: s.risk_level as RiskLevel,
          sortOrder: s.sort_order,
          active: s.active,
        }))
      );
      setChecklists(
        (cl.data || []).map((c: any) => ({
          id: c.id,
          skillId: c.skill_id,
          sortOrder: c.sort_order,
          itemText: c.item_text,
          isCritical: c.is_critical,
        }))
      );
      setUserSkills(
        (us.data || []).map((u: any) => ({
          id: u.id,
          userId: u.user_id,
          skillId: u.skill_id,
          stage: u.stage as SkillStage,
          readingAckAt: u.reading_ack_at,
          readingAckVersion: u.reading_ack_version ?? undefined,
          signedOffAt: u.signed_off_at,
          signedOffBy: u.signed_off_by,
          expiresAt: u.expires_at,
          notes: u.notes,
        }))
      );
      setSignoffs(
        (so.data || []).map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          skillId: s.skill_id,
          signedBy: s.signed_by,
          stageGranted: s.stage_granted as SkillStage,
          observedAt: s.observed_at,
          checklistResults: s.checklist_results ?? [],
          prereqsWaived: s.prereqs_waived,
          waiverReason: s.waiver_reason,
          comments: s.comments,
          expiresAt: s.expires_at,
          revokedAt: s.revoked_at,
          revokedBy: s.revoked_by,
          revokeReason: s.revoke_reason,
        }))
      );
      setProfiles(
        (pr.data || []).map((p: any) => ({ id: p.id, fullName: p.full_name, email: p.email }))
      );
      setPrereqPairs((pre.data || []).map((p: any) => ({ skillId: p.skill_id, prereqId: p.prereq_id })));
      setSkillEquip(
        (se.data || [])
          .filter((r: any) => r.equipment?.name)
          .map((r: any) => ({ skillId: r.skill_id, equipmentName: r.equipment.name }))
      );
    } catch (error) {
      console.error("Error fetching skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------- derived
  const skillById = useMemo(() => Object.fromEntries(skills.map((s) => [s.id, s])), [skills]);
  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const nameById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.fullName ?? p.email])),
    [profiles]
  );
  const myRecords = useMemo(() => {
    const m: Record<string, UserSkill> = {};
    userSkills.filter((u) => u.userId === user?.id).forEach((u) => (m[u.skillId] = u));
    return m;
  }, [userSkills, user]);

  const activeSkills = useMemo(() => skills.filter((s) => s.active), [skills]);

  /**
   * Which skills THIS user may sign off. Mirrors can_sign_off_skill(): pi/manager can sign
   * anything, everyone else only the specific skills they hold an unexpired `trainer`
   * stage on. This is a UI affordance - Postgres is the authority, and an attempt that
   * gets past this list is rejected by the INSERT policy.
   */
  const signableSkillIds = useMemo(() => {
    if (userRole === "pi" || userRole === "manager") return new Set(activeSkills.map((s) => s.id));
    return new Set(
      userSkills
        .filter(
          (u) => u.userId === user?.id && u.stage === "trainer" && !isExpired(u.expiresAt)
        )
        .map((u) => u.skillId)
    );
  }, [userRole, userSkills, user, activeSkills]);

  const canSignAnything = signableSkillIds.size > 0;
  const canGrantTrainer = userRole === "pi" || userRole === "manager";

  const filteredSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeSkills.filter((s) => {
      if (catFilter !== "all" && s.categoryId !== catFilter) return false;
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.summary ?? "").toLowerCase().includes(q)
      );
    });
  }, [activeSkills, search, catFilter]);

  const myStats = useMemo(() => {
    const total = activeSkills.length;
    let read = 0, trained = 0, competent = 0, trainer = 0, lapsed = 0;
    activeSkills.forEach((s) => {
      const r = myRecords[s.id];
      if (!r) return;
      if (isLapsed(r)) lapsed++;
      if (r.stage === "reading_done") read++;
      if (r.stage === "trained") trained++;
      if (r.stage === "competent") competent++;
      if (r.stage === "trainer") trainer++;
    });
    return { total, read, trained, competent, trainer, lapsed };
  }, [activeSkills, myRecords]);

  const equipFor = (skillId: string) =>
    skillEquip.filter((e) => e.skillId === skillId).map((e) => e.equipmentName);

  const prereqsFor = (skillId: string) =>
    prereqPairs
      .filter((p) => p.skillId === skillId)
      .map((p) => skillById[p.prereqId])
      .filter(Boolean);

  // ---------------------------------------------------------------- actions
  const handleAcknowledgeReading = async (skill: Skill) => {
    if (!user) return;
    setAcknowledging(true);
    try {
      const existing = myRecords[skill.id];
      if (existing) {
        // settleWrite + .select(): RLS filtering an UPDATE to zero rows comes back as
        // error:null, which would show a success toast for a write that never happened.
        const result = await settleWrite(
          supabase
            .from("user_skills")
            .update({
              reading_ack_at: new Date().toISOString(),
              reading_ack_version: skill.instructionsVersion,
            })
            .eq("id", existing.id)
            .select("id"),
          "You don't have permission to update this record."
        );
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
      } else {
        const { error } = await supabase.from("user_skills").insert({
          user_id: user.id,
          skill_id: skill.id,
          stage: "reading_done",
          reading_ack_at: new Date().toISOString(),
          reading_ack_version: skill.instructionsVersion,
        });
        if (error) throw error;
      }
      toast.success(`Reading acknowledged for ${skill.code}`);
      await fetchAll();
    } catch (error) {
      console.error("Error acknowledging reading:", error);
      toast.error("Could not record your acknowledgement. Please try again.");
    } finally {
      setAcknowledging(false);
    }
  };

  /**
   * Add or remove someone from the private-preview allowlist. Postgres is the authority:
   * the UPDATE policy requires the caller to be an elevated role who is themselves
   * allowlisted, so this cannot be used to let yourself in.
   */
  const handleSetAllowlist = async (next: string[]) => {
    const result = await settleWrite(
      supabase
        .from("skill_module_settings")
        .update({
          allowlist_user_ids: next,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq("id", true)
        .select("id"),
      "You don't have permission to change who can see the Skills module."
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Updated who can see the Skills module.");
    setAddViewerId("");
    await refresh();
  };

  const handleToggleVisibility = async (next: boolean) => {
    const result = await settleWrite(
      supabase
        .from("skill_module_settings")
        .update({ visible_to_all: next, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("id", true)
        .select("id"),
      "Only a PI or manager can change who sees the Skills module."
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(
      next
        ? "Skills module is now visible to the whole lab."
        : "Skills module hidden again — only PIs and managers can see it."
    );
    await refresh();
  };

  const openSignOff = () => {
    setSoTrainee("");
    setSoSkillId("");
    setSoStage("competent");
    setSoChecks({});
    setSoComments("");
    setSoWaiverReason("");
    setSignOffOpen(true);
  };

  const soChecklist = useMemo(
    () => checklists.filter((c) => c.skillId === soSkillId).sort((a, b) => a.sortOrder - b.sortOrder),
    [checklists, soSkillId]
  );
  const soUnmetPrereqs = useMemo(() => {
    if (!soSkillId || !soTrainee) return [];
    return prereqsFor(soSkillId).filter((p) => {
      const rec = userSkills.find((u) => u.userId === soTrainee && u.skillId === p.id);
      return !rec || STAGE_RANK[rec.stage] < STAGE_RANK.competent;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soSkillId, soTrainee, userSkills, prereqPairs, skillById]);

  const soCriticalUnticked = soChecklist.filter((c) => c.isCritical && !soChecks[c.id]);

  const handleSubmitSignOff = async () => {
    if (!user || !soTrainee || !soSkillId) return;
    const skill = skillById[soSkillId];

    if (soStage === "competent" && soCriticalUnticked.length > 0) {
      toast.error(
        `${soCriticalUnticked.length} critical item${
          soCriticalUnticked.length === 1 ? " is" : "s are"
        } unticked. A failed critical item blocks a competent sign-off.`
      );
      return;
    }
    if (soUnmetPrereqs.length > 0 && !soWaiverReason.trim()) {
      toast.error("Unmet prerequisites need a written reason before you can proceed.");
      return;
    }

    setSoSubmitting(true);
    try {
      const { error } = await supabase.from("skill_signoffs").insert({
        user_id: soTrainee,
        skill_id: soSkillId,
        signed_by: user.id,
        stage_granted: soStage,
        checklist_results: soChecklist.map((c) => ({
          item_id: c.id,
          item_text: c.itemText,
          passed: !!soChecks[c.id],
        })),
        prereqs_waived: soUnmetPrereqs.length > 0,
        waiver_reason: soUnmetPrereqs.length > 0 ? soWaiverReason.trim() : null,
        comments: soComments.trim() || null,
      });
      if (error) throw error;

      toast.success(
        `${nameById[soTrainee]} signed off as ${STAGE_LABELS[soStage]} on ${skill?.code}.`
      );
      setSignOffOpen(false);
      await fetchAll();
    } catch (error: any) {
      console.error("Error signing off:", error);
      // The precondition trigger raises a readable message; surface it rather than a
      // generic failure, because "they haven't read it yet" is actionable.
      toast.error(error?.message ?? "Could not record the sign-off. Please try again.");
    } finally {
      setSoSubmitting(false);
    }
  };

  // ---------------------------------------------------------------- render
  if (flagLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!canSeeModule) return null;

  const matrixCategory = matrixCat || categories[0]?.id || "";
  const matrixSkills = activeSkills.filter((s) => s.categoryId === matrixCategory);
  const matrixPeople = profiles
    .slice()
    .sort((a, b) => (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2">Skills</h1>
            <p className="text-muted-foreground">
              Read the instructions, get checked off on the bench, and see who can supervise what.
            </p>
          </div>
          {canSignAnything && (
            <Button onClick={openSignOff} className="min-h-[44px]">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sign someone off
            </Button>
          )}
        </div>

        {/* Private preview panel. Only allowlisted users ever reach this page while
            visible_to_all is false - RLS blocks everyone else at the data layer too. */}
        {canAdminModule && (
          <Card className={`p-4 mb-6 ${visibleToAll ? "" : "border-amber-500/40 bg-amber-500/5"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {visibleToAll ? (
                <Eye className="w-5 h-5 text-muted-foreground shrink-0" />
              ) : (
                <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {visibleToAll ? "Live for the whole lab" : "Private preview"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {visibleToAll
                    ? "Everyone in the lab can see this page."
                    : "Only the people listed below can see this page — and the catalog is blocked at the database level for everyone else, not just hidden in the menu."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="vis" className="text-sm whitespace-nowrap">
                  Release to everyone
                </Label>
                <Switch id="vis" checked={visibleToAll} onCheckedChange={handleToggleVisibility} />
              </div>
            </div>

            {!visibleToAll && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <Label className="text-sm">Who can see it</Label>
                <div className="flex flex-wrap gap-2">
                  {allowlist.length === 0 && (
                    <span className="text-sm text-muted-foreground">Nobody — add someone below.</span>
                  )}
                  {allowlist.map((id) => (
                    <Badge key={id} variant="secondary" className="gap-1.5 py-1">
                      {nameById[id] ?? id.slice(0, 8)}
                      <button
                        type="button"
                        aria-label={`Remove ${nameById[id] ?? "user"}`}
                        className="hover:text-destructive"
                        onClick={() => handleSetAllowlist(allowlist.filter((x) => x !== id))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={addViewerId} onValueChange={setAddViewerId}>
                    <SelectTrigger className="sm:w-[300px]">
                      <SelectValue placeholder="Add someone to the preview..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles
                        .filter((p) => !allowlist.includes(p.id))
                        .sort((a, b) => (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email))
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fullName ?? p.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!addViewerId}
                    onClick={() => handleSetAllowlist([...allowlist, addViewerId])}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        <Tabs defaultValue="mine" className="space-y-6">
          <TabsList>
            <TabsTrigger value="mine">My Training</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="matrix">Who Can Do What</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------ My Training */}
          <TabsContent value="mine" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                ["Competent", myStats.competent],
                ["Trainer", myStats.trainer],
                ["Trained", myStats.trained],
                ["Read only", myStats.read],
                ["Lapsed", myStats.lapsed],
              ].map(([label, n]) => (
                <Card key={label as string} className="p-4">
                  <div className="text-2xl font-bold">{n as number}</div>
                  <div className="text-sm text-muted-foreground">{label as string}</div>
                </Card>
              ))}
            </div>

            {activeSkills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No skills in the catalog yet.
              </div>
            ) : (
              categories
                .filter((c) => activeSkills.some((s) => s.categoryId === c.id))
                .map((cat) => (
                  <div key={cat.id}>
                    <h2 className="text-xl font-bold mb-3">
                      {cat.icon} {cat.name}
                    </h2>
                    <div className="space-y-2">
                      {activeSkills
                        .filter((s) => s.categoryId === cat.id)
                        .map((s) => {
                          const rec = myRecords[s.id];
                          const stage = rec?.stage ?? "not_started";
                          const lapsed = isLapsed(rec);
                          return (
                            <Card
                              key={s.id}
                              className="p-4 cursor-pointer hover:border-primary transition-colors"
                              onClick={() => setDetailSkill(s)}
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-xs px-2 py-1 rounded bg-muted">
                                  {s.code}
                                </span>
                                <span className="font-medium flex-1 min-w-[180px]">{s.name}</span>
                                {lapsed && <Badge variant="destructive">Expired</Badge>}
                                <Badge className={STAGE_CLASSES[stage]} variant="secondary">
                                  {STAGE_SHORT[stage]}
                                </Badge>
                                {stage === "not_started" && (
                                  <Badge variant="outline" className="gap-1">
                                    <BookOpen className="w-3 h-3" /> Start here
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                ))
            )}
          </TabsContent>

          {/* ------------------------------------------------ Catalog */}
          <TabsContent value="catalog" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeSkills.length} skills...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="sm:w-[280px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories
                    .filter((c) => activeSkills.some((s) => s.categoryId === c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {filteredSkills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No skills match that search. Try a different term or clear the category filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills.map((s) => {
                  const rec = myRecords[s.id];
                  const stage = rec?.stage ?? "not_started";
                  return (
                    <Card
                      key={s.id}
                      className="p-5 cursor-pointer hover:border-primary transition-colors flex flex-col"
                      onClick={() => setDetailSkill(s)}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
                          {s.code}
                        </span>
                        {s.riskLevel !== "standard" && (
                          <Badge className={RISK_CLASSES[s.riskLevel]} variant="secondary">
                            {s.riskLevel}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{s.name}</h3>
                      <p className="text-sm text-muted-foreground flex-1">{s.summary}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge className={STAGE_CLASSES[stage]} variant="secondary">
                          {STAGE_SHORT[stage]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {recertLabel(s.recertMonths)}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------ Matrix */}
          <TabsContent value="matrix" className="space-y-4">
            <Select value={matrixCategory} onValueChange={setMatrixCat}>
              <SelectTrigger className="sm:w-[320px]">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => activeSkills.some((s) => s.categoryId === c.id))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {matrixSkills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Pick a category to see the matrix.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 sticky left-0 bg-background">Person</th>
                      {matrixSkills.map((s) => (
                        <th key={s.id} className="text-left py-3 px-2 font-mono text-xs whitespace-nowrap">
                          {s.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixPeople.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 whitespace-nowrap sticky left-0 bg-background">
                          {p.fullName ?? p.email}
                        </td>
                        {matrixSkills.map((s) => {
                          const rec = userSkills.find(
                            (u) => u.userId === p.id && u.skillId === s.id
                          );
                          const stage = rec?.stage ?? "not_started";
                          const lapsed = isLapsed(rec);
                          return (
                            <td key={s.id} className="py-2 px-2">
                              <span
                                title={`${p.fullName ?? p.email} — ${s.code}: ${STAGE_LABELS[stage]}${
                                  lapsed ? " (expired)" : ""
                                }`}
                                className={`inline-block px-2 py-1 rounded text-xs whitespace-nowrap ${
                                  lapsed ? "bg-destructive/15 text-destructive" : STAGE_CLASSES[stage]
                                }`}
                              >
                                {lapsed ? "Expired" : STAGE_SHORT[stage]}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <SkillDetailDialog
        skill={detailSkill}
        checklist={checklists
          .filter((c) => c.skillId === detailSkill?.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)}
        myRecord={detailSkill ? myRecords[detailSkill.id] : undefined}
        history={signoffs.filter((s) => s.userId === user?.id && s.skillId === detailSkill?.id)}
        nameById={nameById}
        prereqs={detailSkill ? prereqsFor(detailSkill.id) : []}
        equipmentNames={detailSkill ? equipFor(detailSkill.id) : []}
        onAcknowledgeReading={handleAcknowledgeReading}
        acknowledging={acknowledging}
        onOpenChange={(open) => !open && setDetailSkill(null)}
      />

      {/* ------------------------------------------------ Sign-off dialog */}
      <Dialog open={signOffOpen} onOpenChange={setSignOffOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign off a skill</DialogTitle>
            <DialogDescription>
              Your name goes on this record permanently. You can only sign skills you are a
              trainer on.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trainee</Label>
              <Select value={soTrainee} onValueChange={setSoTrainee}>
                <SelectTrigger>
                  <SelectValue placeholder="Who did you observe?" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter((p) => p.id !== user?.id)
                    .sort((a, b) => (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName ?? p.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skill</Label>
              <Select
                value={soSkillId}
                onValueChange={(v) => {
                  setSoSkillId(v);
                  setSoChecks({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Which skill?" />
                </SelectTrigger>
                <SelectContent>
                  {activeSkills
                    .filter((s) => signableSkillIds.has(s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {soUnmetPrereqs.length > 0 && (
              <div className="p-4 rounded-lg border border-destructive/40 bg-destructive/5 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Unmet prerequisites: {soUnmetPrereqs.map((p) => p.code).join(", ")}
                </p>
                <Textarea
                  placeholder="Why are you proceeding anyway? This is recorded on the sign-off."
                  value={soWaiverReason}
                  onChange={(e) => setSoWaiverReason(e.target.value)}
                />
              </div>
            )}

            {soSkillId && soChecklist.length > 0 && (
              <div className="space-y-2">
                <Label>Practical checklist</Label>
                <div className="space-y-2 border rounded-lg p-4">
                  {soChecklist.map((c) => (
                    <label key={c.id} className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={!!soChecks[c.id]}
                        onCheckedChange={(v) =>
                          setSoChecks((prev) => ({ ...prev, [c.id]: v === true }))
                        }
                        className="mt-0.5"
                      />
                      <span className={`text-sm ${c.isCritical ? "font-medium" : ""}`}>
                        {c.itemText}
                        {c.isCritical && (
                          <span className="text-destructive ml-1" title="Critical">
                            *
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Level granted</Label>
              <Select value={soStage} onValueChange={(v) => setSoStage(v as SkillStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trained">Trained — can perform with supervision</SelectItem>
                  <SelectItem value="competent">Competent — can perform independently</SelectItem>
                  {canGrantTrainer && (
                    <SelectItem value="trainer">Trainer — can sign this off for others</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Comments (optional)</Label>
              <Textarea
                value={soComments}
                onChange={(e) => setSoComments(e.target.value)}
                placeholder="Anything worth recording about how it went."
              />
            </div>

            {soTrainee && soSkillId && (
              <p className="text-sm text-muted-foreground border-t pt-3">
                You are signing off <strong>{nameById[soTrainee]}</strong> as{" "}
                <strong>{STAGE_LABELS[soStage]}</strong> on{" "}
                <strong>{skillById[soSkillId]?.code}</strong>.
                {skillById[soSkillId]?.recertMonths
                  ? ` This expires: ${recertLabel(skillById[soSkillId]?.recertMonths).toLowerCase()}.`
                  : " This does not expire."}
              </p>
            )}

            <Button
              onClick={handleSubmitSignOff}
              disabled={!soTrainee || !soSkillId || soSubmitting}
              className="w-full min-h-[44px]"
            >
              {soSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Record sign-off
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Skills;
