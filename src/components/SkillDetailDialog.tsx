import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Clock,
  PlayCircle,
  GraduationCap,
  FileText,
  ClipboardList,
  Factory,
} from "lucide-react";
import {
  Skill,
  ChecklistItem,
  UserSkill,
  SkillSignoff,
  QuizStatus,
  RefKind,
  STAGE_LABELS,
  STAGE_CLASSES,
  RISK_CLASSES,
  REF_KIND_LABELS,
  renderSkillMarkdown,
  recertLabel,
  isLapsed,
  daysUntilExpiry,
  refKind,
  sortedRefs,
} from "@/lib/skills";
import { QuizStatusLine } from "@/components/SkillQuizDialog";

const REF_ICONS: Record<RefKind, typeof ExternalLink> = {
  video: PlayCircle,
  vendor: Factory,
  protocol: ClipboardList,
  course: GraduationCap,
  guidance: BookOpen,
  paper: FileText,
  standard: FileText,
};

interface SkillDetailDialogProps {
  skill: Skill | null;
  checklist: ChecklistItem[];
  myRecord?: UserSkill;
  history: SkillSignoff[];
  /** Display names by profile id, for "signed by". */
  nameById: Record<string, string>;
  prereqs: Skill[];
  equipmentNames: string[];
  onAcknowledgeReading: (skill: Skill) => void;
  acknowledging: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many active questions this skill has. Zero means the quiz gate does not apply. */
  quizQuestionCount?: number;
  quizStatus?: QuizStatus;
  onTakeQuiz?: (skill: Skill) => void;
}

export const SkillDetailDialog = ({
  skill,
  checklist,
  myRecord,
  history,
  nameById,
  prereqs,
  equipmentNames,
  onAcknowledgeReading,
  acknowledging,
  onOpenChange,
  quizQuestionCount = 0,
  quizStatus,
  onTakeQuiz,
}: SkillDetailDialogProps) => {
  const bodyHtml = useMemo(() => renderSkillMarkdown(skill?.instructionsMd), [skill]);

  if (!skill) return null;

  const stage = myRecord?.stage ?? "not_started";
  const lapsed = isLapsed(myRecord);
  const days = daysUntilExpiry(myRecord?.expiresAt);

  // Re-acknowledgement is needed when the instructions have been revised since they read
  // them. instructions_version is bumped by whoever edits the text.
  const staleReading =
    !!myRecord?.readingAckAt &&
    (myRecord.readingAckVersion ?? 0) < skill.instructionsVersion;

  return (
    <Dialog open={!!skill} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
              {skill.code}
            </span>
            <Badge className={RISK_CLASSES[skill.riskLevel]} variant="secondary">
              {skill.riskLevel}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {recertLabel(skill.recertMonths)}
            </Badge>
            {skill.externalRef && (
              <Badge variant="outline" className="font-mono">{skill.externalRef}</Badge>
            )}
            {equipmentNames.map((n) => (
              <Badge key={n} variant="secondary">{n}</Badge>
            ))}
          </div>
          <DialogTitle className="text-2xl pt-1">{skill.name}</DialogTitle>
          {skill.summary && <DialogDescription>{skill.summary}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4">
          <div className="space-y-6 pb-2">
            {prereqs.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Prerequisites: </span>
                {prereqs.map((p) => p.code).join(", ")}
              </div>
            )}

            {/* 1. The reading component */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                <BookOpen className="w-4 h-4" /> Instructions
              </h3>
              {skill.instructionsMd ? (
                <div
                  className="text-sm leading-relaxed break-words [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No instructions written yet. A PI or lab manager can add them.
                </p>
              )}

              {skill.readingRefs.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Learn more
                  </h4>
                  <ul className="space-y-1.5 text-sm">
                    {sortedRefs(skill.readingRefs).map((r, i) => {
                      const kind = refKind(r.kind);
                      const Icon = REF_ICONS[kind];
                      return (
                        <li key={`${r.url}-${i}`}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-start gap-2 text-primary hover:underline break-words"
                          >
                            <Icon
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                kind === "video" ? "text-rose-600 dark:text-rose-400" : ""
                              }`}
                            />
                            <span>
                              {r.label}
                              <span className="ml-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                                {REF_KIND_LABELS[kind]}
                              </span>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {skill.requiresReading && (
                <div className="mt-5 p-4 rounded-lg border bg-muted/40">
                  {myRecord?.readingAckAt && !staleReading ? (
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      You acknowledged reading this on{" "}
                      {new Date(myRecord.readingAckAt).toLocaleDateString()}.
                    </p>
                  ) : (
                    <>
                      {staleReading && (
                        <p className="text-sm mb-3 flex items-start gap-2 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          These instructions have been updated since you read them. Please read
                          them again and re-acknowledge.
                        </p>
                      )}
                      <Button
                        onClick={() => onAcknowledgeReading(skill)}
                        disabled={acknowledging}
                        className="min-h-[44px]"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        I have read and understood these instructions
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Required before anyone can sign you off on the practical.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* The quiz sits between the reading and the practical, because that is the
                  order it gates in: read, acknowledge, pass, then be observed. */}
              {onTakeQuiz && (
                <QuizStatusLine
                  hasQuiz={quizQuestionCount > 0}
                  passed={!!quizStatus?.passed}
                  attempts={quizStatus?.attempts ?? 0}
                  bestPct={quizStatus?.bestPct ?? null}
                  onTake={() => onTakeQuiz(skill)}
                />
              )}
            </section>

            {/* 2. The practical check, shown up front so nothing is a surprise */}
            {skill.requiresPractical && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  <CheckCircle2 className="w-4 h-4" /> Practical check
                  <span className="normal-case font-normal">
                    — {checklist.length} item{checklist.length === 1 ? "" : "s"}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  What your supervisor will watch you do. Bold items are critical — a failed
                  critical item blocks sign-off.
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                  {checklist.map((c) => (
                    <li key={c.id} className={c.isCritical ? "font-medium" : ""}>
                      {c.itemText}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 3. My record */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                My record
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={STAGE_CLASSES[stage]} variant="secondary">
                  {STAGE_LABELS[stage]}
                </Badge>
                {lapsed && <Badge variant="destructive">Expired</Badge>}
                {!lapsed && days !== null && days <= 60 && days >= 0 && (
                  <Badge variant="outline">Expires in {days} day{days === 1 ? "" : "s"}</Badge>
                )}
              </div>

              {history.length > 0 && (
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Granted</th>
                      <th className="text-left py-2 pr-4 font-medium">By</th>
                      <th className="text-left py-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr
                        key={h.id}
                        className={`border-b ${h.revokedAt ? "line-through opacity-60" : ""}`}
                      >
                        <td className="py-2 pr-4">{STAGE_LABELS[h.stageGranted]}</td>
                        <td className="py-2 pr-4">{nameById[h.signedBy] ?? "Unknown"}</td>
                        <td className="py-2">
                          {new Date(h.observedAt).toLocaleDateString()}
                          {h.revokedAt && (
                            <span className="no-underline block text-xs text-destructive">
                              Revoked: {h.revokeReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
