export type NEWS2Route = "EMERGENCY" | "URGENT" | "PRIORITY" | "REGULAR";

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
  criticalParameters: string[];
  route: NEWS2Route;
}

export interface NEWS2Input {
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  systolicBloodPressure: number | null;
  pulseRate: number | null;
  temperature: number | null;
  priorityPatient: boolean;
}

function scoreRespiratoryRate(value: number | null): number | null {
  if (value === null) return null;
  if (value <= 8 || value >= 25) return 3;
  if (value <= 11) return 2;
  if (value <= 20) return 0;
  return 1;
}

function scoreOxygenSaturation(value: number | null): number | null {
  if (value === null) return null;
  if (value <= 91) return 3;
  if (value <= 93) return 2;
  if (value <= 95) return 1;
  return 0;
}

function scoreSystolicBloodPressure(value: number | null): number | null {
  if (value === null) return null;
  if (value <= 90 || value >= 220) return 3;
  if (value <= 100) return 2;
  if (value <= 110) return 1;
  return 0;
}

function scorePulseRate(value: number | null): number | null {
  if (value === null) return null;
  if (value <= 40 || value >= 131) return 3;
  if ((value >= 41 && value <= 50) || (value >= 91 && value <= 110)) return 1;
  if (value >= 111 && value <= 130) return 2;
  return 0;
}

function scoreTemperature(value: number | null): number | null {
  if (value === null) return null;
  if (value <= 35 || value >= 39.1) return 3;
  if (value <= 36) return 2;
  if (value <= 38) return 0;
  return 1;
}

export function calculateNEWS2(input: NEWS2Input): NEWS2Result {
  const components: NEWS2Components = {
    respiratoryRate: scoreRespiratoryRate(input.respiratoryRate),
    oxygenSaturation: scoreOxygenSaturation(input.oxygenSaturation),
    systolicBloodPressure: scoreSystolicBloodPressure(input.systolicBloodPressure),
    pulseRate: scorePulseRate(input.pulseRate),
    consciousness: null,
    temperature: scoreTemperature(input.temperature),
    supplementalOxygen: null,
  };
  const scoreNames: Record<keyof NEWS2Components, string> = {
    respiratoryRate: "Respiratory rate",
    oxygenSaturation: "SpO2",
    systolicBloodPressure: "Systolic blood pressure",
    pulseRate: "Pulse rate",
    consciousness: "Consciousness",
    temperature: "Temperature",
    supplementalOxygen: "Supplemental oxygen",
  };
  const missingParameters = Object.entries(components)
    .filter(([, score]) => score === null)
    .map(([parameter]) => scoreNames[parameter as keyof NEWS2Components]);
  const criticalParameters = Object.entries(components)
    .filter(([, score]) => score === 3)
    .map(([parameter]) => scoreNames[parameter as keyof NEWS2Components]);
  const total = Object.values(components).reduce<number>(
    (sum, score) => sum + (score ?? 0),
    0,
  );
  const route: NEWS2Route =
    criticalParameters.length > 0 || total >= 7
      ? "EMERGENCY"
      : total >= 5
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
    route,
  };
}
