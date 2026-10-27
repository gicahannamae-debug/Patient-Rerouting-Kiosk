'use client'
import { useRef, useState } from "react";
import CcRedflag, { type EmergencyAlert } from "@/Component/ccRedflag";
import PatientInformation from "@/Component/patientInformation";
import PrimaryClinics, { type ClinicOption, type PrimaryClinicsPayload } from "@/Component/primaryClinics";
import VsTemperature from "@/Component/vsTemperature";
import VsBloodpressure from "@/Component/vsBloodpressure";
import VsOximeter from "@/Component/vsOximeter";
import SummaryScreen from "@/Component/summaryScreen";
import type { TicketMetadata } from "@/Component/summaryTypes";
import { createQueuePatient } from "@/lib/patientRecords";
import { calculateNEWS2 } from "@/lib/news2";
import type { NEWS2Result } from "@/lib/news2";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import type { PatientAgeGroup, PatientDemographics } from "@/lib/patientDemographics";

// Flow: early patient details → safety → vitals → registration → complaints → ticket
type AppStep = "safety" | "patientForm" | "vitals" | "primaryClinics" | "summary";
type VitalStage = "bp" | "oximetry" | "temperature";

type PatientInfo = {
  lastName: string;
  firstName: string;
  middleName: string;
  pwdStatus: string;
  birthdate: string;
  age: string;
  ageDisplay: string;
  ageGroup: PatientAgeGroup | "";
  gender: string;
  contactNumber: string;
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
  rr: string;
  spo2: string;
  temperature: string;
};

type TriageSelection = {
  groupLabel: string;
  ccLabel: string;
  ccLabelCebuano: string;
  subLabel: string;
  clinic: ClinicOption | null;
  systemValue: string;
  answers: Record<string, boolean>;
};

type VitalPayload = Partial<VitalData>;

const EMPTY_PATIENT: PatientInfo = {
  lastName: "", firstName: "", middleName: "", pwdStatus: "", birthdate: "", age: "",
  ageDisplay: "", ageGroup: "", gender: "", contactNumber: "", address: "", birthplace: "",
  religion: "", civilStatus: "", appointmentStatus: "",
};
const EMPTY_VITALS: VitalData = { bpSys: "", bpDia: "", hr: "", rr: "", spo2: "", temperature: "" };
const EMPTY_TRIAGE: TriageSelection = {
  groupLabel: "", ccLabel: "", ccLabelCebuano: "", subLabel: "", clinic: null, systemValue: "", answers: {},
};

// Only consultation tickets exist now
const TICKET_METADATA: TicketMetadata = {
  serviceTitle: "MEDICAL CONSULTATION",
  ticketType: "consultation",
  badgeColor: "bg-cyan-600 text-white",
};

const clinicDestinations: Record<ClinicOption | "Emergency Dept.", string> = {
  "General Surgery": "Surgical Services Wing",
  "Internal Medicine": "Internal Medicine Unit",
  "OB-GYNE": "OB-GYNE Clinic",
  Pediatrics: "Pediatrics Wing",
  "Emergency Dept.": "Emergency Department",
};

const getCurrentDate = () => new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
const getCurrentTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const readMeasurement = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

export default function Home() {
  const [step, setStep] = useState<AppStep>("safety");
  const [language, setLanguage] = useState<KioskLanguage>("en");

  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | "Emergency Dept." | null>(null);
  const [vitalStage, setVitalStage] = useState<VitalStage>("bp");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(EMPTY_PATIENT);
  const [vitals, setVitals] = useState<VitalData>(EMPTY_VITALS);
  const [news2, setNews2] = useState<NEWS2Result | null>(null);
  const [triageSelection, setTriageSelection] = useState<TriageSelection>(EMPTY_TRIAGE);
  const [queueCode, setQueueCode] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [queueError, setQueueError] = useState("");
  const emergencyQueueCreation = useRef(false);

  const resetFormState = () => {
    setLanguage("en");
    setSelectedClinic(null);
    setVitalStage("bp");
    setPatientInfo(EMPTY_PATIENT);
    setVitals(EMPTY_VITALS);
    setNews2(null);
    setTriageSelection(EMPTY_TRIAGE);
    setQueueCode("");
    setDestination("");
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setQueueError("");
  };

  const handleKioskLogout = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("bica_emergency");
    resetFormState();
    setStep("safety");
  };

  // ── Patient details and safety check ────────────────────────────────────────
  const handlePatientDemographics = (demographics: PatientDemographics) => {
    setPatientInfo(previous => ({
      ...previous,
      firstName: demographics.firstName,
      lastName: demographics.lastName,
      age: String(demographics.age),
      ageDisplay: demographics.ageDisplay,
      ageGroup: demographics.ageGroup,
      gender: demographics.gender,
      contactNumber: demographics.contactNumber,
    }));
  };

  const handleSafetyProceed = () => {
    setVitalStage("bp");
    setStep("vitals");
  };

  const handleEmergencyAlert = (alert: EmergencyAlert) => {
    // TODO: write to Firestore so the ER dashboard updates in realtime, e.g.
    // addDoc(collection(db, "emergencies"), { ...alert, status: "alerted", createdAt: serverTimestamp() });
    console.log("Emergency alert:", alert);
  };

  // ── Registration form (after vital signs) ───────────────────────────────────
  const handlePatientFormProceed = (values?: PatientInfo) => {
    if (values) {
      setPatientInfo(previous => ({
        ...values,
        age: previous.age || values.age,
        ageDisplay: previous.ageDisplay || values.age,
        ageGroup: previous.ageGroup,
        contactNumber: previous.contactNumber,
      }));
    }
    setStep("primaryClinics");
  };

  const calculateCurrentNEWS2 = (data: VitalData) => calculateNEWS2({
    respiratoryRate: readMeasurement(data.rr, 0, 100),
    oxygenSaturation: readMeasurement(data.spo2, 0, 100),
    systolicBloodPressure: readMeasurement(data.bpSys, 0, 300),
    pulseRate: readMeasurement(data.hr, 0, 250),
    temperature: readMeasurement(data.temperature, 30, 45),
    priorityPatient: patientInfo.pwdStatus === "Yes, PWD" || patientInfo.ageGroup === "SENIOR",
  });

  const createQueueTicket = async (result: NEWS2Result, data: VitalData, payload?: PrimaryClinicsPayload) => {
    const route = result.route;
    const clinic = route === "EMERGENCY" ? "Emergency Dept." : payload?.clinic;
    if (!clinic) throw new Error("Select a clinic before creating the patient ticket.");

    const name = [patientInfo.firstName, patientInfo.middleName, patientInfo.lastName]
      .map(value => value.trim())
      .filter(Boolean)
      .join(" ");
    if (!name || !patientInfo.ageGroup || !patientInfo.ageDisplay || !patientInfo.contactNumber || !patientInfo.gender) {
      throw new Error("Patient details are incomplete. Please return to Patient Details before creating a ticket.");
    }
    const ticket = await createQueuePatient({
      clinic,
      name,
      age: Number(patientInfo.age),
      ageDisplay: patientInfo.ageDisplay,
      ageGroup: patientInfo.ageGroup,
      sex: patientInfo.gender === "MALE" ? "M" : "F",
      contactNumber: patientInfo.contactNumber,
      category: route,
      news2: result,
      complaint: payload
        ? {
            complaint: payload.cc_label,
            duration: payload.duration_text,
            severity: payload.severity_label,
            location: payload.pain_locations.join(", "),
          }
        : {
            complaint: "NEWS2 emergency escalation",
            duration: "At assessment",
            severity: "Emergency",
            location: result.criticalParameters.join(", ") || "NEWS2 total 7 or higher",
          },
      vitals: {
        bp: data.bpSys && data.bpDia ? `${data.bpSys}/${data.bpDia}` : null,
        hr: readMeasurement(data.hr, 30, 250),
        rr: readMeasurement(data.rr, 0, 100),
        temp: readMeasurement(data.temperature, 30, 45),
        spo2: readMeasurement(data.spo2, 0, 100),
      },
    });

    const arrivedAt = new Date(ticket.arrivedAt);
    setNews2(result);
    setSelectedClinic(clinic);
    setDestination(clinicDestinations[clinic]);
    setQueueCode(ticket.ticketCode);
    setTriageSelection(payload ? {
      groupLabel: payload.group_label,
      ccLabel: payload.cc_label,
      ccLabelCebuano: payload.cc_label_cebuano,
      subLabel: payload.sub_label,
      clinic: payload.clinic,
      systemValue: payload.system_value,
      answers: payload.answers,
    } : {
      ...EMPTY_TRIAGE,
      groupLabel: "NEWS2 emergency escalation",
      ccLabel: "NEWS2 emergency escalation",
      subLabel: "NEWS2 emergency escalation",
    });
    setDate(arrivedAt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }));
    setTime(arrivedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    setQueueError("");
    setStep("summary");
  };

  // ── Vitals ──────────────────────────────────────────────────────────────────
  const handleVitalProceed = (values?: VitalPayload) => {
    const updatedVitals = values ? { ...vitals, ...values } : vitals;
    if (values) {
      setVitals(updatedVitals);
    }
    if (vitalStage === "bp") {
      setVitalStage("oximetry");
    } else if (vitalStage === "oximetry") {
      setVitalStage("temperature");
    } else {
      const result = calculateCurrentNEWS2(updatedVitals);
      setNews2(result);
      if (result.route === "EMERGENCY") {
        if (!emergencyQueueCreation.current) {
          emergencyQueueCreation.current = true;
          setQueueError("");
          void createQueueTicket(result, updatedVitals)
            .catch(error => {
              setQueueError(error instanceof Error ? error.message : "Could not create the emergency queue ticket.");
            })
            .finally(() => {
              emergencyQueueCreation.current = false;
            });
        }
      } else {
        setStep("patientForm");
      }
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
      setStep("patientForm");
    } else if (targetStep === 6) {
      setStep("primaryClinics");
    }
  };

  const handleNavigateVitalPart = (part: number) => {
    setVitalStage(part === 1 ? "bp" : part === 2 ? "oximetry" : "temperature");
    setStep("vitals");
  };

  const handlePrimaryClinicsProceed = async (payload: PrimaryClinicsPayload) => {
    const result = calculateCurrentNEWS2(vitals);
    await createQueueTicket(result, vitals, payload);
  };

  const handleFinish = () => {
    resetFormState();
    setStep("safety");
  };

  const patientName = [patientInfo.firstName, patientInfo.middleName, patientInfo.lastName]
    .filter(Boolean)
    .join(" ");
  const complaints = language === "ceb"
    ? triageSelection.ccLabelCebuano || "Wala pay napili nga pangunang reklamo"
    : triageSelection.subLabel || triageSelection.ccLabel || triageSelection.groupLabel || "No chief complaint selected";
  const clinic = selectedClinic ?? triageSelection.clinic ?? "";

  return (
    <div
      className="min-h-screen w-full relative"
    >
      {queueError && (
        <div role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto max-w-2xl rounded-xl border border-red-400 bg-red-950 p-4 text-center font-semibold text-white shadow-xl">
          {queueError} Please ask staff for help before continuing.
        </div>
      )}
      <div className="relative">
        {step === "safety" && (
              <CcRedflag
                language={language}
                onLanguageChange={setLanguage}
                onLogout={handleKioskLogout}
                onProceed={handleSafetyProceed}
                onPatientDemographics={handlePatientDemographics}
                onNavigateStep={handleNavigateStep}
                onEmergencyAlert={handleEmergencyAlert}
              />
            )}

            {step === "patientForm" && (
              <PatientInformation
                language={language}
                onLogout={handleKioskLogout}
                initialValues={patientInfo}
                onProceed={handlePatientFormProceed}
                onNavigateStep={handleNavigateStep}
              />
            )}

            {step === "vitals" && vitalStage === "bp" && (
              <VsBloodpressure
                language={language}
                onLogout={handleKioskLogout}
                onProceed={handleVitalProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}
            {step === "vitals" && vitalStage === "oximetry" && (
              <VsOximeter
                language={language}
                onLogout={handleKioskLogout}
                onProceed={handleVitalProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}
            {step === "vitals" && vitalStage === "temperature" && (
              <VsTemperature
                language={language}
                onLogout={handleKioskLogout}
                onProceed={handleVitalProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}

            {step === "primaryClinics" && (
              <PrimaryClinics
                language={language}
                onLogout={handleKioskLogout}
                onProceed={handlePrimaryClinicsProceed}
                onNavigateStep={handleNavigateStep}
                onNavigateVitalPart={handleNavigateVitalPart}
              />
            )}

            {step === "summary" && (
              <SummaryScreen
                language={language}
                patientName={patientName}
                age={patientInfo.ageDisplay || patientInfo.age}
                ageGroup={patientInfo.ageGroup}
                gender={patientInfo.gender}
                contactNumber={patientInfo.contactNumber}
                patientAddress={patientInfo.address}
                pwdStatus={patientInfo.pwdStatus}
                bpSys={vitals.bpSys}
                bpDia={vitals.bpDia}
                hr={vitals.hr}
                rr={vitals.rr}
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