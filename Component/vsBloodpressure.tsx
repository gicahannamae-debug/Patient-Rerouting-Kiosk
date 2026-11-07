'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

export type BpQueue = "ER" | "URGENT" | "NORMAL";
export type BpQueueColor = "red" | "orange" | "green" | "yellow";
type Severity = "CRITICAL" | "BORDERLINE" | "NORMAL";

type BPCategory = {
  label: string;
  range: string;
  severity: Severity;
  predicate: (s: number, d: number) => boolean;
};

// Clinic-side only. These labels are never shown to the patient.
// Ordered by priority: the first matching category wins.
const BP_CATEGORIES: BPCategory[] = [
  { label: "Critically High", range: "SBP > 180 or DBP > 120", severity: "CRITICAL", predicate: (s, d) => s > 180 || d > 120 },
  { label: "Critically Low", range: "SBP < 90 or DBP < 60", severity: "CRITICAL", predicate: (s, d) => s < 90 || d < 60 },
  { label: "Normal", range: "SBP 100–120 and DBP 65–80", severity: "NORMAL", predicate: (s, d) => s >= 100 && s <= 120 && d >= 65 && d <= 80 },
  { label: "Borderline Low", range: "SBP 90–99 or DBP 60–64", severity: "BORDERLINE", predicate: (s, d) => (s >= 90 && s <= 99) || (d >= 60 && d <= 64) },
  { label: "Borderline High", range: "SBP 121–139 or DBP 81–89", severity: "BORDERLINE", predicate: (s, d) => (s >= 121 && s <= 139) || (d >= 81 && d <= 89) },
  // Fallback: the table has no row for SBP 140–180 / DBP 90–120.
  { label: "High", range: "SBP 140–180 or DBP 90–120", severity: "BORDERLINE", predicate: () => true },
];

export interface BloodPressureResult {
  bpSys: string;
  bpDia: string;
  bpCategory: string;
  /** ER = critical, URGENT = borderline (or priority patient), NORMAL = normal. */
  queue: BpQueue;
  /** red = critical, orange = borderline, green = normal, yellow = normal but priority patient. */
  color: BpQueueColor;
  /** True when a Normal result was upgraded because of patient status. */
  priorityOverride: boolean;
}

type BpField = "systolic" | "diastolic";

interface VsBloodpressureProps {
  language: KioskLanguage;
  /** True for PWD, senior, pregnant, or any other priority status. */
  isPriorityPatient?: boolean;
  /** Previously entered values (from the parent) so they reappear when the patient comes back. */
  initialSystolic?: string;
  initialDiastolic?: string;
  onLogout?: () => void;
  onProceed?: (values: BloodPressureResult) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
  /** Which vital-sign part this page is (1 = BP). */
  part?: number;
}

export default function VsBloodpressure({
  language,
  isPriorityPatient = false,
  initialSystolic = "",
  initialDiastolic = "",
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
  part = 1,
}: VsBloodpressureProps) {
  const [systolic, setSystolic] = useState(initialSystolic);
  const [diastolic, setDiastolic] = useState(initialDiastolic);
  // Start on systolic for a fresh page; if values are prefilled, wait for a tap
  const [activeField, setActiveField] = useState<BpField | null>(
    initialSystolic || initialDiastolic ? null : "systolic"
  );
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const isCebuano = language === "ceb";

  const systolicValue = parseFloat(systolic);
  const diastolicValue = parseFloat(diastolic);
  const isValidSystolic = !Number.isNaN(systolicValue) && systolicValue >= 60 && systolicValue <= 300;
  const isValidDiastolic = !Number.isNaN(diastolicValue) && diastolicValue >= 40 && diastolicValue <= 200;

  // Clinic-side classification and queue routing (not displayed to the patient)
  const routing = useMemo<BloodPressureResult | null>(() => {
    if (!isValidSystolic || !isValidDiastolic) return null;

    const cat = BP_CATEGORIES.find((c) => c.predicate(systolicValue, diastolicValue));
    if (!cat) return null;

    let queue: BpQueue;
    let color: BpQueueColor;
    let priorityOverride = false;

    if (cat.severity === "CRITICAL") {
      queue = "ER";
      color = "red";
    } else if (cat.severity === "BORDERLINE") {
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
      bpSys: systolicValue.toFixed(0),
      bpDia: diastolicValue.toFixed(0),
      bpCategory: cat.label,
      queue,
      color,
      priorityOverride,
    };
  }, [systolicValue, diastolicValue, isValidSystolic, isValidDiastolic, isPriorityPatient]);

  // ── Keypad helpers ──
  const selectField = (field: BpField) => {
    // Start fresh every time a field is tapped so old digits are never appended
    setActiveField(field);
    if (field === "systolic") setSystolic("");
    else setDiastolic("");
  };

  const updateActiveValue = (digit: string) => {
    if (!activeField) return;

    const current = activeField === "systolic" ? systolic : diastolic;
    if (current.length >= 3) return; // up to 3 digits only

    const nextValue = current + digit;
    if (activeField === "systolic") setSystolic(nextValue);
    else setDiastolic(nextValue);
  };

  const clearActiveValue = () => {
    if (activeField === "systolic") setSystolic("");
    else if (activeField === "diastolic") setDiastolic("");
  };

  const backspaceActiveValue = () => {
    if (activeField === "systolic") setSystolic((previous) => previous.slice(0, -1));
    else if (activeField === "diastolic") setDiastolic((previous) => previous.slice(0, -1));
  };

  const keypadDisabled = activeField === null;

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      <KioskHeader
        language={language}
        activeStep={4}
        vitalPart={part}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="text-center w-full mb-6">
          <h2 className="text-5xl font-bold text-white">{isCebuano ? "Pagsukod sa mga Vital Sign" : "Vital Sign Measurement"}</h2>
          <p className="text-2xl text-cyan-200 mt-2">{isCebuano ? "Presyon sa Dugo sa Pasyente (BP)" : "Patient Blood Pressure (BP)"}</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex w-full flex-row gap-6 rounded-3xl border border-cyan-500/30 bg-cyan-900/30 p-8 shadow-2xl backdrop-blur-sm">

          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-2xl p-[1.5rem]">
            <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Pamaagi" : "Procedure"}</h2>
            <p className="text-[1.3rem] text-cyan-300">{isCebuano ? "Sunda ang mga instruksyon sa ubos aron masukod ang imong presyon sa dugo." : "Please follow the instructions below to take your Blood Pressure reading."}</p>

            {(isCebuano ? [
              "Kuhaa ang blood pressure cuff nga naa sa tuo nga bahin sa kiosk.",
              "Ihapin og husto ang cuff sa ibabaw nga bahin sa bukton, mga 2 cm ibabaw sa siko.",
              "Lingkod, ipahulay ang bukton sa lamesa, ug pagpahayahay sulod sa labing menos 1 ka minuto.",
              "Pislita ang buton sa makina aron sugdan ang pagsukod.",
              "Hulata nga mahuman ang pagsukod — ayaw lihok o pagsulti samtang gisukod.",
              "Isulod ang mga numero sa Systolic ug Diastolic nga makita sa makina sa mga kahon sa tuo, dayon pislita ang Padayon.",
            ] : [
              "Pick up the Blood Pressure Cuff located on the right side of the kiosk.",
              "Wrap the cuff snugly around your upper arm, about 2 cm above the elbow.",
              "Sit down, rest your arm on the table, and relax for at least 1 minute.",
              "Press the trigger button on the machine to start the reading.",
              "Wait for the reading to complete — do not move or talk during measurement.",
              "Input the Systolic and Diastolic values shown on the machine into the boxes on the right, then click Proceed.",
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
              <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Resulta sa Presyon sa Dugo" : "Blood Pressure Reading"}</h2>
              <p className="text-[0.9rem] text-cyan-300">{isCebuano ? "Isulod ang mga numero nga makita sa makina sa BP." : "Enter the values shown on the BP machine."}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (!isValidSystolic || !isValidDiastolic) {
                  setShowConfirmPopup(false);
                  setShowValidationPopup(true);
                  return;
                }

                setShowValidationPopup(false);
                setShowConfirmPopup(true);
              }}
              className="flex flex-col gap-[1rem] bg-cyan-950 rounded-2xl p-[1rem]"
            >
              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Systolic (mmHg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder={isCebuano ? "Pislita aron mosulod" : "Tap to enter"}
                  value={systolic}
                  onClick={() => selectField("systolic")}
                  aria-label="Systolic blood pressure in mmHg"
                  className={`w-full text-[1rem] text-cyan-950 border ${activeField === "systolic" ? "border-orange-400 ring-2 ring-orange-300" : "border-stone-300"} bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] cursor-pointer focus:outline-none`}
                />
                {systolic !== "" && !isValidSystolic && (
                  <p className="text-[0.95rem] text-yellow-300">
                    {isCebuano ? "Isulod ang hustong systolic tali sa 60 ug 300 mmHg." : "Please enter a valid systolic between 60 and 300 mmHg."}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Diastolic (mmHg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder={isCebuano ? "Pislita aron mosulod" : "Tap to enter"}
                  value={diastolic}
                  onClick={() => selectField("diastolic")}
                  aria-label="Diastolic blood pressure in mmHg"
                  className={`w-full text-[1rem] text-cyan-950 border ${activeField === "diastolic" ? "border-orange-400 ring-2 ring-orange-300" : "border-stone-300"} bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] cursor-pointer focus:outline-none`}
                />
                {diastolic !== "" && !isValidDiastolic && (
                  <p className="text-[0.95rem] text-yellow-300">
                    {isCebuano ? "Isulod ang hustong diastolic tali sa 40 ug 200 mmHg." : "Please enter a valid diastolic between 40 and 200 mmHg."}
                  </p>
                )}
              </section>

              {/* NUMPAD: always visible, no title row and no Done button */}
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
                      {isCebuano ? "Dili Husto ang Resulta sa Presyon sa Dugo" : "Invalid Blood Pressure Readings"}
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      {isCebuano ? "Isulod ang hustong numero sulod sa gitugot nga sukod sa dili pa mopadayon." : "Please enter valid values within the allowed ranges before proceeding."}
                    </p>

                    <div className="mb-6 space-y-3 text-left">
                      {!isValidSystolic && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">Systolic (mmHg)</p>
                          <p className="text-red-300">
                            {systolic.trim() === ""
                              ? isCebuano ? "Palihog isulod ang sukod sa systolic." : "Please enter the systolic reading."
                              : isCebuano ? "Isulod ang hustong systolic nga numero tali sa 60 ug 300 mmHg." : "Enter a valid systolic value between 60 and 300 mmHg."}
                          </p>
                        </div>
                      )}

                      {!isValidDiastolic && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">Diastolic (mmHg)</p>
                          <p className="text-red-300">
                            {diastolic.trim() === ""
                              ? isCebuano ? "Palihog isulod ang sukod sa diastolic." : "Please enter the diastolic reading."
                              : isCebuano ? "Isulod ang hustong diastolic nga numero tali sa 40 ug 200 mmHg." : "Enter a valid diastolic value between 40 and 200 mmHg."}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowValidationPopup(false);
                        selectField(!isValidSystolic ? "systolic" : "diastolic");
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
                      {isCebuano ? "Kumpirmaha ang Presyon sa Dugo" : "Confirm Blood Pressure"}
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      {isCebuano
                        ? "Siguroha nga parehas kini nga mga numero sa gipakita sa makina sa presyon sa dugo."
                        : "Please verify that these readings match the values displayed on the blood pressure machine."}
                    </p>

                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">SYSTOLIC</p>
                        <p className="text-4xl font-extrabold text-white">
                          {systolic} <span className="text-lg">mmHg</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">DIASTOLIC</p>
                        <p className="text-4xl font-extrabold text-white">
                          {diastolic} <span className="text-lg">mmHg</span>
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

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        {isCebuano ? "Kiosk sa Outpatient sa BICA" : "BICA Outpatient Self-Service Kiosk"}
      </footer>
    </div>
  );
}