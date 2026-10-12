'use client';
import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ClinicOption = "General Surgery" | "Internal Medicine" | "OB-GYNE" | "Pediatrics";

type StepKey = "category" | "complaint" | "details" | "pain" | "severity";
type DurationUnit = "hours" | "days" | "weeks" | "months";

type PainSet =
  | "abdomen" | "chest" | "head" | "breast" | "neck" | "flank"
  | "groin" | "pelvic" | "ear" | "joints" | "urinary" | "foot" | "injury";

/** A "how many?" question that is specific to the complaint (empty input) */
type NumberField = {
  id: string;
  label: string;    // short label used in the summary
  question: string; // what the patient sees
  unit: string;     // e.g. "times", "pads", "kg"
};

type Complaint = {
  id: string;
  label: string;
  sublabel?: string;
  systemValue: string;
  durationQuestion: string; // "How long has the fever been going on?"
  extras?: NumberField[];   // "How many times ...?"
  pain?: PainSet;           // if set, the "location" step is shown
};

type Category = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  clinic: ClinicOption;
  complaints: Complaint[];
};

export interface PrimaryClinicsPayload {
  group_id: string;
  group_label: string;
  cc_id: string;
  cc_label: string;
  sub_id: string;
  sub_label: string;
  system_value: string;
  clinic: ClinicOption;
  answers: Record<string, boolean>; // kept empty for compatibility
  duration_value: number;
  duration_unit: DurationUnit;
  duration_text: string;
  extras: Record<string, number>;
  pain_locations: string[];
  severity: number; // 1 (very mild) to 5 (very severe)
  severity_label: string;
  summary_text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const PAIN_LOCATIONS: Record<PainSet, string[]> = {
  abdomen: [
    "Upper right belly", "Upper middle (stomach area)", "Upper left belly",
    "Around the belly button", "Lower right belly", "Lower middle belly",
    "Lower left belly", "All over the belly",
  ],
  chest: [
    "Center of the chest", "Left side of the chest", "Right side of the chest",
    "Spreads to arm, neck, or jaw", "Back",
  ],
  head: ["Forehead", "One side of the head", "Back of the head", "Whole head"],
  breast: ["Left breast", "Right breast", "Both breasts", "Nipple area"],
  neck: [
    "Front of the neck (thyroid area)", "Left side of the neck",
    "Right side of the neck", "Under the jaw or near the ear",
  ],
  flank: [
    "Lower back - left", "Lower back - right",
    "Side moving down to the groin", "Whole lower back",
  ],
  groin: ["Groin - left", "Groin - right", "Scrotum or testicles", "Upper thigh crease"],
  pelvic: [
    "Lower belly - center", "Lower belly - left",
    "Lower belly - right", "Deep inside the pelvis",
  ],
  ear: ["Left ear", "Right ear", "Both ears", "Behind the ear"],
  joints: [
    "Knee", "Shoulder", "Hip", "Back", "Hands or wrists",
    "Feet or ankles", "Muscles (arms or legs)",
  ],
  urinary: [
    "Burning when peeing", "Lower belly above the pubic bone",
    "Lower back or side", "Around the genital area",
  ],
  foot: ["Toes", "Sole of the foot", "Top of the foot", "Heel", "Ankle"],
  injury: [
    "Head or face", "Shoulder or arm", "Hand or wrist", "Hip or leg",
    "Knee", "Foot or ankle", "Back", "Chest or belly",
  ],
};

const other = (code: string): Complaint => ({
  id: `CC_${code}_OTHER`,
  label: "Other concern (not listed)",
  sublabel: "You can explain more to the nurse",
  systemValue: `${code}_OTHER`,
  durationQuestion: "How long has this been going on?",
});

const NIGHT_PEES: NumberField = {
  id: "night_pees",
  label: "Night-time peeing",
  question: "How many times do you wake up at night to pee?",
  unit: "times",
};

const CATEGORIES: Category[] = [
  // ═══════════════ CHILD HEALTH (PEDIATRICS) ═══════════════
  {
    id: "CAT_PEDIA",
    label: "Child Health",
    shortLabel: "Child Health",
    icon: "👶",
    description: "For patients under 19 years old",
    clinic: "Pediatrics",
    complaints: [
      {
        id: "CC_PED_FEVER", label: "Fever", sublabel: "Warm to touch or high temperature",
        systemValue: "PED_FEVER",
        durationQuestion: "How long has your child had the fever?",
      },
      {
        id: "CC_PED_COUGH", label: "Cough or difficulty breathing", sublabel: "Noisy breathing, cough, or colds",
        systemValue: "PED_COUGH",
        durationQuestion: "How long has your child been coughing or having trouble breathing?",
      },
      {
        id: "CC_PED_DIARRHEA", label: "Diarrhea or vomiting", sublabel: "Loose stools or throwing up",
        systemValue: "PED_DIARRHEA",
        durationQuestion: "How long has this been going on?",
        extras: [
          { id: "stools_today", label: "Loose stools today", question: "How many times did your child pass loose stool today?", unit: "times" },
          { id: "vomit_today", label: "Vomiting today", question: "How many times did your child vomit today?", unit: "times" },
          { id: "pees_24h", label: "Pees / wet diapers in 24h", question: "How many times did your child pee (or wet the diaper) in the last 24 hours?", unit: "times" },
        ],
      },
      {
        id: "CC_PED_TUMMY", label: "Tummy pain", sublabel: "Belly pain in a child",
        systemValue: "PED_TUMMY_PAIN",
        durationQuestion: "How long has the tummy pain lasted?",
        pain: "abdomen",
      },
      {
        id: "CC_PED_EAR", label: "Ear pain or ear discharge", sublabel: "Pain in the ear or fluid coming out",
        systemValue: "PED_EAR",
        durationQuestion: "How long has the ear problem been there?",
        pain: "ear",
      },
      {
        id: "CC_PED_RASH", label: "Skin rash", sublabel: "A new or spreading rash",
        systemValue: "PED_RASH",
        durationQuestion: "How long has the rash been there?",
      },
      {
        id: "CC_PED_NEWBORN", label: "Newborn concern (under 1 month)", sublabel: "For babies 0 to 28 days old",
        systemValue: "PED_NEWBORN",
        durationQuestion: "How long has this problem been going on?",
        extras: [
          { id: "baby_age", label: "Baby's age", question: "How many days old is the baby?", unit: "days" },
        ],
      },
      other("PED"),
    ],
  },

  // ═══════════════ WOMEN'S & PREGNANCY HEALTH (OB-GYNE) ═══════════════
  {
    id: "CAT_OBGYNE",
    label: "Women's & Pregnancy Health",
    shortLabel: "Women's Health",
    icon: "🤰",
    description: "Pregnancy, periods, and women's health concerns",
    clinic: "OB-GYNE",
    complaints: [
      {
        id: "CC_OB_PRENATAL", label: "Pregnancy check-up or concern", sublabel: "Prenatal visit or a problem while pregnant",
        systemValue: "OB_PRENATAL",
        durationQuestion: "How long have you been pregnant?",
      },
      {
        id: "CC_OB_BLEED_PREG", label: "Vaginal bleeding while pregnant", sublabel: "Any bleeding during pregnancy",
        systemValue: "OB_VAG_BLEED_PREG",
        durationQuestion: "How long have you been bleeding?",
        extras: [
          { id: "pads_24h", label: "Pads used in 24h", question: "How many pads have you used in the last 24 hours?", unit: "pads" },
        ],
      },
      {
        id: "CC_OB_BLEED", label: "Vaginal bleeding (not pregnant)", sublabel: "Heavy or unusual bleeding",
        systemValue: "OB_VAG_BLEED_NONPREG",
        durationQuestion: "How long have you been bleeding?",
        extras: [
          { id: "pads_24h", label: "Pads used in 24h", question: "How many pads have you used in the last 24 hours?", unit: "pads" },
        ],
      },
      {
        id: "CC_OB_AMENORRHEA", label: "Missed period", sublabel: "No period for one or more months",
        systemValue: "OB_AMENORRHEA",
        durationQuestion: "How long has it been since your last period?",
      },
      {
        id: "CC_OB_PELVIC_PAIN", label: "Lower belly or pelvic pain", sublabel: "Pain linked to the reproductive organs",
        systemValue: "OB_ABD_PAIN",
        durationQuestion: "How long have you had the pain?",
        pain: "pelvic",
      },
      {
        id: "CC_OB_DISCHARGE", label: "Vaginal discharge or itching", sublabel: "Change in color, smell, or texture",
        systemValue: "OB_VAG_DISC",
        durationQuestion: "How long have you noticed the discharge or itching?",
      },
      {
        id: "CC_OB_BREAST", label: "Breast lump or pain", sublabel: "A new lump or a change in the breast",
        systemValue: "OB_BREAST_LUMP",
        durationQuestion: "How long have you noticed it?",
        pain: "breast",
      },
      {
        id: "CC_OB_MENOPAUSE", label: "Menopause symptoms", sublabel: "Hot flashes, mood changes, or dryness",
        systemValue: "OB_MENOPAUSE",
        durationQuestion: "How long have you had these symptoms?",
      },
      other("OB"),
    ],
  },

  // ═══════════════ ADULT ILLNESS (INTERNAL MEDICINE) ═══════════════
  {
    id: "CAT_INTERNAL",
    label: "Adult Illness",
    shortLabel: "Adult Illness",
    icon: "🫀",
    description: "Fever, cough, heart, blood pressure, sugar, and other illness in adults",
    clinic: "Internal Medicine",
    complaints: [
      {
        id: "CC_IM_FEVER", label: "Fever", sublabel: "New or ongoing high temperature",
        systemValue: "IM_FEVER",
        durationQuestion: "How long have you had the fever?",
      },
      {
        id: "CC_IM_COUGH", label: "Cough or difficulty breathing", sublabel: "Cough or shortness of breath",
        systemValue: "IM_COUGH",
        durationQuestion: "How long have you been coughing or having trouble breathing?",
      },
      {
        id: "CC_IM_CHEST", label: "Chest discomfort or racing heart", sublabel: "Tightness, palpitations, irregular heartbeat",
        systemValue: "IM_CHEST_PALP",
        durationQuestion: "How long have you had the chest discomfort or racing heart?",
        pain: "chest",
      },
      {
        id: "CC_IM_HTN", label: "High blood pressure", sublabel: "Known or newly found",
        systemValue: "IM_HTN",
        durationQuestion: "How long have you had high blood pressure?",
      },
      {
        id: "CC_IM_DM", label: "Diabetes or high blood sugar", sublabel: "Very thirsty, peeing often, or sugar follow-up",
        systemValue: "IM_DIABETES",
        durationQuestion: "How long have you had diabetes or high sugar symptoms?",
        extras: [NIGHT_PEES],
      },
      {
        id: "CC_IM_HEADACHE", label: "Headache or dizziness", sublabel: "Head pain or feeling lightheaded",
        systemValue: "IM_HEADACHE",
        durationQuestion: "How long have you had the headache or dizziness?",
        pain: "head",
      },
      {
        id: "CC_IM_LEGS", label: "Swollen legs", sublabel: "Leg swelling, with or without shortness of breath",
        systemValue: "IM_SWOLLEN_LEGS",
        durationQuestion: "How long have your legs been swollen?",
      },
      {
        id: "CC_IM_JAUNDICE", label: "Yellow skin or eyes", sublabel: "Yellowing of the skin or whites of the eyes",
        systemValue: "IM_JAUNDICE",
        durationQuestion: "How long have you been yellow?",
      },
      {
        id: "CC_IM_WEIGHT", label: "Unexplained weight loss", sublabel: "Losing weight without trying",
        systemValue: "IM_WEIGHT_LOSS",
        durationQuestion: "Over how long have you been losing weight?",
        extras: [
          { id: "kg_lost", label: "Weight lost", question: "About how many kilograms have you lost?", unit: "kg" },
        ],
      },
      {
        id: "CC_IM_FOOT", label: "Diabetic foot wound", sublabel: "A sore or wound on the foot",
        systemValue: "IM_DIAB_FOOT",
        durationQuestion: "How long have you had the wound?",
        pain: "foot",
      },
      {
        id: "CC_IM_MSK", label: "Joint or muscle pain (no injury)", sublabel: "Pain without a recent fall or accident",
        systemValue: "IM_MSK",
        durationQuestion: "How long have you had the pain?",
        pain: "joints",
      },
      other("IM"),
    ],
  },

  // ═══════════════ LUMPS, INJURIES & BELLY PROBLEMS (SURGERY) ═══════════════
  {
    id: "CAT_SURG",
    label: "Lumps, Injuries & Belly Problems",
    shortLabel: "Surgical Concerns",
    icon: "🩹",
    description: "Belly pain, lumps or swelling, groin bulge, urinary problems, wounds and injuries",
    clinic: "General Surgery",
    complaints: [
      {
        id: "CC_GS_BELLY", label: "Stomach or belly pain", sublabel: "Pain anywhere in the belly",
        systemValue: "GS_ABD_PAIN",
        durationQuestion: "How long have you had the belly pain?",
        pain: "abdomen",
      },
      {
        id: "CC_GS_MASS", label: "Lump or swelling in the belly", sublabel: "A growth you can feel",
        systemValue: "GS_ABD_MASS",
        durationQuestion: "How long have you noticed the lump?",
        pain: "abdomen",
      },
      {
        id: "CC_GS_BREAST", label: "Breast lump or pain", sublabel: "Lump, pain, swelling, or nipple discharge",
        systemValue: "GS_BREAST_LUMP",
        durationQuestion: "How long have you noticed it?",
        pain: "breast",
      },
      {
        id: "CC_GS_NECK", label: "Lump or swelling in the neck", sublabel: "Thyroid area or other neck lumps",
        systemValue: "GS_NECK_LUMP",
        durationQuestion: "How long have you noticed the lump?",
        pain: "neck",
      },
      {
        id: "CC_GS_HERNIA", label: "Bulge in the groin or upper thigh", sublabel: "Possible hernia",
        systemValue: "GS_HERNIA",
        durationQuestion: "How long have you noticed the bulge?",
        pain: "groin",
      },
      {
        id: "CC_GS_SCROTAL", label: "Scrotal swelling or testicular pain", sublabel: "Swelling, heaviness, or pain",
        systemValue: "GS_SCROTAL_SWELLING",
        durationQuestion: "How long have you had the swelling or pain?",
        pain: "groin",
      },
      {
        id: "CC_GS_VOIDING", label: "Trouble peeing", sublabel: "Weak stream, frequent, or urgent",
        systemValue: "GS_VOIDING",
        durationQuestion: "How long have you had trouble peeing?",
        extras: [NIGHT_PEES],
        pain: "urinary",
      },
      {
        id: "CC_GS_HEMATURIA", label: "Blood in the urine", sublabel: "Red or brown urine",
        systemValue: "GS_HEMATURIA",
        durationQuestion: "How long have you seen blood in your urine?",
      },
      {
        id: "CC_GS_KIDNEY", label: "Severe back or side pain", sublabel: "Sharp pain that may move to the groin",
        systemValue: "GS_KIDNEY_STONE",
        durationQuestion: "How long have you had the pain?",
        pain: "flank",
      },
      {
        id: "CC_GS_INJURY", label: "Injury, wound, or burn", sublabel: "Cuts, falls, suspected broken bone",
        systemValue: "GS_INJURY",
        durationQuestion: "How long ago did the injury happen?",
        pain: "injury",
      },
      other("GS"),
    ],
  },
];

const DURATION_UNITS: { id: DurationUnit; label: string }[] = [
  { id: "hours", label: "Hours" },
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
];

const SEVERITY = [
  { value: 1, emoji: "😊", label: "Very mild" },
  { value: 2, emoji: "🙂", label: "Mild" },
  { value: 3, emoji: "😐", label: "Moderate" },
  { value: 4, emoji: "😣", label: "Severe" },
  { value: 5, emoji: "😭", label: "Very severe" },
];

const formatDuration = (value: string, unit: DurationUnit | "") => {
  if (!value || !unit) return "";
  const n = Number(value);
  const label = n === 1 ? unit.slice(0, -1) : unit;
  return `${n} ${label}`;
};

const stepsFor = (c: Complaint | null): StepKey[] => [
  "category",
  "complaint",
  "details",
  ...(c?.pain ? (["pain"] as StepKey[]) : []),
  "severity",
];

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="flex w-full items-center justify-between bg-yellow-50 px-8 py-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-cyan-950">BICA</h1>
        <p className="text-xs text-cyan-800">Better Informed Care Access</p>
      </div>
      <ul className="hidden space-x-6 text-sm font-semibold text-cyan-900 md:flex">
        <li><a href="#" className="hover:underline">Triage Form |</a></li>
        <li><a href="#" className="hover:underline">Vital Signs |</a></li>
        <li><a href="#" className="text-orange-600 underline">Chief Complaints |</a></li>
        <li><a href="#" className="hover:underline">Summary |</a></li>
      </ul>
    </nav>
  );
}

function Breadcrumb({
  steps, current, category, complaint,
}: { steps: StepKey[]; current: StepKey; category: Category | null; complaint: Complaint | null }) {
  const labels: Record<StepKey, string> = {
    category: category?.shortLabel ?? "Concern Area",
    complaint: complaint?.label ?? "Chief Complaint",
    details: "Duration",
    pain: "Location",
    severity: "Severity",
  };
  const activeIdx = steps.indexOf(current);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s}>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold
                ${done ? "border-emerald-500 bg-emerald-950 text-emerald-400"
                : active ? "border-orange-300 bg-cyan-950 text-orange-200"
                : "border-cyan-800 text-cyan-600"}`}
            >
              {done && "✓ "}{labels[s]}
            </span>
            {i < steps.length - 1 && <span className="text-sm text-cyan-700">›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SummaryPanel({
  category, complaint, durationText, extraLines, painLocations, severity,
}: {
  category: Category | null;
  complaint: Complaint | null;
  durationText: string;
  extraLines: string[];
  painLocations: string[];
  severity: number | null;
}) {
  const sev = SEVERITY.find((s) => s.value === severity);
  const Row = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-t border-cyan-800 pt-2 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase text-cyan-500">{title}</p>
      <div className="mt-0.5 text-sm font-bold text-orange-200">{children}</div>
    </div>
  );

  return (
    <div className="w-56 flex-shrink-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white">Your Selections</p>
      <div className="flex min-h-[12rem] flex-col gap-3 rounded-xl border border-cyan-800 bg-cyan-950 p-4">
        {!category && <p className="text-xs italic text-cyan-600">No selection yet.</p>}
        {category && <Row title="Concern">{category.icon} {category.shortLabel}</Row>}
        {complaint && <Row title="Complaint">{complaint.label}</Row>}
        {durationText && <Row title="Duration">{durationText}</Row>}
        {extraLines.length > 0 && (
          <Row title="Details">
            <ul className="space-y-0.5 font-semibold">
              {extraLines.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </Row>
        )}
        {painLocations.length > 0 && <Row title="Location">{painLocations.join(", ")}</Row>}
        {sev && <Row title="Severity">{sev.emoji} {sev.label}</Row>}
      </div>
    </div>
  );
}

// ─── STEP: CATEGORY ──────────────────────────────────────────────────────────
function StepCategory({ onSelect }: { onSelect: (c: Category) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-bold text-white">What is the problem about?</h2>
        <p className="mt-1 text-base text-cyan-300">Choose the group that best describes your concern.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-6 py-7 text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <p className="mb-2 text-4xl">{c.icon}</p>
            <p className="text-xl font-bold text-white group-hover:text-orange-100">{c.label}</p>
            <p className="mt-1 text-sm text-cyan-400 group-hover:text-cyan-300">{c.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP: COMPLAINT ─────────────────────────────────────────────────────────
function StepComplaint({ category, onSelect }: { category: Category; onSelect: (c: Complaint) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">
          {category.icon} {category.label}
        </p>
        <h2 className="text-3xl font-bold text-white">What is your main complaint?</h2>
        <p className="mt-1 text-base text-cyan-300">Choose the one that bothers you the most.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {category.complaints.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-5 py-5 text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <p className="text-base font-bold leading-snug text-white group-hover:text-orange-100">{c.label}</p>
            {c.sublabel && <p className="mt-0.5 text-sm text-cyan-400 group-hover:text-cyan-300">{c.sublabel}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP: DETAILS (duration + how many) ─────────────────────────────────────
const numberInputClass =
  "w-44 rounded-xl border-2 border-cyan-700 bg-cyan-950 px-4 py-3 text-3xl font-bold text-white " +
  "placeholder:text-cyan-700 focus:border-orange-300 focus:outline-none";

function StepDetails({
  complaint, durationValue, durationUnit, extras,
  onDurationValue, onDurationUnit, onExtra,
}: {
  complaint: Complaint;
  durationValue: string;
  durationUnit: DurationUnit | "";
  extras: Record<string, string>;
  onDurationValue: (v: string) => void;
  onDurationUnit: (u: DurationUnit) => void;
  onExtra: (id: string, v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{complaint.label}</p>
        <h2 className="text-3xl font-bold text-white">Tell us a little more</h2>
        <p className="mt-1 text-base text-cyan-300">Type a number to answer each question.</p>
      </div>

      {/* Duration */}
      <div className="rounded-xl border-2 border-cyan-800 bg-cyan-950 p-5">
        <p className="mb-3 text-lg font-bold text-white">{complaint.durationQuestion}</p>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={durationValue}
            onChange={(e) => onDurationValue(e.target.value)}
            placeholder="Number"
            className={numberInputClass}
          />
          <div className="flex flex-wrap gap-2">
            {DURATION_UNITS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onDurationUnit(u.id)}
                className={`cursor-pointer rounded-xl border-2 px-5 py-3 text-lg font-bold transition-all
                  ${durationUnit === u.id
                    ? "border-orange-300 bg-orange-300 text-cyan-950"
                    : "border-cyan-700 bg-cyan-900 text-white hover:border-orange-300"}`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* How many ... */}
      {complaint.extras?.map((f) => (
        <div key={f.id} className="rounded-xl border-2 border-cyan-800 bg-cyan-950 p-5">
          <p className="mb-3 text-lg font-bold text-white">{f.question}</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={extras[f.id] ?? ""}
              onChange={(e) => onExtra(f.id, e.target.value)}
              placeholder="Number"
              className={numberInputClass}
            />
            <span className="text-xl font-semibold text-cyan-300">{f.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── STEP: PAIN LOCATION ─────────────────────────────────────────────────────
function StepPain({
  complaint, selected, onToggle,
}: { complaint: Complaint; selected: string[]; onToggle: (loc: string) => void }) {
  const options = [...PAIN_LOCATIONS[complaint.pain!], "Other area"];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{complaint.label}</p>
        <h2 className="text-3xl font-bold text-white">Where is the pain or problem?</h2>
        <p className="mt-1 text-base text-cyan-300">Tap all the places that apply.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((loc) => {
          const on = selected.includes(loc);
          return (
            <button
              key={loc}
              type="button"
              onClick={() => onToggle(loc)}
              className={`cursor-pointer rounded-xl border-2 px-5 py-5 text-left text-lg font-bold transition-all
                ${on
                  ? "border-orange-300 bg-orange-300/20 text-orange-100 ring-2 ring-orange-300"
                  : "border-cyan-800 bg-cyan-950 text-white hover:border-orange-300 hover:bg-[#0e4f68]"}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{loc}</span>
                {on && <span>✓</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP: SEVERITY (emoticons) ──────────────────────────────────────────────
function StepSeverity({
  complaint, severity, onSelect,
}: { complaint: Complaint; severity: number | null; onSelect: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{complaint.label}</p>
        <h2 className="text-3xl font-bold text-white">How bad is it right now?</h2>
        <p className="mt-1 text-base text-cyan-300">Tap the face that matches how you feel.</p>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {SEVERITY.map((s) => {
          const on = severity === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onSelect(s.value)}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-2 py-6 transition-all
                ${on
                  ? "scale-105 border-orange-300 bg-orange-300/20 ring-2 ring-orange-300"
                  : "border-cyan-800 bg-cyan-950 hover:border-orange-300 hover:bg-[#0e4f68]"}`}
            >
              <span className="text-6xl leading-none">{s.emoji}</span>
              <span className={`text-sm font-bold ${on ? "text-orange-100" : "text-cyan-300"}`}>{s.label}</span>
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
  onBack?: () => void;
  onProceed?: (payload: PrimaryClinicsPayload) => void;
}

export default function PrimaryClinics({ onBack, onProceed }: PrimaryClinicsProps) {
  const [stepKey, setStepKey] = useState<StepKey>("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit | "">("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number | null>(null);

  const steps = stepsFor(complaint);
  const stepIdx = steps.indexOf(stepKey);

  const resetDetails = () => {
    setDurationValue("");
    setDurationUnit("");
    setExtras({});
    setPainLocations([]);
    setSeverity(null);
  };

  const handleReset = () => {
    setStepKey("category");
    setCategory(null);
    setComplaint(null);
    resetDetails();
  };

  const selectCategory = (c: Category) => {
    setCategory(c);
    setComplaint(null);
    resetDetails();
    setStepKey("complaint");
  };

  const selectComplaint = (c: Complaint) => {
    setComplaint(c);
    resetDetails();
    setStepKey("details");
  };

  const togglePain = (loc: string) =>
    setPainLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));

  // ── Validation ──────────────────────────────────────────────────────────────
  const detailsValid =
    !!complaint &&
    durationValue !== "" && Number(durationValue) > 0 && durationUnit !== "" &&
    (complaint.extras ?? []).every((f) => extras[f.id] !== undefined && extras[f.id] !== "" && Number(extras[f.id]) >= 0);

  const canContinue =
    stepKey === "details" ? detailsValid
    : stepKey === "pain" ? painLocations.length > 0
    : stepKey === "severity" ? severity !== null
    : false;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!canContinue) return;
    if (stepKey === "severity") {
      handleProceed();
      return;
    }
    setStepKey(steps[stepIdx + 1]);
  };

  const handleBack = () => {
    const prev = steps[stepIdx - 1];
    if (!prev) return;
    if (prev === "category") {
      setCategory(null);
      setComplaint(null);
      resetDetails();
    } else if (prev === "complaint") {
      setComplaint(null);
      resetDetails();
    }
    setStepKey(prev);
  };

  // ── Payload ─────────────────────────────────────────────────────────────────
  const extraLines = (complaint?.extras ?? [])
    .filter((f) => extras[f.id] !== undefined && extras[f.id] !== "")
    .map((f) => `${f.label}: ${extras[f.id]} ${f.unit}`);

  const durationText = formatDuration(durationValue, durationUnit);

  const handleProceed = () => {
    if (!category || !complaint || severity === null || durationUnit === "") return;
    const sev = SEVERITY.find((s) => s.value === severity)!;

    const summaryParts = [
      complaint.label,
      `for ${durationText}`,
      ...extraLines,
      ...(painLocations.length ? [`Location: ${painLocations.join(", ")}`] : []),
      `Severity: ${sev.label} (${sev.value}/5)`,
    ];

    const payload: PrimaryClinicsPayload = {
      group_id: category.id,
      group_label: category.shortLabel,
      cc_id: complaint.id,
      cc_label: complaint.label,
      sub_id: "",
      sub_label: "",
      system_value: complaint.systemValue,
      clinic: category.clinic,
      answers: {},
      duration_value: Number(durationValue),
      duration_unit: durationUnit,
      duration_text: durationText,
      extras: Object.fromEntries(
        (complaint.extras ?? []).map((f) => [f.id, Number(extras[f.id])])
      ),
      pain_locations: painLocations,
      severity: sev.value,
      severity_label: sev.label,
      summary_text: summaryParts.join(" · "),
    };

    console.log("BICA Payload → ML Model:", JSON.stringify(payload, null, 2));
    if (onProceed) {
      onProceed(payload);
    } else {
      alert(`Routing to: ${payload.clinic}\n${payload.summary_text}`);
    }
  };

  return (
    <div>
      <NavBar />

      <div className="flex min-h-screen flex-col items-center gap-6 bg-cyan-950 px-4 py-8">
        {onBack && stepKey === "category" && (
          <div className="w-full max-w-[72rem] pl-4">
            <button onClick={onBack} className="cursor-pointer text-sm text-white/80 hover:text-white">
              ← Back
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-orange-300">Chief Complaints</p>
          <h1 className="text-4xl font-bold text-white">Tell us about your concern</h1>
        </div>

        <Breadcrumb steps={steps} current={stepKey} category={category} complaint={complaint} />

        <div className="flex w-[72rem] max-w-full flex-row gap-6 rounded-2xl bg-cyan-900 px-8 py-8">
          <div className="min-w-0 flex-1">
            {stepKey === "category" && <StepCategory onSelect={selectCategory} />}
            {stepKey === "complaint" && category && (
              <StepComplaint category={category} onSelect={selectComplaint} />
            )}
            {stepKey === "details" && complaint && (
              <StepDetails
                complaint={complaint}
                durationValue={durationValue}
                durationUnit={durationUnit}
                extras={extras}
                onDurationValue={setDurationValue}
                onDurationUnit={setDurationUnit}
                onExtra={(id, v) => setExtras((prev) => ({ ...prev, [id]: v }))}
              />
            )}
            {stepKey === "pain" && complaint?.pain && (
              <StepPain complaint={complaint} selected={painLocations} onToggle={togglePain} />
            )}
            {stepKey === "severity" && complaint && (
              <StepSeverity complaint={complaint} severity={severity} onSelect={setSeverity} />
            )}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <SummaryPanel
              category={category}
              complaint={complaint}
              durationText={durationText}
              extraLines={extraLines}
              painLocations={painLocations}
              severity={severity}
            />

            <div className="mt-4 flex flex-col gap-2">
              {(stepKey === "details" || stepKey === "pain" || stepKey === "severity") && (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={handleContinue}
                  className={`rounded-xl px-5 py-3 text-base font-bold transition-all
                    ${canContinue
                      ? "cursor-pointer bg-orange-50 text-cyan-950 hover:bg-orange-100"
                      : "cursor-not-allowed bg-cyan-800 text-cyan-500"}`}
                >
                  {stepKey === "severity" ? "Proceed →" : "Continue →"}
                </button>
              )}

              {stepIdx > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="cursor-pointer rounded-xl border border-orange-200 bg-transparent px-5 py-2.5 text-sm font-semibold text-orange-100 hover:bg-cyan-800"
                >
                  ← Back
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="mt-1 cursor-pointer text-center text-xs text-cyan-600 hover:text-cyan-400 hover:underline"
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}