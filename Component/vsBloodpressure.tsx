'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

const BP_CATEGORIES = [
  { label: "🔴 HYPERTENSIVE CRISIS", range: "SBP > 180 or DBP > 120", predicate: (s: number, d: number) => s > 180 || d > 120, color: "bg-red-700" },
  { label: "🔴 SEVERE HYPOTENSION", range: "SBP < 80", predicate: (s: number) => s < 80, color: "bg-red-600" },
  { label: "Hypotension", range: "SBP < 90 or DBP < 60", predicate: (s: number, d: number) => s < 90 || d < 60, color: "bg-orange-400" },
  { label: "Stage 2 Hypertension", range: "SBP ≥ 140 or DBP ≥ 90", predicate: (s: number, d: number) => s >= 140 || d >= 90, color: "bg-red-500" },
  { label: "Elevated / High", range: "SBP 121–139 or DBP 81–89", predicate: (s: number, d: number) => (s >= 121 && s <= 139) || (d >= 81 && d <= 89), color: "bg-yellow-400" },
  { label: "Normal", range: "SBP 90–120 and DBP 60–80", predicate: (s: number, d: number) => s >= 90 && s <= 120 && d >= 60 && d <= 80, color: "bg-green-400" },
];

interface VsBloodpressureProps {
  language: KioskLanguage;
  onLogout?: () => void;
  onProceed?: (values: { bpSys: string; bpDia: string }) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
  /** Which vital-sign part this page is (1 = BP). Use 2 / 3 on the RR&O2 and Temp pages. */
  part?: number;
}

export default function VsBloodpressure({
  language,
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
  part = 1,
}: VsBloodpressureProps) {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [alertTriggered, setAlertTriggered] = useState(false);
  const isCebuano = language === "ceb";

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
    if (bpCategory.label === "🔴 SEVERE HYPOTENSION") return isCebuano ? "Delikado kaayo kaubos ang presyon sa dugo. Palihog adto dayon sa emergency room." : "Blood pressure is dangerously low. Please proceed to emergency care immediately.";
    if (bpCategory.label === "🔴 HYPERTENSIVE CRISIS") return isCebuano ? "Krisis sa presyon sa dugo. Palihog adto dayon sa emergency room." : "Blood pressure is in a hypertensive crisis. Please proceed to emergency care immediately.";
    return null;
  }, [bpCategory, isCebuano]);

  const showCriticalBpOverlay = alertTriggered && !!criticalBpMessage;

  //ADDED 10-14-2026
  const [activeField, setActiveField] = useState<
    "systolic" | "diastolic" | null
  >(null);

  const updateActiveValue = (digit: string) => {
    if (!activeField) return;

    const current = activeField === "systolic" ? systolic : diastolic;

    // Allow up to 3 digits only.
    if (current.length >= 3) return;

    const nextValue = current + digit;

    if (activeField === "systolic") {
      setSystolic(nextValue);
    } else {
      setDiastolic(nextValue);
    }

    setAlertTriggered(false);
  };

  const clearActiveValue = () => {
    if (activeField === "systolic") {
      setSystolic("");
    } else if (activeField === "diastolic") {
      setDiastolic("");
    }

    setAlertTriggered(false);
  };

  const backspaceActiveValue = () => {
    if (activeField === "systolic") {
      setSystolic((previous) => previous.slice(0, -1));
    } else if (activeField === "diastolic") {
      setDiastolic((previous) => previous.slice(0, -1));
    }

    setAlertTriggered(false);
  };

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const [showValidationPopup, setShowValidationPopup] = useState(false);

  //END OF ADDED 10-14-2026

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      {showCriticalBpOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950 bg-opacity-95 p-6">
          <div className="w-full max-w-4xl bg-red-600 border-4 border-white rounded-xl p-10 text-center shadow-2xl animate-pulse">
            <h3 className="text-5xl font-extrabold mb-4">{isCebuano ? "ADTO DAYON SA EMERGENCY ROOM" : "IMMEDIATE ER REDIRECTION"}</h3>
            <p className="text-2xl mb-5">{criticalBpMessage}</p>
            <p className="text-3xl font-medium bg-red-950 px-6 py-5 rounded-lg inline-block">
              {isCebuano ? "Kuhaa ang imong tiket ug adto dayon sa emergency room!" : "Please get your ticket and proceed immediately to the ER!"}
            </p>
            <button
              onClick={() => {
                setSystolic("");
                setDiastolic("");
                setAlertTriggered(false);
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
        vitalPart={part}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Heading (same as Safety Check) */}
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
                  setAlertTriggered(false);
                  setShowConfirmPopup(false);
                  setShowValidationPopup(true);
                  return;
                }

                setShowValidationPopup(false);
                setAlertTriggered(false);
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
                  onClick={() => setActiveField("systolic")}
                  aria-label="Systolic blood pressure in mmHg"
                  className={`w-full text-[1rem] text-cyan-950 border ${activeField === "systolic"
                    ? "border-orange-400 ring-2 ring-orange-300"
                    : "border-stone-300"
                    } bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] cursor-pointer focus:outline-none`}
                />
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
                  onClick={() => setActiveField("diastolic")}
                  aria-label="Diastolic blood pressure in mmHg"
                  className={`w-full text-[1rem] text-cyan-950 border ${activeField === "diastolic"
                    ? "border-orange-400 ring-2 ring-orange-300"
                    : "border-stone-300"
                    } bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] cursor-pointer focus:outline-none`}
                />
              </section>

              {
              // NUMPAD UI 10-14-2026
              activeField && (
                <section className="rounded-xl border border-cyan-600 bg-cyan-900 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {activeField === "systolic" ? "Systolic" : "Diastolic"} {isCebuano ? "nga Keypad" : "Keypad"}
                    </h3>

                    <button
                      type="button"
                      onClick={() => setActiveField(null)}
                      className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      {isCebuano ? "Human" : "Done"}
                    </button>
                  </div>

                  <div className="mb-3 text-center text-sm text-cyan-200">
                    {activeField === "systolic"
                      ? isCebuano ? "Gitugot nga sukod: 60–300 mmHg" : "Allowed range: 60–300 mmHg"
                      : isCebuano ? "Gitugot nga sukod: 40–200 mmHg" : "Allowed range: 40–200 mmHg"}
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
                      {isCebuano ? "Haw-asa" : "Clear"}
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
                      aria-label={isCebuano ? "Tangtanga ang kataposang numero" : "Delete last digit"}
                      className="min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600"
                    >
                      ⌫
                    </button>
                  </div>
                </section>
              )}


              {/* Patient Blood Pressure Results */}
              <div className="flex flex-col gap-[0.75rem]">
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider">{isCebuano ? "Resulta sa Presyon sa Dugo sa Pasyente" : "Patient Blood Pressure Results"}</p>
                </div>

                <div className="rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white">
                  {systolic === "" && diastolic === "" ? (
                    <p className="text-[0.95rem] text-cyan-300">{isCebuano ? "Isulod ang systolic ug diastolic aron makita ang resulta dinhi." : "Enter systolic and diastolic values to see the result here."}</p>
                  ) : !isValidSystolic || !isValidDiastolic ? (
                    <p className="text-[0.95rem] text-yellow-300">{isCebuano ? "Isulod ang husto nga numero: systolic 60–300 ug diastolic 40–200 mmHg." : "Please enter valid values: systolic 60–300 and diastolic 40–200 mmHg."}</p>
                  ) : (
                    <>
                      <p className="text-[0.95rem] text-cyan-300">Systolic: <span className="font-semibold text-white">{systolicValue.toFixed(0)} mmHg</span></p>
                      <p className="text-[0.95rem]">Diastolic: <span className="font-semibold text-white">{diastolicValue.toFixed(0)} mmHg</span></p>
                      <p className="text-[0.95rem] mt-[0.5rem]">{isCebuano ? "Resulta" : "Result"}: <span className="font-bold text-white">{bpCategory ? (isCebuano ? ({
                        "🔴 HYPERTENSIVE CRISIS": "🔴 KRISIS SA PRESYON SA DUGO",
                        "🔴 SEVERE HYPOTENSION": "🔴 DELIKADO KAAYO KAUBOS",
                        Hypotension: "Ubos nga Presyon sa Dugo",
                        "Stage 2 Hypertension": "Yugto 2 nga Taas nga Presyon",
                        "Elevated / High": "Medyo Taas / Taas",
                        Normal: "Normal",
                      }[bpCategory.label] ?? bpCategory.label) : bpCategory.label) : "Unknown"}</span></p>
                      <p className="text-[0.95rem] text-cyan-300">{isCebuano ? "Sukod" : "Range"}: {bpCategory?.range}</p>
                    </>
                  )}
                </div>
              </div>

              {
              // POP UP FOR CONFIRMATION OF BLOOD PRESSURE READINGS 10-14-2026
              showValidationPopup && (
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
                        setActiveField(!isValidSystolic ? "systolic" : "diastolic");
                      }}
                      className="rounded-lg bg-orange-50 px-8 py-3 text-lg font-bold text-cyan-950 hover:bg-orange-100"
                    >
                      {isCebuano ? "Itul-id ang mga Numero" : "Correct Values"}
                    </button>
                  </div>
                </div>
              )}

              {
              // POP UP FOR CONFIRMATION OF BLOOD PRESSURE 10-14-2026
              showConfirmPopup && (
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
                        <p className="mb-2 text-sm font-semibold text-cyan-200">
                          SYSTOLIC
                        </p>
                        <p className="text-4xl font-extrabold text-white">
                          {systolic} <span className="text-lg">mmHg</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">
                          DIASTOLIC
                        </p>
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

                          if (criticalBpMessage) {
                            // Show the emergency alert only after confirmation.
                            setAlertTriggered(true);
                            return;
                          }

                          onProceed?.({
                            bpSys: systolic,
                            bpDia: diastolic,
                          });
                        }}
                        className="rounded-lg bg-orange-50 px-6 py-3 text-lg font-bold text-cyan-950 hover:bg-orange-100"
                      >
                        {isCebuano ? "Oo, Kumpirmaha" : "Yes, Confirm"}
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">
                <button
                  type="submit"
                  className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer"
                >
                  {isCebuano ? "Padayon" : "Proceed"}
                </button>
              </div>
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