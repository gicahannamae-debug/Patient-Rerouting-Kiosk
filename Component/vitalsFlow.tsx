'use client'
import React, { useRef, useState } from "react";
import VsBloodpressure from "@/Component/vsBloodpressure"; // adjust paths to your files
import VsOximeter from "@/Component/vsOximeter";
import VsTemperature from "@/Component/vsTemperature";
import type { KioskLanguage } from "@/lib/kioskLanguage";

export interface VitalsData {
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  oxygenSaturation: number | null;
  pulseRate: number | null;
  temperature: number | null;
}

export interface VitalTriageResult {
  queue: "ER" | "URGENT" | "NORMAL";
  color: "red" | "orange" | "yellow" | "green";
  priorityOverride: boolean;
}

export interface VitalsFlowResult {
  vitals: VitalsData;
  triage: VitalTriageResult;
  /** True when a single critical vital ended the flow early. */
  endedEarly: boolean;
}

interface VitalsFlowProps {
  language: KioskLanguage;
  /** senior, PWD, pregnant, etc. */
  priorityPatient: boolean;
  onComplete: (result: VitalsFlowResult) => void;
  onLogout?: () => void;
  onNavigateStep?: (step: number) => void;
}

const EMPTY_VITALS: VitalsData = {
  systolicBloodPressure: null,
  diastolicBloodPressure: null,
  oxygenSaturation: null,
  pulseRate: null,
  temperature: null,
};

export default function VitalsFlow({
  language,
  priorityPatient,
  onComplete,
  onLogout,
  onNavigateStep,
}: VitalsFlowProps) {
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [vitals, setVitals] = useState<VitalsData>(EMPTY_VITALS);
  const [triage, setTriage] = useState<VitalTriageResult>({ queue: "NORMAL", color: "green", priorityOverride: false });
  const doneRef = useRef(false); // prevents duplicate completion

  const combineTriage = (current: VitalTriageResult, next: VitalTriageResult): VitalTriageResult => {
    if (current.queue === "ER" || next.queue === "ER") return { queue: "ER", color: "red", priorityOverride: false };
    if (current.color === "orange" || next.color === "orange") return { queue: "URGENT", color: "orange", priorityOverride: false };
    if (priorityPatient || current.priorityOverride || next.priorityOverride) return { queue: "URGENT", color: "yellow", priorityOverride: true };
    return { queue: "NORMAL", color: "green", priorityOverride: false };
  };

  const finish = (finalVitals: VitalsData, finalTriage: VitalTriageResult, endedEarly: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVitals(finalVitals);
    setTriage(finalTriage);
    onComplete({ vitals: finalVitals, triage: finalTriage, endedEarly });
  };

  const acceptReading = (nextVitals: VitalsData, result: VitalTriageResult, nextPart?: 2 | 3) => {
    const combined = combineTriage(triage, result);
    if (combined.queue === "ER") {
      finish(nextVitals, combined, true);
      return;
    }
    setVitals(nextVitals);
    setTriage(combined);
    if (nextPart) setPart(nextPart);
    else finish(nextVitals, combined, false);
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

  // ── Part 1: SpO2 and heart rate ──
  if (part === 1) {
    return (
      <VsOximeter
        {...common}
        isPriorityPatient={priorityPatient}
        onProceed={(v) => {
          acceptReading({
            ...vitals,
            oxygenSaturation: Number(v.spo2),
            pulseRate: Number(v.hr),
          }, v, 2);
        }}
      />
    );
  }

  // ── Part 2: Blood pressure ──
  if (part === 2) {
    return (
      <VsBloodpressure
        {...common}
        part={2}
        isPriorityPatient={priorityPatient}
        onProceed={(v) => {
          acceptReading({
            ...vitals,
            systolicBloodPressure: Number(v.bpSys),
            diastolicBloodPressure: Number(v.bpDia),
          }, v, 3);
        }}
      />
    );
  }

  // ── Part 3: Temperature (last step) ──
  return (
    <VsTemperature
      {...common}
      isPriorityPatient={priorityPatient}
      onProceed={(v) => acceptReading({ ...vitals, temperature: Number(v.temperature) }, v)}
    />
  );
}
