'use client';

import React, { useState } from "react";

const STEPS = [
  "Welcome",
  "Safety Check",
  "Registration",
  "Forms",
  "Take Vital Signs",
  "Complaints",
  "Ticket",
];

interface KioskHeaderProps {
  activeStep: number;
  vitalPart?: number;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
  onLogout?: () => void;
}

export default function KioskHeader({
  activeStep,
  vitalPart,
  onNavigateStep,
  onNavigateVitalPart,
  onLogout,
}: KioskHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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
              Outpatient Department (OPD) Kiosk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 min-w-0">
          {/* BACK BUTTON 10-14-2026 */ }
        
          {activeStep > 0 &&
            activeStep !== 6 &&
            onNavigateStep && (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Are you sure you want to go back?"
                  );

                  if (!confirmed) return;

                  if (activeStep === 3 ) {
                    onNavigateStep(0);
                  } else {
                    // All other steps → Previous step
                    onNavigateStep(activeStep - 1);
                  }
                }}
                className="flex shrink-0 items-center gap-2 rounded-full bg-cyan-950 px-4 py-2 font-extrabold text-yellow-50 transition-all duration-300 hover:bg-cyan-800 active:scale-95 cursor-pointer"
                aria-label="Go back to previous step"
              >
                <span className="text-xl">←</span>
                <span>Back</span>
              </button>
            )}

          <ol aria-label="Kiosk progress" className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 text-sm">
            {STEPS.map((label, index) => {
              const isActive = index === activeStep;
              const isPast = index < activeStep;
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
                        onClick={() => onNavigateStep(index)}
                        className="cursor-pointer hover:underline"
                      >
                        {label}
                      </button>
                    ) : (
                      <span>{label}</span>
                    )}
                    {index === 4 && (
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
                aria-label="Menu"
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
                    aria-label="Close menu"
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
                      Operator Log out
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
