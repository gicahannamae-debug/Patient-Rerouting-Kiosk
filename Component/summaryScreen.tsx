'use client'
import React from "react";

export type SummaryScreenProps = {
  patientName?: string;
  age?: string | number;
  gender?: string;
  bpSys?: string | number;
  bpDia?: string | number;
  hr?: string | number;
  spo2?: string | number;
  temperature?: string | number;
  complaints?: string;
  clinic?: string;
  queueCode?: string;
  date?: string;
  time?: string;
};

export default function SummaryScreen({
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
}: SummaryScreenProps) {
  return (
    <div className="">

      {/* ── NAV ── */}
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

      {/* ── MAIN ── */}
      <div className="min-h-screen flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">

        {/* Header */}
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">Patient Summary</h1>
          <p className="text-[1.7rem] font-serif text-white">Please review your information before printing.</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem] items-start">

          {/* ── LEFT: 58mm Receipt Preview ── */}
          <div className="flex flex-col items-center gap-[0.5rem] flex-shrink-0">

            <p className="text-[0.78rem] font-semibold text-white uppercase tracking-wider self-start mb-[0.2rem]">
              Receipt Preview (58mm)
            </p>

            {/* 58mm = ~219px at 96dpi. We use w-[219px] to simulate */}
            <div className="w-[219px] bg-white font-mono text-black flex flex-col shadow-2xl">

              {/* Perforated top edge */}
              <div className="w-full h-[6px] bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_6px,#e5e7eb_6px,#e5e7eb_8px)]" />

              <div className="px-[8px] py-[6px] flex flex-col gap-[2px]">

                {/* Hospital Header */}
                <div className="flex flex-col items-center text-center mb-[4px]">
                  <p className="text-[9px] font-bold leading-tight">NORTHERN MINDANAO</p>
                  <p className="text-[9px] font-bold leading-tight">MEDICAL CENTER</p>
                  <p className="text-[7.5px] leading-tight text-gray-600">Triage Assessment Slip</p>
                  <p className="text-[7px] leading-tight text-gray-500">BICA — Better Informed Care Access</p>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />

                {/* Date & Time */}
                <div className="flex flex-row justify-between">
                  <p className="text-[7.5px]">Date: {date}</p>
                  <p className="text-[7.5px]">Time: {time}</p>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />

                {/* Patient Info */}
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

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />

                {/* Vital Signs */}
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

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />

                {/* Chief Complaint */}
                <p className="text-[7.5px] font-bold uppercase">Chief Complaint</p>
                <p className="text-[7px] pl-[4px] italic leading-tight">{complaints}</p>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />

                {/* Clinic Assignment */}
                <p className="text-[7.5px] font-bold uppercase">Assigned Clinic</p>
                <p className="text-[8px] pl-[4px] font-bold">{clinic}</p>

                {/* Divider */}
                <div className="border-t border-gray-400 my-[4px]" />

                {/* Queue Code — big and centered */}
                <div className="flex flex-col items-center py-[4px]">
                  <p className="text-[7.5px] text-gray-600 uppercase tracking-wider">Queue Number</p>
                  <p className="text-[28px] font-bold leading-tight tracking-widest">{queueCode}</p>
                  <p className="text-[7px] text-gray-500 text-center leading-tight mt-[2px]">
                    Please proceed to the {clinic} window and present this slip.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-[3px]" />

                {/* Footer */}
                <div className="flex flex-col items-center text-center mt-[2px] mb-[4px]">
                  <p className="text-[6.5px] text-gray-500 leading-tight">NMMC · DOH Region X</p>
                  <p className="text-[6.5px] text-gray-400 leading-tight">This slip is valid for today only.</p>
                </div>

              </div>

              {/* Perforated bottom edge */}
              <div className="w-full h-[6px] bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_6px,#e5e7eb_6px,#e5e7eb_8px)]" />

            </div>

          </div>

          {/* ── RIGHT: Summary Details + Actions ── */}
          <div className="flex flex-col gap-[1rem] flex-1">

            <div className="flex flex-col gap-[0.4rem]">
              <p className="text-[0.78rem] font-semibold text-white uppercase tracking-wider">Patient Information</p>
              <div className="flex flex-row bg-cyan-950 rounded-lg overflow-hidden">
                <div className="flex flex-col flex-1 px-[1rem] py-[0.75rem] border-r border-cyan-800">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">Full Name</p>
                  <p className="text-[0.95rem] font-semibold text-white">{patientName}</p>
                </div>
                <div className="flex flex-col px-[1rem] py-[0.75rem] border-r border-cyan-800 w-[5rem]">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">Age</p>
                  <p className="text-[0.95rem] font-semibold text-white">{age}</p>
                </div>
                <div className="flex flex-col px-[1rem] py-[0.75rem] w-[7rem]">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">Sex</p>
                  <p className="text-[0.95rem] font-semibold text-white">{gender}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[0.4rem]">
              <p className="text-[0.78rem] font-semibold text-white uppercase tracking-wider">Vital Signs</p>
              <div className="flex flex-row bg-cyan-950 rounded-lg overflow-hidden">
                <div className="flex flex-col flex-1 px-[1rem] py-[0.75rem] border-r border-cyan-800">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">Blood Pressure</p>
                  <p className="text-[0.95rem] font-semibold text-white">{bpSys}/{bpDia}</p>
                  <p className="text-[0.7rem] text-cyan-500">mmHg</p>
                </div>
                <div className="flex flex-col flex-1 px-[1rem] py-[0.75rem] border-r border-cyan-800">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">Heart Rate</p>
                  <p className="text-[0.95rem] font-semibold text-white">{hr}</p>
                  <p className="text-[0.7rem] text-cyan-500">bpm</p>
                </div>
                <div className="flex flex-col flex-1 px-[1rem] py-[0.75rem] border-r border-cyan-800">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">SpO₂</p>
                  <p className="text-[0.95rem] font-semibold text-white">{spo2}</p>
                  <p className="text-[0.7rem] text-cyan-500">%</p>
                </div>
                <div className="flex flex-col flex-1 px-[1rem] py-[0.75rem]">
                  <p className="text-[0.72rem] text-orange-200 uppercase tracking-wider">Temperature</p>
                  <p className="text-[0.95rem] font-semibold text-white">{temperature}</p>
                  <p className="text-[0.7rem] text-cyan-500">°C</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[0.4rem]">
              <p className="text-[0.78rem] font-semibold text-white uppercase tracking-wider">Chief Complaint</p>
              <div className="bg-cyan-950 rounded-lg px-[1rem] py-[0.75rem]">
                <p className="text-[0.95rem] text-white italic">{complaints}</p>
              </div>
            </div>

            <div className="flex flex-row bg-orange-50 rounded-lg overflow-hidden">
              <div className="flex flex-col flex-1 px-[1.2rem] py-[1rem] border-r border-orange-200">
                <p className="text-[0.72rem] font-semibold text-cyan-700 uppercase tracking-wider">Queue Code</p>
                <p className="text-[2.5rem] font-bold text-cyan-950 leading-tight">{queueCode}</p>
              </div>
              <div className="flex flex-col flex-1 px-[1.2rem] py-[1rem] justify-center">
                <p className="text-[0.72rem] font-semibold text-cyan-700 uppercase tracking-wider">Assigned Clinic</p>
                <p className="text-[1.4rem] font-bold text-cyan-950">{clinic}</p>
                <p className="text-[0.75rem] text-cyan-600 mt-[0.2rem]">Proceed to this clinic window.</p>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-yellow-100 border border-yellow-400 rounded-md px-[0.9rem] py-[0.6rem] text-[0.8rem] text-yellow-900">
              <strong>Note:</strong> Present this printed slip to the triage nurse or clinic window upon arrival.
            </div>

            {/* Buttons */}
            <div className="flex flex-row gap-[0.8rem]">
              <button
                type="button"
                className="text-[1rem] font-semibold bg-transparent text-orange-50 border border-orange-100 px-[1.5rem] py-[0.6rem] rounded-md hover:bg-cyan-800 cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                className="flex-1 text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[1.5rem] py-[0.75rem] rounded-md hover:bg-orange-100 cursor-pointer"
              >
                🖨 Print / Finish
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}