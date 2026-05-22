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
import CcMain from "@/Component/ccMain"
import CcRedflag from "@/Component/ccRedflag";
import CcSurgery from "@/Component/ccSurgery";
import CcDental from "@/Component/ccDental";
import CcEnt from "@/Component/ccEnt";
import CcFamilymedicine from "@/Component/ccFamilymedicine";
import CcNephrology from "@/Component/ccNephrology";
import CcObgyn from "@/Component/ccObgyn";
import CcOncology from "@/Component/ccOncology";
import CcPediatrics from "@/Component/ccPediatrics";
import CcPsychiatry from "@/Component/ccPsychiatry";
import CcPulmonary from "@/Component/ccPulmonary";
import CcOpthalmology from "@/Component/ccOpthalmology";
import CcInputconcern from "@/Component/ccInputconcern"
import SummaryScreen, { SummaryScreenProps } from "@/Component/summaryScreen";

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
      <CcMain />
      <CcDental />
      <CcEnt />
      <CcFamilymedicine />
      <CcNephrology />
      <CcObgyn />
      <CcOncology />
      <CcPediatrics />
      <CcPsychiatry />
      <CcPulmonary />
      <CcOpthalmology />  
      <CcSurgery />  
      <CcInputconcern/>
      <SummaryScreen {...summary} />
    </div>
  );
}
