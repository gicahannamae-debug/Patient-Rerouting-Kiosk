'use client';

import React, { useState } from "react";
import type { KioskLanguage } from "@/lib/kioskLanguage";

const STEPS: Record<KioskLanguage, { label: string; index: number }[]> = {
  en: [
    { label: "Welcome", index: 0 },
    { label: "Safety Check", index: 1 },
    { label: "Take Vital Signs", index: 4 },
    { label: "Registration", index: 5 },
    { label: "Complaints", index: 6 },
    { label: "Ticket", index: 7 },
  ],
  ceb: [
    { label: "Maayong pag-abot", index: 0 },
    { label: "Pagsusi sa Kaluwasan", index: 1 },
    { label: "Pagsukod sa mga Vital Sign", index: 4 },
    { label: "Pagparehistro", index: 5 },
    { label: "Mga Reklamo", index: 6 },
    { label: "Tiket", index: 7 },
  ],
};

interface KioskHeaderProps {
  language: KioskLanguage;
  activeStep: number;
  vitalPart?: number;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
  onLogout?: () => void;
}

export default function KioskHeader({
  language,
  activeStep,
  vitalPart,
  onNavigateStep,
  onNavigateVitalPart,
  onLogout,
}: KioskHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const steps = STEPS[language];

  const circleState = (part: number): "done" | "current" | "future" => {
    if (activeStep > 4) return "done";
    if (activeStep < 4) return "future";
    return part < (vitalPart ?? 0) ? "done" : part === vitalPart ? "current" : "future";
  };

  const circleClass = {
    done: "bg-cyan-950 text-yellow-50 border-cyan-950",
    current: "bg-cyan-950 text-yellow-50 border-cyan-950 ring-2 ring-yellow-400 ring-offset-1 scale-110",
    future: "bg-transparent text-cyan-950 border-cyan-950/40 blur-[2px] opacity-50",
  };

  return (
    <nav className="relative z-30 w-full px-8 py-5 text-cyan-950 bg-yellow-50 shadow-md">
      <div className="w-full flex items-center justify-between gap-6">
        <div className="flex flex-col shrink-0">
          <h1 className="text-4xl font-extrabold tracking-wide">BICA</h1>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold tracking-wider uppercase text-cyan-900">
              {language === "en" ? "Outpatient Department (OPD) Kiosk" : "Kiosk sa Departamento sa Outpatient (OPD)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 min-w-0">
          <ol aria-label={language === "en" ? "Kiosk progress" : "Pag-uswag sa kiosk"} className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 text-sm">
            {steps.map(({ label, index: stepIndex }, index) => {
              const isActive = stepIndex === activeStep;
              const isPast = stepIndex < activeStep;
              return (
                <React.Fragment key={label}>
                  {index > 0 && <li aria-hidden className="text-cyan-950/25 font-light select-none">|</li>}
                  <li
                    aria-current={isActive ? "step" : undefined}
                    className={`flex items-center gap-2 transition-all duration-500 ${isActive
                      ? "rounded-full bg-cyan-950 px-3 py-1 font-extrabold text-yellow-50"
                      : isPast
                        ? "px-1 font-semibold text-cyan-950"
                        : "px-1 font-semibold text-cyan-950/40"
                      }`}
                  >
                    {isPast && onNavigateStep ? (
                      <button
                        type="button"
                      onClick={() => onNavigateStep(stepIndex)}
                      aria-label={language === "en" ? `Go back to ${label}` : `Mobalik sa ${label}`}
                      className="cursor-pointer rounded px-1 hover:bg-cyan-950/10 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700"
                    >
                      {label}
                    </button>
                    ) : (
                      <span>{label}</span>
                    )}
                    {stepIndex === 4 && (
                      <span className="flex items-center gap-1">
                        {[1, 2, 3].map(part => {
                          const state = circleState(part);
                          const className = `flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-all duration-500 ${isActive && state !== "future"
                            ? state === "current"
                              ? "bg-yellow-400 text-cyan-950 border-yellow-300 ring-2 ring-yellow-200 scale-110"
                              : "bg-yellow-50 text-cyan-950 border-yellow-50"
                            : circleClass[state]
                            }`;
                          return state === "done" && onNavigateVitalPart ? (
                            <button
                              key={part}
                              type="button"
                              onClick={() => onNavigateVitalPart(part)}
                              aria-label={`Return to vital sign ${part}`}
                              className={`${className} cursor-pointer hover:ring-2 hover:ring-cyan-500`}
                            >
                              {part}
                            </button>
                          ) : (
                            <span key={part} className={className}>{part}</span>
                          );
                        })}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>

          {onLogout && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(open => !open)}
                aria-label={language === "en" ? "Menu" : "Menu"}
                aria-expanded={menuOpen}
                className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-xl border border-cyan-950/30 bg-white hover:bg-cyan-50 transition-colors cursor-pointer"
              >
                <span className="block h-0.5 w-6 rounded bg-cyan-950" />
                <span className="block h-0.5 w-6 rounded bg-cyan-950" />
                <span className="block h-0.5 w-6 rounded bg-cyan-950" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label={language === "en" ? "Close menu" : "Sirad-i ang menu"}
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-cyan-950/20 bg-white shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      {language === "en" ? "Operator Log out" : "Pag-log out sa operator"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
