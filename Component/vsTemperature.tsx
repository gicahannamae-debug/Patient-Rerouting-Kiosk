'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

export type TempQueue = "ER" | "URGENT" | "NORMAL";

type TempCategory = {
  label: string;
  range: string;
  min: number; // inclusive
  max: number; // exclusive
  queue: TempQueue;
  color: "red" | "orange" | "green";
};

// Clinic-side only. These labels are never shown to the patient.
const TEMPERATURE_CATEGORIES: TempCategory[] = [
  { label: "Critically Low", range: "< 35.0 °C", min: Number.NEGATIVE_INFINITY, max: 35.0, queue: "ER", color: "red" },
  { label: "Borderline Low", range: "35.0 – 36.0 °C", min: 35.0, max: 36.1, queue: "URGENT", color: "orange" },
  { label: "Normal", range: "36.1 – 37.2 °C", min: 36.1, max: 37.3, queue: "NORMAL", color: "green" },
  { label: "Borderline High", range: "37.3 – 37.9 °C", min: 37.3, max: 38.0, queue: "URGENT", color: "orange" },
  // Assumption: 38.0 – 40.0 had no row, so it is treated as Critically High (ER).
  { label: "Critically High", range: "≥ 38.0 °C", min: 38.0, max: Number.POSITIVE_INFINITY, queue: "ER", color: "red" },
];

export interface TemperatureResult {
  temperature: string;
  category: string;
  queue: TempQueue;
  color: "red" | "orange" | "green";
  /** True when a Normal reading was upgraded to URGENT because of patient status. */
  priorityOverride: boolean;
}

interface VsTemperatureProps {
  language: KioskLanguage;
  /** True for PWD, senior, pregnant, or any other priority status. */
  isPriorityPatient?: boolean;
  /** Previously entered value (from the parent) so it reappears when the patient comes back. */
  initialTemperature?: string;
  onLogout?: () => void;
  onProceed?: (values: TemperatureResult) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function VsTemperature({
  language,
  isPriorityPatient = false,
  initialTemperature = "",
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
}: VsTemperatureProps) {
  const [temperature, setTemperature] = useState(initialTemperature);
  // True while a prefilled value is untouched: the first keypad tap starts fresh
  // instead of appending to the old reading.
  const [fresh, setFresh] = useState(initialTemperature !== "");
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const isCebuano = language === "ceb";

  const temperatureValue = parseFloat(temperature);
  const isValidTemperature = !Number.isNaN(temperatureValue) && temperatureValue >= 30 && temperatureValue <= 45;

  // Clinic-side classification and queue routing (not displayed to the patient)
  const routing = useMemo<TemperatureResult | null>(() => {
    if (!isValidTemperature) return null;

    const category = TEMPERATURE_CATEGORIES.find(
      (item) => temperatureValue >= item.min && temperatureValue < item.max
    );
    if (!category) return null;

    // Critical -> ER always. Normal + priority patient -> URGENT.
    const priorityOverride = category.queue === "NORMAL" && isPriorityPatient;
    const queue: TempQueue = priorityOverride ? "URGENT" : category.queue;
    const color = priorityOverride ? "orange" : category.color;

    return {
      temperature: temperatureValue.toFixed(1),
      category: category.label,
      queue,
      color,
      priorityOverride,
    };
  }, [temperatureValue, isValidTemperature, isPriorityPatient]);

  const updateTemperature = (value: string) => {
    const base = fresh ? "" : temperature;
    setFresh(false);

    if (value === ".") {
      // needs at least one digit, max two digits before the point, only one point
      if (base.includes(".") || base.length === 0 || base.length > 2) {
        setTemperature(base);
        return;
      }
      setTemperature(`${base}.`);
    } else if (base.includes(".")) {
      // only one decimal digit
      if (base.split(".")[1].length >= 1) {
        setTemperature(base);
        return;
      }
      setTemperature(`${base}${value}`);
    } else {
      if (base.length >= 2) {
        setTemperature(base);
        return;
      }
      setTemperature(`${base}${value}`);
    }
  };

  const clearTemperature = () => {
    setFresh(false);
    setTemperature("");
  };

  const backspaceTemperature = () => {
    if (fresh) {
      setFresh(false);
      setTemperature((value) => value.slice(0, -1));
      return;
    }
    setTemperature((value) => value.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
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
                if (!isValidTemperature) return;
                setShowConfirmPopup(true);
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
                  placeholder={isCebuano ? "Gamita ang keypad sa ubos" : "Use the keypad below"}
                  value={temperature}
                  onClick={clearTemperature}
                  aria-label={isCebuano ? "Temperatura sa Celsius" : "Temperature in Celsius"}
                  className={`text-[1rem] text-cyan-950 border ${!fresh ? "border-orange-400 ring-2 ring-orange-300" : "border-stone-300"} bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none cursor-pointer`}
                />
                {temperature !== "" && !isValidTemperature && (
                  <p className="text-[0.95rem] text-yellow-300">
                    {isCebuano
                      ? "Isulod ang husto nga temperatura tali sa 30.0 ug 45.0 °C."
                      : "Please enter a valid temperature between 30.0 and 45.0 °C."}
                  </p>
                )}
              </section>

              {/* KEYPAD: always visible, no title row and no Done button */}
              <section className="rounded-xl border border-cyan-600 bg-cyan-900 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                    <button key={digit} type="button" onClick={() => updateTemperature(digit)} className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300">{digit}</button>
                  ))}
                  <button type="button" onClick={clearTemperature} className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500">{isCebuano ? "Haw-asa" : "Clear"}</button>
                  <button type="button" onClick={() => updateTemperature("0")} className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200">0</button>
                  <button type="button" onClick={() => updateTemperature(".")} className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200">.</button>
                  <button type="button" onClick={backspaceTemperature} aria-label={isCebuano ? "Tangtanga ang kataposang numero" : "Delete last digit"} className="col-span-3 min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600">⌫</button>
                </div>
              </section>

              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">
                <button type="submit" className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer">{isCebuano ? "Padayon" : "Proceed"}</button>
              </div>
            </form>

            {/* POP UP: CONFIRMATION */}
            {showConfirmPopup && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
                <div className="w-full max-w-xl rounded-2xl border-2 border-cyan-500 bg-cyan-950 p-8 text-center shadow-2xl">
                  <h3 className="mb-4 text-3xl font-extrabold text-white">
                    {isCebuano ? "Kumpirmaha ang Temperatura" : "Confirm Temperature"}
                  </h3>

                  <p className="mb-6 text-lg text-cyan-200">
                    {isCebuano
                      ? "Siguroha nga parehas kini nga numero sa gipakita sa thermometer."
                      : "Please verify that this reading matches the value displayed on the thermometer."}
                  </p>

                  <div className="mb-6 rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                    <p className="mb-2 text-sm font-semibold text-cyan-200">
                      {isCebuano ? "TEMPERATURA" : "TEMPERATURE"}
                    </p>
                    <p className="text-5xl font-extrabold text-white">
                      {temperatureValue.toFixed(1)} <span className="text-xl">°C</span>
                    </p>
                  </div>

                  <p className="mb-6 text-base text-yellow-300">
                    {isCebuano ? "Husto ba kini nga numero?" : "Is this value correct?"}
                  </p>

                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPopup(false)}
                      className="rounded-lg bg-stone-200 px-6 py-3 text-lg font-bold text-cyan-950 hover:bg-stone-300"
                    >
                      {isCebuano ? "Balik" : "Go Back"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmPopup(false);
                        if (routing) onProceed?.(routing);
                      }}
                      className="rounded-lg bg-orange-50 px-6 py-3 text-lg font-bold text-cyan-950 hover:bg-orange-100"
                    >
                      {isCebuano ? "Oo, Kumpirmaha" : "Yes, Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}