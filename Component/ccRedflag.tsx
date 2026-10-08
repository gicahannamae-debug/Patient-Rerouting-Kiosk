'use client';
import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClinicName = "OB-GYN" | "Internal Medicine" | "Surgery" | "Pediatrics";

interface Experience {
  text: string;
  clinics: ClinicName[];
}

interface RedFlagCategory {
  id: string;
  name: string;      // patient-friendly category name (shown to the patient)
  clinical: string;  // clinical category (kept for your data, not shown)
  experiences: Experience[];
}

interface Tier {
  level: 1 | 2 | 3;
  label: string;
  title: string;
  tone: "red" | "amber" | "blue";
  categories: RedFlagCategory[];
}

export interface ScreeningResult {
  tier: 1 | 2 | 3;
  tierTitle: string;
  category: string;
  clinicalCategory: string;
  experience: string;
  clinics: ClinicName[];
}

interface CcRedflagProps {
  /** Fallback for log out if onLogout is not provided */
  onBack?: () => void;
  /** Log out -> back to Operator Login */
  onLogout?: () => void;
  /** Called when the patient finishes the safety check.
   *  Priority 2 / 3 selection => result is passed. "None apply" => no argument. */
  onProceed?: (result?: ScreeningResult) => void;
  onPrintEmergencyTicket?: (emergencyData: { symptom: string; ticketNumber: string }) => void;
}

// ─── Safety check data ────────────────────────────────────────────────────────

const OBG: ClinicName = "OB-GYN";
const IM: ClinicName = "Internal Medicine";
const SUR: ClinicName = "Surgery";
const PED: ClinicName = "Pediatrics";

const TIERS: Tier[] = [
  {
    level: 1,
    label: "Priority 1",
    title: "Life-Threatening Emergencies (The ABCs)",
    tone: "red",
    categories: [
      {
        id: "airway",
        name: "Choking & Mouth/Throat Blockages",
        clinical: "A – Airway",
        experiences: [
          { clinics: [OBG, IM, SUR], text: "Cannot speak, cough, or breathe due to a blocked throat." },
          { clinics: [OBG, IM, SUR], text: "Severe allergic reaction causing the tongue or throat to swell shut." },
          { clinics: [PED], text: "Child swallowed an object (toy, coin) and is gasping or turning blue." },
          { clinics: [PED], text: "Child is choking and cannot make any sound or cry." },
        ],
      },
      {
        id: "breathing",
        name: "Severe Breathing Difficulty",
        clinical: "B – Breathing",
        experiences: [
          { clinics: [IM, SUR], text: "Sudden, severe shortness of breath or gasping for air." },
          { clinics: [IM, SUR], text: "Unable to speak a full sentence without stopping to breathe." },
          { clinics: [OBG], text: "Sudden, sharp chest pain with extreme shortness of breath during pregnancy." },
          { clinics: [PED], text: "Child is breathing dangerously fast." },
          { clinics: [PED], text: "Child's ribs pull in tightly with each breath (sucking in under the chest)." },
        ],
      },
      {
        id: "circulation",
        name: "Chest Pain & Severe Bleeding",
        clinical: "C – Circulation",
        experiences: [
          { clinics: [IM], text: "Heavy, crushing chest pain or pressure spreading to the arm or jaw." },
          { clinics: [IM], text: "Heart racing dangerously fast out of nowhere with dizziness." },
          { clinics: [OBG], text: "Heavy vaginal bleeding during pregnancy (soaking a menstrual pad in 1 hour)." },
          { clinics: [OBG], text: "Sudden, gushing loss of blood." },
          { clinics: [PED], text: "Child is completely pale or blue around the lips." },
          { clinics: [PED], text: "Heavy bleeding from a deep wound that won't stop with pressure." },
          { clinics: [SUR], text: "Blood is spurting heavily from a deep cut or severe injury." },
          { clinics: [SUR], text: "Bleeding that does not stop after 10 minutes of direct pressure." },
        ],
      },
    ],
  },
  {
    level: 2,
    label: "Priority 2",
    title: "Urgent Body Systems & Brain Function",
    tone: "amber",
    categories: [
      {
        id: "mental",
        name: "Confusion, Fainting, & Brain Changes",
        clinical: "Altered Mental Status",
        experiences: [
          { clinics: [IM], text: "Sudden numbness/weakness on one side of the face or body." },
          { clinics: [IM], text: "Slurred speech or sudden confusion." },
          { clinics: [OBG], text: "Fainting or sudden blackouts while pregnant." },
          { clinics: [OBG], text: "Sudden severe headache with blurry vision/spots in the eyes (Pre-eclampsia)." },
          { clinics: [PED], text: "Child is unusually floppy, limp, or impossible to wake up." },
          { clinics: [PED], text: "Baby is completely unresponsive to your voice or touch." },
          { clinics: [SUR], text: "Confused, dizzy, or vomiting repeatedly after a hard blow to the head." },
        ],
      },
      {
        id: "neuro",
        name: "Seizures & Sudden Critical Risks",
        clinical: "Neurological / Critical Risks",
        experiences: [
          { clinics: [IM, SUR], text: "Active shaking, fitting, or full-body convulsions." },
          { clinics: [IM, SUR], text: "Known ingestion of poison, chemicals, or drug overdose." },
          { clinics: [OBG], text: "Sudden loss of baby movement or no kicks felt for several hours." },
          { clinics: [OBG], text: "Water breaking or regular contractions early (before 37 weeks)." },
          { clinics: [PED], text: "Baby under 3 months old with any fever over 38°C (100.4°F)." },
          { clinics: [PED], text: "Child has a seizure or full-body shaking during a high fever." },
        ],
      },
    ],
  },
  {
    level: 3,
    label: "Priority 3",
    title: "Injuries, Pain, & Other Symptoms",
    tone: "blue",
    categories: [
      {
        id: "trauma",
        name: "Accidents, Injuries, & Burns",
        clinical: "Trauma / Injury",
        experiences: [
          { clinics: [SUR], text: "Suspected broken bones (limb is bent abnormally or cannot bear weight)." },
          { clinics: [SUR], text: "Deep cuts needing stitches or severe burns from fire/chemicals." },
          { clinics: [SUR], text: "Pain or swelling at an old surgical site." },
          { clinics: [PED], text: "Child fell from a height or injured a limb and refuses to use it." },
          { clinics: [IM, OBG], text: "Minor cuts or scrapes that are not bleeding heavily." },
        ],
      },
      {
        id: "pain",
        name: "Severe Body Pain",
        clinical: "Somatic Pain",
        experiences: [
          { clinics: [SUR], text: "Sudden, agonizing pain starting around the belly button and moving to the lower right side (Appendicitis)." },
          { clinics: [OBG], text: "Severe, sharp pain in the lower belly or pelvic area (pregnant or non-pregnant)." },
          { clinics: [IM], text: "Sudden, unbearable headache (worse than any normal headache)." },
          { clinics: [IM], text: "Severe, cramping abdominal pain with nausea." },
          { clinics: [PED], text: "Child crying inconsolably for hours due to unexplained, severe body pain." },
        ],
      },
      {
        id: "infection",
        name: "Severe Reactions & Infections",
        clinical: "Systemic Infection",
        experiences: [
          { clinics: [IM], text: "High fever with extreme shivering, dizziness, and low energy." },
          { clinics: [IM], text: "Sudden full-body rash with mild swelling." },
          { clinics: [OBG], text: "Foul-smelling vaginal discharge with pelvic pain and a fever." },
          { clinics: [PED], text: "Dehydration: No wet diapers for over 8 hours, or crying with no tears." },
          { clinics: [PED], text: "Persistent vomiting—cannot keep any fluids down for several hours." },
        ],
      },
    ],
  },
];

// Full class strings so Tailwind can detect them
const TONE = {
  red: {
    panel: "bg-red-950/90 border-red-500/60",
    divider: "border-red-500/30",
    heading: "text-red-300",
    icon: "text-red-400",
    hint: "text-red-100 bg-red-900 border-red-600",
    button: "bg-red-900/70 border-red-500/50 hover:bg-red-700",
    buttonText: "text-red-50 group-hover:text-white",
  },
  amber: {
    panel: "bg-amber-950/90 border-amber-500/60",
    divider: "border-amber-500/30",
    heading: "text-amber-300",
    icon: "text-amber-400",
    hint: "text-amber-100 bg-amber-900 border-amber-600",
    button: "bg-amber-900/60 border-amber-500/50 hover:bg-amber-700",
    buttonText: "text-amber-50 group-hover:text-white",
  },
  blue: {
    panel: "bg-sky-950/90 border-sky-500/60",
    divider: "border-sky-500/30",
    heading: "text-sky-300",
    icon: "text-sky-400",
    hint: "text-sky-100 bg-sky-900 border-sky-600",
    button: "bg-sky-900/60 border-sky-500/50 hover:bg-sky-700",
    buttonText: "text-sky-50 group-hover:text-white",
  },
} as const;

const STEPS = [
  "Welcome",
  "Safety Check",
  "Registration",
  "Forms",
  "Take Vital Signs",
  "Complaints",
  "Ticket",
];
const SAFETY_STEP_INDEX = 1;
const SAFETY_PARTS = 6; // 3 priority tiers x (categories + experiences)

// Clinic codes used only inside the queue number, e.g. ER-OB-482
const CLINIC_CODE: Record<ClinicName, string> = {
  "OB-GYN": "OB",
  "Internal Medicine": "IM",
  "Surgery": "SUR",
  "Pediatrics": "PED",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CcRedflag({ onBack, onLogout, onProceed, onPrintEmergencyTicket }: CcRedflagProps) {
  const [screenStep, setScreenStep] = useState<"welcome" | "screening" | "emergency" | "erTicket">("welcome");
  const [alertData, setAlertData] = useState({ symptom: "", ticketNumber: "" });

  // Safety check position
  const [tierIndex, setTierIndex] = useState(0);
  const [view, setView] = useState<"categories" | "experiences">("categories");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const currentTier = TIERS[tierIndex];
  const tone = TONE[currentTier.tone];
  const isLastTier = tierIndex === TIERS.length - 1;
  const selectedCategory = currentTier.categories.find(c => c.id === categoryId) ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const resetScreening = () => {
    setTierIndex(0);
    setView("categories");
    setCategoryId(null);
  };

  const handleGoEmergency = (symptom: string, clinics: ClinicName[]) => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const clinicTag = clinics.map(c => CLINIC_CODE[c]).join("/");
    const data = { symptom, ticketNumber: `ER-${clinicTag}-${randomNum}` };
    setAlertData(data);
    setScreenStep("emergency");

    if (typeof window !== "undefined") {
      sessionStorage.setItem("bica_emergency", JSON.stringify(data));
    }
  };

  const handlePrint = () => {
    if (onPrintEmergencyTicket) {
      onPrintEmergencyTicket(alertData);
    } else {
      window.print();
    }
  };

  const handleSelectCategory = (id: string) => {
    setCategoryId(id);
    setView("experiences");
  };

  const handleSelectExperience = (exp: Experience) => {
    if (!selectedCategory) return;

    // Priority 1 -> immediate Emergency Red Alert
    if (currentTier.level === 1) {
      handleGoEmergency(exp.text, exp.clinics);
      return;
    }

    // Priority 2 / 3 -> hand the result to the next step
    onProceed?.({
      tier: currentTier.level,
      tierTitle: currentTier.title,
      category: selectedCategory.name,
      clinicalCategory: selectedCategory.clinical,
      experience: exp.text,
      clinics: exp.clinics,
    });
  };

  // "None of these apply" -> next priority tier (or proceed after the last one)
  const handleNone = () => {
    if (isLastTier) {
      onProceed?.();
    } else {
      setTierIndex(i => i + 1);
      setView("categories");
      setCategoryId(null);
    }
  };

  const handlePrevious = () => {
    if (view === "experiences") {
      setView("categories");
      setCategoryId(null);
    } else if (tierIndex > 0) {
      setTierIndex(i => i - 1);
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bica_emergency");
    }
    (onLogout ?? onBack)?.();
  };

  // ── Progress indicator state ────────────────────────────────────────────────

  const activeStep = screenStep === "welcome" ? 0 : screenStep === "erTicket" ? STEPS.length - 1 : SAFETY_STEP_INDEX;
  const currentPart = tierIndex * 2 + (view === "experiences" ? 2 : 1); // 1..6

  const circleState = (n: number): "done" | "current" | "future" => {
    if (activeStep > SAFETY_STEP_INDEX) return "done";
    if (activeStep < SAFETY_STEP_INDEX) return "future";
    if (n < currentPart) return "done";
    if (n === currentPart) return "current";
    return "future";
  };

  const circleClass = {
    done: "bg-cyan-950 text-yellow-50 border-cyan-950",
    current: "bg-cyan-950 text-yellow-50 border-cyan-950 ring-2 ring-yellow-400 ring-offset-1 scale-110",
    future: "bg-transparent text-cyan-950 border-cyan-950/40 blur-[2px] opacity-50",
  };

  const showPrevious = view === "experiences" || tierIndex > 0;
  const previousLabel = view === "experiences" ? "← Choose another category" : "← Previous Priority";

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      {/* TOP KIOSK HEADER */}
      <nav className="relative z-30 w-full px-8 py-5 text-cyan-950 bg-yellow-50 shadow-md">
        <div className="w-full flex items-center justify-between gap-6">
          <div className="flex flex-col shrink-0">
            <h1 className="text-4xl font-extrabold tracking-wide">BICA</h1>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-semibold tracking-wider uppercase text-cyan-900">
                Outpatient Department (OPD) Kiosk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 min-w-0">
            {/* Step tracker */}
            <ol className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 text-sm">
              {STEPS.map((label, i) => {
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                return (
                  <React.Fragment key={label}>
                    {i > 0 && <li aria-hidden className="text-cyan-950/25 font-light select-none">|</li>}
                    <li
                      className={`flex items-center gap-2 transition-all duration-500 ${
                        isActive
                          ? "rounded-full bg-cyan-950 px-3 py-1 font-extrabold text-yellow-50"
                          : isPast
                          ? "px-1 font-semibold text-cyan-950"
                          : "px-1 font-semibold text-cyan-950/40"
                      }`}
                    >
                      <span>{label}</span>

                      {i === SAFETY_STEP_INDEX && (
                        <span className="flex items-center gap-1">
                          {Array.from({ length: SAFETY_PARTS }, (_, k) => k + 1).map(n => {
                            const state = circleState(n);
                            return (
                              <span
                                key={n}
                                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-all duration-500 ${
                                  isActive && state !== "future"
                                    ? state === "current"
                                      ? "bg-yellow-400 text-cyan-950 border-yellow-300 ring-2 ring-yellow-200 scale-110"
                                      : "bg-yellow-50 text-cyan-950 border-yellow-50"
                                    : circleClass[state]
                                }`}
                              >
                                {n}
                              </span>
                            );
                          })}
                        </span>
                      )}
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>

            {/* 3-bar menu: Operator log out */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Menu"
                className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-xl border border-cyan-950/30 bg-white hover:bg-cyan-50 transition-colors cursor-pointer"
              >
                <span className="block h-0.5 w-6 rounded bg-cyan-950" />
                <span className="block h-0.5 w-6 rounded bg-cyan-950" />
                <span className="block h-0.5 w-6 rounded bg-cyan-950" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-cyan-950/20 bg-white shadow-2xl">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Operator Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* STEP 0: WELCOME */}
      {screenStep === "welcome" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 max-w-5xl mx-auto text-center my-auto w-full">
          <div className="inline-block bg-yellow-400 text-cyan-950 text-xl font-extrabold tracking-widest uppercase px-8 py-3 rounded-full mb-10 border-2 border-yellow-300 shadow-lg">
            Welcome to the Outpatient Department
          </div>

          <div className="w-full bg-cyan-900/30 border border-cyan-500/30 rounded-3xl p-10 backdrop-blur-sm shadow-2xl flex flex-col items-center gap-10">
            <p className="text-3xl sm:text-4xl text-cyan-100 max-w-3xl leading-relaxed font-semibold tracking-wide">
              For your safety, please answer the questions. <br className="hidden sm:inline" />
              Tap the box that <span className="font-extrabold text-white underline decoration-yellow-400 underline-offset-8">applies to you</span>.
            </p>

            <button
              onClick={() => { resetScreening(); setScreenStep("screening"); }}
              className="w-full max-w-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-3xl sm:text-4xl font-black py-7 px-10 rounded-2xl shadow-[0_10px_30px_rgba(5,150,105,0.4)] transition-all active:scale-95 border-2 border-emerald-300 flex items-center justify-center gap-6 cursor-pointer tracking-wider"
            >
              <span>START SAFETY CHECK</span>
              <span className="text-4xl sm:text-5xl">→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: SAFETY CHECK (Priority 1 -> 2 -> 3) */}
      {screenStep === "screening" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">
          <div className="text-center w-full mb-6">
            <h2 className="text-5xl font-bold text-white">Safety Check</h2>
            <p className="text-2xl text-cyan-200 mt-2">
              {view === "categories"
                ? "Are you experiencing any of the following right now?"
                : `${selectedCategory?.name} — which one applies to you?`}
            </p>
          </div>

          <div className={`w-full ${tone.panel} border-2 rounded-3xl p-8 shadow-2xl backdrop-blur-sm`}>
            {/* Tier header */}
            <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b ${tone.divider} pb-4 mb-6`}>
              <div className={`flex items-center gap-3 ${tone.heading} font-bold uppercase tracking-wider text-base`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 flex-shrink-0 ${tone.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>{currentTier.label}: {currentTier.title}</span>
              </div>
              <span className={`text-sm ${tone.hint} px-4 py-1.5 rounded-full border font-semibold self-start sm:self-auto`}>
                {view === "categories" ? "Tap the one that applies" : "Tap what you are experiencing"}
              </span>
            </div>

            <div className="min-h-[360px] flex flex-col justify-between gap-6">
              {/* CATEGORY LIST (patient-friendly names) */}
              {view === "categories" && (
                <div className={`grid grid-cols-1 gap-5 ${currentTier.categories.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                  {currentTier.categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`${tone.button} border rounded-2xl p-6 text-left active:scale-[0.98] transition-all cursor-pointer group flex items-center min-h-[180px]`}
                    >
                      <p className={`${tone.buttonText} text-3xl font-bold leading-snug`}>
                        {cat.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* EXPERIENCE LIST (what the patient experiences) */}
              {view === "experiences" && selectedCategory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedCategory.experiences.map((exp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectExperience(exp)}
                      className={`${tone.button} border rounded-2xl p-6 text-left active:scale-[0.98] transition-all cursor-pointer group flex items-center min-h-[160px]`}
                    >
                      <p className={`${tone.buttonText} text-2xl font-semibold leading-relaxed`}>
                        {exp.text}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t ${tone.divider}`}>
                {showPrevious ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="w-full sm:w-auto px-6 py-4 bg-transparent border border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {previousLabel}
                  </button>
                ) : (
                  <span />
                )}

                {view === "categories" && (
                  <button
                    type="button"
                    onClick={handleNone}
                    className="w-full sm:w-auto px-8 py-4 bg-cyan-900 border-2 border-cyan-400 text-white text-xl font-bold rounded-xl hover:bg-cyan-800 transition-colors shadow-lg cursor-pointer"
                  >
                    {isLastTier
                      ? "NONE apply — Proceed to Registration →"
                      : `NONE of these apply — Go to Priority ${currentTier.level + 1} →`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: EMERGENCY REDIRECTION NOTICE */}
      {screenStep === "emergency" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto text-center my-auto w-full">
          <div className="w-full bg-red-900 border-4 border-red-500 text-white rounded-3xl p-10 text-center shadow-2xl">
            <h3 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight text-red-100">
              IMMEDIATE ER REDIRECTION
            </h3>

            <p className="text-2xl sm:text-3xl mb-8">
              Emergency Symptom Detected:{" "}
              <span className="font-bold underline text-white decoration-red-400">
                {alertData.symptom}
              </span>
            </p>

            {/* QUEUE NUMBER: ER - clinic - patient number */}
            <div className="mx-auto mb-8 w-fit rounded-2xl border-2 border-red-300 bg-red-950 px-10 py-4">
              <span className="block text-xs font-bold uppercase tracking-widest text-red-300">Queue Number</span>
              <span className="block text-5xl sm:text-6xl font-black tracking-wider text-white">{alertData.ticketNumber}</span>
            </div>

            <div className="bg-slate-950/90 p-10 rounded-2xl border border-red-500/50 max-w-2xl mx-auto mb-8 shadow-inner flex flex-col items-center gap-8">
              <p className="text-2xl sm:text-3xl font-bold leading-relaxed text-red-100">
                Please step out of line and proceed immediately to the Emergency Room (ER) triage desk!
              </p>

              <button
                onClick={() => setScreenStep("erTicket")}
                className="w-full max-w-md bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-2xl font-bold py-5 px-8 rounded-xl shadow-[0_8px_25px_rgba(220,38,38,0.5)] transition-all active:scale-95 border border-red-300 flex items-center justify-center gap-4 cursor-pointer"
              >
                <span>Continue to Print Ticket →</span>
              </button>
            </div>

            <button
              onClick={() => { resetScreening(); setScreenStep("screening"); }}
              className="text-base text-red-200 hover:text-white underline opacity-80 cursor-pointer"
            >
              Cancel / Restart Safety Check
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EMERGENCY TICKET PREVIEW & PRINT */}
      {screenStep === "erTicket" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">
          <div className="text-center w-full mb-6">
            <h2 className="text-4xl font-extrabold text-white">Emergency Patient Summary</h2>
            <p className="text-xl text-cyan-200 mt-1">
              Please review your emergency slip before printing.
            </p>
          </div>

          <div className="w-full bg-cyan-900/40 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-sm flex flex-col md:flex-row gap-8 items-center justify-center">
            {/* THERMAL RECEIPT SLIP PREVIEW */}
            <div className="bg-white text-black p-6 rounded-lg shadow-2xl w-full max-w-[320px] font-mono text-xs border border-gray-300 flex flex-col gap-3">
              <div className="text-center border-b border-black pb-2">
                <h3 className="font-extrabold text-sm uppercase">Northern Mindanao Medical Center</h3>
                <p className="text-[10px]">Triage Assessment Slip</p>
                <p className="text-[10px]">BICA - OPD Kiosk</p>
              </div>

              <div className="border-b border-dashed border-black pb-2 text-[11px] flex justify-between">
                <span>DATE: {new Date().toLocaleDateString()}</span>
                <span>TIME: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              <div className="border-b border-dashed border-black pb-2">
                <span className="font-bold text-red-600 block text-xs">STATUS: EMERGENCY</span>
                <span>CHIEF COMPLAINT:</span>
                <p className="font-bold text-sm text-red-700 mt-0.5">{alertData.symptom}</p>
              </div>

              <div className="text-center py-2 border-b border-black">
                <span className="text-[10px] uppercase font-bold text-gray-600 block">DESTINATION</span>
                <span className="text-base font-black">EMERGENCY ROOM (ER)</span>
                <span className="text-[10px] block text-gray-500 mt-1">PRIORITY QUEUE CODE</span>
                <span className="text-3xl font-black text-red-600 tracking-wider block mt-1">{alertData.ticketNumber}</span>
              </div>

              <div className="text-center text-[10px] pt-1">
                <p className="font-bold">Please proceed directly to the Emergency Room triage window and present this slip.</p>
              </div>
            </div>

            {/* DETAILS + PRINT */}
            <div className="flex-1 w-full max-w-xl flex flex-col justify-between gap-6">
              <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-6 text-white space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-red-300 font-bold">Patient Status</span>
                  <p className="text-2xl font-bold text-red-400">Emergency Redirection</p>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-red-300 font-bold">Detected Symptom</span>
                  <p className="text-xl font-semibold text-white">{alertData.symptom}</p>
                </div>

                <div className="pt-4 border-t border-red-500/30 flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-red-300 font-bold">Assigned Destination</span>
                    <p className="text-2xl font-black text-white">Emergency Room (ER)</p>
                  </div>
                  <div className="bg-red-900 border border-red-400 rounded-xl px-4 py-2 text-center">
                    <span className="text-[10px] uppercase text-red-200 block font-semibold">Priority Tag</span>
                    <span className="text-2xl font-black text-white">{alertData.ticketNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setScreenStep("emergency")}
                  className="w-1/3 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-lg border border-slate-600 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-2/3 py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xl font-bold rounded-xl shadow-lg transition-all border border-red-300 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        BICA Outpatient Self-Service Kiosk • Northern Mindanao Medical Center
      </footer>
    </div>
  );
}