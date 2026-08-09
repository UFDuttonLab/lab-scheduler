import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { settleWrite } from "@/lib/dbWrite";
import { Skill } from "@/lib/skills";

/**
 * Authoring the question bank for one skill.
 *
 * Two tables, one editor. `skill_quiz_questions` holds the prompt and the options and is
 * readable by anyone who can see the module; `skill_quiz_answers` holds the key and the
 * explanation and RLS shows it only to a PI or a lab manager. That split is the whole
 * security design (see 20260809200000_skills_quiz.sql), so this component reads the key
 * through the same policy as everyone else rather than trying to route around it - if the
 * key does not come back, the editor says so instead of quietly saving blanks over it.
 *
 * The two tables cannot be written in one statement, and a question without a key is
 * invisible to grade_skill_quiz() - the skill then gates on a quiz nobody can pass. Every
 * path below therefore either lands both rows or leaves the pair as it found it, and says
 * plainly when it cannot.
 */

const DENIED = "You don't have permission to edit this skill's quiz.";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

/** Option keys are short, stable identifiers, not display order. Past attempts store them. */
const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

const mintKey = (used: string[]): string => {
  const free = LETTERS.find((l) => !used.includes(l));
  if (free) return free;
  let n = used.length + 1;
  while (used.includes(`o${n}`)) n++;
  return `o${n}`;
};

interface DraftOption {
  key: string;
  text: string;
}

interface DraftQuestion {
  /** undefined = not in the database yet. */
  id?: string;
  prompt: string;
  options: DraftOption[];
  /** The one option key marked correct. "" until the author picks one. */
  correctKey: string;
  explanation: string;
  isCritical: boolean;
  active: boolean;
  /** What the database held when this dialog opened. Drives write ordering and change detection. */
  saved?: {
    optionKeys: string[];
    correctKeys: string[];
    hasKeyRow: boolean;
    signature: string;
  };
}

interface SkillQuizEditorDialogProps {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const blankQuestion = (): DraftQuestion => ({
  prompt: "",
  options: [
    { key: "a", text: "" },
    { key: "b", text: "" },
  ],
  correctKey: "",
  explanation: "",
  isCritical: false,
  active: true,
});

/** Everything a save would write, in a comparable form, so an untouched question is skipped. */
const signatureOf = (q: DraftQuestion, sortOrder: number): string =>
  JSON.stringify({
    sortOrder,
    prompt: q.prompt.trim(),
    options: q.options.map((o) => ({ key: o.key, text: o.text.trim() })),
    correct: [q.correctKey],
    explanation: q.explanation.trim(),
    isCritical: q.isCritical,
    active: q.active,
  });

export const SkillQuizEditorDialog = ({
  skill,
  open,
  onOpenChange,
  onSaved,
}: SkillQuizEditorDialogProps) => {
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [missingKeys, setMissingKeys] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!skill) return;
    setLoading(true);
    setLoadFailed(false);

    const qres = await supabase
      .from("skill_quiz_questions")
      .select("id, sort_order, prompt, options, is_critical, active")
      .eq("skill_id", skill.id)
      .order("sort_order", { ascending: true });

    if (qres.error) {
      setLoading(false);
      setLoadFailed(true);
      toast.error(`Could not load the question bank: ${qres.error.message}`);
      return;
    }

    const rows = qres.data ?? [];
    const keyByQuestion: Record<string, { correctKeys: string[]; explanation: string }> = {};

    if (rows.length) {
      // The answer key. A PI or manager may read this; anyone else gets zero rows and no
      // error, which is why the count is checked below rather than assumed.
      const ares = await supabase
        .from("skill_quiz_answers")
        .select("question_id, correct_keys, explanation")
        .in(
          "question_id",
          rows.map((r) => r.id)
        );
      if (ares.error) {
        setLoading(false);
        setLoadFailed(true);
        toast.error(`Could not read the answer key: ${ares.error.message}`);
        return;
      }
      for (const a of ares.data ?? []) {
        keyByQuestion[a.question_id] = {
          correctKeys: a.correct_keys ?? [],
          explanation: a.explanation ?? "",
        };
      }
    }

    const drafts: DraftQuestion[] = rows.map((r, i) => {
      const options: DraftOption[] = Array.isArray(r.options)
        ? (r.options as unknown as { key: string; text: string }[]).map((o) => ({
            key: String(o?.key ?? ""),
            text: String(o?.text ?? ""),
          }))
        : [];
      const key = keyByQuestion[r.id];
      const correctKey =
        key?.correctKeys.find((k) => options.some((o) => o.key === k)) ?? "";
      const draft: DraftQuestion = {
        id: r.id,
        prompt: r.prompt,
        options,
        correctKey,
        explanation: key?.explanation ?? "",
        isCritical: r.is_critical,
        active: r.active,
      };
      draft.saved = {
        optionKeys: options.map((o) => o.key),
        correctKeys: key?.correctKeys ?? [],
        hasKeyRow: !!key,
        signature: signatureOf(draft, (i + 1) * 10),
      };
      return draft;
    });

    setQuestions(drafts);
    setLoadedIds(rows.map((r) => r.id));
    setMissingKeys(rows.filter((r) => !keyByQuestion[r.id]).length);
    setLoading(false);
  }, [skill]);

  useEffect(() => {
    if (!open || !skill) return;
    setQuestions([]);
    setLoadedIds([]);
    setMissingKeys(0);
    void load();
  }, [open, skill, load]);

  // ---------------------------------------------------------------- draft editing
  const patch = (i: number, next: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...next } : q)));

  const moveQuestion = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const next = questions.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setQuestions(next);
  };

  const setOptionText = (i: number, k: number, text: string) =>
    setQuestions((qs) =>
      qs.map((q, j) =>
        j === i
          ? { ...q, options: q.options.map((o, m) => (m === k ? { ...o, text } : o)) }
          : q
      )
    );

  const addOption = (i: number) =>
    setQuestions((qs) =>
      qs.map((q, j) =>
        j === i && q.options.length < MAX_OPTIONS
          ? {
              ...q,
              options: [...q.options, { key: mintKey(q.options.map((o) => o.key)), text: "" }],
            }
          : q
      )
    );

  const removeOption = (i: number, k: number) =>
    setQuestions((qs) =>
      qs.map((q, j) => {
        if (j !== i || q.options.length <= MIN_OPTIONS) return q;
        const gone = q.options[k];
        return {
          ...q,
          options: q.options.filter((_, m) => m !== k),
          correctKey: q.correctKey === gone.key ? "" : q.correctKey,
        };
      })
    );

  // ---------------------------------------------------------------- saving
  const removedIds = loadedIds.filter((id) => !questions.some((q) => q.id === id));

  const validate = (): string | null => {
    for (let i = 0; i < questions.length; i++) {
      const n = i + 1;
      const q = questions[i];
      if (!q.prompt.trim()) return `Question ${n} has no prompt.`;
      if (q.options.length < MIN_OPTIONS || q.options.length > MAX_OPTIONS)
        return `Question ${n} needs between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`;
      if (q.options.some((o) => !o.text.trim()))
        return `Question ${n} has an empty option. Write it out or remove it.`;
      const texts = q.options.map((o) => o.text.trim().toLowerCase());
      if (new Set(texts).size !== texts.length)
        return `Question ${n} has two options that read the same.`;
      if (!q.correctKey || !q.options.some((o) => o.key === q.correctKey))
        return `Question ${n} has no correct answer marked.`;
      if (!q.explanation.trim())
        return `Question ${n} has no explanation. It is what the trainee reads after passing, so it cannot be blank.`;
    }
    return null;
  };

  /**
   * Write one question and its key.
   *
   * Ordering is not cosmetic. Postgres validates the key against the question's options in
   * both directions: an UPDATE of options is rejected while the stored key names an option
   * that is about to disappear, and an UPDATE of the key is rejected while it names an
   * option that does not exist yet. So the two writes go in whichever order is legal, and
   * where neither is - every option replaced at once - the key is dropped first, which is
   * the one state the options trigger deliberately skips.
   *
   * Returns null on success, or a message to show the author.
   */
  const writeQuestion = async (q: DraftQuestion, index: number): Promise<string | null> => {
    if (!skill) return "No skill selected.";
    const n = index + 1;
    const sortOrder = (index + 1) * 10;

    // `any` for the same reason SkillEditorDialog casts its reading_refs payload: an
    // array of {key, text} does not structurally satisfy the generated Json type.
    const payload: any = {
      skill_id: skill.id,
      sort_order: sortOrder,
      prompt: q.prompt.trim(),
      options: q.options.map((o) => ({ key: o.key, text: o.text.trim() })),
      is_critical: q.isCritical,
      active: q.active,
    };
    const keyFields = {
      correct_keys: [q.correctKey],
      explanation: q.explanation.trim(),
    };

    // --- brand new question: question first, then key, and no orphan left behind.
    if (!q.id) {
      const ins = await supabase
        .from("skill_quiz_questions")
        .insert(payload)
        .select("id")
        .single();
      if (ins.error) return `Question ${n} could not be saved: ${ins.error.message}`;

      const keyIns = await supabase
        .from("skill_quiz_answers")
        .insert({ question_id: ins.data.id, ...keyFields });
      if (keyIns.error) {
        // A question with no key is invisible to the grader and deadlocks the skill, so the
        // question goes back out rather than being left half-written.
        const undo = await settleWrite(
          supabase.from("skill_quiz_questions").delete().eq("id", ins.data.id).select("id"),
          DENIED
        );
        return (
          `Question ${n}: the answer key could not be saved (${keyIns.error.message}). ` +
          (undo.ok
            ? "The question was rolled back, so nothing was added."
            : "The question could NOT be rolled back either - it now has no answer key and must be deleted by hand before anyone takes this quiz.")
        );
      }
      return null;
    }

    const id = q.id;
    const savedOptionKeys = q.saved?.optionKeys ?? [];
    const savedCorrect = q.saved?.correctKeys ?? [];
    const hasKeyRow = q.saved?.hasKeyRow ?? false;
    const newKeys = q.options.map((o) => o.key);

    const putQuestion = async () =>
      settleWrite(
        supabase.from("skill_quiz_questions").update(payload).eq("id", id).select("id"),
        DENIED
      );
    const putKey = async () =>
      settleWrite(
        supabase
          .from("skill_quiz_answers")
          .update(keyFields)
          .eq("question_id", id)
          .select("question_id"),
        DENIED
      );
    const addKey = async () => {
      const { error } = await supabase
        .from("skill_quiz_answers")
        .insert({ question_id: id, ...keyFields });
      return error ? { ok: false, message: error.message } : { ok: true as const };
    };

    if (!hasKeyRow) {
      // Nothing to contradict the new options, so order does not matter. The key row is
      // missing - either this question was orphaned, or it is being repaired now.
      const a = await putQuestion();
      if (!a.ok) return `Question ${n} could not be saved: ${a.message}`;
      const b = await addKey();
      if (!b.ok)
        return `Question ${n} was saved but its answer key was not (${b.message}). It has no key, so the grader cannot see it - fix it before anyone takes this quiz.`;
      return null;
    }

    if (savedOptionKeys.includes(q.correctKey)) {
      // The new correct option already exists on the stored question: key first is legal,
      // and the options that follow are guaranteed to contain it.
      const a = await putKey();
      if (!a.ok) return `Question ${n}: the answer key could not be saved (${a.message}). Nothing else was changed.`;
      const b = await putQuestion();
      if (!b.ok)
        return `Question ${n}: the answer key was updated but the question itself was not (${b.message}). Try saving again.`;
      return null;
    }

    if (savedCorrect.length > 0 && savedCorrect.every((k) => newKeys.includes(k))) {
      // The stored key survives the new option list, so the question can go first.
      const a = await putQuestion();
      if (!a.ok) return `Question ${n} could not be saved: ${a.message}`;
      const b = await putKey();
      if (!b.ok)
        return `Question ${n} was saved but its answer key was not (${b.message}). The key still points at the old answer - fix it before anyone takes this quiz.`;
      return null;
    }

    // Every option was replaced. Neither write is legal while the other row stands, so the
    // key is removed for the duration - the options trigger skips validation when there is
    // no key - and written again immediately.
    const drop = await settleWrite(
      supabase.from("skill_quiz_answers").delete().eq("question_id", id).select("question_id"),
      DENIED
    );
    if (!drop.ok) return `Question ${n}: the answer key could not be replaced (${drop.message}). Nothing was changed.`;
    const upd = await putQuestion();
    if (!upd.ok)
      return `Question ${n} could not be saved (${upd.message}) and its answer key has already been removed - re-save this question before anyone takes the quiz.`;
    const re = await addKey();
    if (!re.ok)
      return `Question ${n} was saved but its answer key was not (${re.message}). It has no key, so the grader cannot see it - fix it before anyone takes this quiz.`;
    return null;
  };

  const handleSave = async () => {
    if (!skill) return;

    // Everything is checked before a single row moves. A half-built question that reached
    // the database would gate the practical behind a quiz nobody can pass.
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      for (const id of removedIds) {
        const del = await settleWrite(
          supabase.from("skill_quiz_questions").delete().eq("id", id).select("id"),
          DENIED
        );
        if (!del.ok) {
          toast.error(`A removed question could not be deleted: ${del.message}`);
          return;
        }
      }

      let written = 0;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // Skip anything identical to what is already stored: every write bumps
        // quiz_version, and a no-op edit should not tell the lab the quiz changed.
        if (q.id && q.saved && q.saved.signature === signatureOf(q, (i + 1) * 10)) continue;
        const failure = await writeQuestion(q, i);
        if (failure) {
          toast.error(failure);
          return;
        }
        written++;
      }

      if (written === 0 && removedIds.length === 0) {
        toast.success("Nothing had changed, so nothing was written.");
      } else {
        toast.success(
          `${skill.code} quiz saved — ${questions.length} question${
            questions.length === 1 ? "" : "s"
          }${removedIds.length ? `, ${removedIds.length} removed` : ""}. Quiz version bumped.`
        );
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error: any) {
      console.error("Error saving quiz:", error);
      toast.error(error?.message ?? "Could not save the quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!skill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
              {skill.code}
            </span>
            <Badge variant="outline">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </Badge>
            {skill.quizVersion !== undefined && (
              <Badge variant="secondary">quiz v{skill.quizVersion}</Badge>
            )}
          </div>
          <DialogTitle className="text-xl pt-1">Quiz questions — {skill.name}</DialogTitle>
          <DialogDescription>
            The prompt and options are readable by everyone who can see the module. The
            correct answer and the explanation live in a separate table only a PI or lab
            manager can read, which is what stops a trainee reading the key off the wire.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4">
          <div className="space-y-4 pb-2">
            <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm">
                Saving any change here bumps this skill's <strong>quiz version</strong>.
                Anyone who has already passed <strong>stays passed</strong> — the bump only
                records that their pass predates these questions, it does not revoke it and
                nobody is asked to retake. Anyone part-way through an attempt should start
                again.
              </p>
            </div>

            {missingKeys > 0 && (
              <div className="p-3 rounded-lg border bg-destructive/10 border-destructive/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                <p className="text-sm">
                  {missingKeys} question{missingKeys === 1 ? "" : "s"} came back without an
                  answer key. Either the key was never written — in which case the grader
                  cannot see that question at all and you should set the answer below — or
                  your account cannot read the key table, in which case close this without
                  saving and ask a PI.
                </p>
              </div>
            )}

            {removedIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {removedIds.length} question{removedIds.length === 1 ? "" : "s"} will be
                deleted when you save.
              </p>
            )}

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading the question bank…
              </div>
            ) : loadFailed ? (
              <p className="text-sm text-destructive py-8">
                The question bank could not be loaded, so it cannot be edited safely. Close
                this and try again.
              </p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">
                No questions yet. A skill with no questions has no quiz gate at all — add
                some below.
              </p>
            ) : (
              questions.map((q, i) => (
                <Card
                  key={q.id ?? `new-${i}`}
                  className={`p-3 ${q.active ? "" : "opacity-70 border-dashed"}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        type="button"
                        aria-label={`Move question ${i + 1} up`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => moveQuestion(i, -1)}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move question ${i + 1} down`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                        disabled={i === questions.length - 1}
                        onClick={() => moveQuestion(i, 1)}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-muted">
                          Q{i + 1}
                        </span>
                        {q.isCritical && (
                          <Badge variant="outline" className="text-[10px]">
                            critical
                          </Badge>
                        )}
                        {!q.active && (
                          <Badge variant="secondary" className="text-[10px]">
                            not asked
                          </Badge>
                        )}
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          aria-label={`Delete question ${i + 1}`}
                          onClick={() =>
                            setQuestions(questions.filter((_, j) => j !== i))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        value={q.prompt}
                        rows={2}
                        onChange={(e) => patch(i, { prompt: e.target.value })}
                        placeholder="Something they can only answer if they read and understood the instructions."
                      />

                      <div className="space-y-2">
                        <Label>
                          Options{" "}
                          <span className="font-normal text-muted-foreground">
                            — {MIN_OPTIONS} to {MAX_OPTIONS}. Select the one that is correct.
                          </span>
                        </Label>
                        <RadioGroup
                          value={q.correctKey}
                          onValueChange={(v) => patch(i, { correctKey: v })}
                          className="gap-2"
                        >
                          {q.options.map((o, k) => (
                            <div key={o.key} className="flex items-center gap-2">
                              <RadioGroupItem
                                value={o.key}
                                id={`q${i}-${o.key}`}
                                aria-label={`Mark option ${k + 1} of question ${
                                  i + 1
                                } as correct`}
                                className="shrink-0"
                              />
                              <Input
                                value={o.text}
                                onChange={(e) => setOptionText(i, k, e.target.value)}
                                placeholder={`Option ${k + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                aria-label={`Remove option ${k + 1} of question ${i + 1}`}
                                disabled={q.options.length <= MIN_OPTIONS}
                                onClick={() => removeOption(i, k)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </RadioGroup>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={q.options.length >= MAX_OPTIONS}
                          onClick={() => addOption(i)}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add option
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Explanation{" "}
                          <span className="font-normal text-muted-foreground">
                            — shown only after a pass. This is where the teaching lands.
                          </span>
                        </Label>
                        <Textarea
                          value={q.explanation}
                          rows={2}
                          onChange={(e) => patch(i, { explanation: e.target.value })}
                          placeholder="Why that answer is right, and why the tempting one is not."
                        />
                      </div>

                      <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={q.isCritical}
                            onCheckedChange={(v) => patch(i, { isCritical: v })}
                          />
                          <span className="text-sm">Critical — must be right to pass</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={q.active}
                            onCheckedChange={(v) => patch(i, { active: v })}
                          />
                          <span className="text-sm">Asked</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {!loading && !loadFailed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuestions([...questions, blankQuestion()])}
              >
                <Plus className="w-4 h-4 mr-2" /> Add question
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || loadFailed}
            className="min-h-[44px]"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
