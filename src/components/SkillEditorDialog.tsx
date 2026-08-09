import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { settleWrite } from "@/lib/dbWrite";
import {
  Skill,
  SkillCategory,
  ChecklistItem,
  ReadingRef,
  RiskLevel,
} from "@/lib/skills";

interface EquipmentLite {
  id: string;
  name: string;
}

interface SkillEditorDialogProps {
  open: boolean;
  /** null = creating a new skill. */
  skill: Skill | null;
  categories: SkillCategory[];
  allSkills: Skill[];
  equipment: EquipmentLite[];
  existingChecklist: ChecklistItem[];
  existingPrereqIds: string[];
  existingEquipmentIds: string[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface DraftCheck {
  itemText: string;
  isCritical: boolean;
}

export const SkillEditorDialog = ({
  open,
  skill,
  categories,
  allSkills,
  equipment,
  existingChecklist,
  existingPrereqIds,
  existingEquipmentIds,
  onOpenChange,
  onSaved,
}: SkillEditorDialogProps) => {
  const [categoryId, setCategoryId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [instructions, setInstructions] = useState("");
  const [refs, setRefs] = useState<ReadingRef[]>([]);
  const [requiresReading, setRequiresReading] = useState(true);
  const [requiresPractical, setRequiresPractical] = useState(true);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("standard");
  const [recertMonths, setRecertMonths] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [active, setActive] = useState(true);
  const [checks, setChecks] = useState<DraftCheck[]>([]);
  const [prereqIds, setPrereqIds] = useState<string[]>([]);
  const [equipIds, setEquipIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Prefill on open, and reset to defaults when creating. Keyed on the editing target the
  // same way the Lab Projects dialog in Settings.tsx does it.
  useEffect(() => {
    if (!open) return;
    if (skill) {
      setCategoryId(skill.categoryId);
      setCode(skill.code);
      setName(skill.name);
      setSummary(skill.summary ?? "");
      setInstructions(skill.instructionsMd ?? "");
      setRefs(skill.readingRefs ?? []);
      setRequiresReading(skill.requiresReading);
      setRequiresPractical(skill.requiresPractical);
      setRiskLevel(skill.riskLevel);
      // ?? not ||: a recert of 0 would be a real value.
      setRecertMonths(skill.recertMonths !== undefined ? String(skill.recertMonths) : "");
      setExternalRef(skill.externalRef ?? "");
      setActive(skill.active);
      setChecks(
        existingChecklist
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c) => ({ itemText: c.itemText, isCritical: c.isCritical }))
      );
      setPrereqIds(existingPrereqIds);
      setEquipIds(existingEquipmentIds);
    } else {
      setCategoryId(categories[0]?.id ?? "");
      setCode("");
      setName("");
      setSummary("");
      setInstructions("");
      setRefs([]);
      setRequiresReading(true);
      setRequiresPractical(true);
      setRiskLevel("standard");
      setRecertMonths("");
      setExternalRef("");
      setActive(true);
      setChecks([]);
      setPrereqIds([]);
      setEquipIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, skill]);

  const instructionsChanged = (skill?.instructionsMd ?? "") !== instructions;

  const moveCheck = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= checks.length) return;
    const next = checks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setChecks(next);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !categoryId) {
      toast.error("Code, name and category are all required.");
      return;
    }
    const cleanChecks = checks.filter((c) => c.itemText.trim());
    if (requiresPractical && cleanChecks.length === 0) {
      toast.error(
        "A skill with a practical check needs at least one checklist item — otherwise there is nothing for the supervisor to observe."
      );
      return;
    }

    setSaving(true);
    try {
      // `any` here matches how Equipment.tsx types its own write payload. The friction is
      // reading_refs: a ReadingRef[] does not structurally satisfy the generated Json type
      // (no index signature), and widening ReadingRef to accept arbitrary keys would be
      // worse than a cast at the single place it is written.
      const payload: any = {
        category_id: categoryId,
        code: code.trim(),
        name: name.trim(),
        summary: summary.trim() || null,
        instructions_md: instructions.trim() || null,
        reading_refs: refs.filter((r) => r.label.trim() && r.url.trim()),
        requires_reading: requiresReading,
        requires_practical: requiresPractical,
        risk_level: riskLevel,
        recert_months: recertMonths.trim() === "" ? null : Number(recertMonths),
        external_ref: externalRef.trim() || null,
        active,
      };

      let skillId = skill?.id;

      if (skill) {
        // Bumping instructions_version is what makes everyone who already acknowledged
        // this skill see "the instructions changed since you read them" rather than
        // silently having signed against a different document.
        const result = await settleWrite(
          supabase
            .from("skills")
            .update({
              ...payload,
              instructions_version: instructionsChanged
                ? skill.instructionsVersion + 1
                : skill.instructionsVersion,
            })
            .eq("id", skill.id)
            .select("id"),
          "You don't have permission to edit the skill catalog."
        );
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("skills")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        skillId = data.id;
      }

      if (!skillId) throw new Error("No skill id after save");

      // Checklist, prerequisites and equipment links are replaced wholesale. Simpler than
      // diffing, and safe: checklist_results on past sign-offs are a snapshot taken at
      // sign-off time, so rewriting the current checklist cannot rewrite history.
      await supabase.from("skill_checklist_items").delete().eq("skill_id", skillId);
      if (cleanChecks.length) {
        const { error } = await supabase.from("skill_checklist_items").insert(
          cleanChecks.map((c, i) => ({
            skill_id: skillId,
            sort_order: i * 10,
            item_text: c.itemText.trim(),
            is_critical: c.isCritical,
          }))
        );
        if (error) throw error;
      }

      await supabase.from("skill_prerequisites").delete().eq("skill_id", skillId);
      if (prereqIds.length) {
        const { error } = await supabase
          .from("skill_prerequisites")
          .insert(prereqIds.map((p) => ({ skill_id: skillId, prereq_id: p })));
        if (error) throw error;
      }

      await supabase.from("skill_equipment").delete().eq("skill_id", skillId);
      if (equipIds.length) {
        const { error } = await supabase
          .from("skill_equipment")
          .insert(equipIds.map((e) => ({ skill_id: skillId, equipment_id: e })));
        if (error) throw error;
      }

      toast.success(
        skill
          ? `${code} updated${instructionsChanged ? " — instructions version bumped" : ""}.`
          : `${code} created.`
      );
      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      console.error("Error saving skill:", error);
      toast.error(
        error?.code === "23505"
          ? `A skill with code "${code.trim()}" already exists.`
          : error?.message ?? "Could not save the skill. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{skill ? `Edit ${skill.code}` : "New skill"}</DialogTitle>
          <DialogDescription>
            {skill
              ? "Changes apply immediately. Editing the instructions asks everyone who already read them to read again."
              : "Add a skill to the catalog. It appears for trainees as soon as it is active."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4">
          <div className="space-y-5 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="FLX-21"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Labware Position Check (LPC)"
              />
            </div>

            <div className="space-y-2">
              <Label>Summary</Label>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One line: what 'competent and independent' looks like."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Instructions — what the trainee reads</Label>
                {skill && instructionsChanged && (
                  <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
                    version {skill.instructionsVersion} → {skill.instructionsVersion + 1}
                  </Badge>
                )}
              </div>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder={"Markdown. **bold**, *italic*, `code`, - bullets, 1. numbers, | tables |"}
              />
              <p className="text-xs text-muted-foreground">
                Supports bold, italic, inline code, bullet and numbered lists, and pipe tables.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Source links</Label>
              {refs.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={r.label}
                    onChange={(e) => {
                      const n = refs.slice();
                      n[i] = { ...n[i], label: e.target.value };
                      setRefs(n);
                    }}
                    placeholder="Label"
                    className="sm:w-1/3"
                  />
                  <Input
                    value={r.url}
                    onChange={(e) => {
                      const n = refs.slice();
                      n[i] = { ...n[i], url: e.target.value };
                      setRefs(n);
                    }}
                    placeholder="https://..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setRefs(refs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefs([...refs, { label: "", url: "", kind: "vendor" }])}
              >
                <Plus className="w-4 h-4 mr-2" /> Add link
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Risk level</Label>
                <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recert (months)</Label>
                <Input
                  type="number"
                  min={0}
                  value={recertMonths}
                  onChange={(e) => setRecertMonths(e.target.value)}
                  placeholder="blank = never expires"
                />
              </div>
              <div className="space-y-2">
                <Label>External reference</Label>
                <Input
                  value={externalRef}
                  onChange={(e) => setExternalRef(e.target.value)}
                  placeholder="EHS869"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={requiresReading} onCheckedChange={setRequiresReading} />
                <span className="text-sm">Requires reading acknowledgement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={requiresPractical} onCheckedChange={setRequiresPractical} />
                <span className="text-sm">Requires a practical check</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={active} onCheckedChange={setActive} />
                <span className="text-sm">Active</span>
              </label>
            </div>

            {requiresPractical && (
              <div className="space-y-2">
                <Label>
                  Practical checklist{" "}
                  <span className="font-normal text-muted-foreground">
                    — what the supervisor observes. Tick "critical" for items that block a
                    competent sign-off.
                  </span>
                </Label>
                {checks.map((c, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button
                        type="button"
                        aria-label="Move up"
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => moveCheck(i, -1)}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={i === checks.length - 1}
                        onClick={() => moveCheck(i, 1)}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Textarea
                      value={c.itemText}
                      rows={2}
                      onChange={(e) => {
                        const n = checks.slice();
                        n[i] = { ...n[i], itemText: e.target.value };
                        setChecks(n);
                      }}
                      placeholder="Something a supervisor can watch them do."
                    />
                    <label className="flex items-center gap-1.5 pt-2 shrink-0 cursor-pointer">
                      <Checkbox
                        checked={c.isCritical}
                        onCheckedChange={(v) => {
                          const n = checks.slice();
                          n[i] = { ...n[i], isCritical: v === true };
                          setChecks(n);
                        }}
                      />
                      <span className="text-xs">Critical</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setChecks(checks.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChecks([...checks, { itemText: "", isCritical: false }])}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add checklist item
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Prerequisites</Label>
              <div className="flex flex-wrap gap-2">
                {prereqIds.map((id) => {
                  const p = allSkills.find((s) => s.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1.5 py-1">
                      {p?.code ?? id.slice(0, 8)}
                      <button type="button" onClick={() => setPrereqIds(prereqIds.filter((x) => x !== id))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
                {prereqIds.length === 0 && (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
              <Select value="" onValueChange={(v) => setPrereqIds([...prereqIds, v])}>
                <SelectTrigger className="sm:w-[380px]">
                  <SelectValue placeholder="Add a prerequisite..." />
                </SelectTrigger>
                <SelectContent>
                  {allSkills
                    .filter((s) => s.id !== skill?.id && !prereqIds.includes(s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipment this applies to</Label>
              <div className="flex flex-wrap gap-2">
                {equipIds.map((id) => {
                  const e = equipment.find((x) => x.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1.5 py-1">
                      {e?.name ?? id.slice(0, 8)}
                      <button type="button" onClick={() => setEquipIds(equipIds.filter((x) => x !== id))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
                {equipIds.length === 0 && (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
              <Select value="" onValueChange={(v) => setEquipIds([...equipIds, v])}>
                <SelectTrigger className="sm:w-[380px]">
                  <SelectValue placeholder="Link a machine..." />
                </SelectTrigger>
                <SelectContent>
                  {equipment
                    .filter((e) => !equipIds.includes(e.id))
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-h-[44px]">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {skill ? "Save changes" : "Create skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
