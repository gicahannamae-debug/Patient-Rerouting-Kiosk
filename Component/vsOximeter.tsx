'use client'
import React, { useMemo, useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

const SPO2_CATEGORIES = [
  { label: "Normal", range: "95% – 100%", min: 95, max: 101, color: "bg-green-400" },
  { label: "Low", range: "90% – 94%", min: 90, max: 95, color: "bg-yellow-400" },
  { label: "🔴 CRITICAL", range: "< 90%", min: 0, max: 90, color: "bg-red-600" },
];

const HR_CATEGORIES = [
  { label: "🔴 CRITICAL LOW", range: "< 50 bpm", min: 0, max: 50, color: "bg-red-600" },
  { label: "Bradycardia", range: "50 – 59 bpm", min: 50, max: 60, color: "bg-blue-400" },
  { label: "Normal", range: "60 – 100 bpm", min: 60, max: 101, color: "bg-green-400" },
  { label: "Tachycardia", range: "101 – 120 bpm", min: 101, max: 121, color: "bg-orange-400" },
  { label: "🔴 CRITICAL HIGH", range: "> 120 bpm", min: 121, max: 1000, color: "bg-red-600" },
];

const RR_CATEGORIES = [
  { label: "🔴 CRITICAL LOW", range: "< 8 breaths/min", min: 0, max: 8 },
  { label: "Bradypnea", range: "8–11 breaths/min", min: 8, max: 12 },
  { label: "Normal", range: "12–20 breaths/min", min: 12, max: 21 },
  { label: "Tachypnea", range: "21–25 breaths/min", min: 21, max: 26 },
  { label: "🔴 CRITICAL HIGH", range: "> 25 breaths/min", min: 26, max: 101 },
];

type FieldName = "spo2" | "heartRate" | "respiratoryRate";

interface VsOximeterProps {
  language: KioskLanguage;
  onLogout?: () => void;
  onProceed?: (values: { spo2: string; hr: string; rr: string }) => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function VsOximeter({
  language,
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
}: VsOximeterProps) {
  const [spo2, setSpo2] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [activeField, setActiveField] = useState<FieldName | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const isCebuano = language === "ceb";

  const spo2Value = parseFloat(spo2);
  const heartRateValue = parseFloat(heartRate);
  const respiratoryRateValue = parseFloat(respiratoryRate);
  const isValidSpo2 = !Number.isNaN(spo2Value) && spo2Value >= 0 && spo2Value <= 100;
  const isValidHeartRate = !Number.isNaN(heartRateValue) && heartRateValue >= 30 && heartRateValue <= 250;
  const isValidRespiratoryRate = !Number.isNaN(respiratoryRateValue) && respiratoryRateValue >= 0 && respiratoryRateValue <= 100;

  const spo2Category = useMemo(() => {
    if (!isValidSpo2) return null;
    return SPO2_CATEGORIES.find((item) => spo2Value >= item.min && spo2Value < item.max) ?? null;
  }, [spo2Value, isValidSpo2]);

  const heartRateCategory = useMemo(() => {
    if (!isValidHeartRate) return null;
    return HR_CATEGORIES.find((item) => heartRateValue >= item.min && heartRateValue < item.max) ?? null;
  }, [heartRateValue, isValidHeartRate]);

  const respiratoryRateCategory = useMemo(() => {
    if (!isValidRespiratoryRate) return null;
    return RR_CATEGORIES.find((item) => respiratoryRateValue >= item.min && respiratoryRateValue < item.max) ?? null;
  }, [respiratoryRateValue, isValidRespiratoryRate]);

  // ── Keypad helpers ──
  const selectField = (field: FieldName) => {
    // Start fresh every time a field is tapped so old digits are never appended
    setActiveField(field);
    if (field === "spo2") setSpo2("");
    else if (field === "heartRate") setHeartRate("");
    else setRespiratoryRate("");
  };

  const updateActiveValue = (digit: string) => {
    if (!activeField) return;
    const current = activeField === "spo2" ? spo2 : activeField === "heartRate" ? heartRate : respiratoryRate;
    if (current.length >= 3) return;
    const nextValue = current + digit;

    if (activeField === "spo2") setSpo2(nextValue);
    else if (activeField === "heartRate") setHeartRate(nextValue);
    else setRespiratoryRate(nextValue);
  };

  const clearActiveValue = () => {
    if (activeField === "spo2") setSpo2("");
    else if (activeField === "heartRate") setHeartRate("");
    else if (activeField === "respiratoryRate") setRespiratoryRate("");
  };

  const backspaceActiveValue = () => {
    if (activeField === "spo2") setSpo2((previous) => previous.slice(0, -1));
    else if (activeField === "heartRate") setHeartRate((previous) => previous.slice(0, -1));
    else if (activeField === "respiratoryRate") setRespiratoryRate((previous) => previous.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      <KioskHeader
        language={language}
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
          <h1 className="text-[3rem] font-bold text-white">{isCebuano ? "Pagsukod sa mga Vital Sign" : "Vital Sign Measurement"}</h1>
          <p className="text-[1.7rem] font-serif text-white">{isCebuano ? "Oxygen Saturation (SpO₂), Pitik sa Kasingkasing (HR) ug Gikusgon sa Pagginhawa (RR) sa Pasyente" : "Patient Oxygen Saturation (SpO₂), Heart Rate (HR) and Respiratory Rate (RR)"}</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">

          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-lg p-[1.5rem]">

            <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Pamaagi" : "Procedure"}</h2>
            <p className="text-[1.3rem] text-cyan-300">{isCebuano ? "Sunda ang mga instruksyon sa ubos aron masukod ang SpO₂ ug pitik sa kasingkasing, ug ihap ang imong pagginhawa sulod sa usa ka minuto." : "Please follow the instructions below to take your SpO₂ and Heart Rate reading, and count your breaths for one minute."}</p>

            {(isCebuano ? [
              "Kuhaa ang pulse oximeter nga naa sa tuo nga bahin sa kiosk.",
              "Ibutang ang clip sa imong tudlo nga tudlo-tudlo; siguroha nga hugot kini ug ang kuko nag-atubang pataas.",
              "Ipabiling hilom ug relaks ang kamot. Likayi ang paglihok samtang gisukod.",
              "Hulata nga mohupay ug magpabilin ang numero — kasagaran 10 hangtod 15 segundos.",
              "Basaha ang mga numero sa SpO₂ (%) ug Heart Rate (bpm) sa screen sa oximeter.",
              "Ihap ang imong pagginhawa sulod sa usa ka minuto. Isulod ang tulo ka numero sa mga kahon sa tuo ug pislita ang Padayon.",
            ] : [
              "Pick up the Pulse Oximeter device located on the right side of the kiosk.",
              "Place the device clip on your index finger — make sure it fits snugly and your fingernail faces upward.",
              "Keep your hand still and relaxed. Avoid moving or shaking during the measurement.",
              "Wait for the reading to stabilize — this usually takes 10 to 15 seconds.",
              "Read the SpO₂ (%) and Heart Rate (bpm) values shown on the oximeter display.",
              "Count your breaths for one minute. Input all three values into the boxes on the right side and click Proceed.",
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
              <h2 className="text-[1.4rem] font-bold text-white">{isCebuano ? "Resulta sa SpO₂, HR ug RR" : "SpO₂, HR and RR Readings"}</h2>
              <p className="text-[0.9rem] text-cyan-300">{isCebuano ? "Isulod ang mga numero nga makita sa oximeter." : "Enter the values shown on the oximeter."}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (!isValidSpo2 || !isValidHeartRate || !isValidRespiratoryRate) {
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
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer"
                />
              </section>

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  {isCebuano ? "Gikusgon sa Pagginhawa (RR/min)" : "Respiratory Rate (breaths/min)"} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  placeholder={isCebuano ? "Pislita aron isulod ang RR" : "Tap to enter respiratory rate"}
                  value={respiratoryRate}
                  onClick={() => selectField("respiratoryRate")}
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
                  placeholder={isCebuano ? "Pislita aron mosulod sa Heart Rate" : "Tap to enter Heart Rate"}
                  value={heartRate}
                  onClick={() => selectField("heartRate")}
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer"
                />
              </section>

              {/* NUM PAD UI */}
              {activeField && (
                <section className="rounded-xl border border-cyan-600 bg-cyan-900 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {activeField === "spo2" ? "SpO₂" : activeField === "heartRate" ? "Heart Rate" : "Respiratory Rate"} {isCebuano ? "nga Keypad" : "Keypad"}
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
                    {activeField === "spo2"
                      ? isCebuano ? "Gitugot nga sukod: 0–100%" : "Allowed range: 0–100%"
                      : activeField === "heartRate"
                        ? isCebuano ? "Gitugot nga sukod: 30–250 bpm" : "Allowed range: 30–250 bpm"
                        : isCebuano ? "Gitugot nga sukod: 0–100 pagginhawa/min" : "Allowed range: 0–100 breaths/min"}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => updateActiveValue(digit)}
                        className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300"
                      >
                        {digit}
                      </button>
                    ))}

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

              {/* Patient Oxygen Results */}
              <div className="flex flex-col gap-[0.75rem] bg-cyan-950 rounded-lg px-[0.9rem] py-[0.9rem]">
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider">{isCebuano ? "Resulta sa Oxygen sa Pasyente" : "Patient Oxygen Results"}</p>
                </div>

                <div className="rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white">
                  {spo2 === "" && heartRate === "" && respiratoryRate === "" ? (
                    <p className="text-[0.95rem] text-cyan-300">{isCebuano ? "Isulod ang SpO₂, pitik sa kasingkasing ug gikusgon sa pagginhawa aron makita ang resulta dinhi." : "Enter SpO₂, heart rate and respiratory rate values to see the result here."}</p>
                  ) : !isValidSpo2 || !isValidHeartRate || !isValidRespiratoryRate ? (
                    <p className="text-[0.95rem] text-yellow-300">{isCebuano ? "Isulod ang hustong numero: SpO₂ 0–100%, HR 30–250 bpm, ug RR 0–100 pagginhawa/min." : "Enter valid values: SpO₂ 0–100%, HR 30–250 bpm, and RR 0–100 breaths/min."}</p>
                  ) : (
                    <>
                      <p className="text-[0.95rem] text-cyan-300">SpO₂: <span className="font-semibold text-white">{spo2Value.toFixed(0)}%</span></p>
                      <p className="text-[0.95rem]">{isCebuano ? "Kahimtang sa SpO₂" : "SpO₂ status"}: <span className="font-bold text-white">{spo2Category ? (isCebuano ? ({ Normal: "Normal", Acceptable: "Madawat", Low: "Ubos", "🔴 CRITICAL": "🔴 KRITIKAL" }[spo2Category.label] ?? spo2Category.label) : spo2Category.label) : "Unknown"}</span></p>
                      <p className="text-[0.95rem] text-cyan-300 mt-[0.5rem]">{isCebuano ? "Pitik sa Kasingkasing" : "Heart Rate"}: <span className="font-semibold text-white">{heartRateValue.toFixed(0)} bpm</span></p>
                      <p className="text-[0.95rem]">{isCebuano ? "Kahimtang sa HR" : "HR status"}: <span className="font-bold text-white">{heartRateCategory ? (isCebuano ? ({ "🔴 CRITICAL LOW": "🔴 UBOS KAAYO", Bradycardia: "Hinay nga Pitik", Normal: "Normal", Tachycardia: "Paspas nga Pitik", "🔴 CRITICAL HIGH": "🔴 TAAS KAAYO" }[heartRateCategory.label] ?? heartRateCategory.label) : heartRateCategory.label) : "Unknown"}</span></p>
                      <p className="text-[0.95rem] text-cyan-300 mt-[0.5rem]">{isCebuano ? "Gikusgon sa Pagginhawa" : "Respiratory Rate"}: <span className="font-semibold text-white">{respiratoryRateValue.toFixed(0)} breaths/min</span></p>
                      <p className="text-[0.95rem]">{isCebuano ? "Kahimtang sa RR" : "RR status"}: <span className="font-bold text-white">{respiratoryRateCategory?.label ?? "Unknown"}</span></p>
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

                      {!isValidRespiratoryRate && (
                        <div className="rounded-xl border border-red-500 bg-red-950/50 p-4">
                          <p className="font-bold text-white">{isCebuano ? "Gikusgon sa Pagginhawa (RR/min)" : "Respiratory Rate (breaths/min)"}</p>
                          <p className="text-red-300">
                            {respiratoryRate.trim() === ""
                              ? isCebuano ? "Palihog isulod ang gikusgon sa pagginhawa." : "Please enter the respiratory rate."
                              : isCebuano ? "Isulod ang numero tali sa 0 ug 100 ka ginhawa/min." : "Enter a value between 0 and 100 breaths/min."}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowValidationPopup(false);
                        selectField(!isValidSpo2 ? "spo2" : !isValidHeartRate ? "heartRate" : "respiratoryRate");
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
                  <div className="w-full max-w-2xl rounded-2xl border-2 border-cyan-500 bg-cyan-950 p-8 text-center shadow-2xl">
                    <h3 className="mb-4 text-3xl font-extrabold text-white">
                      {isCebuano ? "Kumpirmaha ang Resulta sa Vital Sign" : "Confirm Vital Sign Readings"}
                    </h3>

                    <p className="mb-6 text-lg text-cyan-200">
                      {isCebuano
                        ? "Siguroha nga parehas kini nga mga numero sa gipakita sa pulse oximeter ug sa imong giihap nga pagginhawa."
                        : "Please verify that these readings match the pulse oximeter display and your breath count."}
                    </p>

                    <div className="mb-6 grid grid-cols-3 gap-4">
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

                      <div className="rounded-xl border border-cyan-600 bg-cyan-900 p-5">
                        <p className="mb-2 text-sm font-semibold text-cyan-200">
                          {isCebuano ? "GIKUSGON SA PAGGINHAWA" : "RESPIRATORY RATE"}
                        </p>
                        <p className="text-4xl font-extrabold text-white">
                          {respiratoryRate} <span className="text-lg">br/min</span>
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
                          onProceed?.({ spo2, hr: heartRate, rr: respiratoryRate });
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