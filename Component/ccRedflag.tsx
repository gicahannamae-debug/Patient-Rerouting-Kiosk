'use client';
import React, { useState } from "react";

interface CcRedflagProps {
  onBack?: () => void;
  onProceed?: () => void;
}

export default function CcRedflag({ onBack, onProceed }: CcRedflagProps) {
  // Step 0: OPD Welcome & Intro
  // Step 1: Red Flag Screening Questions
  // Step 2: Emergency Triggered
  const [screenStep, setScreenStep] = useState<"welcome" | "screening" | "emergency">("welcome");
  const [alertData, setAlertData] = useState({ symptom: "" });
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const handleGoEmergency = (symptom: string) => {
    setAlertData({ symptom });
    setScreenStep("emergency");

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bica_emergency', JSON.stringify({ symptom }));
    }
  };

  const redFlagGroups = [
    {
      title: "Brain & Mental State",
      items: [
        {
          question: "Are you experiencing sudden confusion or having a hard time thinking clearly right now?",
          symptom: "Sudden confusion / altered state",
        },
        {
          question: "Do you have signs of a stroke? (Sudden face drooping, weakness in one arm, or slurred speech)",
          symptom: "Signs of a stroke (FAST)",
        },
        {
          question: "Did you pass out, faint, or lose consciousness earlier?",
          symptom: "Fainted / lost consciousness",
        },
        {
          question: "Are you currently having, or did you just have, a seizure or uncontrollable shaking?",
          symptom: "Active or recent seizures",
        },
      ],
    },
    {
      title: "Breathing & Heart",
      items: [
        {
          question: "Are you having severe trouble breathing, gasping for air, or feeling suffocated?",
          symptom: "Severe breathing trouble",
        },
      ],
    },
    {
      title: "Bleeding & Injuries",
      items: [
        {
          question: "Do you have heavy bleeding that will not stop even when you press hard on the wound?",
          symptom: "Uncontrolled heavy bleeding",
        },
        {
          question: "Are you vomiting blood, or is your stool bloody, black, or tarry?",
          symptom: "Vomiting blood / bloody or black stool",
        },
        {
          question: "Were you just in a severe accident or injury with suspected internal damage?",
          symptom: "Severe accident / trauma",
        },
      ],
    },
    {
      title: "Severe Pain",
      items: [
        {
          question: "Are you experiencing sudden, unbearable pain? (Worst pain imaginable, rated 9 or 10 out of 10)",
          symptom: "Sudden pain rated 9–10/10",
        },
      ],
    },
    {
      title: "Poisoning & Overdose",
      items: [
        {
          question: "Did you swallow poison, toxic chemicals, or have a drug overdose?",
          symptom: "Swallowed poison / chemical overdose",
        },
      ],
    },
    {
      title: "Pregnancy Emergencies",
      items: [
        {
          question: "If pregnant: Are you experiencing vaginal bleeding or severe abdominal pain?",
          symptom: "Pregnancy bleeding / severe abdominal pain",
        },
      ],
    },
  ];

  const currentGroup = redFlagGroups[currentGroupIndex];
  const isLastGroup = currentGroupIndex === redFlagGroups.length - 1;

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between">

      {/* TOP KIOSK HEADER */}
      <nav className="w-full px-8 py-5 text-cyan-950 bg-yellow-50 shadow-md">
        <div className="w-full flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-4xl font-extrabold tracking-wide">BICA</h1>
            <p className="text-sm font-semibold tracking-wider uppercase text-cyan-900">
              Outpatient Department (OPD) Kiosk
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-lg font-bold text-cyan-950">Kiosk Ready</span>
          </div>
        </div>
      </nav>

      {/* STEP 0: WELCOME & SAFETY ACKNOWLEDGMENT */}
{screenStep === "welcome" && (
  <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 max-w-5xl mx-auto text-center my-auto w-full">
    
    {/* OPD Badge */}
    <div className="inline-block bg-yellow-400 text-cyan-950 text-xl font-extrabold tracking-widest uppercase px-8 py-3 rounded-full mb-10 border-2 border-yellow-300 shadow-lg">
      Welcome to the Outpatient Department
    </div>

    {/* Message & Button Card Wrapper */}
    <div className="w-full bg-cyan-900/30 border border-cyan-500/30 rounded-3xl p-10 backdrop-blur-sm shadow-2xl flex flex-col items-center gap-10">
      
      {/* Safety Message */}
      <p className="text-3xl sm:text-4xl text-cyan-100 max-w-3xl leading-relaxed font-semibold tracking-wide">
        For your safety, please answer the questions. <br className="hidden sm:inline" />
        Tap <span className="font-extrabold text-white underline decoration-yellow-400 underline-offset-8">YES</span> if it applies.
      </p>

      {/* Primary Touch Button */}
      <button
        onClick={() => setScreenStep("screening")}
        className="w-full max-w-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-3xl sm:text-4xl font-black py-7 px-10 rounded-2xl shadow-[0_10px_30px_rgba(5,150,105,0.4)] transition-all active:scale-95 border-2 border-emerald-300 flex items-center justify-center gap-6 cursor-pointer tracking-wider"
      >
        <span>START SAFETY CHECK</span>
        <span className="text-4xl sm:text-5xl">→</span>
      </button>

    </div>
  </div>
)}
      {/* STEP 1: SAFETY SCREENING RED FLAGS */}
      {screenStep === "screening" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">
          
          <div className="text-center w-full mb-6">
            <h2 className="text-5xl font-bold text-white">Safety Check</h2>
            <p className="text-2xl text-cyan-200 mt-2">
              Are you experiencing any of the following right now?
            </p>
          </div>

          <div className="w-full bg-red-950/90 border-2 border-red-500/60 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
            
            <div className="flex items-center justify-between border-b border-red-500/30 pb-4 mb-6">
              <div className="flex items-center gap-3 text-red-300 font-bold uppercase tracking-wider text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <span>Category {currentGroupIndex + 1} of {redFlagGroups.length}: {currentGroup.title}</span>
              </div>
              <span className="text-sm text-red-100 bg-red-900 px-4 py-1.5 rounded-full border border-red-600 font-semibold">
                Tap YES on any that apply
              </span>
            </div>

            <div className="min-h-[360px] flex flex-col justify-between gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentGroup.items.map((flag, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => handleGoEmergency(flag.symptom)}
                    className="bg-red-900/70 border border-red-500/50 rounded-2xl p-6 text-left hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between gap-4 min-h-[160px]"
                  >
                    <p className="text-red-50 text-2xl font-semibold group-hover:text-white leading-relaxed">
                      {flag.question}
                    </p>
                    <span className="self-end bg-red-600 group-hover:bg-red-500 text-white text-base font-bold px-6 py-2.5 rounded-xl border border-red-300 tracking-wide flex items-center gap-2">
                      YES →
                    </span>
                  </button>
                ))}
              </div>

              {/* Group Navigation Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-red-500/30">
                <button
                  type="button"
                  disabled={currentGroupIndex === 0}
                  onClick={() => setCurrentGroupIndex((index) => Math.max(0, index - 1))}
                  className="w-full sm:w-auto px-6 py-4 bg-transparent border border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Previous Category
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isLastGroup) {
                      onProceed?.();
                    } else {
                      setCurrentGroupIndex((index) => index + 1);
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-cyan-900 border-2 border-cyan-400 text-white text-xl font-bold rounded-xl hover:bg-cyan-800 transition-colors shadow-lg"
                >
                  {isLastGroup ? "NONE apply — Proceed to Vital Signs →" : "NONE of these apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: EMERGENCY REDIRECTION SCREEN */}
      {screenStep === "emergency" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto text-center my-auto">
          <div className="w-full bg-red-600 border-4 border-white text-white rounded-3xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-6xl font-black mb-4 tracking-tight">IMMEDIATE ER REDIRECTION</h3>
            <p className="text-3xl mb-6">Emergency Symptom Detected: <span className="font-bold underline">{alertData.symptom}</span></p>
            
            <div className="bg-red-950 p-6 rounded-2xl border border-red-400 max-w-2xl mx-auto mb-6">
              <p className="text-3xl font-bold leading-snug">
                Please step out of line and proceed immediately to the Emergency Room (ER) triage desk!
              </p>
            </div>
            
            <button
              onClick={() => setScreenStep("welcome")}
              className="mt-4 text-lg text-red-100 hover:text-white underline opacity-80 cursor-pointer"
            >
              Cancel / Restart Kiosk
            </button>
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