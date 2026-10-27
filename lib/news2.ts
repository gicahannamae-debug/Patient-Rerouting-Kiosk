export type NEWS2Route = "EMERGENCY" | "URGENT" | "PRIORITY" | "REGULAR";
export type NEWS2Risk = "LOW" | "LOW_MEDIUM" | "MEDIUM" | "HIGH";

export interface NEWS2Components {
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  systolicBloodPressure: number | null;
  pulseRate: number | null;
  consciousness: number | null;
  temperature: number | null;
  supplementalOxygen: number | null;
}

export interface NEWS2Result {
  components: NEWS2Components;
  total: number;
  complete: boolean;
  missingParameters: string[];
  /** parameters that individually scored 3 (NEWS2 "red score") */
  criticalParameters: string[];
  risk: NEWS2Risk;
  route: NEWS2Route;
}

export interface NEWS2Input {
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  systolicBloodPressure: number | null;
  pulseRate: number | null;
  temperature: number | null;
  /** true = on supplemental oxygen (2 points). Default: room air */
  supplementalOxygen?: boolean;
  /** false = Confusion / Voice / Pain / Unresponsive (3 points). Default: Alert */
  alert?: boolean;
  /** senior, PWD, pregnant, etc. Only reorders patients within the low-risk band */
  priorityPatient: boolean;
}

// ── NEWS2 scoring (Royal College of Physicians, 2017; SpO2 Scale 1) ──

function scoreRespiratoryRate(v: number | null): number | null {
  if (v === null) return null;
  if (v <= 8) return 3;
  if (v <= 11) return 1;
  if (v <= 20) return 0;
  if (v <= 24) return 2;
  return 3;
}

function scoreOxygenSaturation(v: number | null): number | null {
  if (v === null) return null;
  if (v <= 91) return 3;
  if (v <= 93) return 2;
  if (v <= 95) return 1;
  return 0;
}

function scoreSystolicBloodPressure(v: number | null): number | null {
  if (v === null) return null;
  if (v <= 90) return 3;
  if (v <= 100) return 2;
  if (v <= 110) return 1;
  if (v <= 219) return 0;
  return 3;
}

function scorePulseRate(v: number | null): number | null {
  if (v === null) return null;
  if (v <= 40) return 3;
  if (v <= 50) return 1;
  if (v <= 90) return 0;
  if (v <= 110) return 1;
  if (v <= 130) return 2;
  return 3;
}

function scoreTemperature(v: number | null): number | null {
  if (v === null) return null;
  if (v <= 35.0) return 3;
  if (v <= 36.0) return 1;
  if (v <= 38.0) return 0;
  if (v <= 39.0) return 1;
  return 2;
}

export function calculateNEWS2(input: NEWS2Input): NEWS2Result {
  const components: NEWS2Components = {
    respiratoryRate: scoreRespiratoryRate(input.respiratoryRate),
    oxygenSaturation: scoreOxygenSaturation(input.oxygenSaturation),
    systolicBloodPressure: scoreSystolicBloodPressure(input.systolicBloodPressure),
    pulseRate: scorePulseRate(input.pulseRate),
    consciousness: input.alert === false ? 3 : 0,
    temperature: scoreTemperature(input.temperature),
    supplementalOxygen: input.supplementalOxygen ? 2 : 0,
  };

  const names: Record<keyof NEWS2Components, string> = {
    respiratoryRate: "Respiratory rate",
    oxygenSaturation: "SpO2",
    systolicBloodPressure: "Systolic blood pressure",
    pulseRate: "Pulse rate",
    consciousness: "Consciousness",
    temperature: "Temperature",
    supplementalOxygen: "Supplemental oxygen",
  };

  const entries = Object.entries(components) as [keyof NEWS2Components, number | null][];

  // only the five measured parameters can be missing
  const measured: (keyof NEWS2Components)[] = [
    "respiratoryRate",
    "oxygenSaturation",
    "systolicBloodPressure",
    "pulseRate",
    "temperature",
  ];
  const missingParameters = measured.filter((k) => components[k] === null).map((k) => names[k]);
  const criticalParameters = entries.filter(([, s]) => s === 3).map(([k]) => names[k]);
  const total = entries.reduce((sum, [, s]) => sum + (s ?? 0), 0);

  // NEWS2 clinical risk bands
  let risk: NEWS2Risk;
  if (total >= 7) risk = "HIGH";
  else if (total >= 5) risk = "MEDIUM";
  else if (criticalParameters.length > 0) risk = "LOW_MEDIUM"; // single red score
  else risk = "LOW";

  const route: NEWS2Route =
    risk === "HIGH"
      ? "EMERGENCY"
      : risk === "MEDIUM" || risk === "LOW_MEDIUM"
        ? "URGENT"
        : input.priorityPatient
          ? "PRIORITY"
          : "REGULAR";

  return {
    components,
    total,
    complete: missingParameters.length === 0,
    missingParameters,
    criticalParameters,
    risk,
    route,
  };
}