'use client';
import { SummaryScreenProps } from "./summaryTypes";

export default function SummaryReturningPatient({
  patientName,
  age,
  gender,
  bpSys,
  bpDia,
  hr,
  spo2,
  temperature,
  complaints,
  clinic,
  queueCode,
}: SummaryScreenProps) {
  return (
    <div className="flex flex-col gap-[1rem] flex-1">
      <div className="flex flex-col gap-[0.4rem]">
        <p className="text-[0.78rem] font-semibold text-white uppercase tracking-wider">Patient Status</p>
        <div className="bg-cyan-950 rounded-lg px-[1rem] py-[0.75rem]">
          <p className="text-[0.95rem] font-semibold text-white">Returning Patient</p>
          <p className="text-[0.88rem] text-cyan-400 mt-[0.25rem]">
            Patient has visited before and is returning for follow-up or further care.
          </p>
        </div>
      </div>

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

      <div className="bg-yellow-100 border border-yellow-400 rounded-md px-[0.9rem] py-[0.6rem] text-[0.8rem] text-yellow-900">
        <strong>Note:</strong> Present this printed slip to the triage nurse or clinic window upon arrival.
      </div>

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
  );
}
