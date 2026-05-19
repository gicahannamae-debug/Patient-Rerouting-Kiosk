'use client';
import React, { useState } from "react";

interface Complaint {
  id: number;
  label: string;
}

const complaints: Complaint[] = [
  { id: 1, label: "Anxiety / Depression / Behavioral Changes" },
  { id: 2, label: "Psychotic Symptoms" },
  { id: 3, label: "Substance Use / Addiction Concern" },
  { id: 4, label: "Psychological Evaluation Request" },
];

export default function CcPsychiatry() {
  const [selected, setSelected] = useState<number | null>(null);

  const handleProceed = (): void => {
    const chosen = complaints.find((c) => c.id === selected);
    console.log("Psychiatry complaint selected:", chosen?.label);
  };

  return (
    <div className="">

      {/* NAV */}
      <nav className="w-full pl-8 pt-4 pb-4 pr-8 text-cyan-950 bg-yellow-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p>Better Informed Care Access</p>
          </div>
          <ul className="md:flex space-x-8 hidden text-xl font-semibold">
            <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
            <li><a href="#" className="cursor-pointer hover:underline">Vital Signs |</a></li>
            <li><a href="#" className="cursor-pointer hover:underline text-orange-600 underline">Chief Complaints |</a></li>
            <li><a href="#" className="cursor-pointer hover:underline">Summary |</a></li>
          </ul>
        </div>
      </nav>

      {/* MAIN */}
      <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-cyan-950 py-12">

        <div className="flex flex-col text-center">
          <p className="text-orange-300 text-sm font-bold uppercase tracking-widest mb-1">Chief Complaints</p>
          <h1 className="text-5xl font-bold text-white">Psychiatry</h1>
          <p className="text-xl font-serif text-white mt-1">For mental health and behavioral concerns</p>
        </div>

        <div className="flex flex-row gap-5 bg-cyan-900 px-10 py-8 rounded-xl w-[70rem]">

          {/* Complaint Grid */}
          <div className="flex flex-col flex-1 gap-4">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Select your main concern</p>
            <div className="grid grid-cols-2 gap-3">
              {complaints.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`px-4 py-6 rounded-lg text-center text-base font-semibold transition-all cursor-pointer border-2
                    ${selected === c.id
                      ? "bg-orange-50 text-cyan-950 border-orange-300"
                      : "bg-cyan-950 text-white border-cyan-800 hover:border-orange-200 hover:text-orange-100"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-dashed border-cyan-700">
              <button
                type="button"
                onClick={() => console.log("Not listed – Psychiatry")}
                className="text-sm text-orange-200 hover:text-white hover:underline cursor-pointer"
              >
                My concern is not listed here... →
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4 w-64 flex-shrink-0">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Selected Concern</p>
            <div className={`rounded-lg px-4 py-4 flex flex-col gap-2 min-h-28 border ${selected !== null ? "bg-orange-50 border-orange-300" : "bg-cyan-950 border-cyan-800"}`}>
              {selected !== null ? (
                <>
                  <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">Your Concern</p>
                  <p className="text-base font-bold text-cyan-950">{complaints.find((c) => c.id === selected)?.label}</p>
                </>
              ) : (
                <p className="text-sm text-white mt-2">No concern selected yet. Please choose from the options.</p>
              )}
            </div>
            <div className="flex-1" />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={selected === null}
                onClick={handleProceed}
                className={`text-lg font-semibold px-6 py-3 rounded-md transition-all ${selected !== null ? "bg-orange-50 text-cyan-950 hover:bg-orange-100 cursor-pointer" : "bg-cyan-800 text-cyan-500 cursor-not-allowed"}`}
              >
                Proceed →
              </button>
              <button
                type="button"
                onClick={() => console.log("Back – Psychiatry")}
                className="text-base font-semibold bg-transparent text-orange-50 border border-orange-100 px-6 py-2 rounded-md hover:bg-cyan-800 cursor-pointer"
              >
                ← Back
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}