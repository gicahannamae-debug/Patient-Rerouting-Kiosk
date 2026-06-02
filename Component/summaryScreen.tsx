"use client"
import React from "react";
import SummaryNewPatient from "./SummaryNewPatient";
import SummaryReturningPatient from "./SummaryReturningPatient";
import SummaryReferredPatient from "./SummaryReferredPatient";
import type { SummaryScreenProps, PatientStatus } from "./summaryTypes";

export type { SummaryScreenProps };

export default function SummaryScreen(props: SummaryScreenProps & { onFinish?: () => void }) {
  const {
    patientName = "DELA CRUZ, JUAN S.",
    age = "32",
    gender = "Male",
    bpSys = "120",
    bpDia = "80",
    hr = "72",
    spo2 = "98",
    temperature = "36.8",
    complaints = "Persistent Headache",
    clinic = "Family Medicine",
    queueCode = "FM-042",
    date = "05/16/2026",
    time = "08:42 AM",
    patientStatus = "new",
    referralFrom = "N/A",
    referralDoctor = "N/A",
    referralDate = "—",
    referralPurpose = "—",
    referralFormNo = "—",
    referralDiagnosis = "—",
    onFinish,
  } = props as any;

  const currentStatus: PatientStatus = patientStatus;

  return (
    <div className="">
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-yellow-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p className="w-full">Better Informed Care Access</p>
          </div>

          <div className="pr-[2rem]">
            <ul className="md:flex space-x-8 hidden text-xl font-semibold w-full">
              <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Vital Signs |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Chief Complaints |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline text-orange-600 underline">Summary |</a></li>
            </ul>
            <div className="md:hidden">
              <a className="text-4xl font-semibold" href="#">&#8801;</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">
        <div className="flex flex-col text-center justify-center gap-[0.75rem]">
          <h1 className="text-[3rem] font-bold text-white">Patient Summary</h1>
          <p className="text-[1.7rem] font-serif text-white">Please review your information before printing.</p>
          <div className="text-sm text-cyan-300">
            Summary view is selected automatically by the system based on the patient category.
          </div>
        </div>

        <div className="flex flex-row gap-[2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem] items-start">
          <div className="flex flex-col items-center gap-[0.5rem] flex-shrink-0">
            <p className="text-[0.78rem] font-semibold text-white uppercase tracking-wider self-start mb-[0.2rem]">
              Receipt Preview (58mm)
            </p>
            <div className="w-[219px] bg-white font-mono text-black flex flex-col shadow-2xl">
              <div className="w-full h-[6px] bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_6px,#e5e7eb_6px,#e5e7eb_8px)]" />
              <div className="px-[8px] py-[6px] flex flex-col gap-[2px]">
                <div className="flex flex-col items-center text-center mb-[4px]">
                  <p className="text-[9px] font-bold leading-tight">NORTHERN MINDANAO</p>
                  <p className="text-[9px] font-bold leading-tight">MEDICAL CENTER</p>
                  <p className="text-[7.5px] leading-tight text-gray-600">Triage Assessment Slip</p>
                  <p className="text-[7px] leading-tight text-gray-500">BICA — Better Informed Care Access</p>
                </div>
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <div className="flex flex-row justify-between">
                  <p className="text-[7.5px]">Date: {date}</p>
                  <p className="text-[7.5px]">Time: {time}</p>
                </div>
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <p className="text-[7.5px] font-bold uppercase">Patient Information</p>
                <div className="flex flex-col gap-[1px] pl-[4px]">
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">Name:</p>
                    <p className="text-[7px] font-semibold text-right w-[130px] leading-tight">{patientName}</p>
                  </div>
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">Age:</p>
                    <p className="text-[7px] font-semibold">{age} yrs old</p>
                  </div>
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">Sex:</p>
                    <p className="text-[7px] font-semibold">{gender}</p>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <div className="flex flex-row justify-between">
                  <p className="text-[7px] text-gray-600">Status:</p>
                  <p className="text-[7px] font-semibold">
                    {currentStatus === "new"
                      ? "New Patient"
                      : currentStatus === "returning"
                      ? "Returning Patient"
                      : "Referred Patient"}
                  </p>
                </div>
                {currentStatus === "referred" && (
                  <>
                    <div className="border-t border-dashed border-gray-400 my-[3px]" />
                    <div className="flex flex-col gap-[1px] pl-[4px]">
                      <div className="flex flex-row justify-between">
                        <p className="text-[7px] text-gray-600">Referred From:</p>
                        <p className="text-[7px] font-semibold text-right w-[110px] leading-tight">{referralFrom}</p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p className="text-[7px] text-gray-600">Referring Dr.:</p>
                        <p className="text-[7px] font-semibold">{referralDoctor}</p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p className="text-[7px] text-gray-600">Referral Date:</p>
                        <p className="text-[7px] font-semibold">{referralDate}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <p className="text-[7.5px] font-bold uppercase">Vital Signs</p>
                <div className="flex flex-col gap-[1px] pl-[4px]">
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">BP:</p>
                    <p className="text-[7px] font-semibold">{bpSys}/{bpDia} mmHg</p>
                  </div>
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">HR:</p>
                    <p className="text-[7px] font-semibold">{hr} bpm</p>
                  </div>
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">SpO2:</p>
                    <p className="text-[7px] font-semibold">{spo2}%</p>
                  </div>
                  <div className="flex flex-row justify-between">
                    <p className="text-[7px] text-gray-600">Temp:</p>
                    <p className="text-[7px] font-semibold">{temperature} °C</p>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <p className="text-[7.5px] font-bold uppercase">Chief Complaint</p>
                <p className="text-[7px] pl-[4px] italic leading-tight">{complaints}</p>
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <p className="text-[7.5px] font-bold uppercase">Assigned Clinic</p>
                <p className="text-[8px] pl-[4px] font-bold">{clinic}</p>
                <div className="border-t border-gray-400 my-[4px]" />
                <div className="flex flex-col items-center py-[4px]">
                  <p className="text-[7.5px] text-gray-600 uppercase tracking-wider">Queue Number</p>
                  <p className="text-[28px] font-bold leading-tight tracking-widest">{queueCode}</p>
                  <p className="text-[7px] text-gray-500 text-center leading-tight mt-[2px]">
                    Please proceed to the {clinic} window and present this slip.
                  </p>
                </div>
                <div className="border-t border-dashed border-gray-400 my-[3px]" />
                <div className="flex flex-col items-center text-center mt-[2px] mb-[4px]">
                  <p className="text-[6.5px] text-gray-500 leading-tight">NMMC · DOH Region X</p>
                  <p className="text-[6.5px] text-gray-400 leading-tight">This slip is valid for today only.</p>
                </div>
              </div>
              <div className="w-full h-[6px] bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_6px,#e5e7eb_6px,#e5e7eb_8px)]" />
            </div>
          </div>

          <div className="flex flex-col gap-[1rem] flex-1">
            {currentStatus === "new" && (
              <SummaryNewPatient
                patientName={patientName}
                age={age}
                gender={gender}
                bpSys={bpSys}
                bpDia={bpDia}
                hr={hr}
                spo2={spo2}
                temperature={temperature}
                complaints={complaints}
                clinic={clinic}
                queueCode={queueCode}
              />
            )}
            {currentStatus === "returning" && (
              <SummaryReturningPatient
                patientName={patientName}
                age={age}
                gender={gender}
                bpSys={bpSys}
                bpDia={bpDia}
                hr={hr}
                spo2={spo2}
                temperature={temperature}
                complaints={complaints}
                clinic={clinic}
                queueCode={queueCode}
              />
            )}
            {currentStatus === "referred" && (
              <SummaryReferredPatient
                patientName={patientName}
                age={age}
                gender={gender}
                bpSys={bpSys}
                bpDia={bpDia}
                hr={hr}
                spo2={spo2}
                temperature={temperature}
                complaints={complaints}
                clinic={clinic}
                queueCode={queueCode}
                referralFrom={referralFrom}
                referralDoctor={referralDoctor}
                referralDate={referralDate}
                referralPurpose={referralPurpose}
                referralFormNo={referralFormNo}
                referralDiagnosis={referralDiagnosis}
              />
            )}
          </div>
        </div>

        <div className="w-[70rem] mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-white text-cyan-950 font-semibold px-5 py-2 rounded-lg"
          >
            Print
          </button>

          <button
            type="button"
            onClick={() => onFinish?.()}
            className="bg-emerald-400 text-cyan-950 font-semibold px-5 py-2 rounded-lg"
          >
            Finish
          </button>
        </div>

      </div>
    </div>
  );
}
