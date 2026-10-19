import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClinicOption } from "@/Component/primaryClinics";
import type { NEWS2Result } from "@/lib/news2";
import type { PatientAgeGroup } from "@/lib/patientDemographics";

export type ClinicCode = "SUR" | "PED" | "OBG" | "IM" | "ER";
export type PatientCategory = "EMERGENCY" | "URGENT" | "PRIORITY" | "REGULAR";
export type PatientStatus =
  | "waiting"
  | "serving"
  | "done"
  | "cancelled";

export interface PatientVitals {
  bp: string | null;
  hr: number | null;
  rr: number | null;
  temp: number | null;
  spo2: number | null;
}

export interface PatientComplaint {
  complaint: string;
  duration: string;
  severity: string | number;
  location: string;
}

export interface QueuePatient {
  id: string;
  ticketCode: string;
  name: string;
  age: number;
  ageDisplay: string;
  ageGroup: PatientAgeGroup;
  sex: "M" | "F";
  contactNumber: string;
  chiefComplaints: PatientComplaint[];
  vitals: PatientVitals;
  news2?: NEWS2Result;
  category: PatientCategory;
  clinic: ClinicCode;
  status: PatientStatus;
  queueNumber: number;
  arrivedAt: string;
  completedAt?: string;
}

export interface NewQueuePatient {
  clinic: ClinicOption | "Emergency Dept.";
  name: string;
  age: number;
  ageDisplay: string;
  ageGroup: PatientAgeGroup;
  sex: "M" | "F";
  contactNumber: string;
  complaint: PatientComplaint;
  vitals: PatientVitals;
  news2: NEWS2Result;
  category: PatientCategory;
}

export interface CreatedQueueTicket {
  id: string;
  ticketCode: string;
  queueNumber: number;
  arrivedAt: string;
}

const CLINIC_CODES: Record<ClinicOption, ClinicCode> = {
  "General Surgery": "SUR",
  "Internal Medicine": "IM",
  "OB-GYNE": "OBG",
  Pediatrics: "PED",
};
const EMERGENCY_CLINIC_CODE: ClinicCode = "ER";

const VALID_CLINICS: ClinicCode[] = ["SUR", "PED", "OBG", "IM", "ER"];
const VALID_CATEGORIES: PatientCategory[] = ["EMERGENCY", "URGENT", "PRIORITY", "REGULAR"];
const VALID_STATUSES: PatientStatus[] = [
  "waiting",
  "serving",
  "done",
  "cancelled",
];
const VALID_AGE_GROUPS: PatientAgeGroup[] = ["INFANT", "CHILD", "ADOLESCENT", "ADULT", "SENIOR"];

function isPatientAgeGroup(value: unknown): value is PatientAgeGroup {
  return typeof value === "string" && VALID_AGE_GROUPS.some(group => group === value);
}

function readTimestamp(value: unknown, fieldName: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  throw new Error(`Invalid patient record: ${fieldName} must be a Firestore timestamp.`);
}

function readOptionalTimestamp(value: unknown, fieldName: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return readTimestamp(value, fieldName);
}

function readNullableNumber(value: unknown, fieldName: string): number | null {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Invalid patient record: ${fieldName} must be a number or null.`);
}

export function parseQueuePatient(id: string, data: DocumentData): QueuePatient {
  if (
    typeof data.ticketCode !== "string" ||
    typeof data.name !== "string" ||
    typeof data.age !== "number" ||
    !Number.isInteger(data.age) ||
    data.age < 0 ||
    data.age > 150 ||
    (data.ageDisplay !== undefined && typeof data.ageDisplay !== "string") ||
    (data.ageGroup !== undefined && !isPatientAgeGroup(data.ageGroup)) ||
    (data.contactNumber !== undefined && typeof data.contactNumber !== "string") ||
    (data.sex !== "M" && data.sex !== "F") ||
    !VALID_CLINICS.includes(data.clinic) ||
    typeof data.category !== "string" ||
    !VALID_CATEGORIES.includes(data.category as PatientCategory) ||
   !VALID_STATUSES.includes(data.status as PatientStatus) ||
    typeof data.queueNumber !== "number" ||
    !Array.isArray(data.chiefComplaints) ||
    !data.vitals ||
    typeof data.vitals !== "object"
  ) {
    throw new Error(`Invalid patient record: ${id} has an unexpected data shape.`);
  }

  const chiefComplaints = data.chiefComplaints.map((complaint: unknown) => {
    if (
      typeof complaint !== "object" ||
      complaint === null ||
      !("complaint" in complaint) ||
      !("duration" in complaint) ||
      !("severity" in complaint) ||
      !("location" in complaint) ||
      typeof complaint.complaint !== "string" ||
      typeof complaint.duration !== "string" ||
      (typeof complaint.severity !== "string" && typeof complaint.severity !== "number") ||
      typeof complaint.location !== "string"
    ) {
      throw new Error(`Invalid patient record: ${id} contains an invalid complaint.`);
    }
    return {
      complaint: complaint.complaint,
      duration: complaint.duration,
      severity: complaint.severity,
      location: complaint.location,
    };
  });

  if (typeof data.vitals.bp !== "string" && data.vitals.bp !== null) {
    throw new Error(`Invalid patient record: ${id} has invalid blood pressure.`);
  }

  let news2: NEWS2Result | undefined;
  if (data.news2 !== undefined) {
    const value = data.news2;
    if (
      typeof value !== "object" ||
      value === null ||
      typeof value.total !== "number" ||
      typeof value.complete !== "boolean" ||
      !Array.isArray(value.missingParameters) ||
      !value.missingParameters.every((item: unknown) => typeof item === "string") ||
      !Array.isArray(value.criticalParameters) ||
      !value.criticalParameters.every((item: unknown) => typeof item === "string") ||
      !["EMERGENCY", "URGENT", "PRIORITY", "REGULAR"].includes(value.route) ||
      typeof value.components !== "object" ||
      value.components === null
    ) {
      throw new Error(`Invalid patient record: ${id} has an invalid NEWS2 result.`);
    }
    const scoreValues = [
      value.components.respiratoryRate,
      value.components.oxygenSaturation,
      value.components.systolicBloodPressure,
      value.components.pulseRate,
      value.components.consciousness,
      value.components.temperature,
      value.components.supplementalOxygen,
    ];
    if (!scoreValues.every((score: unknown) => score === null || (typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= 3))) {
      throw new Error(`Invalid patient record: ${id} has invalid NEWS2 parameter scores.`);
    }
    news2 = value as NEWS2Result;
  }

  return {
    id,
    ticketCode: data.ticketCode,
    name: data.name,
    age: data.age,
    ageDisplay: data.ageDisplay ?? `${data.age} ${data.age === 1 ? "year" : "years"}`,
    ageGroup: data.ageGroup ?? (
      data.age === 0 ? "INFANT"
        : data.age <= 11 ? "CHILD"
          : data.age <= 17 ? "ADOLESCENT"
            : data.age <= 59 ? "ADULT"
              : "SENIOR"
    ),
    sex: data.sex,
    contactNumber: data.contactNumber ?? "",
    chiefComplaints,
    vitals: {
      bp: data.vitals.bp,
      hr: readNullableNumber(data.vitals.hr, "vitals.hr"),
      rr: readNullableNumber(data.vitals.rr, "vitals.rr"),
      temp: readNullableNumber(data.vitals.temp, "vitals.temp"),
      spo2: readNullableNumber(data.vitals.spo2, "vitals.spo2"),
    },
    ...(news2 ? { news2 } : {}),
    category: data.category as PatientCategory,
    clinic: data.clinic,
    status: data.status,
    queueNumber: data.queueNumber,
    arrivedAt: readTimestamp(data.createdAt, "createdAt"),
    completedAt: readOptionalTimestamp(data.completedAt, "completedAt"),
  };
}

export async function createQueuePatient(input: NewQueuePatient): Promise<CreatedQueueTicket> {
  const clinic = input.clinic === "Emergency Dept."
    ? EMERGENCY_CLINIC_CODE
    : CLINIC_CODES[input.clinic];
  const categoryCode: Record<PatientCategory, string> = {
    EMERGENCY: "E",
    URGENT: "U",
    PRIORITY: "P",
    REGULAR: "R",
  };
  const patientRef = doc(collection(db, "patients"));
  const counterRef = doc(db, "queueCounters", clinic);
  const arrivedAt = new Date();
  let ticketCode = "";
  let queueNumber = 0;

  await runTransaction(db, async transaction => {
    const counter = await transaction.get(counterRef);
    queueNumber = counter.exists() ? counter.data().current + 1 : 1;
    if (!Number.isInteger(queueNumber) || queueNumber > 999999) {
      throw new Error(`The ${input.clinic} queue has reached its daily capacity.`);
    }

    ticketCode = `${clinic}-${categoryCode[input.category]}-${String(queueNumber).padStart(3, "0")}`;
    transaction.set(counterRef, {
      clinic,
      current: queueNumber,
      lastPatientId: patientRef.id,
      updatedAt: serverTimestamp(),
    });
    transaction.set(patientRef, {
      ticketCode,
      name: input.name,
      age: input.age,
      ageDisplay: input.ageDisplay,
      ageGroup: input.ageGroup,
      sex: input.sex,
      contactNumber: input.contactNumber,
      chiefComplaints: [input.complaint],
      vitals: input.vitals,
      news2: input.news2,
      category: input.category,
      clinic,
      status: "waiting",
      queueNumber,
      createdAt: serverTimestamp(),
      completedAt: null,
    });
  });

  return {
    id: patientRef.id,
    ticketCode,
    queueNumber,
    arrivedAt: arrivedAt.toISOString(),
  };
}

export async function getStaffClinic(uid: string): Promise<ClinicCode> {
  const staffSnapshot = await getDoc(doc(db, "staff", uid));
  if (!staffSnapshot.exists()) {
    throw new Error("This account is not authorized for a clinic dashboard.");
  }
  const staff = staffSnapshot.data();
  if (staff.active !== true || !VALID_CLINICS.includes(staff.clinic)) {
    throw new Error("This staff account is inactive or has an invalid clinic assignment.");
  }
  return staff.clinic;
}

export function subscribeToClinicPatients(
  clinic: ClinicCode,
  onPatients: (patients: QueuePatient[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const patientsQuery = query(
    collection(db, "patients"),
    where("clinic", "==", clinic),
  );

  return onSnapshot(
    patientsQuery,
    snapshot => {
      try {
        onPatients(
          snapshot.docs
            .map(patientDoc => parseQueuePatient(patientDoc.id, patientDoc.data()))
            .sort((a, b) => a.queueNumber - b.queueNumber),
        );
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Could not read patient records."));
      }
    },
    error => onError(error),
  );
}

export async function persistPatientStatuses(previous: QueuePatient[], next: QueuePatient[]): Promise<void> {
  const oldPatients = new Map(previous.map(patient => [patient.id, patient]));
  const batch = writeBatch(db);
  let updates = 0;

  for (const patient of next) {
    const oldPatient = oldPatients.get(patient.id);
    if (!oldPatient || (oldPatient.status === patient.status && oldPatient.completedAt === patient.completedAt)) continue;
    batch.update(doc(db, "patients", patient.id), {
      status: patient.status,
      completedAt: patient.status === "done" ? serverTimestamp() : null,
    });
    updates += 1;
  }

  if (updates > 0) await batch.commit();
}
