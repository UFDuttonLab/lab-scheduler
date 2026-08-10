import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skill } from "@/lib/skills";

/**
 * Taking a skill's quiz.
 *
 * Grading happens entirely in Postgres. This component never sees which option is correct
 * until the server tells it, because the answer key lives in a table RLS hides from
 * everyone but a PI or lab manager - see 20260809200000_skills_quiz.sql. Do not "optimise"
 * this by fetching the key client-side; that is the whole attack this design prevents.
 *
 * On a FAILED attempt the server returns only which questions were wrong. On a PASS it
 * returns the correct answers and the explanations, which is the point at which the
 * teaching actually lands. `reveals_answers` on the response says which of the two you got.
 */

interface QuizOption {
  key: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  sort_order: number;
  prompt: string;
  options: QuizOption[];
  is_critical: boolean;
}

interface GradedQuestion {
  question_id: string;
  prompt: string;
  is_critical: boolean;
  chosen: string[];
  was_correct: boolean;
  /** Only present when the attempt passed. */
  correct?: string[];
  explanation?: string;
}

interface GradeResult {
  attempt_id: string;
  attempt_no: number;
  passed: boolean;
  score_pct: number;
  pass_pct_required: number;
  n_questions: number;
  n_correct: number;
  n_critical: number;
  n_critical_correct: number;
  reveals_answers: boolean;
  questions: GradedQuestion[];
}

interface SkillQuizDialogProps {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a passing attempt so the parent can refresh gating state. */
  onPassed?: () => void;
}

/**
 * Deterministic per-attempt shuffle. Option order is fixed in the database, so without this
 * a retake presents the same list in the same order and the quiz degrades into "click the
 * next one down". Seeded on the attempt counter so a single attempt stays stable while the
 * user is answering it, and reshuffles when they try again.
 */
const shuffle = <T,>(items: T[], seed: number): T[] => {
  const out = [...items];
  let s = seed * 9301 + 49297;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const SkillQuizDialog = ({
  skill,
  open,
  onOpenChange,
  onPassed,
}: SkillQuizDialogProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [round, setRound] = useState(0);
  /**
   * Per-mount seed. Seeding purely on sort_order made the order identical for every trainee
   * and identical again every time the dialog was reopened, which defeats the point of
   * shuffling at all. Set once when the dialog opens so the order is stable while answering.
   */
  const [seedBase, setSeedBase] = useState(() => Math.floor(Math.random() * 100000));
  /**
   * Guards against a slow grade landing in the wrong place. This dialog never unmounts - it
   * only toggles `open` - so if someone submits, presses Escape, and opens a different
   * skill's quiz, the in-flight response would otherwise paint that skill's result under
   * the new skill's heading. A trainee reading "QZ-B ... Passed" would stop studying.
   * Every submit takes a ticket; only the current ticket may write a result.
   */
  const submitTicket = useRef(0);

  const load = useCallback(async () => {
    if (!skill) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("skill_quiz_questions")
      .select("id, sort_order, prompt, options, is_critical")
      .eq("skill_id", skill.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    setLoading(false);

    if (error) {
      toast.error(`Could not load the quiz: ${error.message}`);
      return;
    }
    setQuestions(
      (data ?? []).map((q) => ({
        id: q.id,
        sort_order: q.sort_order,
        prompt: q.prompt,
        is_critical: q.is_critical,
        options: Array.isArray(q.options) ? (q.options as unknown as QuizOption[]) : [],
      }))
    );
  }, [skill]);

  useEffect(() => {
    if (open && skill) {
      setAnswers({});
      setResult(null);
      setRound(0);
      setSeedBase(Math.floor(Math.random() * 100000));
      submitTicket.current += 1;
      void load();
    }
  }, [open, skill, load]);

  const shuffled = useMemo(
    () =>
      questions.map((q) => ({
        ...q,
        options: shuffle(q.options, seedBase + q.sort_order + round * 7919),
      })),
    [questions, round, seedBase]
  );

  /**
   * The server's graded payload carries option KEYS, not option text, so resolve them back
   * against the question bank we already loaded. Falls back to the raw key rather than
   * rendering nothing, in case a question was edited between loading and submitting.
   */
  const labelFor = useCallback(
    (g: { question_id: string }, keys: string[] | undefined): string => {
      if (!keys || keys.length === 0) return "";
      const q = questions.find((x) => x.id === g.question_id);
      return keys
        .map((k) => q?.options.find((o) => o.key === k)?.text ?? "(option removed)")
        .join("; ");
    },
    [questions]
  );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const submit = async () => {
    if (!skill || !allAnswered || submitting) return;
    const ticket = ++submitTicket.current;
    const forSkillId = skill.id;
    setSubmitting(true);
    const payload = questions.map((q) => ({
      question_id: q.id,
      chosen: [answers[q.id]],
    }));

    const { data, error } = await supabase.rpc("grade_skill_quiz", {
      _skill_id: skill.id,
      _answers: payload,
    });
    // Clear the spinner FIRST. Returning before this left `submitting` stuck true when the
    // dialog was closed mid-flight and reopened - the component never unmounts, so nothing
    // reset it and Submit stayed dead until a full page reload.
    setSubmitting(false);
    // Stale response: the dialog has since been closed, reopened, or pointed at another
    // skill. The attempt is still correctly recorded server-side; we just must not render it.
    if (ticket !== submitTicket.current || skill?.id !== forSkillId) return;

    if (error) {
      toast.error(error.message);
      return;
    }
    const graded = data as unknown as GradeResult;
    setResult(graded);
    if (graded.passed) {
      toast.success(`Passed at ${graded.score_pct}%.`);
      onPassed?.();
    }
  };

  const retake = () => {
    setAnswers({});
    setResult(null);
    setRound((r) => r + 1);
  };

  if (!skill) return null;

  const wrongOnes = result?.questions.filter((q) => !q.was_correct) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
              {skill.code}
            </span>
            {result && (
              <Badge variant={result.passed ? "default" : "destructive"}>
                Attempt {result.attempt_no}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl pt-1">
            {result ? "Your result" : `Quiz — ${skill.name}`}
          </DialogTitle>
          <DialogDescription>
            {result
              ? result.passed
                ? "Passed. The correct answers and explanations are below — worth reading before you go."
                : "Not passed this time. Go back over the instructions and try again — there is no limit on attempts."
              : `Every question must be answered. You need ${skill.quizPassPct ?? 80}% overall to pass. You can retake this as many times as you need.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading the quiz…
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">
              No quiz has been written for this skill yet.
            </p>
          ) : result ? (
            <div className="space-y-5 pb-2">
              <div
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  result.passed
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-destructive/10 border-destructive/30"
                }`}
              >
                {result.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                )}
                <div className="text-sm">
                  <p className="font-semibold">
                    {result.score_pct}% — {result.n_correct} of {result.n_questions} correct
                    {result.n_critical > 0 && (
                      <>
                        {" · "}
                        {result.n_critical_correct} of {result.n_critical} critical
                      </>
                    )}
                  </p>
                  {!result.passed && (
                    <p className="text-muted-foreground mt-1">
                      You need {result.pass_pct_required}% overall.
                      {result.n_critical_correct < result.n_critical &&
                        " One of the ones you missed was a critical item — worth re-reading that part closely."}
                    </p>
                  )}
                  {result.passed && result.n_critical_correct < result.n_critical && (
                    <p className="text-amber-700 dark:text-amber-400 mt-1">
                      You passed, but missed {result.n_critical - result.n_critical_correct} critical
                      question{result.n_critical - result.n_critical_correct === 1 ? "" : "s"}. Go back
                      over those before your practical check.
                    </p>
                  )}
                </div>
              </div>

              {!result.passed && (
                <p className="text-sm text-muted-foreground">
                  Which questions you got wrong is deliberately not shown. Otherwise a few
                  deliberate failures would map out the whole answer key, and the quiz would
                  stop meaning anything. Re-read the instructions above and come back — there
                  is no limit on attempts and nothing is held against you.
                </p>
              )}

              <ol className="space-y-4">
                {result.questions.map((q, i) => (
                  <li key={q.question_id} className="text-sm">
                    <div className="flex items-start gap-2">
                      {q.was_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium break-words">
                          {i + 1}. {q.prompt}
                          {q.is_critical && (
                            <Badge variant="outline" className="ml-2 text-[10px] align-middle">
                              critical
                            </Badge>
                          )}
                        </div>
                        {/* What they picked is the one thing still worth showing after a
                            fail, since the answers are withheld until they pass. */}
                        <p className="text-xs text-muted-foreground mt-1 break-words">
                          You answered: {labelFor(q, q.chosen) || "—"}
                        </p>
                        {result.reveals_answers && q.correct && !q.was_correct && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 break-words">
                            Correct answer: {labelFor(q, q.correct)}
                          </p>
                        )}
                        {result.reveals_answers && q.explanation && (
                          <p className="text-muted-foreground mt-1 break-words">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="space-y-6 pb-2">
              {shuffled.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <div className="text-sm font-medium break-words">
                    {i + 1}. {q.prompt}
                    {q.is_critical && (
                      <Badge variant="outline" className="ml-2 text-[10px] align-middle">
                        critical
                      </Badge>
                    )}
                  </div>
                  <RadioGroup
                    value={answers[q.id] ?? ""}
                    onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                    className="gap-1.5"
                  >
                    {q.options.map((o) => (
                      <div key={o.key} className="flex items-start gap-2">
                        <RadioGroupItem
                          value={o.key}
                          id={`${q.id}-${o.key}`}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`${q.id}-${o.key}`}
                          className="text-sm font-normal leading-relaxed cursor-pointer break-words"
                        >
                          {o.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          )}
        </div>

        {questions.length > 0 && !result && (
          <div className="pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <Progress
                value={(answeredCount / questions.length) * 100}
                className="h-1.5 flex-1"
              />
              <span className="shrink-0">
                {answeredCount} / {questions.length}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {!result.passed && (
                <Button onClick={retake} className="min-h-[44px]">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={!allAnswered || submitting || questions.length === 0}
                className="min-h-[44px]"
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {allAnswered ? "Submit" : `Answer all ${questions.length}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Small status line used on the skill detail dialog. */
export const QuizStatusLine = ({
  hasQuiz,
  passed,
  attempts,
  bestPct,
  onTake,
}: {
  hasQuiz: boolean;
  passed: boolean;
  attempts: number;
  bestPct: number | null;
  onTake: () => void;
}) => {
  if (!hasQuiz) return null;
  return (
    <div className="mt-5 p-4 rounded-lg border bg-muted/40">
      {passed ? (
        <p className="text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Quiz passed{bestPct !== null && <> — best score {bestPct}%</>}.
          <Button variant="link" className="h-auto p-0 text-sm" onClick={onTake}>
            Take it again
          </Button>
        </p>
      ) : (
        <>
          <p className="text-sm flex items-start gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <span>
              You need to pass the quiz before anyone can sign you off on the practical.
              {attempts > 0 && (
                <>
                  {" "}
                  {attempts} attempt{attempts === 1 ? "" : "s"} so far
                  {bestPct !== null && <>, best {bestPct}%</>}.
                </>
              )}
            </span>
          </p>
          <Button onClick={onTake} className="min-h-[44px]">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {attempts > 0 ? "Try the quiz again" : "Take the quiz"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Unlimited retakes. Read the instructions above first.
          </p>
        </>
      )}
    </div>
  );
};
