'use client'
import { useState } from "react";
import WelcomeScreen from "@/Component/welcomeScreen"; 
import PatientCategory from "@/Component/patientCategory";
import PatientInformation from "@/Component/patientInformation";
import ReferralDetails from "@/Component/referralDetails";
import HospitalNumber from "@/Component/hospitalNumber";
import VsTemperature from "@/Component/vsTemperature";
import VsBloodpressure from "@/Component/vsBloodpressure";
import VsOximeter from "@/Component/vsOximeter";
import CcRedflag from "@/Component/ccRedflag";
import PrimaryClinics from "@/Component/primaryClinics";
import { SummaryScreenProps } from "@/Component/summaryTypes";
import SummaryScreen from "@/Component/summaryScreen";

export default function Home(){
  const [summary] = useState<SummaryScreenProps>({
    patientName: "Hanna Mae Gica",
    age: 22,
    gender: "Female",
    bpSys: 118,
    bpDia: 76,
    hr: 70,
    spo2: 98,
    temperature: 36.8,
    complaints: "Eye Irritation",
    clinic: "General OPD",
    queueCode: "R-ENT-007",
    patientStatus: "referred",
    referralFrom: "Bukidnon Provincial Hospital",
    referralDoctor: "Dr. Juan Dela Cruz",
    referralDate: "05/16/2026",
    referralPurpose: "Specialist consultation",
    referralFormNo: "RF-2026-00123",
    referralDiagnosis: "Suspected acute glaucoma",
  });

  const [isPatientCat, setIsPatientCat] = useState<boolean>(false);

  console.log("Home render", { isPatientCat });

  return (
    <div className={`w-auto h-auto`}>

      {!isPatientCat && (
        <WelcomeScreen 
          setIsPatientCat={setIsPatientCat}
          isPatientCat={isPatientCat} />
      )}
      
      {isPatientCat && (
        <PatientCategory 
          isPatientCat={isPatientCat} />
      )}

      <PatientInformation />
      <ReferralDetails />
      <HospitalNumber />

      <VsTemperature />
      <VsBloodpressure />
      <VsOximeter />
      <CcRedflag />
      <PrimaryClinics />
      <SummaryScreen {...summary} />
    </div>
  );
}
