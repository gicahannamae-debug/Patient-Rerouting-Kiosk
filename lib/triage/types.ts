// Shared types for the BICA triage data + engine.
// You normally never edit this file — edit clinicRouting.data.ts instead.

export type Level = "URGENT" | "PRIORITY" | "REGULAR";
export type ClinicOption = "General Surgery" | "Internal Medicine" | "OB-GYNE" | "Pediatrics";

export type VitalKey = "temp" | "spo2" | "systolic" | "diastolic" | "glucose";
export type Vitals = Partial<Record<VitalKey, number>>;

export type Option = { id: string; label: string };

/** Tap one option. */
export type SingleQuestion = { id: string; text: string; type: "single"; options: Option[] };
/** Tap any number of options (or "None of these"). */
export type MultiQuestion = { id: string; text: string; type: "multi"; options: Option[] };
/** Keypad number ("how many times / pads / kg"). */
export type CountQuestion = {
  id: string; text: string; type: "count";
  unit: string;   // shown next to the box, e.g. "times"
  short: string;  // short label for the summary, e.g. "Loose stools today"
  decimal?: boolean;
};
export type Question = SingleQuestion | MultiQuestion | CountQuestion;

export type Range = { gt?: number; gte?: number; lt?: number; lte?: number };

/** A condition the engine can test. Combine with all / any / not. */
export type Cond =
  | { q: string; is: string[] }        // single/multi: any of these option ids was chosen
  | { q: string; num: Range }          // count question is within range
  | { pain: number[] }                 // pain scale value is one of these (1-5)
  | ({ vital: VitalKey } & Range)      // measured vital sign (from the kiosk vitals step)
  | { age: Range }                     // patient age in years
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond };

export type Rule = { level: "URGENT" | "PRIORITY"; reason: string; when: Cond };

/** Which pain-scale values (1-5) escalate on their own. */
export type PainRule = { urgent: number[]; priority: number[] };

export type Complaint = {
  id: string;
  label: string;
  sublabel?: string;
  systemValue: string;
  questions: Question[];
  /** Show the 1-5 pain scale step. Omit for complaints that have no pain scale. */
  pain?: PainRule;
  /** Level when no rule matches. Defaults to REGULAR. */
  defaultLevel?: Level;
  /** Highest matching level wins (URGENT > PRIORITY > REGULAR). */
  rules: Rule[];
};

export type Category = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  clinic: ClinicOption;
  complaints: Complaint[];
};

export type Answers = Record<string, string | string[] | number>;

export type TriageResult = {
  level: Level;
  /** Why it got this level (rules that matched at the winning level). */
  reasons: string[];
};

export type QueueEntry = {
  id: string;
  clinic: ClinicOption;
  level: Level;
  /** ms since epoch when the patient was queued */
  arrivedAt: number;
};
