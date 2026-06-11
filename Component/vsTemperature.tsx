'use client'
import React, { useMemo, useState } from "react";

const TEMPERATURE_CATEGORIES = [
  { label: "🔴 CRITICAL LOW", range: "< 35.0 °C", min: Number.NEGATIVE_INFINITY, max: 35.0, color: "bg-red-600" },
  { label: "Hypothermia", range: "35.0 – 36.9 °C", min: 35.0, max: 37.0, color: "bg-blue-400" },
  { label: "Normal", range: "37.0 – 37.2 °C", min: 37.0, max: 37.3, color: "bg-green-400" },
  { label: "Low-grade Fever", range: "37.3 – 38.0 °C", min: 37.3, max: 38.1, color: "bg-yellow-400" },
  { label: "Moderate Fever", range: "38.1 – 41.5 °C", min: 38.1, max: 41.5, color: "bg-orange-400" },
  { label: "🔴 CRITICAL HIGH", range: "> 41.5 °C", min: 41.5, max: Number.POSITIVE_INFINITY, color: "bg-red-600" },
];

interface VsTemperatureProps {
  onBack?: () => void;
  onProceed?: (values: { temperature: string }) => void;
}

export default function VsTemperature({ onBack, onProceed }: VsTemperatureProps) {
  const [temperature, setTemperature] = useState("");
  const [alertTriggered, setAlertTriggered] = useState(false);

  const temperatureValue = parseFloat(temperature);
  const isValidTemperature = !Number.isNaN(temperatureValue) && temperatureValue >= 30 && temperatureValue <= 45;

  const category = useMemo(() => {
    if (!isValidTemperature) return null;
    return TEMPERATURE_CATEGORIES.find((item) => temperatureValue >= item.min && temperatureValue < item.max) ?? null;
  }, [temperatureValue, isValidTemperature]);

  const criticalTempMessage = useMemo(() => {
    if (!category) return null;
    if (category.label === "🔴 CRITICAL LOW") return "Temperature is critically low. Please proceed to emergency care immediately.";
    if (category.label === "🔴 CRITICAL HIGH") return "Temperature is critically high. Please proceed to emergency care immediately.";
    return null;
  }, [category]);

  const showCriticalTempOverlay = alertTriggered && !!criticalTempMessage;

  return (
    <div className="">
      {showCriticalTempOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950 bg-opacity-95 p-6">
          <div className="w-full max-w-4xl bg-red-600 border-4 border-white rounded-xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-5xl font-extrabold mb-4">IMMEDIATE ER REDIRECTION</h3>
            <p className="text-2xl mb-5">{criticalTempMessage}</p>
            <p className="text-3xl font-medium bg-red-950 px-6 py-5 rounded-lg inline-block">
              Please get your ticket and proceed immediately to the ER!
            </p>
            <button
              onClick={() => {
                setTemperature("");
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
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="min-h-screen flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">Vital Sign Measurement</h1>
          <p className="text-[1.7rem] font-serif text-white">Patient Temperature (T)</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">
          
          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-lg p-[1.5rem]">
            <h2 className="text-[1.4rem] font-bold text-white">Procedure</h2>
            <p className="text-[1.3rem] text-cyan-300">Please follow the instructions below to take your Temperature reading.</p>
            {[
              "Pick up the Temperature Gun located on the right side of the kiosk.",
              "Remove any hat, bandana, or head covering before taking the reading.",
              "Point the device at the center of your forehead, 3–5 cm away from the skin.",
              "Hold still and press the trigger button to take your reading.",
              "Read the temperature value shown on the display.",
              "Input the value in °C into the box on the right side and click Proceed.",
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
              <h2 className="text-[1.4rem] font-bold text-white">Temperature Reading</h2>
              <p className="text-[0.9rem] text-cyan-300">Enter the value shown on the thermometer.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAlertTriggered(true);
                if (isValidTemperature && !criticalTempMessage) {
                  onProceed?.({ temperature });
                }
              }}
              className="flex flex-col gap-[1rem]"
            >
              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Temperature (°C) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 36.8"
                  min="30"
                  max="45"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </section>

              {/* Patient Temperature Results */}
              <div className="flex flex-col gap-[0.75rem] bg-cyan-950 rounded-lg px-[0.9rem] py-[0.9rem]">
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider">Patient Temperature Results</p>
                </div>
                <div className="rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white">
                  {temperature === "" ? (
                    <p className="text-[0.95rem] text-cyan-300">Enter a temperature to see the result here.</p>
                  ) : !isValidTemperature ? (
                    <p className="text-[0.95rem] text-yellow-300">Please enter a valid temperature between 30.0 and 45.0 °C.</p>
                  ) : (
                    <>
                      <p className="text-[0.95rem]">Temperature: <span className="font-semibold text-white">{temperatureValue.toFixed(1)} °C</span></p>
                      <p className="text-[0.95rem]">Result: <span className="font-bold text-white">{category?.label ?? "Unknown"}</span></p>
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
                <button type="submit" className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer">Proceed</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}