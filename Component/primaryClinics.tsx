'use client';
import React, { useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import { CATEGORIES, PAIN_SCALE } from "@/lib/triage/clinicRouting.data";
import { evaluateTriage, LEVEL_RANK, validateRouting } from "@/lib/triage/triageEngine";
import { textForLanguage } from "@/lib/triage/cebuano";
import type {
  Answers, Category, ClinicOption, Complaint, CountQuestion, Level, Question, Vitals,
} from "@/lib/triage/types";

export type { ClinicOption, Level };

// Dev-only: catches typos in clinicRouting.data.ts (unknown question/option ids, duplicates)
if (process.env.NODE_ENV !== "production") {
  const errs = validateRouting(CATEGORIES);
  if (errs.length) console.error("[BICA] clinicRouting.data.ts problems:\n" + errs.join("\n"));
}

type StepKey = "category" | "complaint" | "details" | "severity";
type Raw = Record<string, string | string[]>; // UI state: count answers are kept as strings while typing

export interface PrimaryClinicsPayload {
  group_id: string;
  group_label: string;
  cc_id: string;
  cc_label: string;
  cc_label_cebuano: string;
  sub_id: string;
  sub_label: string;
  system_value: string;
  clinic: ClinicOption;
  /** every answer: single = option id, multi = option ids, count = number */
  answers: Answers;
  /** pain scale 1-5, null when the complaint has no pain scale (name kept for compatibility) */
  severity: number | null;
  severity_label: string;
  summary_text: string;
  // ── triage / queue (hidden from the patient) ──
  triage_level: Level;
  triage_rank: number; // 0 urgent, 1 priority, 2 regular — sort ascending, then queued_at
  triage_reasons: string[];
  queued_at: string;   // ISO
}

const stepsFor = (c: Complaint | null): StepKey[] => [
  "category", "complaint", "details", ...(c?.pain ? (["severity"] as StepKey[]) : []),
];

const toAnswers = (c: Complaint, raw: Raw): Answers =>
  Object.fromEntries(
    c.questions.filter((q) => raw[q.id] !== undefined).map((q) => [q.id, q.type === "count" ? Number(raw[q.id]) : raw[q.id]]),
  ) as Answers;

const isAnswered = (q: Question, raw: Raw) =>
  q.type === "count" ? (raw[q.id] as string | undefined) !== undefined && raw[q.id] !== "" : raw[q.id] !== undefined &&
    (q.type === "multi" || raw[q.id] !== "");

const selectedText = (q: Question, raw: Raw): string => {
  const v = raw[q.id];
  if (v === undefined) return "";
  if (q.type === "count") return v === "" ? "" : `${q.short}: ${v} ${q.unit}`;
  const ids = Array.isArray(v) ? v : [v];
  return ids.map((id) => q.options.find((o) => o.id === id)?.label ?? id).join(", ");
};

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumb({
  steps, current, category, complaint, onNavigate, language,
}: {
  steps: StepKey[]; current: StepKey; category: Category | null; complaint: Complaint | null;
  onNavigate: (step: StepKey) => void; language: KioskLanguage;
}) {
  const labels: Record<StepKey, string> = {
    category: textForLanguage(category?.shortLabel ?? "Concern Area", language),
    complaint: textForLanguage(complaint?.label ?? "Chief Complaint", language),
    details: textForLanguage("Questions", language),
    severity: textForLanguage("Pain level", language),
  };
  const activeIdx = steps.indexOf(current);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        const tone = done ? "border-emerald-500 bg-emerald-950 text-emerald-400"
          : active ? "border-orange-300 bg-cyan-950 text-orange-200" : "border-cyan-800 text-cyan-600";
        return (
          <React.Fragment key={s}>
            {done ? (
              <button type="button" onClick={() => onNavigate(s)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold hover:underline ${tone}`}>
                ✓ {labels[s]}
              </button>
            ) : (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{labels[s]}</span>
            )}
            {i < steps.length - 1 && <span className="text-sm text-cyan-700">›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SummaryRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-cyan-800 pt-2 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase text-cyan-500">{title}</p>
      <div className="mt-0.5 text-sm font-bold text-orange-200">{children}</div>
    </div>
  );
}

function SummaryPanel({
  category, complaint, raw, pain, language,
}: { category: Category | null; complaint: Complaint | null; raw: Raw; pain: number | null; language: KioskLanguage }) {
  const sev = PAIN_SCALE.find((s) => s.value === pain);
  const lines = (complaint?.questions ?? []).map((q) => selectedText(q, raw)).filter(Boolean);
  return (
    <div className="w-56 flex-shrink-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white">{textForLanguage("Your Selections", language)}</p>
      <div className="flex min-h-[12rem] flex-col gap-3 rounded-xl border border-cyan-800 bg-cyan-950 p-4">
        {!category && <p className="text-xs italic text-cyan-600">{textForLanguage("No selection yet.", language)}</p>}
        {category && <SummaryRow title={textForLanguage("Concern", language)}>{category.icon} {textForLanguage(category.shortLabel, language)}</SummaryRow>}
        {complaint && <SummaryRow title={textForLanguage("Complaint", language)}>{textForLanguage(complaint.label, language)}</SummaryRow>}
        {lines.length > 0 && (
          <SummaryRow title={textForLanguage("Details", language)}>
            <ul className="space-y-0.5 font-semibold">
              {lines.map((l) => <li key={l}>{l.split(", ").map((p) => textForLanguage(p, language)).join(", ")}</li>)}
            </ul>
          </SummaryRow>
        )}
        {sev && <SummaryRow title={textForLanguage("Pain level", language)}>{sev.emoji} {textForLanguage(sev.label, language)}</SummaryRow>}
      </div>
    </div>
  );
}

// ─── STEP: CATEGORY ──────────────────────────────────────────────────────────
function StepCategory({ onSelect, language }: { onSelect: (c: Category) => void; language: KioskLanguage }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("What is the problem about?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Choose the group that best describes your concern.", language)}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" onClick={() => onSelect(c)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-6 py-7 text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]">
            <p className="mb-2 text-4xl">{c.icon}</p>
            <p className="text-xl font-bold text-white group-hover:text-orange-100">{textForLanguage(c.label, language)}</p>
            <p className="mt-1 text-sm text-cyan-400 group-hover:text-cyan-300">{textForLanguage(c.description, language)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP: COMPLAINT ─────────────────────────────────────────────────────────
function StepComplaint({ category, onSelect, language }: { category: Category; onSelect: (c: Complaint) => void; language: KioskLanguage }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{category.icon} {textForLanguage(category.label, language)}</p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("What is your main complaint?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Choose the one that bothers you the most.", language)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {category.complaints.map((c) => (
          <button key={c.id} type="button" onClick={() => onSelect(c)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-5 py-5 text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]">
            <p className="text-base font-bold leading-snug text-white group-hover:text-orange-100">{textForLanguage(c.label, language)}</p>
            {c.sublabel && <p className="mt-0.5 text-sm text-cyan-400 group-hover:text-cyan-300">{textForLanguage(c.sublabel, language)}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP: QUESTIONS (generated from the data file) ──────────────────────────
const numberInputClass =
  "w-44 rounded-xl border-2 border-cyan-700 bg-cyan-950 px-4 py-3 text-3xl font-bold text-white " +
  "placeholder:text-cyan-700 focus:border-orange-300 focus:outline-none";

function NumberKeypad({
  q, value, onChange, onClose, language,
}: { q: CountQuestion; value: string; onChange: (v: string) => void; onClose: () => void; language: KioskLanguage }) {
  const en = language === "en";
  const append = (d: string) => {
    if (d === ".") {
      if (!q.decimal || value.includes(".")) return;
      return onChange(`${value || "0"}.`);
    }
    const [whole, fraction] = value.split(".");
    if (whole.length >= 3 || (fraction !== undefined && fraction.length >= 1)) return;
    onChange(`${value}${d}`);
  };
  const key = "min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300";
  return (
    <section className="mt-4 max-w-sm rounded-xl border border-cyan-600 bg-cyan-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-white">{en ? "Number Keypad" : "Keypad sa Numero"}</h3>
        <button type="button" onClick={onClose} className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
          {en ? "Done" : "Human"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => append(d)} className={key}>{d}</button>
        ))}
        <button type="button" onClick={() => onChange("")} className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500">
          {en ? "Clear" : "Haw-asa"}
        </button>
        <button type="button" onClick={() => append("0")} className={key}>0</button>
        {q.decimal ? (
          <button type="button" onClick={() => append(".")} className={key}>.</button>
        ) : (
          <button type="button" onClick={() => onChange(value.slice(0, -1))}
            aria-label={en ? "Delete last digit" : "Tangtanga ang kataposang numero"}
            className="min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600">⌫</button>
        )}
        {q.decimal && (
          <button type="button" onClick={() => onChange(value.slice(0, -1))}
            aria-label={en ? "Delete last digit" : "Tangtanga ang kataposang numero"}
            className="col-span-3 min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600">⌫</button>
        )}
      </div>
    </section>
  );
}

function StepQuestions({
  complaint, raw, onChange, language,
}: { complaint: Complaint; raw: Raw; onChange: (id: string, v: string | string[]) => void; language: KioskLanguage }) {
  const [keypadFor, setKeypadFor] = useState<string | null>(null);
  const optionClass = (on: boolean) =>
    `cursor-pointer rounded-xl border-2 px-4 py-3 text-left text-base font-bold transition-all ${on
      ? "border-orange-300 bg-orange-300/20 text-orange-100 ring-2 ring-orange-300"
      : "border-cyan-800 bg-cyan-950 text-white hover:border-orange-300 hover:bg-[#0e4f68]"}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{textForLanguage(complaint.label, language)}</p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("Tell us a little more", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Answer each question below.", language)}</p>
      </div>

      {complaint.questions.map((q) => (
        <div key={q.id} className="rounded-xl border-2 border-cyan-800 bg-cyan-900 p-5">
          <p className="mb-3 text-lg font-bold text-white">{textForLanguage(q.text, language)}</p>

          {q.type === "count" && (
            <>
              <div className="flex items-center gap-3">
                <input type="text" inputMode="none" readOnly value={(raw[q.id] as string) ?? ""}
                  onClick={() => setKeypadFor(q.id)} placeholder={textForLanguage("Tap to enter", language)}
                  aria-label={textForLanguage(q.text, language)} className={numberInputClass} />
                <span className="text-xl font-semibold text-cyan-300">{textForLanguage(q.unit, language)}</span>
              </div>
              {keypadFor === q.id && (
                <NumberKeypad q={q} value={(raw[q.id] as string) ?? ""} onChange={(v) => onChange(q.id, v)}
                  onClose={() => setKeypadFor(null)} language={language} />
              )}
            </>
          )}

          {q.type === "single" && (
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((o) => (
                <button key={o.id} type="button" onClick={() => onChange(q.id, o.id)} className={optionClass(raw[q.id] === o.id)}>
                  <span className="flex items-center justify-between gap-2">
                    <span>{textForLanguage(o.label, language)}</span>{raw[q.id] === o.id && <span>✓</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

          {q.type === "multi" && (
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((o) => {
                const sel = (raw[q.id] as string[] | undefined) ?? [];
                const on = sel.includes(o.id);
                return (
                  <button key={o.id} type="button" className={optionClass(on)}
                    onClick={() => onChange(q.id, on ? sel.filter((x) => x !== o.id) : [...sel, o.id])}>
                    <span className="flex items-center justify-between gap-2">
                      <span>{textForLanguage(o.label, language)}</span>{on && <span>✓</span>}
                    </span>
                  </button>
                );
              })}
              <button type="button" onClick={() => onChange(q.id, [])}
                className={optionClass(Array.isArray(raw[q.id]) && (raw[q.id] as string[]).length === 0)}>
                {textForLanguage("None of these", language)}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── STEP: PAIN SCALE ────────────────────────────────────────────────────────
function StepPain({
  complaint, pain, onSelect, language,
}: { complaint: Complaint; pain: number | null; onSelect: (v: number) => void; language: KioskLanguage }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{textForLanguage(complaint.label, language)}</p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("How bad is the pain right now?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Tap the face that matches how you feel.", language)}</p>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {PAIN_SCALE.map((s) => {
          const on = pain === s.value;
          return (
            <button key={s.value} type="button" onClick={() => onSelect(s.value)}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-2 py-6 transition-all ${on
                ? "scale-105 border-orange-300 bg-orange-300/20 ring-2 ring-orange-300"
                : "border-cyan-800 bg-cyan-950 hover:border-orange-300 hover:bg-[#0e4f68]"}`}>
              <span className="text-6xl leading-none">{s.emoji}</span>
              <span className={`text-sm font-bold ${on ? "text-orange-100" : "text-cyan-300"}`}>{textForLanguage(s.label, language)}</span>
              <span className="px-1 text-center text-xs text-cyan-400">{textForLanguage(s.hint, language)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface PrimaryClinicsProps {
  language: KioskLanguage;
  /** measured on the previous kiosk steps; used by rules like "SpO2 below 90" */
  vitals?: Vitals;
  /** patient age in years; used by rules that depend on age */
  patientAge?: number;
  onLogout?: () => void;
  onProceed?: (payload: PrimaryClinicsPayload) => void | Promise<void>;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function PrimaryClinics({
  language, vitals, patientAge, onLogout, onProceed, onNavigateStep, onNavigateVitalPart,
}: PrimaryClinicsProps) {
  const [stepKey, setStepKey] = useState<StepKey>("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [raw, setRaw] = useState<Raw>({});
  const [pain, setPain] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const steps = stepsFor(complaint);
  const stepIdx = steps.indexOf(stepKey);

  const resetDetails = () => { setRaw({}); setPain(null); };
  const handleReset = () => { setStepKey("category"); setCategory(null); setComplaint(null); resetDetails(); };

  const selectCategory = (c: Category) => { setCategory(c); setComplaint(null); resetDetails(); setStepKey("complaint"); };
  const selectComplaint = (c: Complaint) => { setComplaint(c); resetDetails(); setStepKey("details"); };

  const detailsValid = !!complaint && complaint.questions.every((q) => isAnswered(q, raw));
  const canContinue = stepKey === "details" ? detailsValid : stepKey === "severity" ? pain !== null : false;
  const isLastStep = stepIdx === steps.length - 1;

  const handleContinue = () => {
    if (!canContinue) return;
    if (isLastStep) { handleProceed(); return; }
    setStepKey(steps[stepIdx + 1]);
  };

  const handleWizardNavigate = (target: StepKey) => {
    if (steps.indexOf(target) >= stepIdx) return;
    if (target === "category") { setCategory(null); setComplaint(null); resetDetails(); }
    else if (target === "complaint") { setComplaint(null); resetDetails(); }
    setStepKey(target);
  };

  const handleProceed = async () => {
    if (!category || !complaint) return;
    const answers = toAnswers(complaint, raw);
    const painInfo = PAIN_SCALE.find((s) => s.value === pain);
    const triage = evaluateTriage(complaint, answers, pain, vitals, patientAge);

    const summaryParts = [
      complaint.label,
      ...complaint.questions.map((q) => selectedText(q, raw)).filter(Boolean),
      ...(painInfo ? [`Pain: ${painInfo.label} (${painInfo.value}/5)`] : []),
    ];

    const payload: PrimaryClinicsPayload = {
      group_id: category.id,
      group_label: category.shortLabel,
      cc_id: complaint.id,
      cc_label: complaint.label,
      cc_label_cebuano: textForLanguage(complaint.label, "ceb"),
      sub_id: "",
      sub_label: "",
      system_value: complaint.systemValue,
      clinic: category.clinic,
      answers,
      severity: painInfo?.value ?? null,
      severity_label: painInfo?.label ?? "",
      summary_text: summaryParts.join(" · "),
      triage_level: triage.level,
      triage_rank: LEVEL_RANK[triage.level],
      triage_reasons: triage.reasons,
      queued_at: new Date().toISOString(),
    };

    console.log("BICA Payload → ML Model / Queue:", JSON.stringify(payload, null, 2));
    if (onProceed) {
      setIsSubmitting(true);
      setSubmissionError("");
      try {
        await onProceed(payload);
      } catch (error) {
        setSubmissionError(error instanceof Error ? error.message : "Could not save the patient record.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert(`Routing to: ${payload.clinic} (${payload.triage_level})\n${payload.summary_text}`);
    }
  };

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col font-sans">
      <KioskHeader language={language} activeStep={6} onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart} onLogout={onLogout} />

      <div className="flex flex-1 flex-col items-center gap-6 bg-cyan-950 px-4 py-8">
        <div className="text-center">
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-orange-300">{textForLanguage("Chief Complaints", language)}</p>
          <h1 className="text-4xl font-bold text-white">{textForLanguage("Tell us about your concern", language)}</h1>
        </div>

        <Breadcrumb steps={steps} current={stepKey} category={category} complaint={complaint}
          onNavigate={handleWizardNavigate} language={language} />

        <div className="flex w-[72rem] max-w-full flex-row gap-6 rounded-2xl bg-cyan-900 px-8 py-8">
          <div className="min-w-0 flex-1">
            {stepKey === "category" && <StepCategory onSelect={selectCategory} language={language} />}
            {stepKey === "complaint" && category && <StepComplaint category={category} onSelect={selectComplaint} language={language} />}
            {stepKey === "details" && complaint && (
              <StepQuestions complaint={complaint} raw={raw} language={language}
                onChange={(id, v) => setRaw((prev) => ({ ...prev, [id]: v }))} />
            )}
            {stepKey === "severity" && complaint && <StepPain complaint={complaint} pain={pain} onSelect={setPain} language={language} />}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <SummaryPanel category={category} complaint={complaint} raw={raw} pain={pain} language={language} />
            <div className="mt-4 flex flex-col gap-2">
              {submissionError && (
                <p role="alert" className="rounded-lg border border-red-700 bg-red-950/60 px-3 py-2 text-sm text-red-200">
                  {language === "en" ? submissionError : textForLanguage(submissionError, language)}
                </p>
              )}
              {(stepKey === "details" || stepKey === "severity") && (
                <button type="button" disabled={!canContinue || isSubmitting} onClick={handleContinue}
                  className={`rounded-xl px-5 py-3 text-base font-bold transition-all ${canContinue && !isSubmitting
                    ? "cursor-pointer bg-orange-50 text-cyan-950 hover:bg-orange-100"
                    : "cursor-not-allowed bg-cyan-800 text-cyan-500"}`}>
                  {isSubmitting ? textForLanguage("Saving patient…", language)
                    : textForLanguage(isLastStep ? "Proceed →" : "Continue →", language)}
                </button>
              )}
              <button type="button" onClick={handleReset}
                className="mt-1 cursor-pointer text-center text-xs text-cyan-600 hover:text-cyan-400 hover:underline">
                {textForLanguage("Start over", language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}