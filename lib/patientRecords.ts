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

export type ClinicCode = "SUR" | "PED" | "OBG" | "IM" | "ER";
export type PatientCategory = "URGENT" | "PRIORITY" | "REGULAR";
export type PatientStatus = "waiting" | "serving" | "done";

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
  sex: "M" | "F";
  chiefComplaints: PatientComplaint[];
  vitals: PatientVitals;
  category: PatientCategory;
  clinic: ClinicCode;
  status: PatientStatus;
  queueNumber: number;
  arrivedAt: string;
  completedAt?: string;
}

export interface NewQueuePatient {
  clinic: ClinicOption;
  name: string;
  age: number;
  sex: "M" | "F";
  complaint: PatientComplaint;
  vitals: PatientVitals;
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

const VALID_CLINICS: ClinicCode[] = ["SUR", "PED", "OBG", "IM", "ER"];
const VALID_CATEGORIES: PatientCategory[] = ["URGENT", "PRIORITY", "REGULAR"];
const VALID_STATUSES: PatientStatus[] = ["waiting", "serving", "done"];

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
    (data.sex !== "M" && data.sex !== "F") ||
    !VALID_CLINICS.includes(data.clinic) ||
    !VALID_CATEGORIES.includes(data.category) ||
    !VALID_STATUSES.includes(data.status) ||
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

  return {
    id,
    ticketCode: data.ticketCode,
    name: data.name,
    age: data.age,
    sex: data.sex,
    chiefComplaints,
    vitals: {
      bp: data.vitals.bp,
      hr: readNullableNumber(data.vitals.hr, "vitals.hr"),
      rr: readNullableNumber(data.vitals.rr, "vitals.rr"),
      temp: readNullableNumber(data.vitals.temp, "vitals.temp"),
      spo2: readNullableNumber(data.vitals.spo2, "vitals.spo2"),
    },
    category: data.category,
    clinic: data.clinic,
    status: data.status,
    queueNumber: data.queueNumber,
    arrivedAt: readTimestamp(data.createdAt, "createdAt"),
    completedAt: readOptionalTimestamp(data.completedAt, "completedAt"),
  };
}

export async function createQueuePatient(input: NewQueuePatient): Promise<CreatedQueueTicket> {
  const clinic = CLINIC_CODES[input.clinic];
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

    ticketCode = `${clinic}-R-${String(queueNumber).padStart(3, "0")}`;
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
      sex: input.sex,
      chiefComplaints: [input.complaint],
      vitals: input.vitals,
      category: "REGULAR",
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
