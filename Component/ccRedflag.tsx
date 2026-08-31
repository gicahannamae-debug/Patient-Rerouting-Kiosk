'use client';
import React, { useState } from "react";

interface CcRedflagProps {
  onBack?: () => void;
  onProceed?: () => void;
  onPrintEmergencyTicket?: (emergencyData: { symptom: string; ticketNumber: string }) => void;
}

export default function CcRedflag({ onBack, onProceed, onPrintEmergencyTicket }: CcRedflagProps) {
  // Step 0: Welcome
  // Step 1: Red Flag Screening
  // Step 2: Immediate Emergency Alert Notice (No queue tag display)
  // Step 3: ER Ticket Preview & Print Action
  const [screenStep, setScreenStep] = useState<"welcome" | "screening" | "emergency" | "erTicket">("welcome");
  const [alertData, setAlertData] = useState({ symptom: "", ticketNumber: "" });
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const handleGoEmergency = (symptom: string) => {
    // Generate deterministic ER ticket ID
    const randomNum = Math.floor(100 + Math.random() * 900);
    const emergencyTicket = `ER-P1-${randomNum}`;

    const data = { symptom, ticketNumber: emergencyTicket };
    setAlertData(data);
    setScreenStep("emergency");

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bica_emergency', JSON.stringify(data));
    }
  };

  const handlePrint = () => {
    if (onPrintEmergencyTicket) {
      onPrintEmergencyTicket(alertData);
    } else {
      window.print();
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
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      {onBack && (
        <div className="w-full px-8 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="text-base text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>
      )}

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
          <div className="inline-block bg-yellow-400 text-cyan-950 text-xl font-extrabold tracking-widest uppercase px-8 py-3 rounded-full mb-10 border-2 border-yellow-300 shadow-lg">
            Welcome to the Outpatient Department
          </div>

          <div className="w-full bg-cyan-900/30 border border-cyan-500/30 rounded-3xl p-10 backdrop-blur-sm shadow-2xl flex flex-col items-center gap-10">
            <p className="text-3xl sm:text-4xl text-cyan-100 max-w-3xl leading-relaxed font-semibold tracking-wide">
              For your safety, please answer the questions. <br className="hidden sm:inline" />
              Tap <span className="font-extrabold text-white underline decoration-yellow-400 underline-offset-8">YES</span> if it applies.
            </p>

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
                  className="w-full sm:w-auto px-6 py-4 bg-transparent border border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                  className="w-full sm:w-auto px-8 py-4 bg-cyan-900 border-2 border-cyan-400 text-white text-xl font-bold rounded-xl hover:bg-cyan-800 transition-colors shadow-lg cursor-pointer"
                >
                  {isLastGroup ? "NONE apply — Proceed to Patient Category →" : "NONE of these apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CLEAN EMERGENCY REDIRECTION NOTICE (NO QUEUE TAG DISPLAY) */}
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

            <div className="bg-slate-950/90 p-10 rounded-2xl border border-red-500/50 max-w-2xl mx-auto mb-8 shadow-inner flex flex-col items-center gap-8">
              <p className="text-2xl sm:text-3xl font-bold leading-relaxed text-red-100">
                Please step out of line and proceed immediately to the Emergency Room (ER) triage desk!
              </p>

              {/* ACTION BUTTON LEADING TO THE TICKET PREVIEW PAGE */}
              <button
                onClick={() => setScreenStep("erTicket")}
                className="w-full max-w-md bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-2xl font-bold py-5 px-8 rounded-xl shadow-[0_8px_25px_rgba(220,38,38,0.5)] transition-all active:scale-95 border border-red-300 flex items-center justify-center gap-4 cursor-pointer"
              >
                <span>Continue to Print Ticket →</span>
              </button>
            </div>

            <button
              onClick={() => setScreenStep("screening")}
              className="text-base text-red-200 hover:text-white underline opacity-80 cursor-pointer"
            >
              Cancel / Restart Safety Check
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EMERGENCY TICKET PREVIEW & PRINT PAGE */}
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
                <span>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

            {/* DETAILS CONTAINER AND PRINT ACTION */}
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