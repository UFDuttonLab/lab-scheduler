import { Fragment, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";
import { format } from "date-fns";
import {
  Skill,
  SkillCategory,
  UserSkill,
  SkillSignoff,
  QuizStatus,
  SkillStage,
  STAGE_RANK,
  STAGE_LABELS,
  STAGE_SHORT,
  STAGE_CLASSES,
  isLapsed,
  isExpired,
} from "@/lib/skills";

interface ProfileLite {
  id: string;
  fullName: string | null;
  email: string;
}

interface SkillTrackerProps {
  skills: Skill[];
  categories: SkillCategory[];
  profiles: ProfileLite[];
  userSkills: UserSkill[];
  signoffs: SkillSignoff[];
  /** Every row of skill_quiz_status the viewer can read; pi/manager read all of them. */
  quizStatus: QuizStatus[];
  /** Active question count per skill; a skill with 0 has no quiz gate. */
  quizCounts: Record<string, number>;
}

const EXPIRING_DAYS = 60;

const name = (p: ProfileLite) => p.fullName ?? p.email;
const fmt = (iso: string | null | undefined) => (iso ? format(new Date(iso), "d MMM yyyy") : "");
const expiringSoon = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return false;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms > 0 && ms < EXPIRING_DAYS * 86400000;
};

/**
 * The PI's master view of who has done what. Three angles on the same rows: people
 * (progress across every skill), skills (who holds each one), and the sign-off ledger.
 *
 * Reads only what the page already loaded. Visibility is enforced by the parent (pi/manager)
 * and by RLS: skill_quiz_attempts and full skill_quiz_status are only readable by those roles,
 * so a non-admin who reached this component would see empty quiz columns, not other people's
 * data.
 */
export const SkillTracker = ({
  skills,
  categories,
  profiles,
  userSkills,
  signoffs,
  quizStatus,
  quizCounts,
}: SkillTrackerProps) => {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [openSkill, setOpenSkill] = useState<string | null>(null);

  const activeSkills = useMemo(
    () =>
      skills
        .filter((s) => s.active && (cat === "all" || s.categoryId === cat))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [skills, cat]
  );
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const usKey = (u: string, s: string) => `${u}|${s}`;
  const usMap = useMemo(() => {
    const m = new Map<string, UserSkill>();
    for (const u of userSkills) m.set(usKey(u.userId, u.skillId), u);
    return m;
  }, [userSkills]);
  const quizMap = useMemo(() => {
    const m = new Map<string, QuizStatus>();
    for (const q of quizStatus) m.set(usKey(q.userId, q.skillId), q);
    return m;
  }, [quizStatus]);

  // Per-person rollup over the filtered skill set.
  const people = useMemo(() => {
    const rows = profiles.map((p) => {
      let read = 0, quiz = 0, trained = 0, competent = 0, trainer = 0, expiring = 0, lapsed = 0;
      let last: string | null = null;
      for (const s of activeSkills) {
        const us = usMap.get(usKey(p.id, s.id));
        const q = quizMap.get(usKey(p.id, s.id));
        if (us?.readingAckAt) read++;
        if (q?.passed) quiz++;
        if (us) {
          const r = STAGE_RANK[us.stage];
          if (r >= STAGE_RANK.trained) trained++;
          if (r >= STAGE_RANK.competent) competent++;
          if (r >= STAGE_RANK.trainer) trainer++;
          if (isLapsed(us)) lapsed++;
          else if (r >= STAGE_RANK.trained && expiringSoon(us.expiresAt)) expiring++;
          for (const t of [us.readingAckAt, us.signedOffAt]) {
            if (t && (!last || t > last)) last = t;
          }
        }
      }
      return { p, read, quiz, trained, competent, trainer, expiring, lapsed, last, any: read + quiz + trained > 0 };
    });
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => !q || name(r.p).toLowerCase().includes(q) || r.p.email.toLowerCase().includes(q))
      .filter((r) => !onlyActive || r.any)
      .sort((a, b) => b.competent - a.competent || b.trained - a.trained || b.read - a.read || name(a.p).localeCompare(name(b.p)));
  }, [profiles, activeSkills, usMap, quizMap, search, onlyActive]);

  // Per-skill rollup.
  const bySkill = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeSkills
      .filter((s) => !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .map((s) => {
        const holders = userSkills.filter((u) => u.skillId === s.id);
        const passed = quizStatus.filter((x) => x.skillId === s.id && x.passed).length;
        const attempted = quizStatus.filter((x) => x.skillId === s.id && x.attempts > 0).length;
        return {
          s,
          read: holders.filter((u) => !!u.readingAckAt).length,
          attempted,
          passed,
          trained: holders.filter((u) => STAGE_RANK[u.stage] >= STAGE_RANK.trained && !isLapsed(u)).length,
          competent: holders.filter((u) => STAGE_RANK[u.stage] >= STAGE_RANK.competent && !isLapsed(u)).length,
          trainers: holders.filter((u) => u.stage === "trainer" && !isLapsed(u)),
          lapsed: holders.filter((u) => isLapsed(u)).length,
        };
      });
  }, [activeSkills, userSkills, quizStatus, search]);

  const totals = useMemo(() => {
    const live = signoffs.filter((s) => !s.revokedAt);
    return {
      people: profiles.length,
      skills: activeSkills.length,
      signoffs: live.length,
      quizPasses: quizStatus.filter((q) => q.passed).length,
      read: userSkills.filter((u) => !!u.readingAckAt).length,
      expiring: userSkills.filter((u) => STAGE_RANK[u.stage] >= STAGE_RANK.trained && !isLapsed(u) && expiringSoon(u.expiresAt)).length,
      lapsed: userSkills.filter((u) => isLapsed(u)).length,
    };
  }, [profiles, activeSkills, signoffs, quizStatus, userSkills]);

  const ledger = useMemo(
    () =>
      signoffs
        .slice()
        .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
        .slice(0, 200),
    [signoffs]
  );

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["person", "email", "skill_code", "skill_name", "category", "stage", "instructions_read_at", "quiz_attempts", "quiz_best_pct", "quiz_passed", "signed_off_at", "signed_off_by", "expires_at", "lapsed"].join(","),
    ];
    for (const p of profiles) {
      for (const s of skills.filter((x) => x.active)) {
        const us = usMap.get(usKey(p.id, s.id));
        const q = quizMap.get(usKey(p.id, s.id));
        if (!us && !q) continue;
        const by = us?.signedOffBy ? profileById.get(us.signedOffBy) : undefined;
        lines.push(
          [
            name(p), p.email, s.code, s.name, catById.get(s.categoryId)?.name ?? "",
            us?.stage ?? "not_started", us?.readingAckAt ?? "", q?.attempts ?? 0, q?.bestPct ?? "",
            q?.passed ? "yes" : "no", us?.signedOffAt ?? "", by ? name(by) : "", us?.expiresAt ?? "",
            us && isLapsed(us) ? "yes" : "no",
          ].map(esc).join(",")
        );
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skills-tracker-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stagePill = (us: UserSkill | undefined) => {
    const stage: SkillStage = us?.stage ?? "not_started";
    const lapsed = isLapsed(us);
    return (
      <span
        title={STAGE_LABELS[stage] + (lapsed ? " (expired)" : "")}
        className={`inline-block px-2 py-0.5 rounded text-xs whitespace-nowrap ${lapsed ? "bg-destructive/15 text-destructive" : STAGE_CLASSES[stage]}`}
      >
        {lapsed ? "Expired" : STAGE_SHORT[stage]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          ["People", totals.people],
          ["Active skills", totals.skills],
          ["Sign-offs", totals.signoffs],
          ["Quiz passes", totals.quizPasses],
          ["Instructions read", totals.read],
          [`Expiring < ${EXPIRING_DAYS} d`, totals.expiring],
          ["Expired", totals.lapsed],
        ].map(([label, n]) => (
          <Card key={String(label)} className="p-3">
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search people or skills" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="sm:w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.filter((c) => c.active).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={onlyActive ? "default" : "outline"} size="sm" onClick={() => setOnlyActive((v) => !v)}>
          {onlyActive ? "Showing people with activity" : "Show everyone"}
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
      </div>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">By person</TabsTrigger>
          <TabsTrigger value="skills">By skill</TabsTrigger>
          <TabsTrigger value="ledger">Sign-off ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="people">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3">Person</th>
                  <th className="py-2 px-3 text-right" title="Instructions acknowledged">Read</th>
                  <th className="py-2 px-3 text-right" title="Quiz passed">Quiz</th>
                  <th className="py-2 px-3 text-right">Trained</th>
                  <th className="py-2 px-3 text-right">Competent</th>
                  <th className="py-2 px-3 text-right">Trainer</th>
                  <th className="py-2 px-3 text-right">Expiring</th>
                  <th className="py-2 px-3 text-right">Expired</th>
                  <th className="py-2 px-3">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {people.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Nobody matches.</td></tr>
                )}
                {people.map((r) => {
                  const open = openPerson === r.p.id;
                  return (
                    <Fragment key={r.p.id}>
                      <tr
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setOpenPerson(open ? null : r.p.id)}
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {name(r.p)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.read}<span className="text-muted-foreground">/{activeSkills.length}</span></td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.quiz}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.trained}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.competent}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.trainer}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.expiring > 0 ? <Badge variant="outline" className="text-warning border-warning">{r.expiring}</Badge> : "0"}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.lapsed > 0 ? <Badge variant="destructive">{r.lapsed}</Badge> : "0"}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmt(r.last)}</td>
                      </tr>
                      {open && (
                        <tr className="bg-muted/30">
                          <td colSpan={9} className="p-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-muted-foreground">
                                  <th className="py-1 px-2">Skill</th>
                                  <th className="py-1 px-2">Stage</th>
                                  <th className="py-1 px-2">Read</th>
                                  <th className="py-1 px-2">Quiz</th>
                                  <th className="py-1 px-2">Signed off</th>
                                  <th className="py-1 px-2">By</th>
                                  <th className="py-1 px-2">Expires</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeSkills.map((s) => {
                                  const us = usMap.get(usKey(r.p.id, s.id));
                                  const q = quizMap.get(usKey(r.p.id, s.id));
                                  if (!us && !q) return null;
                                  const by = us?.signedOffBy ? profileById.get(us.signedOffBy) : undefined;
                                  return (
                                    <tr key={s.id} className="border-t border-border/50">
                                      <td className="py-1 px-2 whitespace-nowrap"><span className="font-mono">{s.code}</span> {s.name}</td>
                                      <td className="py-1 px-2">{stagePill(us)}</td>
                                      <td className="py-1 px-2 whitespace-nowrap">{fmt(us?.readingAckAt)}</td>
                                      <td className="py-1 px-2 whitespace-nowrap">
                                        {(quizCounts[s.id] ?? 0) === 0 ? <span className="text-muted-foreground">no quiz</span>
                                          : q ? `${q.passed ? "passed" : "not passed"} · best ${q.bestPct ?? 0}% · ${q.attempts} attempt${q.attempts === 1 ? "" : "s"}`
                                          : <span className="text-muted-foreground">not attempted</span>}
                                      </td>
                                      <td className="py-1 px-2 whitespace-nowrap">{fmt(us?.signedOffAt)}</td>
                                      <td className="py-1 px-2 whitespace-nowrap">{by ? name(by) : ""}</td>
                                      <td className={`py-1 px-2 whitespace-nowrap ${us && isExpired(us.expiresAt) ? "text-destructive" : expiringSoon(us?.expiresAt) ? "text-warning" : ""}`}>{fmt(us?.expiresAt)}</td>
                                    </tr>
                                  );
                                })}
                                {activeSkills.every((s) => !usMap.get(usKey(r.p.id, s.id)) && !quizMap.get(usKey(r.p.id, s.id))) && (
                                  <tr><td colSpan={7} className="py-2 px-2 text-muted-foreground">No activity yet.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3">Skill</th>
                  <th className="py-2 px-3 text-right">Read</th>
                  <th className="py-2 px-3 text-right" title="attempted / passed">Quiz</th>
                  <th className="py-2 px-3 text-right">Trained</th>
                  <th className="py-2 px-3 text-right">Competent</th>
                  <th className="py-2 px-3" title="Every grad student and postdoc can sign off any skill; this column lists people holding a per-skill trainer grant on top of that">Named trainers</th>
                  <th className="py-2 px-3 text-right">Expired</th>
                </tr>
              </thead>
              <tbody>
                {bySkill.map((r) => {
                  const open = openSkill === r.s.id;
                  const holders = userSkills
                    .filter((u) => u.skillId === r.s.id)
                    .sort((a, b) => STAGE_RANK[b.stage] - STAGE_RANK[a.stage]);
                  return (
                    <Fragment key={r.s.id}>
                      <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setOpenSkill(open ? null : r.s.id)}>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1">
                            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-mono text-xs">{r.s.code}</span> {r.s.name}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">{catById.get(r.s.categoryId)?.name}</span>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.read}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{(quizCounts[r.s.id] ?? 0) === 0 ? <span className="text-muted-foreground">none</span> : `${r.attempted} / ${r.passed}`}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.trained}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.competent}</td>
                        <td className="py-2 px-3">
                          {r.trainers.length === 0
                            ? <span className="text-muted-foreground">grad students and postdocs</span>
                            : r.trainers.map((t) => profileById.get(t.userId)).filter(Boolean).map((p) => name(p!)).join(", ")}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.lapsed > 0 ? <Badge variant="destructive">{r.lapsed}</Badge> : "0"}</td>
                      </tr>
                      {open && (
                        <tr className="bg-muted/30">
                          <td colSpan={7} className="p-3">
                            {holders.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Nobody has started this skill.</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {holders.map((u) => {
                                  const p = profileById.get(u.userId);
                                  const q = quizMap.get(usKey(u.userId, u.skillId));
                                  return (
                                    <span key={u.id} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-background">
                                      {p ? name(p) : u.userId.slice(0, 8)} {stagePill(u)}
                                      {q?.passed && <span className="text-muted-foreground">quiz {q.bestPct}%</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3">Observed</th>
                  <th className="py-2 px-3">Trainee</th>
                  <th className="py-2 px-3">Skill</th>
                  <th className="py-2 px-3">Stage</th>
                  <th className="py-2 px-3">Signed by</th>
                  <th className="py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No sign-offs recorded yet.</td></tr>
                )}
                {ledger.map((so) => {
                  const trainee = profileById.get(so.userId);
                  const by = profileById.get(so.signedBy);
                  const s = skillById.get(so.skillId);
                  return (
                    <tr key={so.id} className={`border-b ${so.revokedAt ? "opacity-60 line-through" : ""}`}>
                      <td className="py-2 px-3 whitespace-nowrap">{fmt(so.observedAt)}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{trainee ? name(trainee) : ""}</td>
                      <td className="py-2 px-3 whitespace-nowrap"><span className="font-mono text-xs">{s?.code}</span> {s?.name}</td>
                      <td className="py-2 px-3">{STAGE_SHORT[so.stageGranted]}{so.prereqsWaived && <span className="ml-1 text-xs text-warning">(prereqs waived)</span>}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{by ? name(by) : ""}</td>
                      <td className="py-2 px-3 text-muted-foreground max-w-[28rem] truncate" title={so.revokedAt ? `Revoked: ${so.revokeReason ?? ""}` : so.comments ?? ""}>
                        {so.revokedAt ? `Revoked ${fmt(so.revokedAt)}: ${so.revokeReason ?? ""}` : so.comments}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {signoffs.length > 200 && <p className="text-xs text-muted-foreground mt-2">Showing the most recent 200 of {signoffs.length}. Export CSV for everything.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
