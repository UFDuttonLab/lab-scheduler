/**
 * Types and helpers for the lab skills training / sign-off module.
 *
 * The module is HIDDEN by default: public.skill_module_settings.visible_to_all defaults to
 * false, and until a PI or manager flips it, only pi/manager see the Skills nav item and
 * page. See useSkillsModule().
 */

/** Mirrors the public.skill_stage Postgres enum. Ordered. */
export type SkillStage =
  | 'not_started'
  | 'reading_done'
  | 'trained'
  | 'competent'
  | 'trainer';

/** Mirrors public.skill_stage_rank(). Used for ordering and for "at least" comparisons. */
export const STAGE_RANK: Record<SkillStage, number> = {
  not_started: 0,
  reading_done: 1,
  trained: 2,
  competent: 3,
  trainer: 4,
};

export const STAGE_LABELS: Record<SkillStage, string> = {
  not_started: 'Not started',
  reading_done: 'Instructions read',
  trained: 'Trained (supervised)',
  competent: 'Competent (independent)',
  trainer: 'Trainer',
};

export const STAGE_SHORT: Record<SkillStage, string> = {
  not_started: '—',
  reading_done: 'Read',
  trained: 'Trained',
  competent: 'Competent',
  trainer: 'Trainer',
};

/**
 * Tailwind classes per stage. Deliberately not red/green only - "trained" is a real,
 * valid state and should not read as a failure.
 */
export const STAGE_CLASSES: Record<SkillStage, string> = {
  not_started: 'bg-muted text-muted-foreground',
  reading_done: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  trained: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  competent: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  trainer: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
};

export type RiskLevel = 'standard' | 'high' | 'critical';

export const RISK_CLASSES: Record<RiskLevel, string> = {
  standard: 'bg-muted text-muted-foreground',
  high: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  critical: 'bg-destructive/15 text-destructive',
};

export interface ReadingRef {
  label: string;
  url: string;
  kind?: string;
}

export interface SkillCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

export interface Skill {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  summary: string | null;
  instructionsMd: string | null;
  instructionsVersion: number;
  readingRefs: ReadingRef[];
  requiresReading: boolean;
  requiresPractical: boolean;
  /** ?? not ||: 0 months would be a real value and `0 || undefined` erases it. */
  estTrainMinutes?: number;
  recertMonths?: number;
  externalRef: string | null;
  riskLevel: RiskLevel;
  sortOrder: number;
  active: boolean;
}

export interface ChecklistItem {
  id: string;
  skillId: string;
  sortOrder: number;
  itemText: string;
  isCritical: boolean;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  stage: SkillStage;
  readingAckAt: string | null;
  readingAckVersion?: number;
  signedOffAt: string | null;
  signedOffBy: string | null;
  expiresAt: string | null;
  notes: string | null;
}

export interface SkillSignoff {
  id: string;
  userId: string;
  skillId: string;
  signedBy: string;
  stageGranted: SkillStage;
  observedAt: string;
  checklistResults: SignoffChecklistResult[];
  prereqsWaived: boolean;
  waiverReason: string | null;
  comments: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
}

export interface SignoffChecklistResult {
  item_id: string;
  item_text: string;
  passed: boolean;
  comment?: string;
}

export interface SkillTrack {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

/** True when the row has an expiry that has already passed. */
export const isExpired = (expiresAt: string | null | undefined): boolean =>
  !!expiresAt && new Date(expiresAt).getTime() <= Date.now();

/** Days until expiry, or null when the row never expires. Negative when already lapsed. */
export const daysUntilExpiry = (expiresAt: string | null | undefined): number | null => {
  if (!expiresAt) return null;
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
};

/**
 * The effective stage for display. An expired sign-off keeps its stage in the database on
 * purpose - nothing is silently auto-downgraded, because silent state changes are exactly
 * the failure mode the July 2026 audit was about - so the UI is what surfaces the lapse.
 */
export const isLapsed = (us: Pick<UserSkill, 'stage' | 'expiresAt'> | undefined): boolean =>
  !!us && STAGE_RANK[us.stage] >= STAGE_RANK.trained && isExpired(us.expiresAt);

export const recertLabel = (months?: number): string => {
  if (months === undefined || months === null) return 'No expiry';
  if (months === 3) return 'Quarterly';
  if (months === 6) return 'Every 6 months';
  if (months === 12) return 'Annual';
  if (months === 24) return 'Every 2 years';
  if (months === 36) return 'Every 3 years';
  return `Every ${months} months`;
};

/**
 * Minimal markdown renderer for skill instructions.
 *
 * Deliberately hand-rolled rather than adding react-markdown: this app has no markdown
 * dependency today and the seeded instruction text only uses bold, italic, inline code,
 * bullet and numbered lists, and simple pipe tables. Everything is HTML-escaped FIRST, so
 * the output is safe to feed to dangerouslySetInnerHTML - the only tags in the result are
 * the ones this function emits.
 */
export const renderSkillMarkdown = (src: string | null | undefined): string => {
  if (!src) return '';

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\w*])\*(?!\s)([^*]+?)(?<!\s)\*(?![\w*])/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-[0.85em]">$1</code>');

  const out: string[] = [];
  let inTable = false;
  let inList = false;
  let listTag: 'ul' | 'ol' = 'ul';

  const closeList = () => {
    if (inList) {
      out.push(`</${listTag}>`);
      inList = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push('</tbody></table></div>');
      inTable = false;
    }
  };

  for (const raw of esc(src).split('\n')) {
    const line = raw.trim();

    // pipe table
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator row
      closeList();
      if (!inTable) {
        out.push(
          '<div class="overflow-x-auto my-3"><table class="w-full text-sm border-collapse"><tbody>'
        );
        inTable = true;
        out.push(
          '<tr class="border-b bg-muted/50">' +
            cells.map((c) => `<th class="text-left py-2 px-3 font-semibold">${inline(c)}</th>`).join('') +
            '</tr>'
        );
        continue;
      }
      out.push(
        '<tr class="border-b">' +
          cells.map((c) => `<td class="py-2 px-3 align-top">${inline(c)}</td>`).join('') +
          '</tr>'
      );
      continue;
    }
    closeTable();

    const bullet = /^-\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const wantTag: 'ul' | 'ol' = bullet ? 'ul' : 'ol';
      if (inList && listTag !== wantTag) closeList();
      if (!inList) {
        listTag = wantTag;
        out.push(
          `<${listTag} class="${
            listTag === 'ul' ? 'list-disc' : 'list-decimal'
          } pl-5 space-y-1 my-2">`
        );
        inList = true;
      }
      out.push(`<li>${inline((bullet ?? numbered)![1])}</li>`);
      continue;
    }
    closeList();

    if (!line) continue;
    out.push(`<p class="my-2">${inline(line)}</p>`);
  }
  closeList();
  closeTable();
  return out.join('\n');
};
