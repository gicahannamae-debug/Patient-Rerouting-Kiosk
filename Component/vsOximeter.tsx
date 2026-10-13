'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";

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
  onLogout?: () => void;
  onProceed?: (values: { spo2: string; hr: string }) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function vsOximeter({
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
}: VsOximeterProps) {
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

// ADDED 10-14-2026

  const [activeField, setActiveField] = useState<"spo2" | "heartRate" | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const updateActiveValue = (digit: string) => {
    if (!activeField) return;

    const current = activeField === "spo2" ? spo2 : heartRate;

    if (current.length >= 3) return;

    const nextValue = current + digit;

    if (activeField === "spo2") {
      setSpo2(nextValue);
    } else {
      setHeartRate(nextValue);
    }

    setAlertTriggered(false);
  };

  const clearActiveValue = () => {
    if (activeField === "spo2") {
      setSpo2("");
    } else if (activeField === "heartRate") {
      setHeartRate("");
    }

    setAlertTriggered(false);
  };

  const backspaceActiveValue = () => {
    if (activeField === "spo2") {
      setSpo2((previous) => previous.slice(0, -1));
    } else if (activeField === "heartRate") {
      setHeartRate((previous) => previous.slice(0, -1));
    }

    setAlertTriggered(false);
  };

  const [showValidationPopup, setShowValidationPopup] = useState(false);

  //END OF ADDED 10-14-2026

  return (

    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
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

      <KioskHeader
        activeStep={4}
        vitalPart={2}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">

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

                if (!isValidSpo2 || !isValidHeartRate) {
                  setAlertTriggered(false);
                  setShowValidationPopup(true);
                  return;
                }

                setShowValidationPopup(false);
                setAlertTriggered(false);
                setShowConfirmPopup(true);
              }}
              className="flex flex-col gap-[1rem]"
            >

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  SpO₂ (%) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder="Tap to enter SpO₂"
                  value={spo2}
                  onClick={() => setActiveField("spo2")}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer"
                />
              </section>

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Heart Rate (bpm) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder="Tap to enter Heart Rate"
                  value={heartRate}
                  onClick={() => setActiveField("heartRate")}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer"
                />
              </section>

           
              {
              // NUM PAD UI 10-14-2026
              activeField && (
                <section className="rounded-xl border border-cyan-600 bg-cyan-900 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {activeField === "spo2" ? "SpO₂" : "Heart Rate"} Keypad
                    </h3>

                    <button
                      type="button"
                      onClick={() => setActiveField(null)}
                      className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      Done
                    </button>
                  </div>

                  <div className="mb-3 text-center text-sm text-cyan-200">
                    {activeField === "spo2"
                      ? "Allowed range: 50–100%"
                      : "Allowed range: 30–250 bpm"}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                      (digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => updateActiveValue(digit)}
                          className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300"
                        >
                          {digit}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={clearActiveValue}
                      className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => updateActiveValue("0")}
                      className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      onClick={backspaceActiveValue}
                      aria-label="Delete last digit"
                      className="min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600"
                    >
                      ⌫
                    </button>
                  </div>
                </section>
              )}

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
                  type="submit"
                  className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer"
                >
                  Proceed
                </button>

              </div>

              {
              // POP UP OF FOR CONFIRMATION VITAL SIGN 10-14-2026
              showValidationPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
                  <div className="w-full max-w-xl rounded-2xl border-2 border-red-500 bg-cyan-950 p-8 text-center shadow-2xl">
                    <h3 className="mb-4 text-3xl font-extrabold text-red-400">
                      Invalid Vital Sign Readings
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      Please enter valid values within the allowed ranges before proceeding.
                    </p>

                    <div className="mb-6 space-y-3 text-left">
                      {!isValidSpo2 && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">SpO₂ (%)</p>
                          <p className="text-red-300">
                            {spo2.trim() === ""
                              ? "Please enter your SpO₂ reading."
                              : "Enter a valid SpO₂ value between 50 and 100%."}
                          </p>
                        </div>
                      )}

                      {!isValidHeartRate && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">Heart Rate (bpm)</p>
                          <p className="text-red-300">
                            {heartRate.trim() === ""
                              ? "Please enter your heart rate reading."
                              : "Enter a valid heart rate between 30 and 250 bpm."}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowValidationPopup(false);
                        setActiveField(!isValidSpo2 ? "spo2" : "heartRate");
                      }}
                      className="rounded-lg bg-orange-50 px-8 py-3 text-lg font-bold text-cyan-950 hover:bg-orange-100"
                    >
                      Correct Values
                    </button>
                  </div>
                </div>
              )}

              {
              //POP UP OF CONFIRMATION OXYGEN 10-14-2026
              showConfirmPopup && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
                  <div className="w-full max-w-xl rounded-2xl border-2 border-cyan-500 bg-cyan-950 p-8 text-center shadow-2xl">
                    <h3 className="mb-4 text-3xl font-extrabold text-white">
                      Confirm Oxygen Readings
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      Please verify that these readings match the values displayed on the
                      pulse oximeter.
                    </p>

                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">
                          SpO₂
                        </p>
                        <p className="text-4xl font-extrabold text-white">
                          {spo2} <span className="text-lg">%</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">
                          HEART RATE
                        </p>
                        <p className="text-4xl font-extrabold text-white">
                          {heartRate} <span className="text-lg">bpm</span>
                        </p>
                      </div>
                    </div>

                    <p className="mb-6 text-base text-yellow-300">
                      Are these values correct?
                    </p>

                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmPopup(false);
                          setActiveField("spo2");
                        }}
                        className="rounded-lg bg-stone-200 px-6 py-3 text-lg font-bold text-cyan-950 hover:bg-stone-300"
                      >
                        Go Back
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmPopup(false);

                          if (criticalOximeterMessage) {
                            // Show the emergency alert only after confirmation.
                            setAlertTriggered(true);
                            return;
                          }

                          onProceed?.({ spo2, hr: heartRate });
                        }}
                        className="rounded-lg bg-orange-50 px-6 py-3 text-lg font-bold text-cyan-950 hover:bg-orange-100"
                      >
                        Yes, Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}