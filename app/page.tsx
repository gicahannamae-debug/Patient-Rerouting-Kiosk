'use client'
import { useState } from "react";
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

type AppStep = "welcome" | "category" | "patientForm" | "clinicChoice" | "primaryClinics" | "vitals" | "safety" | "summary";
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
};

type ReturningInfo = {
  hospitalNumber: string;
  philhealthId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthdate: string;
  age: string;
  gender: string;
  contactNumber: string;
  purpose: string;
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
  });
  const [returningInfo, setReturningInfo] = useState<ReturningInfo>({
    hospitalNumber: "",
    philhealthId: "",
    lastName: "",
    firstName: "",
    middleName: "",
    birthdate: "",
    age: "",
    gender: "",
    contactNumber: "",
    purpose: "",
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
    setPatientInfo({ lastName: "", firstName: "", middleName: "", pwdStatus: "", birthdate: "", age: "", gender: "", address: "" });
    setReturningInfo({ hospitalNumber: "", philhealthId: "", lastName: "", firstName: "", middleName: "", birthdate: "", age: "", gender: "", contactNumber: "", purpose: "" });
    setReferralInfo({ referringFacility: "", facilityType: "", referringDoctor: "", referringContact: "", referralDate: "", referralDiagnosis: "", referralPurpose: "", interventions: "", referralFormNo: "" });
    setVitals({ bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" });
    setTriageSelection({ groupLabel: "", ccLabel: "", subLabel: "", clinic: "Family Medicine", systemValue: "", answers: {} });
    setQueueCode("FM-042");
    setDestination(clinicDestinations["Family Medicine"]);
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setStep("welcome");
  };

  const patientName = selectedCategory === "old"
    ? `${returningInfo.lastName}, ${returningInfo.firstName} ${returningInfo.middleName}`.trim()
    : selectedCategory === "new"
    ? `${patientInfo.lastName}, ${patientInfo.firstName} ${patientInfo.middleName}`.trim()
    : "N/A";

  const age = selectedCategory === "old" ? returningInfo.age : selectedCategory === "new" ? patientInfo.age : "";
  const gender = selectedCategory === "old" ? returningInfo.gender : selectedCategory === "new" ? patientInfo.gender : "";
  const patientAddress = selectedCategory === "new" ? patientInfo.address : "";
  const pwdStatus = selectedCategory === "new" ? patientInfo.pwdStatus : "";
  const complaints = triageSelection.subLabel || triageSelection.ccLabel || triageSelection.groupLabel || "No chief complaint selected";
  const clinic = selectedClinic ?? triageSelection.clinic ?? "Family Medicine";

  return (
    <div className="w-auto h-auto">
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
          referralFormNo={referralInfo.referralFormNo}
          referralDiagnosis={referralInfo.referralDiagnosis}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
