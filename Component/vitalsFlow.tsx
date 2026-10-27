'use client'
import React, { useRef, useState } from "react";
import VsBloodpressure from "@/Component/vsBloodpressure"; // adjust paths to your files
import VsOximeter from "@/Component/vsOximeter";
import VsTemperature from "@/Component/vsTemperature";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import { calculateNEWS2, type NEWS2Result } from "@/lib/news2";

export interface VitalsData {
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  oxygenSaturation: number | null;
  pulseRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
}

export interface VitalsFlowResult {
  vitals: VitalsData;
  news2: NEWS2Result;
  /** true when the flow ended before all vitals were taken (partial score already >= 7) */
  endedEarly: boolean;
}

interface VitalsFlowProps {
  language: KioskLanguage;
  /** senior, PWD, pregnant, etc. */
  priorityPatient: boolean;
  /** optional: patient is on supplemental oxygen (default false) */
  supplementalOxygen?: boolean;
  /** optional: false = confused / not alert (default true) */
  alert?: boolean;
  onComplete: (result: VitalsFlowResult) => void;
  onLogout?: () => void;
  onNavigateStep?: (step: number) => void;
}

const EMPTY_VITALS: VitalsData = {
  systolicBloodPressure: null,
  diastolicBloodPressure: null,
  oxygenSaturation: null,
  pulseRate: null,
  respiratoryRate: null,
  temperature: null,
};

export default function VitalsFlow({
  language,
  priorityPatient,
  supplementalOxygen = false,
  alert = true,
  onComplete,
  onLogout,
  onNavigateStep,
}: VitalsFlowProps) {
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [vitals, setVitals] = useState<VitalsData>(EMPTY_VITALS);
  const doneRef = useRef(false); // prevents duplicate completion

  const score = (v: VitalsData): NEWS2Result =>
    calculateNEWS2({
      respiratoryRate: v.respiratoryRate,
      oxygenSaturation: v.oxygenSaturation,
      systolicBloodPressure: v.systolicBloodPressure,
      pulseRate: v.pulseRate,
      temperature: v.temperature,
      supplementalOxygen,
      alert,
      priorityPatient,
    });

  const finish = (finalVitals: VitalsData, endedEarly: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVitals(finalVitals);
    onComplete({ vitals: finalVitals, news2: score(finalVitals), endedEarly });
  };

  // Header navigation: allow going back only, never skipping ahead
  const handleNavigateVitalPart = (p: number) => {
    if (p >= 1 && p <= part) setPart(p as 1 | 2 | 3);
  };

  const common = {
    language,
    onLogout,
    onNavigateStep,
    onNavigateVitalPart: handleNavigateVitalPart,
  };

  // ── Part 1: Blood pressure ──
  if (part === 1) {
    return (
      <VsBloodpressure
        {...common}
        part={1}
        onProceed={(v) => {
          setVitals((prev) => ({
            ...prev,
            systolicBloodPressure: Number(v.bpSys),
            diastolicBloodPressure: Number(v.bpDia),
          }));
          setPart(2);
        }}
      />
    );
  }

  // ── Part 2: SpO₂, HR, RR ──
  if (part === 2) {
    return (
      <VsOximeter
        {...common}
        onProceed={(v) => {
          const next: VitalsData = {
            ...vitals,
            oxygenSaturation: Number(v.spo2),
            pulseRate: Number(v.hr),
            respiratoryRate: Number(v.rr),
          };

          // NEWS2 points only add up, so a partial total of 7+ guarantees
          // the final total is 7+. Skip the temperature step and escalate.
          if (score(next).total >= 7) {
            finish(next, true);
            return;
          }

          setVitals(next);
          setPart(3);
        }}
      />
    );
  }

  // ── Part 3: Temperature (last step) ──
  return (
    <VsTemperature
      {...common}
      onProceed={(v) => finish({ ...vitals, temperature: Number(v.temperature) }, false)}
    />
  );
}
