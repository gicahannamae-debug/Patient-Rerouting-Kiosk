'use client'
import { useState, useEffect } from "react";
import WelcomeScreen from "@/Component/welcomeScreen";
import PatientCategory, { PatientCategoryType } from "@/Component/patientCategory";
import PatientInformation from "@/Component/patientInformation";
import ReferralDetails from "@/Component/referralDetails";
import HospitalNumber from "@/Component/hospitalNumber";
import DesiredClinic, { ClinicOption } from "@/Component/desiredClinic";
import PrimaryClinics from "@/Component/primaryClinics";
import VsTemperature from "@/Component/vsTemperature";
import VsBloodpressure from "@/Component/vsBloodpressure";
import VsOximeter from "@/Component/vsOximeter";
import CcRedflag from "@/Component/ccRedflag";
import SummaryScreen from "@/Component/summaryScreen";
import ClinicDashboard from "@/Component/clinicDashboard";
import OperatorLogin from "@/Component/operatorLogin";

type AppStep = "welcome" | "category" | "patientForm" | "clinicChoice" | "primaryClinics" | "vitals" | "safety" | "summary";
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

type ReturningInfo = {
  hospitalNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthdate: string;
  age: string;
  gender: string;
  contactNumber: string;
  purpose: string;
  completeAddress: string;
  birthplace: string;
  religion: string;
  civilStatus: string;
  appointmentStatus: string;
};

type ReferralInfo = {
  referringFacility: string;
  facilityType: string;
  referringDoctor: string;
  referringContact: string;
  referralDate: string;
  referralDiagnosis: string;
  referralPurpose: string;
  interventions: string;
  referralFormNo: string;
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

type PatientFormValues = PatientInfo | ReturningInfo | ReferralInfo;
type VitalPayload = Partial<VitalData>;
type PrimaryClinicPayload = {
  clinic?: ClinicOption;
  group_label?: string;
  cc_label?: string;
  sub_label?: string;
  system_value?: string;
  answers?: Record<string, boolean>;
};

const categoryToStatus = {
  old: "returning",
  new: "new",
  referred: "referred",
} as const;

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
  const [step, setStep] = useState<AppStep>("welcome");
  const [selectedCategory, setSelectedCategory] = useState<PatientCategoryType>(null);
  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(null);
  const [vitalStage, setVitalStage] = useState<VitalStage>("bp");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    lastName: "",
    firstName: "",
    middleName: "",
    pwdStatus: "",
    birthdate: "",
    age: "",
    gender: "",
    address: "",
    birthplace: "",
    religion: "",
    civilStatus: "",
    appointmentStatus: "",
  });
  const [returningInfo, setReturningInfo] = useState<ReturningInfo>({
    hospitalNumber: "",
    lastName: "",
    firstName: "",
    middleName: "",
    birthdate: "",
    age: "",
    gender: "",
    contactNumber: "",
    purpose: "",
    completeAddress: "",
    birthplace: "",
    religion: "",
    civilStatus: "",
    appointmentStatus: "",
  });
  const [referralInfo, setReferralInfo] = useState<ReferralInfo>({
    referringFacility: "",
    facilityType: "",
    referringDoctor: "",
    referringContact: "",
    referralDate: "",
    referralDiagnosis: "",
    referralPurpose: "",
    interventions: "",
    referralFormNo: "",
  });
  const [vitals, setVitals] = useState<VitalData>({ bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" });
  const [triageSelection, setTriageSelection] = useState<TriageSelection>({
    groupLabel: "",
    ccLabel: "",
    subLabel: "",
    clinic: "Family Medicine",
    systemValue: "",
    answers: {},
  });
  const [queueCode, setQueueCode] = useState("FM-042");
  const [destination, setDestination] = useState(clinicDestinations["Family Medicine"]);
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());

  const updateTicketDateTime = () => {
    setDate(getCurrentDate());
    setTime(getCurrentTime());
  };

  const handleSelectMode = (mode: "kiosk" | "dashboard") => {
    setViewMode(mode);
    if (mode === "kiosk") {
      setStep("welcome");
      setSelectedCategory(null);
      setSelectedClinic(null);
      setVitalStage("bp");
      setPatientInfo({ lastName: "", firstName: "", middleName: "", pwdStatus: "", birthdate: "", age: "", gender: "", address: "", birthplace: "", religion: "", civilStatus: "", appointmentStatus: "" });
      setReturningInfo({ hospitalNumber: "", lastName: "", firstName: "", middleName: "", birthdate: "", age: "", gender: "", contactNumber: "", purpose: "", completeAddress: "", birthplace: "", religion: "", civilStatus: "", appointmentStatus: "" });
      setReferralInfo({ referringFacility: "", facilityType: "", referringDoctor: "", referringContact: "", referralDate: "", referralDiagnosis: "", referralPurpose: "", interventions: "", referralFormNo: "" });
      setVitals({ bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" });
      setTriageSelection({ groupLabel: "", ccLabel: "", subLabel: "", clinic: "Family Medicine", systemValue: "", answers: {} });
      setQueueCode("FM-042");
      setDestination(clinicDestinations["Family Medicine"]);
      setDate(getCurrentDate());
      setTime(getCurrentTime());
    }
  };

  useEffect(() => {
    const s = typeof window !== 'undefined' ? sessionStorage.getItem('operatorAuth') : null;
    setOperatorAuthenticated(s === '1');
  }, []);

  const handleOperatorLogin = () => {
    setOperatorAuthenticated(true);
    if (typeof window !== 'undefined') sessionStorage.setItem('operatorAuth', '1');
  };

  const handleOperatorLogout = () => {
    setOperatorAuthenticated(false);
    if (typeof window !== 'undefined') sessionStorage.removeItem('operatorAuth');
  };

  const handleExitToOperator = () => {
    // Return to selector and clear operator session so operator must sign in again
    setViewMode('selector');
    handleOperatorLogout();
  };

  const handleBackToMode = () => {
    setViewMode("selector");
    setStep("welcome");
  };

  const handleStart = () => setStep("category");

  const handleCategorySelect = (category: PatientCategoryType) => {
    setSelectedCategory(category);
    setStep("patientForm");
  };

  const handlePatientFormProceed = (values?: PatientFormValues) => {
    if (values) {
      if (selectedCategory === "new") {
        setPatientInfo(values as PatientInfo);
      } else if (selectedCategory === "old") {
        setReturningInfo(values as ReturningInfo);
      } else if (selectedCategory === "referred") {
        setReferralInfo(values as ReferralInfo);
      }
    }
    setStep("safety");
  };

  const handlePatientFormBack = () => setStep("category");

  const handleVitalBack = () => {
    if (vitalStage === "bp") {
      setStep("safety");
    } else if (vitalStage === "oximetry") {
      setVitalStage("bp");
    } else {
      setVitalStage("oximetry");
    }
  };

  const handleVitalProceed = (values?: VitalPayload) => {
    if (values) {
      setVitals((prev) => ({ ...prev, ...values }));
    }
    if (vitalStage === "bp") {
      setVitalStage("oximetry");
    } else if (vitalStage === "oximetry") {
      setVitalStage("temperature");
    } else {
      if (selectedCategory === "referred") {
        setStep("clinicChoice");
      } else {
        setStep("primaryClinics");
      }
    }
  };

  const handleSafetyBack = () => setStep("patientForm");
  const handleSafetyProceed = () => setStep("vitals");

  const handleCategoryBack = () => setStep("welcome");
  const handleClinicBack = () => setStep("vitals");

  const handleClinicProceed = (clinic?: ClinicOption | null) => {
    const resolvedClinic = clinic ?? selectedClinic ?? "Family Medicine";
    setSelectedClinic(resolvedClinic);
    setDestination(clinicDestinations[resolvedClinic]);
    setQueueCode(generateQueueCode(resolvedClinic));
    updateTicketDateTime();
    setStep("summary");
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
    setSelectedCategory(null);
    setSelectedClinic(null);
    setVitalStage("bp");
    setPatientInfo({ lastName: "", firstName: "", middleName: "", pwdStatus: "", birthdate: "", age: "", gender: "", address: "", birthplace: "", religion: "", civilStatus: "", appointmentStatus: "" });
    setReturningInfo({ hospitalNumber: "", lastName: "", firstName: "", middleName: "", birthdate: "", age: "", gender: "", contactNumber: "", purpose: "", completeAddress: "", birthplace: "", religion: "", civilStatus: "", appointmentStatus: "" });
    setReferralInfo({ referringFacility: "", facilityType: "", referringDoctor: "", referringContact: "", referralDate: "", referralDiagnosis: "", referralPurpose: "", interventions: "", referralFormNo: "" });
    setVitals({ bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" });
    setTriageSelection({ groupLabel: "", ccLabel: "", subLabel: "", clinic: "Family Medicine", systemValue: "", answers: {} });
    setQueueCode("FM-042");
    setDestination(clinicDestinations["Family Medicine"]);
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setStep("welcome");
    setViewMode("kiosk");
  };

  const patientName = selectedCategory === "old"
    ? `${returningInfo.lastName}, ${returningInfo.firstName} ${returningInfo.middleName}`.trim()
    : selectedCategory === "new"
    ? `${patientInfo.lastName}, ${patientInfo.firstName} ${patientInfo.middleName}`.trim()
    : "N/A";

  const age = selectedCategory === "old" ? returningInfo.age : selectedCategory === "new" ? patientInfo.age : "";
  const gender = selectedCategory === "old" ? returningInfo.gender : selectedCategory === "new" ? patientInfo.gender : "";
  const patientAddress = selectedCategory === "old"
    ? returningInfo.completeAddress
    : selectedCategory === "new"
      ? patientInfo.address
      : "";
  const pwdStatus = selectedCategory === "new" ? patientInfo.pwdStatus : "";
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
        <div className="fixed top-4 right-4">
          <button onClick={handleOperatorLogout} className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">Log out</button>
        </div>
      )}
      {viewMode === "dashboard" && <ClinicDashboard onBack={handleBackToMode} />}
      {viewMode === "kiosk" && (
        <>
          {step === "welcome" && <WelcomeScreen onStart={handleStart} />}

      {step === "category" && (
        <PatientCategory
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          onBack={handleCategoryBack}
        />
      )}

      {step === "patientForm" && selectedCategory === "old" && (
        <HospitalNumber onBack={handlePatientFormBack} onProceed={handlePatientFormProceed} />
      )}
      {step === "patientForm" && selectedCategory === "new" && (
        <PatientInformation onBack={handlePatientFormBack} onProceed={handlePatientFormProceed} />
      )}
      {step === "patientForm" && selectedCategory === "referred" && (
        <ReferralDetails onBack={handlePatientFormBack} onProceed={handlePatientFormProceed} />
      )}

      {step === "clinicChoice" && selectedCategory === "referred" && (
        <DesiredClinic
          selectedClinic={selectedClinic}
          onClinicSelect={setSelectedClinic}
          onBack={handleClinicBack}
          onProceed={handleClinicProceed}
        />
      )}

      {step === "primaryClinics" && (
        <PrimaryClinics
          onBack={handleClinicBack}
          onProceed={handlePrimaryClinicsProceed}
        />
      )}

      {step === "vitals" && vitalStage === "bp" && (
        <VsBloodpressure onBack={handleVitalBack} onProceed={handleVitalProceed} />
      )}
      {step === "vitals" && vitalStage === "oximetry" && (
        <VsOximeter onBack={handleVitalBack} onProceed={handleVitalProceed} />
      )}
      {step === "vitals" && vitalStage === "temperature" && (
        <VsTemperature onBack={handleVitalBack} onProceed={handleVitalProceed} />
      )}

      {step === "safety" && (
        <CcRedflag onBack={handleSafetyBack} onProceed={handleSafetyProceed} />
      )}

      {step === "summary" && (
        <SummaryScreen
          patientName={patientName}
          age={age}
          gender={gender}
          patientAddress={patientAddress}
          pwdStatus={pwdStatus}
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
          patientStatus={
            selectedCategory
              ? categoryToStatus[selectedCategory as keyof typeof categoryToStatus]
              : "new"
          }
          referralFrom={referralInfo.referringFacility}
          referralDoctor={referralInfo.referringDoctor}
          referralDate={referralInfo.referralDate}
          referralPurpose={referralInfo.referralPurpose}
          referralDiagnosis={referralInfo.referralDiagnosis}
          onFinish={handleFinish}
        />
      )}
        </>
      )}
      </div>
    </div>
  );
}
