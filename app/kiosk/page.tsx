'use client'
import { useState } from "react";
import CcRedflag, { type EmergencyAlert } from "@/Component/ccRedflag";
import PatientInformation from "@/Component/patientInformation";
import PrimaryClinics, { type ClinicOption, type PrimaryClinicsPayload } from "@/Component/primaryClinics";
import VsTemperature from "@/Component/vsTemperature";
import VsBloodpressure from "@/Component/vsBloodpressure";
import VsOximeter from "@/Component/vsOximeter";
import SummaryScreen from "@/Component/summaryScreen";
import type { TicketMetadata } from "@/Component/summaryTypes";
import { createQueuePatient } from "@/lib/patientRecords";

// Flow (new patients only): safety → patientForm → vitals (bp → oximetry → temperature) → primaryClinics → summary
type AppStep = "safety" | "patientForm" | "vitals" | "primaryClinics" | "summary";
type VitalStage = "bp" | "oximetry" | "temperature";

type PatientInfo = {
  lastName: string;
  firstName: string;
  middleName: string;
  pwdStatus: string;
  birthdate: string;
  age: string;
  gender: string;
  address: string;
  birthplace: string;
  religion: string;
  civilStatus: string;
  appointmentStatus: string;
};

type VitalData = {
  bpSys: string;
  bpDia: string;
  hr: string;
  spo2: string;
  temperature: string;
};

type TriageSelection = {
  groupLabel: string;
  ccLabel: string;
  subLabel: string;
  clinic: ClinicOption | null;
  systemValue: string;
  answers: Record<string, boolean>;
};

type VitalPayload = Partial<VitalData>;

const EMPTY_PATIENT: PatientInfo = {
  lastName: "", firstName: "", middleName: "", pwdStatus: "", birthdate: "", age: "",
  gender: "", address: "", birthplace: "", religion: "", civilStatus: "", appointmentStatus: "",
};
const EMPTY_VITALS: VitalData = { bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" };
const EMPTY_TRIAGE: TriageSelection = {
  groupLabel: "", ccLabel: "", subLabel: "", clinic: null, systemValue: "", answers: {},
};

// Only consultation tickets exist now
const TICKET_METADATA: TicketMetadata = {
  serviceTitle: "MEDICAL CONSULTATION",
  ticketType: "consultation",
  badgeColor: "bg-cyan-600 text-white",
};

const clinicDestinations: Record<ClinicOption, string> = {
  "General Surgery": "Surgical Services Wing",
  "Internal Medicine": "Internal Medicine Unit",
  "OB-GYNE": "OB-GYNE Clinic",
  Pediatrics: "Pediatrics Wing",
};

const getCurrentDate = () => new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
const getCurrentTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const readMeasurement = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

export default function Home() {
  const [step, setStep] = useState<AppStep>("safety");

  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(null);
  const [vitalStage, setVitalStage] = useState<VitalStage>("bp");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(EMPTY_PATIENT);
  const [vitals, setVitals] = useState<VitalData>(EMPTY_VITALS);
  const [triageSelection, setTriageSelection] = useState<TriageSelection>(EMPTY_TRIAGE);
  const [queueCode, setQueueCode] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());

  const resetFormState = () => {
    setSelectedClinic(null);
    setVitalStage("bp");
    setPatientInfo(EMPTY_PATIENT);
    setVitals(EMPTY_VITALS);
    setTriageSelection(EMPTY_TRIAGE);
    setQueueCode("");
    setDestination("");
    setDate(getCurrentDate());
    setTime(getCurrentTime());
  };

  const handleKioskLogout = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("bica_emergency");
    resetFormState();
    setStep("safety");
  };

  // ── Safety check ────────────────────────────────────────────────────────────
  const handleSafetyProceed = () => setStep("patientForm"); // "NONE apply" → straight to triage form

  const handleEmergencyAlert = (alert: EmergencyAlert) => {
    // TODO: write to Firestore so the ER dashboard updates in realtime, e.g.
    // addDoc(collection(db, "emergencies"), { ...alert, status: "alerted", createdAt: serverTimestamp() });
    console.log("Emergency alert:", alert);
  };

  // ── Triage form ─────────────────────────────────────────────────────────────
  const handlePatientFormProceed = (values?: PatientInfo) => {
    if (values) setPatientInfo(values);
    setVitalStage("bp");
    setStep("vitals");
  };

  // ── Vitals ──────────────────────────────────────────────────────────────────
  const handleVitalProceed = (values?: VitalPayload) => {
    if (values) {
      setVitals((prev) => ({ ...prev, ...values }));
    }
    if (vitalStage === "bp") {
      setVitalStage("oximetry");
    } else if (vitalStage === "oximetry") {
      setVitalStage("temperature");
    } else {
      setStep("primaryClinics");
    }
  };

  // ── Header navigation ───────────────────────────────────────────────────────
  const handleNavigateStep = (targetStep: number) => {
    if (targetStep <= 1) {
      setStep("safety");
    } else if (targetStep <= 3) {
      setStep("patientForm");
    } else if (targetStep === 4) {
      setVitalStage("temperature");
      setStep("vitals");
    } else if (targetStep === 5) {
      setStep("primaryClinics");
    }
  };

  const handleNavigateVitalPart = (part: number) => {
    setVitalStage(part === 1 ? "bp" : part === 2 ? "oximetry" : "temperature");
    setStep("vitals");
  };

  const handlePrimaryClinicsProceed = async (payload: PrimaryClinicsPayload) => {
    const clinic = payload.clinic;
    const name = [patientInfo.firstName, patientInfo.middleName, patientInfo.lastName]
      .map(value => value.trim())
      .filter(Boolean)
      .join(" ");
    const ticket = await createQueuePatient({
      clinic,
      name,
      age: Number(patientInfo.age),
      sex: patientInfo.gender === "Male" ? "M" : "F",
      complaint: {
        complaint: payload.cc_label,
        duration: payload.duration_text,
        severity: payload.severity_label,
        location: payload.pain_locations.join(", "),
      },
      vitals: {
        bp: vitals.bpSys && vitals.bpDia ? `${vitals.bpSys}/${vitals.bpDia}` : null,
        hr: readMeasurement(vitals.hr, 30, 250),
        rr: null,
        temp: readMeasurement(vitals.temperature, 30, 45),
        spo2: readMeasurement(vitals.spo2, 50, 100),
      },
    });
    const arrivedAt = new Date(ticket.arrivedAt);
    setSelectedClinic(clinic);
    setDestination(clinicDestinations[clinic]);
    setQueueCode(ticket.ticketCode);
    setTriageSelection({
      groupLabel: payload.group_label,
      ccLabel: payload.cc_label,
      subLabel: payload.sub_label,
      clinic,
      systemValue: payload.system_value,
      answers: payload.answers,
    });
    setDate(arrivedAt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }));
    setTime(arrivedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    setStep("summary");
  };

  const handleFinish = () => {
    resetFormState();
    setStep("safety");
  };

  const patientName = `${patientInfo.lastName}, ${patientInfo.firstName} ${patientInfo.middleName}`.trim();
  const complaints = triageSelection.subLabel || triageSelection.ccLabel || triageSelection.groupLabel || "No chief complaint selected";
  const clinic = selectedClinic ?? triageSelection.clinic ?? "";

  return (
    <div
      className="min-h-screen w-full relative"
    >
      <div className="relative">
        {step === "safety" && (
              <CcRedflag
                onLogout={handleKioskLogout}
                onProceed={handleSafetyProceed}
                onNavigateStep={handleNavigateStep}
                onEmergencyAlert={handleEmergencyAlert}
              />
            )}

            {step === "patientForm" && (
              <PatientInformation
                onLogout={handleKioskLogout}
                onProceed={handlePatientFormProceed}
                onNavigateStep={handleNavigateStep}
              />
            )}

            {step === "vitals" && vitalStage === "bp" && (
              <VsBloodpressure
                onLogout={handleKioskLogout}
                onProceed={handleVitalProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}
            {step === "vitals" && vitalStage === "oximetry" && (
              <VsOximeter
                onLogout={handleKioskLogout}
                onProceed={handleVitalProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}
            {step === "vitals" && vitalStage === "temperature" && (
              <VsTemperature
                onLogout={handleKioskLogout}
                onProceed={handleVitalProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}

            {step === "primaryClinics" && (
              <PrimaryClinics
                onLogout={handleKioskLogout}
                onProceed={handlePrimaryClinicsProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}

            {step === "summary" && (
              <SummaryScreen
                patientName={patientName}
                age={patientInfo.age}
                gender={patientInfo.gender}
                patientAddress={patientInfo.address}
                pwdStatus={patientInfo.pwdStatus}
                bpSys={vitals.bpSys}
                bpDia={vitals.bpDia}
                hr={vitals.hr}
                spo2={vitals.spo2}
                temperature={vitals.temperature}
                complaints={complaints}
                clinic={clinic}
                destination={destination}
                queueCode={queueCode}
                date={date}
                time={time}
                patientStatus="new"
                referralFrom=""
                referralDoctor=""
                referralDate=""
                referralPurpose=""
                referralDiagnosis=""
                ticketMetadata={TICKET_METADATA}
                onLogout={handleKioskLogout}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
                onFinish={handleFinish}
              />
            )}
      </div>
    </div>
  );
}