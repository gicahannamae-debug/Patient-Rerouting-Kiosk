'use client'
import React from "react";

export type ClinicOption =
  | "General Surgery"
  | "Internal Medicine"
  | "OB-GYNE"
  | "Pediatrics"
  | "Family Medicine";

interface DesiredClinicProps {
  selectedClinic?: ClinicOption | null;
  onClinicSelect: (clinic: ClinicOption) => void;
  onBack?: () => void;
  onProceed: (clinic?: ClinicOption | null) => void;
}

const clinics: ClinicOption[] = [
  "General Surgery",
  "Internal Medicine",
  "OB-GYNE",
  "Pediatrics",
  "Family Medicine",
];

export default function DesiredClinic({ selectedClinic, onClinicSelect, onBack, onProceed }: DesiredClinicProps) {
  return (
    <div className="min-h-screen bg-cyan-950 text-white flex flex-col">
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-yellow-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p className="text-sm text-cyan-900">Better Informed Care Access</p>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-[2rem] py-[4rem] gap-[2rem]">
        <div className="text-center max-w-4xl">
          <h1 className="text-[3rem] font-bold">Choose Desired Clinic</h1>
          <p className="text-[1.4rem] text-cyan-200 mt-3">
            Select the clinic that the patient would like to proceed to before continuing with vital signs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] w-full max-w-5xl">
          {clinics.map((clinic) => {
            const isSelected = selectedClinic === clinic;
            return (
              <button
                key={clinic}
                type="button"
                onClick={() => onClinicSelect(clinic)}
                className={`rounded-3xl border-2 px-[1.5rem] py-[2rem] text-left transition-all duration-300 shadow-2xl ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-500/15 text-emerald-100 shadow-emerald-500/20"
                    : "border-cyan-500/40 bg-cyan-900/80 hover:border-cyan-300 hover:bg-cyan-800"
                }`}
              >
                <div className="text-[1.2rem] font-bold">{clinic}</div>
                <p className="mt-2 text-cyan-200/80 text-sm">
                  Choose this clinic if the patient prefers care under this specialty.
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-[1rem] w-full max-w-5xl justify-between items-center">
          <button
            type="button"
            onClick={() => onBack?.()}
            className="w-full md:w-auto text-sm font-semibold uppercase tracking-wide text-cyan-950 bg-white/10 border border-white/20 rounded-xl px-[1.75rem] py-[1rem] hover:bg-white/20"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => onProceed(selectedClinic)}
            disabled={!selectedClinic}
            className="w-full md:w-auto text-sm font-semibold uppercase tracking-wide bg-emerald-400 text-cyan-950 rounded-xl px-[1.75rem] py-[1rem] transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Vital Signs
          </button>
        </div>
      </div>
    </div>
  );
}
