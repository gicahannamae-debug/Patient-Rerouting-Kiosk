'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

const TEMPERATURE_CATEGORIES = [
  { label: "🔴 CRITICAL LOW", range: "< 32.0 °C", min: Number.NEGATIVE_INFINITY, max: 32.0, color: "bg-red-600" },
  { label: "Hypothermia", range: "32.0 – 34.9 °C", min: 32.0, max: 35.0, color: "bg-blue-400" },
  { label: "Below normal", range: "35.0 – 36.4 °C", min: 35.0, max: 36.5, color: "bg-cyan-400" },
  { label: "Normal", range: "36.5 – 37.5 °C", min: 36.5, max: 37.6, color: "bg-green-400" },
  { label: "Elevated", range: "37.6 – 37.9 °C", min: 37.6, max: 38.0, color: "bg-yellow-400" },
  { label: "Low-grade Fever", range: "38.0 – 38.9 °C", min: 38.0, max: 39.0, color: "bg-orange-400" },
  { label: "High Fever", range: "39.0 – 40.0 °C", min: 39.0, max: 40.1, color: "bg-orange-500" },
  { label: "🔴 CRITICAL HIGH", range: "> 40.0 °C", min: 40.1, max: Number.POSITIVE_INFINITY, color: "bg-red-600" },
];

interface VsTemperatureProps {
  language: KioskLanguage;
  onLogout?: () => void;
  onProceed?: (values: { temperature: string }) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function VsTemperature({
  language,
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
}: VsTemperatureProps) {
  const [temperature, setTemperature] = useState("");
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const isCebuano = language === "ceb";

  const temperatureValue = parseFloat(temperature);
  const isValidTemperature = !Number.isNaN(temperatureValue) && temperatureValue >= 30 && temperatureValue <= 45;

  const category = useMemo(() => {
    if (!isValidTemperature) return null;
    return TEMPERATURE_CATEGORIES.find((item) => temperatureValue >= item.min && temperatureValue < item.max) ?? null;
  }, [temperatureValue, isValidTemperature]);

  const criticalTempMessage = useMemo(() => {
    if (!category) return null;
    if (category.label === "🔴 CRITICAL LOW") return isCebuano ? "Ubos kaayo ang temperatura. Palihog adto dayon sa emergency room." : "Temperature is critically low. Please proceed to emergency care immediately.";
    if (category.label === "🔴 CRITICAL HIGH") return isCebuano ? "Taas kaayo ang temperatura. Palihog adto dayon sa emergency room." : "Temperature is critically high. Please proceed to emergency care immediately.";
    return null;
  }, [category, isCebuano]);

  const showCriticalTempOverlay = alertTriggered && !!criticalTempMessage;

  const updateTemperature = (value: string) => {
    if (value === ".") {
      if (temperature.includes(".") || temperature.length >= 2) return;
      setTemperature(`${temperature || "0"}.`);
    } else if (temperature.includes(".")) {
      if (temperature.split(".")[1].length >= 1 || temperature.length >= 4) return;
      setTemperature(`${temperature}${value}`);
    } else {
      if (temperature.length >= 2) return;
      setTemperature(`${temperature}${value}`);
    }
    setAlertTriggered(false);
  };

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      {showCriticalTempOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950 bg-opacity-95 p-6">
          <div className="w-full max-w-4xl bg-red-600 border-4 border-white rounded-xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-5xl font-extrabold mb-4">{isCebuano ? "ADTO DAYON SA EMERGENCY ROOM" : "IMMEDIATE ER REDIRECTION"}</h3>
            <p className="text-2xl mb-5">{criticalTempMessage}</p>
            <p className="text-3xl font-medium bg-red-950 px-6 py-5 rounded-lg inline-block">
              {isCebuano ? "Kuhaa ang imong tiket ug adto dayon sa emergency room!" : "Please get your ticket and proceed immediately to the ER!"}
            </p>
            <button
              onClick={() => {
                setTemperature("");
                setAlertTriggered(false);
                setKeypadOpen(false);
              }}
              className="block mx-auto mt-8 text-base text-red-200 hover:underline opacity-70"
            >
              {isCebuano ? "Kanselahon / I-reset ang kiosk" : "Cancel / Reset Kiosk"}
            </button>
          </div>
        </div>
      )}
      <KioskHeader
        language={language}
        activeStep={4}
        vitalPart={3}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">{isCebuano ? "Pagsukod sa mga Vital Sign" : "Vital Sign Measurement"}</h1>
          <p className="text-[1.7rem] font-serif text-white">{isCebuano ? "Temperatura sa Pasyente (T)" : "Patient Temperature (T)"}</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">
          
          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-lg p-[1.5rem]">
            <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Pamaagi" : "Procedure"}</h2>
            <p className="text-[1.3rem] text-cyan-300">{isCebuano ? "Sunda ang mga instruksyon sa ubos aron masukod ang imong temperatura." : "Please follow the instructions below to take your Temperature reading."}</p>
            {(isCebuano ? [
              "Kuhaa ang temperature gun nga naa sa tuo nga bahin sa kiosk.",
              "Tangtanga ang kalo, bandana, o tabon sa ulo sa dili pa mosukod.",
              "Itudlo ang aparato sa tunga sa agtang, 3–5 cm ang gilay-on sa panit.",
              "Ayaw lihok ug pislita ang gatilyo aron makuha ang sukod.",
              "Basaha ang numero sa temperatura nga makita sa screen.",
              "Isulod ang numero sa °C sa kahon sa tuo ug pislita ang Padayon.",
            ] : [
              "Pick up the Temperature Gun located on the right side of the kiosk.",
              "Remove any hat, bandana, or head covering before taking the reading.",
              "Point the device at the center of your forehead, 3–5 cm away from the skin.",
              "Hold still and press the trigger button to take your reading.",
              "Read the temperature value shown on the display.",
              "Input the value in °C into the box on the right side and click Proceed.",
            ]).map((step, i) => (
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
              <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Resulta sa Temperatura" : "Temperature Reading"}</h2>
              <p className="text-[0.9rem] text-cyan-300">{isCebuano ? "Isulod ang numero nga makita sa thermometer." : "Enter the value shown on the thermometer."}</p>
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
                  {isCebuano ? "Temperatura (°C)" : "Temperature (°C)"} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder={isCebuano ? "Pislita aron mosulod" : "Tap to enter"}
                  value={temperature}
                  onClick={() => setKeypadOpen(true)}
                  aria-label={isCebuano ? "Temperatura sa Celsius" : "Temperature in Celsius"}
                  className={`text-[1rem] text-cyan-950 border ${keypadOpen ? "border-orange-400 ring-2 ring-orange-300" : "border-stone-300"} bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none cursor-pointer`}
                />
              </section>

              {keypadOpen && (
                <section className="rounded-xl border border-cyan-600 bg-cyan-900 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">{isCebuano ? "Keypad sa Temperatura" : "Temperature Keypad"}</h3>
                    <button type="button" onClick={() => setKeypadOpen(false)} className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
                      {isCebuano ? "Human" : "Done"}
                    </button>
                  </div>
                  <p className="mb-3 text-center text-sm text-cyan-200">{isCebuano ? "Gitugot nga sukod: 30.0–45.0 °C" : "Allowed range: 30.0–45.0 °C"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                      <button key={digit} type="button" onClick={() => updateTemperature(digit)} className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300">{digit}</button>
                    ))}
                    <button type="button" onClick={() => { setTemperature(""); setAlertTriggered(false); }} className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500">{isCebuano ? "Haw-asa" : "Clear"}</button>
                    <button type="button" onClick={() => updateTemperature("0")} className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200">0</button>
                    <button type="button" onClick={() => updateTemperature(".")} className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200">.</button>
                    <button type="button" onClick={() => { setTemperature((value) => value.slice(0, -1)); setAlertTriggered(false); }} aria-label={isCebuano ? "Tangtanga ang kataposang numero" : "Delete last digit"} className="col-span-3 min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600">⌫</button>
                  </div>
                </section>
              )}

              {/* Patient Temperature Results */}
              <div className="flex flex-col gap-[0.75rem] bg-cyan-950 rounded-lg px-[0.9rem] py-[0.9rem]">
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider">{isCebuano ? "Resulta sa Temperatura sa Pasyente" : "Patient Temperature Results"}</p>
                </div>
                <div className="rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white">
                  {temperature === "" ? (
                    <p className="text-[0.95rem] text-cyan-300">{isCebuano ? "Isulod ang temperatura aron makita ang resulta dinhi." : "Enter a temperature to see the result here."}</p>
                  ) : !isValidTemperature ? (
                    <p className="text-[0.95rem] text-yellow-300">{isCebuano ? "Isulod ang husto nga temperatura tali sa 30.0 ug 45.0 °C." : "Please enter a valid temperature between 30.0 and 45.0 °C."}</p>
                  ) : (
                    <>
                      <p className="text-[0.95rem]">{isCebuano ? "Temperatura" : "Temperature"}: <span className="font-semibold text-white">{temperatureValue.toFixed(1)} °C</span></p>
                      <p className="text-[0.95rem]">{isCebuano ? "Resulta" : "Result"}: <span className="font-bold text-white">{category ? (isCebuano ? ({
                        "🔴 CRITICAL LOW": "🔴 UBOS KAAYO",
                        Hypothermia: "Ubos kaayo ang temperatura sa lawas",
                        Normal: "Normal",
                        "Low-grade Fever": "Gamay nga Hilanat",
                        "Moderate Fever": "Kasagarang Hilanat",
                        "🔴 CRITICAL HIGH": "🔴 TAAS KAAYO",
                      }[category.label] ?? category.label) : category.label) : "Unknown"}</span></p>
                    </>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">
                <button type="submit" className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer">{isCebuano ? "Padayon" : "Proceed"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}