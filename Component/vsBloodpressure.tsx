'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";

const BP_CATEGORIES = [
  { label: "🔴 CRITICAL LOW", range: "< 90 / < 60", predicate: (s: number, d: number) => s < 90 && d < 60, color: "bg-red-600" },
  { label: "🔴 CRITICAL HIGH", range: "> 140 / > 90", predicate: (s: number, d: number) => s > 140 || d > 90, color: "bg-red-600" },
  { label: "Crisis", range: "> 180 / > 120", predicate: (s: number, d: number) => s > 180 || d > 120, color: "bg-red-700" },
  { label: "High Stage 2", range: "140–180 / 90–120", predicate: (s: number, d: number) => s >= 140 || d >= 90, color: "bg-red-500" },
  { label: "High Stage 1", range: "130–139 / 80–89", predicate: (s: number, d: number) => (s >= 130 && s <= 139) || (d >= 80 && d <= 89), color: "bg-orange-400" },
  { label: "Elevated", range: "120–129 / < 80", predicate: (s: number, d: number) => s >= 120 && s <= 129 && d < 80, color: "bg-yellow-400" },
  { label: "Normal", range: "< 120 / < 80", predicate: (s: number, d: number) => s < 120 && d < 80, color: "bg-green-400" },
];

interface VsBloodpressureProps {
  onLogout?: () => void;
  onProceed?: (values: { bpSys: string; bpDia: string }) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
  /** Which vital-sign part this page is (1 = BP). Use 2 / 3 on the RR&O2 and Temp pages. */
  part?: number;
}

export default function VsBloodpressure({
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
  part = 1,
}: VsBloodpressureProps) {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [alertTriggered, setAlertTriggered] = useState(false);

  const systolicValue = parseFloat(systolic);
  const diastolicValue = parseFloat(diastolic);
  const isValidSystolic = !Number.isNaN(systolicValue) && systolicValue >= 60 && systolicValue <= 300;
  const isValidDiastolic = !Number.isNaN(diastolicValue) && diastolicValue >= 40 && diastolicValue <= 200;

  const bpCategory = useMemo(() => {
    if (!isValidSystolic || !isValidDiastolic) return null;
    return BP_CATEGORIES.find((item) => item.predicate(systolicValue, diastolicValue)) ?? null;
  }, [systolicValue, diastolicValue, isValidSystolic, isValidDiastolic]);

  const criticalBpMessage = useMemo(() => {
    if (!bpCategory) return null;
    if (bpCategory.label === "🔴 CRITICAL LOW") return "Blood pressure is critically low. Please proceed to emergency care immediately.";
    if (bpCategory.label === "🔴 CRITICAL HIGH" || bpCategory.label === "High Stage 2" || bpCategory.label === "Crisis") return "Blood pressure is critically high. Please proceed to emergency care immediately.";
    return null;
  }, [bpCategory]);

  const showCriticalBpOverlay = alertTriggered && !!criticalBpMessage;

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      {showCriticalBpOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950 bg-opacity-95 p-6">
          <div className="w-full max-w-4xl bg-red-600 border-4 border-white rounded-xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-5xl font-extrabold mb-4">IMMEDIATE ER REDIRECTION</h3>
            <p className="text-2xl mb-5">{criticalBpMessage}</p>
            <p className="text-3xl font-medium bg-red-950 px-6 py-5 rounded-lg inline-block">
              Please get your ticket and proceed immediately to the ER!
            </p>
            <button
              onClick={() => {
                setSystolic("");
                setDiastolic("");
                setAlertTriggered(false);
              }}
              className="block mx-auto mt-8 text-base text-red-200 hover:underline opacity-70"
            >
              Cancel / Reset Kiosk
            </button>
          </div>
        </div>
      )}

      <KioskHeader
        activeStep={4}
        vitalPart={part}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Heading (same as Safety Check) */}
        <div className="text-center w-full mb-6">
          <h2 className="text-5xl font-bold text-white">Vital Sign Measurement</h2>
          <p className="text-2xl text-cyan-200 mt-2">Patient Blood Pressure (BP)</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex w-full flex-row gap-6 rounded-3xl border border-cyan-500/30 bg-cyan-900/30 p-8 shadow-2xl backdrop-blur-sm">

          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-2xl p-[1.5rem]">
            <h2 className="text-[1.4rem] font-bold text-white">Procedure</h2>
            <p className="text-[1.3rem] text-cyan-300">Please follow the instructions below to take your Blood Pressure reading.</p>

            {[
              "Pick up the Blood Pressure Cuff located on the right side of the kiosk.",
              "Wrap the cuff snugly around your upper arm, about 2 cm above the elbow.",
              "Sit down, rest your arm on the table, and relax for at least 1 minute.",
              "Press the trigger button on the machine to start the reading.",
              "Wait for the reading to complete — do not move or talk during measurement.",
              "Input the Systolic and Diastolic values shown on the machine into the boxes on the right, then click Proceed.",
            ].map((step, i) => (
              <div key={i} className="flex flex-row items-start gap-[0.75rem]">
                <div className="w-[1.8rem] h-[1.8rem] flex-shrink-0 rounded-full bg-cyan-950 text-white flex items-center justify-center text-[0.85rem] font-bold mt-[0.1rem]">
                  {i + 1}
                </div>
                <p className="text-[1.3rem] text-white leading-snug">{step}</p>
              </div>
            ))}
          </div>

          {/* ── RIGHT: Input Form ── */}
          <div className="flex flex-col gap-[1rem] w-[22rem] flex-shrink-0">
            <div className="flex flex-col text-center justify-center">
              <h2 className="text-[1.4rem] font-bold text-white">Blood Pressure Reading</h2>
              <p className="text-[0.9rem] text-cyan-300">Enter the values shown on the BP machine.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAlertTriggered(true);
                if (isValidSystolic && isValidDiastolic && !criticalBpMessage) {
                  onProceed?.({ bpSys: systolic, bpDia: diastolic });
                }
              }}
              className="flex flex-col gap-[1rem] bg-cyan-950 rounded-2xl p-[1rem]"
            >
              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Systolic (mmHg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  min="60"
                  max="300"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </section>

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Diastolic (mmHg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  min="40"
                  max="200"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </section>

              {/* Patient Blood Pressure Results */}
              <div className="flex flex-col gap-[0.75rem]">
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider">Patient Blood Pressure Results</p>
                </div>

                <div className="rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white">
                  {systolic === "" && diastolic === "" ? (
                    <p className="text-[0.95rem] text-cyan-300">Enter systolic and diastolic values to see the result here.</p>
                  ) : !isValidSystolic || !isValidDiastolic ? (
                    <p className="text-[0.95rem] text-yellow-300">Please enter valid values: systolic 60–300 and diastolic 40–200 mmHg.</p>
                  ) : (
                    <>
                      <p className="text-[0.95rem] text-cyan-300">Systolic: <span className="font-semibold text-white">{systolicValue.toFixed(0)} mmHg</span></p>
                      <p className="text-[0.95rem]">Diastolic: <span className="font-semibold text-white">{diastolicValue.toFixed(0)} mmHg</span></p>
                      <p className="text-[0.95rem] mt-[0.5rem]">Result: <span className="font-bold text-white">{bpCategory?.label ?? "Unknown"}</span></p>
                      <p className="text-[0.95rem] text-cyan-300">Range: {bpCategory?.range}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">
                <button
                  type="submit"
                  className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer"
                >
                  Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        BICA Outpatient Self-Service Kiosk • Northern Mindanao Medical Center
      </footer>
    </div>
  );
}