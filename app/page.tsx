'use client'
import { useState } from "react";
import CcRedflag, { type EmergencyAlert } from "@/Component/ccRedflag";
import PatientInformation from "@/Component/patientInformation";
import type { ClinicOption } from "@/Component/desiredClinic";
import PrimaryClinics from "@/Component/primaryClinics";
import VsTemperature from "@/Component/vsTemperature";
import VsBloodpressure from "@/Component/vsBloodpressure";
import VsOximeter from "@/Component/vsOximeter";
import SummaryScreen from "@/Component/summaryScreen";
import ClinicDashboard from "@/Component/clinicDashboard";
import OperatorLogin from "@/Component/operatorLogin";
import type { TicketMetadata } from "@/Component/summaryTypes";

// Flow (new patients only): safety → patientForm → vitals (bp → oximetry → temperature) → primaryClinics → summary
type AppStep = "safety" | "patientForm" | "vitals" | "primaryClinics" | "summary";
type ViewMode = "selector" | "kiosk" | "dashboard";
type VitalStage = "bp" | "oximetry" | "temperature";

const ModeSelector = ({ onSelect }: { onSelect: (mode: "kiosk" | "dashboard") => void }) => (
  <div className="min-h-screen relative flex flex-col items-center justify-center gap-6 px-6 py-12 text-white"
    style={{
      backgroundImage: "url('/bg3.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}
  >
    <div className="absolute inset-0 bg-slate-950/85" />
    <div className="relative z-10 flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">BICA Access</h1>
      <p className="max-w-2xl text-center text-lg text-cyan-100">
        Select how you want to continue: patient kiosk self-triage or the clinic dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => onSelect("kiosk")}
          className="rounded-xl bg-orange-400 px-8 py-4 text-xl font-semibold text-cyan-950 hover:bg-orange-300"
        >
          Patient Kiosk
        </button>
        <button
          onClick={() => onSelect("dashboard")}
          className="rounded-xl border border-white/40 bg-transparent px-8 py-4 text-xl font-semibold text-white hover:bg-white/10"
        >
          Clinic Dashboard
        </button>
      </div>
    </div>
  </div>
);

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
  clinic: ClinicOption;
  systemValue: string;
  answers: Record<string, boolean>;
};

type VitalPayload = Partial<VitalData>;
type PrimaryClinicPayload = {
  clinic?: ClinicOption;
  group_label?: string;
  cc_label?: string;
  sub_label?: string;
  system_value?: string;
  answers?: Record<string, boolean>;
};

const EMPTY_PATIENT: PatientInfo = {
  lastName: "", firstName: "", middleName: "", pwdStatus: "", birthdate: "", age: "",
  gender: "", address: "", birthplace: "", religion: "", civilStatus: "", appointmentStatus: "",
};
const EMPTY_VITALS: VitalData = { bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" };
const EMPTY_TRIAGE: TriageSelection = {
  groupLabel: "", ccLabel: "", subLabel: "", clinic: "Family Medicine", systemValue: "", answers: {},
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
  "Family Medicine": "Family Medicine Hub",
};

const clinicPrefixes: Record<ClinicOption, string> = {
  "General Surgery": "GS",
  "Internal Medicine": "IM",
  "OB-GYNE": "OB",
  Pediatrics: "PD",
  "Family Medicine": "FM",
};

const getCurrentDate = () => new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
const getCurrentTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const generateQueueCode = (clinic: ClinicOption) => {
  const prefix = clinicPrefixes[clinic] ?? "FM";
  const random = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${random}`;
};

export default function Home() {
  const [operatorAuthenticated, setOperatorAuthenticated] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("selector");
  const [step, setStep] = useState<AppStep>("safety");

  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(null);
  const [vitalStage, setVitalStage] = useState<VitalStage>("bp");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(EMPTY_PATIENT);
  const [vitals, setVitals] = useState<VitalData>(EMPTY_VITALS);
  const [triageSelection, setTriageSelection] = useState<TriageSelection>(EMPTY_TRIAGE);
  const [queueCode, setQueueCode] = useState("FM-042");
  const [destination, setDestination] = useState(clinicDestinations["Family Medicine"]);
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());

  const updateTicketDateTime = () => {
    setDate(getCurrentDate());
    setTime(getCurrentTime());
  };

  const resetFormState = () => {
    setSelectedClinic(null);
    setVitalStage("bp");
    setPatientInfo(EMPTY_PATIENT);
    setVitals(EMPTY_VITALS);
    setTriageSelection(EMPTY_TRIAGE);
    setQueueCode("FM-042");
    setDestination(clinicDestinations["Family Medicine"]);
    setDate(getCurrentDate());
    setTime(getCurrentTime());
  };

  const handleSelectMode = (mode: "kiosk" | "dashboard") => {
    setViewMode(mode);
    if (mode === "kiosk") {
      setStep("safety");
      resetFormState();
    }
  };

  const handleOperatorLogin = () => {
    setOperatorAuthenticated(true);
    if (typeof window !== 'undefined') sessionStorage.setItem('operatorAuth', '1');
  };

  const handleOperatorLogout = () => {
    setOperatorAuthenticated(false);
    if (typeof window !== 'undefined') sessionStorage.removeItem('operatorAuth');
  };

  const handleKioskLogout = () => {
    handleOperatorLogout();
    if (typeof window !== "undefined") sessionStorage.removeItem("bica_emergency");
    resetFormState();
    setStep("safety");
    setViewMode("selector");
  };

  const handleBackToMode = () => {
    setViewMode("selector");
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

  const handlePrimaryClinicsProceed = (payload: PrimaryClinicPayload) => {
    const clinic = payload?.clinic ?? selectedClinic ?? "Family Medicine";
    setSelectedClinic(clinic);
    setDestination(clinicDestinations[clinic]);
    setQueueCode(generateQueueCode(clinic));
    setTriageSelection({
      groupLabel: payload?.group_label ?? "",
      ccLabel: payload?.cc_label ?? "",
      subLabel: payload?.sub_label ?? "",
      clinic,
      systemValue: payload?.system_value ?? "",
      answers: payload?.answers ?? {},
    });
    updateTicketDateTime();
    setStep("summary");
  };

  const handleFinish = () => {
    resetFormState();
    setStep("safety");
    setViewMode("kiosk");
  };

  const patientName = `${patientInfo.lastName}, ${patientInfo.firstName} ${patientInfo.middleName}`.trim();
  const complaints = triageSelection.subLabel || triageSelection.ccLabel || triageSelection.groupLabel || "No chief complaint selected";
  const clinic = selectedClinic ?? triageSelection.clinic ?? "Family Medicine";

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: "url('/bg3.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/85" />
      <div className="relative">
        {viewMode === "selector" && (
          operatorAuthenticated ? <ModeSelector onSelect={handleSelectMode} /> : <OperatorLogin onLogin={handleOperatorLogin} />
        )}

        {viewMode === "selector" && operatorAuthenticated && (
          <div className="fixed top-4 right-4 z-20">
            <button onClick={handleOperatorLogout} className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">
              Log out
            </button>
          </div>
        )}

        {viewMode === "dashboard" && <ClinicDashboard onBack={handleBackToMode} />}

        {viewMode === "kiosk" && (
          <>
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
                bpSys={vitals.bpSys || "120"}
                bpDia={vitals.bpDia || "80"}
                hr={vitals.hr || "72"}
                spo2={vitals.spo2 || "98"}
                temperature={vitals.temperature || "36.8"}
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
          </>
        )}
      </div>
    </div>
  );
}