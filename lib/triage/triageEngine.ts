// Pure functions: no React, no Firebase. Safe to unit-test and to reuse on the nurse dashboard.
import type {
  Answers, Category, ClinicOption, Complaint, Cond, Level, QueueEntry, Range, TriageResult, Vitals,
} from "./types";

export const LEVEL_RANK: Record<Level, number> = { URGENT: 0, PRIORITY: 1, REGULAR: 2 };

const inRange = (v: number | undefined, r: Range) =>
  v !== undefined && Number.isFinite(v) &&
  (r.gt === undefined || v > r.gt) && (r.gte === undefined || v >= r.gte) &&
  (r.lt === undefined || v < r.lt) && (r.lte === undefined || v <= r.lte);

export type Ctx = { answers: Answers; pain: number | null; vitals?: Vitals; age?: number };

export function matches(c: Cond, x: Ctx): boolean {
  if ("all" in c) return c.all.every((s) => matches(s, x));
  if ("any" in c) return c.any.some((s) => matches(s, x));
  if ("not" in c) return !matches(c.not, x);
  if ("pain" in c) return x.pain !== null && c.pain.includes(x.pain);
  if ("age" in c) return inRange(x.age, c.age);
  if ("vital" in c) return inRange(x.vitals?.[c.vital], c);
  const a = x.answers[c.q];
  if ("is" in c) {
    const picked = Array.isArray(a) ? a : typeof a === "string" ? [a] : [];
    return c.is.some((id) => picked.includes(id));
  }
  return typeof a === "number" && inRange(a, c.num);
}

export function evaluateTriage(
  complaint: Complaint,
  answers: Answers,
  pain: number | null,
  vitals?: Vitals,
  age?: number,
): TriageResult {
  const ctx: Ctx = { answers, pain, vitals, age };
  const hits: { level: Level; reason: string }[] = [];

  for (const r of complaint.rules) if (matches(r.when, ctx)) hits.push({ level: r.level, reason: r.reason });

  if (complaint.pain && pain !== null) {
    if (complaint.pain.urgent.includes(pain)) hits.push({ level: "URGENT", reason: `Pain scale ${pain}/5` });
    else if (complaint.pain.priority.includes(pain)) hits.push({ level: "PRIORITY", reason: `Pain scale ${pain}/5` });
  }

  const base: Level = complaint.defaultLevel ?? "REGULAR";
  const level = hits.reduce<Level>((best, h) => (LEVEL_RANK[h.level] < LEVEL_RANK[best] ? h.level : best), base);
  const reasons = hits.filter((h) => h.level === level).map((h) => h.reason);
  if (reasons.length === 0) reasons.push(level === "REGULAR" ? "No red flags" : "Default level for this complaint");
  return { level, reasons };
}

// ─── QUEUE ────────────────────────────────────────────────────────────────────

export const QUEUE_CONFIG = {
  /** Move REGULAR patients up to PRIORITY after waiting this many minutes. null = off. */
  regularToPriorityAfterMin: null as number | null,
};

export function effectiveLevel(e: QueueEntry, now = Date.now()): Level {
  const m = QUEUE_CONFIG.regularToPriorityAfterMin;
  if (e.level === "REGULAR" && m !== null && (now - e.arrivedAt) / 60000 >= m) return "PRIORITY";
  return e.level;
}

/** URGENT first, then PRIORITY, then REGULAR; first-come-first-served inside each level. */
export function sortQueue(entries: QueueEntry[], now = Date.now()): QueueEntry[] {
  return [...entries].sort(
    (a, b) =>
      LEVEL_RANK[effectiveLevel(a, now)] - LEVEL_RANK[effectiveLevel(b, now)] ||
      a.arrivedAt - b.arrivedAt ||
      a.id.localeCompare(b.id),
  );
}

export function buildQueues(entries: QueueEntry[], now = Date.now()): Record<ClinicOption, QueueEntry[]> {
  const out: Record<ClinicOption, QueueEntry[]> = {
    "General Surgery": [], "Internal Medicine": [], "OB-GYNE": [], Pediatrics: [],
  };
  for (const e of sortQueue(entries, now)) out[e.clinic].push(e);
  return out;
}

/** 1-based position of a patient inside their own clinic's queue (0 if not found). */
export function queuePosition(entries: QueueEntry[], id: string, now = Date.now()): number {
  const me = entries.find((e) => e.id === id);
  if (!me) return 0;
  return buildQueues(entries, now)[me.clinic].findIndex((e) => e.id === id) + 1;
}

// ─── DATA CHECK (run after editing clinicRouting.data.ts) ─────────────────────

/** Returns a list of mistakes in the data file: unknown question ids, unknown option ids, duplicates. */
export function validateRouting(categories: Category[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();

  const walk = (c: Cond, cc: Complaint) => {
    if ("all" in c) return c.all.forEach((s) => walk(s, cc));
    if ("any" in c) return c.any.forEach((s) => walk(s, cc));
    if ("not" in c) return walk(c.not, cc);
    if ("pain" in c) {
      if (!cc.pain) errs.push(`${cc.id}: a rule uses pain but the complaint has no pain scale`);
      return;
    }
    if ("age" in c || "vital" in c) return;
    const q = cc.questions.find((x) => x.id === c.q);
    if (!q) return void errs.push(`${cc.id}: rule uses unknown question "${c.q}"`);
    if ("is" in c) {
      if (q.type === "count") return void errs.push(`${cc.id}: "${c.q}" is a count question, use n()`);
      for (const id of c.is)
        if (!q.options.some((o) => o.id === id)) errs.push(`${cc.id}: question "${c.q}" has no option "${id}"`);
    } else if (q.type !== "count") errs.push(`${cc.id}: "${c.q}" is not a count question`);
  };

  for (const cat of categories)
    for (const cc of cat.complaints) {
      if (seen.has(cc.id)) errs.push(`Duplicate complaint id ${cc.id}`);
      seen.add(cc.id);
      const qids = new Set<string>();
      for (const q of cc.questions) {
        if (qids.has(q.id)) errs.push(`${cc.id}: duplicate question id "${q.id}"`);
        qids.add(q.id);
      }
      cc.rules.forEach((r) => walk(r.when, cc));
    }
  return errs;
}