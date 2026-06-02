'use client'
import React, { useMemo, useState } from "react";

const SPO2_CATEGORIES = [
  { label: "Normal", range: "95% – 100%", min: 95, max: 101, color: "bg-green-400" },
  { label: "Acceptable", range: "91% – 94%", min: 91, max: 95, color: "bg-yellow-400" },
  { label: "Low", range: "86% – 90%", min: 86, max: 91, color: "bg-orange-400" },
  { label: "🔴 CRITICAL", range: "< 90%", min: 0, max: 90, color: "bg-red-600" },
];

const HR_CATEGORIES = [
  { label: "🔴 CRITICAL LOW", range: "< 50 bpm", min: 0, max: 50, color: "bg-red-600" },
  { label: "Bradycardia", range: "50 – 59 bpm", min: 50, max: 60, color: "bg-blue-400" },
  { label: "Normal", range: "60 – 100 bpm", min: 60, max: 101, color: "bg-green-400" },
  { label: "Tachycardia", range: "101 – 120 bpm", min: 101, max: 120, color: "bg-orange-400" },
  { label: "🔴 CRITICAL HIGH", range: "> 120 bpm", min: 120, max: 1000, color: "bg-red-600" },
];

interface VsOximeterProps {
  onBack?: () => void;
  onProceed?: () => void;
}

export default function vsOximeter({ onBack, onProceed }: VsOximeterProps) {
  const [spo2, setSpo2] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [alertTriggered, setAlertTriggered] = useState(false);

  const spo2Value = parseFloat(spo2);
  const heartRateValue = parseFloat(heartRate);
  const isValidSpo2 = !Number.isNaN(spo2Value) && spo2Value >= 50 && spo2Value <= 100;
  const isValidHeartRate = !Number.isNaN(heartRateValue) && heartRateValue >= 30 && heartRateValue <= 250;

  const spo2Category = useMemo(() => {
    if (!isValidSpo2) return null;
    return SPO2_CATEGORIES.find((item) => spo2Value >= item.min && spo2Value < item.max) ?? null;
  }, [spo2Value, isValidSpo2]);

  const heartRateCategory = useMemo(() => {
    if (!isValidHeartRate) return null;
    return HR_CATEGORIES.find((item) => heartRateValue >= item.min && heartRateValue < item.max) ?? null;
  }, [heartRateValue, isValidHeartRate]);

  const criticalOximeterMessage = useMemo(() => {
    const messages: string[] = [];
    if (spo2Category?.label === "🔴 CRITICAL") messages.push("SpO₂ is critically low.");
    if (heartRateCategory?.label === "🔴 CRITICAL LOW") messages.push("Heart rate is critically low.");
    if (heartRateCategory?.label === "🔴 CRITICAL HIGH") messages.push("Heart rate is critically high.");
    return messages.length ? `${messages.join(" ")} Please proceed to emergency care immediately.` : null;
  }, [spo2Category, heartRateCategory]);

  const showCriticalOximeterOverlay = alertTriggered && !!criticalOximeterMessage;

  return (

    <div className="">
      {showCriticalOximeterOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950 bg-opacity-95 p-6">
          <div className="w-full max-w-4xl bg-red-600 border-4 border-white rounded-xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-5xl font-extrabold mb-4">IMMEDIATE ER REDIRECTION</h3>
            <p className="text-2xl mb-5">{criticalOximeterMessage}</p>
            <p className="text-3xl font-medium bg-red-950 px-6 py-5 rounded-lg inline-block">
              Please get your ticket and proceed immediately to the ER!
            </p>
            <button
              onClick={() => {
                setSpo2("");
                setHeartRate("");
                setAlertTriggered(false);
              }}
              className="block mx-auto mt-8 text-base text-red-200 hover:underline opacity-70"
            >
              Cancel / Reset Kiosk
            </button>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-yellow-50">
        <div className="container mx-auto flex items-center justify-between">

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p className="w-full">Better Informed Care Access</p>
          </div>

          <div className="pr-[2rem]">
            <ul className="md:flex space-x-8 hidden text-xl font-semibold w-full">
              <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline text-orange-600 underline">Vital Signs |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Chief Complaints |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Summary |</a></li>
            </ul>
            <div className="md:hidden">
              <a className="text-4xl font-semibold" href="#">&#8801;</a>
            </div>
          </div>

        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="min-h-screen flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">

        {/* Header */}
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">Vital Sign Measurement</h1>
          <p className="text-[1.7rem] font-serif text-white">Patient Oxygen Saturation (SpO₂) and Heart Rate (HR)</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">

          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-lg p-[1.5rem]">

            <h2 className="text-[1.4rem] font-bold text-white">Procedure</h2>
            <p className="text-[1.3rem] text-cyan-300">Please follow the instructions below to take your SpO₂ and Heart Rate reading.</p>

            {[
              "Pick up the Pulse Oximeter device located on the right side of the kiosk.",
              "Place the device clip on your index finger — make sure it fits snugly and your fingernail faces upward.",
              "Keep your hand still and relaxed. Avoid moving or shaking during the measurement.",
              "Wait for the reading to stabilize — this usually takes 10 to 15 seconds.",
              "Read the SpO₂ (%) and Heart Rate (bpm) values shown on the oximeter display.",
              "Input both values into the boxes on the right side and click Proceed.",
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
              <h2 className="text-[1.4rem] font-bold text-white">SpO₂ and HR Reading</h2>
              <p className="text-[0.9rem] text-cyan-300">Enter the values shown on the oximeter.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAlertTriggered(true);
                if (!criticalOximeterMessage) {
                  onProceed?.();
                }
              }}
              className="flex flex-col gap-[1rem]"
            >

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  SpO₂ (%) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  min="50"
                  max="100"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </section>

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Heart Rate (bpm) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  min="30"
                  max="250"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </section>

              {/* Patient Oxygen Results */}
              <div className="flex flex-col gap-[0.75rem] bg-cyan-950 rounded-lg px-[0.9rem] py-[0.9rem]">
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider">Patient Oxygen Results</p>
                </div>

                <div className="rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white">
                  {spo2 === "" && heartRate === "" ? (
                    <p className="text-[0.95rem] text-cyan-300">Enter SpO₂ and heart rate values to see the result here.</p>
                  ) : !isValidSpo2 || !isValidHeartRate ? (
                    <p className="text-[0.95rem] text-yellow-300">Please enter valid values: SpO₂ 50–100% and HR 30–250 bpm.</p>
                  ) : (
                    <>
                      <p className="text-[0.95rem] text-cyan-300">SpO₂: <span className="font-semibold text-white">{spo2Value.toFixed(0)}%</span></p>
                      <p className="text-[0.95rem]">SpO₂ status: <span className="font-bold text-white">{spo2Category?.label ?? "Unknown"}</span></p>
                      <p className="text-[0.95rem] text-cyan-300 mt-[0.5rem]">Heart Rate: <span className="font-semibold text-white">{heartRateValue.toFixed(0)} bpm</span></p>
                      <p className="text-[0.95rem]">HR status: <span className="font-bold text-white">{heartRateCategory?.label ?? "Unknown"}</span></p>
                    </>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">

                <button
                  type="button"
                  onClick={() => onBack?.()}
                  className="text-[1rem] font-semibold bg-transparent text-orange-50 border border-orange-100 px-[1.5rem] py-[0.5rem] rounded-md hover:bg-cyan-800 cursor-pointer"
                >
                  ← Back
                </button>

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
    </div>
  );
}