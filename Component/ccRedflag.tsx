'use client';
import React, { useState } from "react";

interface CcRedflagProps {
  onBack?: () => void;
  onProceed?: () => void;
}

export default function CcRedflag({ onBack, onProceed }: CcRedflagProps) {
  const [isEmergency, setIsEmergency] = useState(false);
  const [alertData, setAlertData] = useState({ symptom: "", clinic: "" });

  const handleGoEmergency = (symptom: string, clinic: string) => {
    setAlertData({ symptom, clinic });
    setIsEmergency(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bica_emergency', JSON.stringify({ symptom, clinic }));
    }
  };

  const redFlags = [
    {
      question: "Are you feeling confused, disoriented, or not acting like yourself?",
      symptom: "Altered mental status / confusion",
      clinic: "ER / Neurology",
    },
    {
      question: "Are you having severe difficulty breathing or gasping for air?",
      symptom: "Severe difficulty breathing",
      clinic: "ER / Pulmonology",
    },
    {
      question: "Do you have heavy, uncontrolled bleeding or blood in your vomit or stool?",
      symptom: "Uncontrolled bleeding / blood in vomit or stool",
      clinic: "Trauma / Surgery ER",
    },
    {
      question: "Are you in extreme, unbearable pain (rated 9–10 out of 10)?",
      symptom: "Extreme pain (9–10/10)",
      clinic: "ER / Pain Management",
    },
    {
      question: "Have you fainted, lost consciousness, or are you currently having a seizure?",
      symptom: "Loss of consciousness / active seizure",
      clinic: "ER / Neurology",
    },
    {
      question: "Do you have sudden face drooping, arm weakness, or slurred speech?",
      symptom: "Stroke signs (FAST positive)",
      clinic: "Neurology ER",
    },
    {
      question: "Are you pregnant and experiencing severe belly pain or heavy bleeding?",
      symptom: "Pregnancy with severe abdominal pain or heavy bleeding",
      clinic: "OB-GYN ER",
    },
    {
      question: "Did you suffer a serious injury or suspect you have been poisoned?",
      symptom: "Serious injury / suspected poisoning",
      clinic: "Trauma / Toxicology ER",
    },
  ];

  return (
    <div className="min-h-screen">

      {/* NAV */}
      <nav className="w-full pl-8 pt-4 pb-4 pr-8 text-cyan-950 bg-yellow-50">
        <div className="w-full flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">BICA</h1>
            <p className="text-lg">Better Informed Care Access</p>
          </div>
          <ul className="md:flex space-x-8 hidden text-xl font-semibold">
            <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
            <li><a href="#" className="cursor-pointer hover:underline">Vital Signs |</a></li>
            <li><a href="#" className="cursor-pointer hover:underline text-orange-600 underline">Chief Complaints |</a></li>
            <li><a href="#" className="cursor-pointer hover:underline">Summary |</a></li>
          </ul>
        </div>
      </nav>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-8 bg-cyan-950 min-h-[calc(100vh-72px)]">

        {/* Header */}
        <div className="text-center w-full">
          <h2 className="text-7xl font-bold text-white">Safety Check</h2>
          <p className="text-3xl font-serif text-white mt-2">Are you experiencing any of the following right now?</p>
        </div>

        {/* EMERGENCY SCREEN */}
        {isEmergency ? (
          <div className="w-full bg-red-600 border-4 border-white text-white rounded-xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-5xl font-extrabold mb-4">IMMEDIATE ER REDIRECTION</h3>
            <p className="text-2xl mb-5">Detected: <span className="font-bold underline">{alertData.symptom}</span></p>
            <p className="text-3xl font-medium bg-red-950 px-6 py-5 rounded-lg inline-block">
              Please get your ticket and proceed immediately to the ER!
            </p>
            <button
              onClick={() => setIsEmergency(false)}
              className="block mx-auto mt-8 text-base text-red-200 hover:underline opacity-70"
            >
              Cancel / Reset Kiosk
            </button>
          </div>
        ) : (
          <>
            {/* RED FLAG CARD — full width */}
            <div className="w-full bg-red-950 border-2 border-red-400 rounded-xl p-6 shadow-xl">

              <h3 className="flex items-center gap-2 text-red-300 text-base font-bold uppercase tracking-wider mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                Tap YES on any that apply — you will be directed to the emergency area immediately
              </h3>

              {/* 4-column grid */}
              <div className="grid grid-cols-4 gap-4">
                {redFlags.map((flag, index) => (
                  <button
                    key={index}
                    onClick={() => handleGoEmergency(flag.symptom, flag.clinic)}
                    className="bg-red-800 border border-red-400 rounded-xl p-6 text-left hover:bg-red-700 active:scale-95 transition-all cursor-pointer group flex flex-col justify-between gap-4 min-h-[180px]"
                  >
                    <div className="flex flex-col gap-3">
                      <p className="text-red-100 text-xl font-medium group-hover:text-white leading-snug">
                        {flag.question}
                      </p>
                    </div>
                    <span className="self-end bg-red-600 group-hover:bg-red-500 text-white text-base font-bold px-5 py-2 rounded-md border border-red-300 tracking-wide">
                      YES →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Safe Proceed */}
            <div className="w-full flex flex-col gap-4">
              {onBack && (
                <button
                  onClick={() => onBack?.()}
                  className="w-full text-center bg-transparent border border-white/30 text-white text-base font-semibold py-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ← Back to Vital Signs
                </button>
              )}

              <button
                onClick={() => onProceed?.()}
                className="w-full text-center bg-[#083344] border-2 border-[#fefce8] text-white text-2xl font-bold py-5 rounded-xl hover:bg-[#0e4f68] transition-colors cursor-pointer block"
              >
                None of these apply to me — proceed to summary →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}