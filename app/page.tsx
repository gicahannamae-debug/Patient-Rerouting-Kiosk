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

const categoryToStatus = {
  old: "returning",
  new: "new",
  referred: "referred",
} as const;

export default function Home() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [selectedCategory, setSelectedCategory] = useState<PatientCategoryType>(null);
  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(null);
  const [vitalStage, setVitalStage] = useState<VitalStage>("bp");

  const handleStart = () => setStep("category");
  const handleCategorySelect = (category: PatientCategoryType) => {
    setSelectedCategory(category);
    setStep("patientForm");
  };

  const handlePatientFormProceed = () => {
    setStep("vitals");
  };
  const handlePatientFormBack = () => setStep("category");

  const handleVitalBack = () => {
    if (vitalStage === "bp") {
      setStep("patientForm");
    } else if (vitalStage === "oximetry") {
      setVitalStage("bp");
    } else {
      setVitalStage("oximetry");
    }
  };

  const handleVitalProceed = () => {
    if (vitalStage === "bp") {
      setVitalStage("oximetry");
    } else if (vitalStage === "oximetry") {
      setVitalStage("temperature");
    } else {
      setStep("safety");
    }
  };

  const handleSafetyBack = () => setStep("vitals");
  const handleSafetyProceed = () => {
    if (selectedCategory === "referred") {
      setStep("clinicChoice");
    } else {
      setStep("primaryClinics");
    }
  };
  const handleCategoryBack = () => setStep("welcome");
  const handleClinicBack = () => setStep("safety");
  const handleClinicProceed = (clinic?: ClinicOption | null) => {
    if (clinic) setSelectedClinic(clinic);
    setStep("summary");
  };

  const handleFinish = () => {
    setSelectedCategory(null);
    setSelectedClinic(null);
    setVitalStage("bp");
    setStep("welcome");
  };

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
          onBack={handleSafetyBack}
          onProceed={(payload: unknown) => {
            const p = payload as { clinic?: unknown } | undefined;
            if (p && typeof p.clinic === "string") setSelectedClinic(p.clinic as ClinicOption);
            setStep("summary");
          }}
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
          patientStatus={
            selectedCategory
              ? categoryToStatus[selectedCategory as keyof typeof categoryToStatus]
              : "new"
          }
          clinic={selectedClinic ?? "Family Medicine"}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
