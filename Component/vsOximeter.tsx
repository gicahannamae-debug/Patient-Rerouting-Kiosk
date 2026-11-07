'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

export type VitalQueue = "ER" | "URGENT" | "NORMAL";
export type QueueColor = "red" | "orange" | "green" | "yellow";
type Severity = "CRITICAL" | "BORDERLINE" | "NORMAL";

type VitalCategory = {
  label: string;
  range: string;
  min: number; // inclusive
  max: number; // exclusive
  severity: Severity;
};

// Clinic-side only. These labels are never shown to the patient.
const SPO2_CATEGORIES: VitalCategory[] = [
  { label: "Critically Low", range: "< 90%", min: 0, max: 90, severity: "CRITICAL" },
  { label: "Borderline Low", range: "90% – 94%", min: 90, max: 95, severity: "BORDERLINE" },
  { label: "Normal", range: "95% – 100%", min: 95, max: 101, severity: "NORMAL" },
];

const HR_CATEGORIES: VitalCategory[] = [
  // Assumption: 40–49 had no row, so it is treated as Critically Low.
  { label: "Critically Low", range: "< 50 bpm", min: 0, max: 50, severity: "CRITICAL" },
  { label: "Borderline Low", range: "50 – 59 bpm", min: 50, max: 60, severity: "BORDERLINE" },
  { label: "Normal", range: "60 – 100 bpm", min: 60, max: 101, severity: "NORMAL" },
  // Assumption: 101–120 had no row, so it is treated as Borderline High (urgent).
  { label: "Borderline High", range: "101 – 120 bpm", min: 101, max: 121, severity: "BORDERLINE" },
  { label: "Critically High", range: "> 120 bpm", min: 121, max: Number.POSITIVE_INFINITY, severity: "CRITICAL" },
];

const SEVERITY_RANK: Record<Severity, number> = { NORMAL: 0, BORDERLINE: 1, CRITICAL: 2 };

export interface OximeterResult {
  spo2: string;
  hr: string;
  spo2Category: string;
  hrCategory: string;
  /** Worst of the two readings. */
  queue: VitalQueue;
  /** red = critical, orange = borderline, green = normal, yellow = normal but priority patient. */
  color: QueueColor;
  /** True when a Normal result was upgraded because of patient status. */
  priorityOverride: boolean;
}

type FieldName = "spo2" | "heartRate";

interface VsOximeterProps {
  language: KioskLanguage;
  /** True for PWD, senior, pregnant, or any other priority status. */
  isPriorityPatient?: boolean;
  /** Previously entered values (from the parent) so they reappear when the patient comes back. */
  initialSpo2?: string;
  initialHeartRate?: string;
  onLogout?: () => void;
  onProceed?: (values: OximeterResult) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function VsOximeter({
  language,
  isPriorityPatient = false,
  initialSpo2 = "",
  initialHeartRate = "",
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
}: VsOximeterProps) {
  const [spo2, setSpo2] = useState(initialSpo2);
  const [heartRate, setHeartRate] = useState(initialHeartRate);
  // Start on SpO₂ for a fresh page; if values are prefilled, wait for a tap
  const [activeField, setActiveField] = useState<FieldName | null>(
    initialSpo2 || initialHeartRate ? null : "spo2"
  );
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const isCebuano = language === "ceb";

  const spo2Value = parseFloat(spo2);
  const heartRateValue = parseFloat(heartRate);
  const isValidSpo2 = !Number.isNaN(spo2Value) && spo2Value >= 0 && spo2Value <= 100;
  const isValidHeartRate = !Number.isNaN(heartRateValue) && heartRateValue >= 30 && heartRateValue <= 250;

  // Clinic-side classification and queue routing (not displayed to the patient)
  const routing = useMemo<OximeterResult | null>(() => {
    if (!isValidSpo2 || !isValidHeartRate) return null;

    const spo2Cat = SPO2_CATEGORIES.find((c) => spo2Value >= c.min && spo2Value < c.max);
    const hrCat = HR_CATEGORIES.find((c) => heartRateValue >= c.min && heartRateValue < c.max);
    if (!spo2Cat || !hrCat) return null;

    const worst: Severity =
      SEVERITY_RANK[spo2Cat.severity] >= SEVERITY_RANK[hrCat.severity] ? spo2Cat.severity : hrCat.severity;

    let queue: VitalQueue;
    let color: QueueColor;
    let priorityOverride = false;

    if (worst === "CRITICAL") {
      queue = "ER";
      color = "red";
    } else if (worst === "BORDERLINE") {
      queue = "URGENT";
      color = "orange";
    } else if (isPriorityPatient) {
      // Normal reading, but PWD / senior / pregnant -> yellow, always urgent
      queue = "URGENT";
      color = "yellow";
      priorityOverride = true;
    } else {
      queue = "NORMAL";
      color = "green";
    }

    return {
      spo2: spo2Value.toFixed(0),
      hr: heartRateValue.toFixed(0),
      spo2Category: spo2Cat.label,
      hrCategory: hrCat.label,
      queue,
      color,
      priorityOverride,
    };
  }, [spo2Value, heartRateValue, isValidSpo2, isValidHeartRate, isPriorityPatient]);

  // ── Keypad helpers ──
  const selectField = (field: FieldName) => {
    // Start fresh every time a field is tapped so old digits are never appended
    setActiveField(field);
    if (field === "spo2") setSpo2("");
    else setHeartRate("");
  };

  const updateActiveValue = (digit: string) => {
    if (!activeField) return;
    const current = activeField === "spo2" ? spo2 : heartRate;
    if (current.length >= 3) return;
    const nextValue = current + digit;

    if (activeField === "spo2") setSpo2(nextValue);
    else setHeartRate(nextValue);
  };

  const clearActiveValue = () => {
    if (activeField === "spo2") setSpo2("");
    else if (activeField === "heartRate") setHeartRate("");
  };

  const backspaceActiveValue = () => {
    if (activeField === "spo2") setSpo2((previous) => previous.slice(0, -1));
    else if (activeField === "heartRate") setHeartRate((previous) => previous.slice(0, -1));
  };

  const keypadDisabled = activeField === null;

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      <KioskHeader
        language={language}
        activeStep={4}
        vitalPart={1}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">

        {/* Header */}
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">{isCebuano ? "Pagsukod sa mga Vital Sign" : "Vital Sign Measurement"}</h1>
          <p className="text-[1.7rem] font-serif text-white">{isCebuano ? "Oxygen Saturation (SpO₂) ug Pitik sa Kasingkasing (HR) sa Pasyente" : "Patient Oxygen Saturation (SpO₂) and Heart Rate (HR)"}</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">

          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-lg p-[1.5rem]">

            <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Pamaagi" : "Procedure"}</h2>
            <p className="text-[1.3rem] text-cyan-300">{isCebuano ? "Sunda ang mga instruksyon sa ubos aron masukod ang imong SpO₂ ug pitik sa kasingkasing." : "Please follow the instructions below to take your SpO₂ and Heart Rate reading."}</p>

            {(isCebuano ? [
              "Kuhaa ang pulse oximeter nga naa sa tuo nga bahin sa kiosk.",
              "Ibutang ang clip sa imong tudlo nga tudlo-tudlo; siguroha nga hugot kini ug ang kuko nag-atubang pataas.",
              "Ipabiling hilom ug relaks ang kamot. Likayi ang paglihok samtang gisukod.",
              "Hulata nga mohupay ug magpabilin ang numero — kasagaran 10 hangtod 15 segundos.",
              "Basaha ang mga numero sa SpO₂ (%) ug Heart Rate (bpm) sa screen sa oximeter.",
              "Isulod ang duha ka numero sa mga kahon sa tuo ug pislita ang Padayon.",
            ] : [
              "Pick up the Pulse Oximeter device located on the right side of the kiosk.",
              "Place the device clip on your index finger — make sure it fits snugly and your fingernail faces upward.",
              "Keep your hand still and relaxed. Avoid moving or shaking during the measurement.",
              "Wait for the reading to stabilize — this usually takes 10 to 15 seconds.",
              "Read the SpO₂ (%) and Heart Rate (bpm) values shown on the oximeter display.",
              "Input both values into the boxes on the right side and click Proceed.",
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
              <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Resulta sa SpO₂ ug HR" : "SpO₂ and HR Readings"}</h2>
              <p className="text-[0.9rem] text-cyan-300">{isCebuano ? "Isulod ang mga numero nga makita sa oximeter." : "Enter the values shown on the oximeter."}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (!isValidSpo2 || !isValidHeartRate) {
                  setShowValidationPopup(true);
                  return;
                }

                setShowValidationPopup(false);
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
                  placeholder={isCebuano ? "Pislita aron mosulod sa SpO₂" : "Tap to enter SpO₂"}
                  value={spo2}
                  onClick={() => selectField("spo2")}
                  aria-label="SpO2 in percent"
                  className={`text-[1rem] text-cyan-950 border ${activeField === "spo2" ? "border-orange-400 ring-2 ring-orange-300" : "border-stone-300"} bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none cursor-pointer`}
                />
                {spo2 !== "" && !isValidSpo2 && (
                  <p className="text-[0.95rem] text-yellow-300">
                    {isCebuano ? "Isulod ang hustong SpO₂ tali sa 0 ug 100%." : "Please enter a valid SpO₂ between 0 and 100%."}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Heart Rate (bpm) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder={isCebuano ? "Pislita aron mosulod sa Heart Rate" : "Tap to enter Heart Rate"}
                  value={heartRate}
                  onClick={() => selectField("heartRate")}
                  aria-label="Heart rate in beats per minute"
                  className={`text-[1rem] text-cyan-950 border ${activeField === "heartRate" ? "border-orange-400 ring-2 ring-orange-300" : "border-stone-300"} bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none cursor-pointer`}
                />
                {heartRate !== "" && !isValidHeartRate && (
                  <p className="text-[0.95rem] text-yellow-300">
                    {isCebuano ? "Isulod ang hustong HR tali sa 30 ug 250 bpm." : "Please enter a valid heart rate between 30 and 250 bpm."}
                  </p>
                )}
              </section>

              {/* NUM PAD: always visible, no title row and no Done button */}
              <section className="rounded-xl border border-cyan-600 bg-cyan-900 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      disabled={keypadDisabled}
                      onClick={() => updateActiveValue(digit)}
                      className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300 disabled:opacity-40"
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={keypadDisabled}
                    onClick={clearActiveValue}
                    className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-40"
                  >
                    {isCebuano ? "Haw-asa" : "Clear"}
                  </button>

                  <button
                    type="button"
                    disabled={keypadDisabled}
                    onClick={() => updateActiveValue("0")}
                    className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 disabled:opacity-40"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    disabled={keypadDisabled}
                    onClick={backspaceActiveValue}
                    aria-label={isCebuano ? "Tangtanga ang kataposang numero" : "Delete last digit"}
                    className="min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600 disabled:opacity-40"
                  >
                    ⌫
                  </button>
                </div>
              </section>

              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">
                <button
                  type="submit"
                  className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer"
                >
                  {isCebuano ? "Padayon" : "Proceed"}
                </button>
              </div>

              {/* POP UP: INVALID READINGS */}
              {showValidationPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
                  <div className="w-full max-w-xl rounded-2xl border-2 border-red-500 bg-cyan-950 p-8 text-center shadow-2xl">
                    <h3 className="mb-4 text-3xl font-extrabold text-red-400">
                      {isCebuano ? "Dili Husto ang Resulta sa Vital Sign" : "Invalid Vital Sign Readings"}
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      {isCebuano ? "Isulod ang hustong numero sulod sa gitugot nga sukod sa dili pa mopadayon." : "Please enter valid values within the allowed ranges before proceeding."}
                    </p>

                    <div className="mb-6 space-y-3 text-left">
                      {!isValidSpo2 && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">SpO₂ (%)</p>
                          <p className="text-red-300">
                            {spo2.trim() === ""
                              ? isCebuano ? "Palihog isulod ang imong sukod sa SpO₂." : "Please enter your SpO₂ reading."
                              : isCebuano ? "Isulod ang hustong numero sa SpO₂ tali sa 0 ug 100%." : "Enter a valid SpO₂ value between 0 and 100%."}
                          </p>
                        </div>
                      )}

                      {!isValidHeartRate && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">Heart Rate (bpm)</p>
                          <p className="text-red-300">
                            {heartRate.trim() === ""
                              ? isCebuano ? "Palihog isulod ang sukod sa pitik sa kasingkasing." : "Please enter your heart rate reading."
                              : isCebuano ? "Isulod ang hustong numero tali sa 30 ug 250 bpm." : "Enter a valid heart rate between 30 and 250 bpm."}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowValidationPopup(false);
                        selectField(!isValidSpo2 ? "spo2" : "heartRate");
                      }}
                      className="rounded-lg bg-orange-50 px-8 py-3 text-lg font-bold text-cyan-950 hover:bg-orange-100"
                    >
                      {isCebuano ? "Itul-id ang mga Numero" : "Correct Values"}
                    </button>
                  </div>
                </div>
              )}

              {/* POP UP: CONFIRMATION */}
              {showConfirmPopup && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
                  <div className="w-full max-w-xl rounded-2xl border-2 border-cyan-500 bg-cyan-950 p-8 text-center shadow-2xl">
                    <h3 className="mb-4 text-3xl font-extrabold text-white">
                      {isCebuano ? "Kumpirmaha ang Resulta sa Vital Sign" : "Confirm Vital Sign Readings"}
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      {isCebuano
                        ? "Siguroha nga parehas kini nga mga numero sa gipakita sa pulse oximeter."
                        : "Please verify that these readings match the pulse oximeter display."}
                    </p>

                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">SpO₂</p>
                        <p className="text-4xl font-extrabold text-white">
                          {spo2} <span className="text-lg">%</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">HEART RATE</p>
                        <p className="text-4xl font-extrabold text-white">
                          {heartRate} <span className="text-lg">bpm</span>
                        </p>
                      </div>
                    </div>

                    <p className="mb-6 text-base text-yellow-300">
                      {isCebuano ? "Husto ba kini nga mga numero?" : "Are these values correct?"}
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

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}