'use client'
import React from "react";
import KioskHeader from "@/Component/kioskHeader";

export interface PatientInfoValues {
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
}

interface PatientInformationProps {
  onLogout?: () => void;
  onProceed?: (values: PatientInfoValues) => void;
  onNavigateStep?: (step: number) => void;
}

export default function PatientInformation({ onLogout, onProceed, onNavigateStep }: PatientInformationProps) {
  return (

    <div className="min-h-screen bg-cyan-950 flex flex-col font-sans">
      <KioskHeader activeStep={3} onNavigateStep={onNavigateStep} onLogout={onLogout} />

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">

        {/* Header */}
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">Triage Assessment Form</h1>
          <p className="text-[1.7rem] font-serif text-white">Please fill-up all necessary information.</p>
        </div>

        {/* ── FORM CARD ── */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onProceed?.({
                lastName: (formData.get("lastName") as string) ?? "",
                firstName: (formData.get("firstName") as string) ?? "",
                middleName: (formData.get("middleName") as string) ?? "",
                pwdStatus: (formData.get("pwdStatus") as string) ?? "",
                birthdate: (formData.get("birthdate") as string) ?? "",
                age: (formData.get("age") as string) ?? "",
                gender: (formData.get("gender") as string) ?? "",
                address: (formData.get("address") as string) ?? "",
                birthplace: (formData.get("birthplace") as string) ?? "",
                religion: (formData.get("religion") as string) ?? "",
                civilStatus: (formData.get("civilStatus") as string) ?? "",
                appointmentStatus: (formData.get("appointmentStatus") as string) ?? "",
              });
            }}
            className="flex flex-col gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]"
          >
          {/* ── ROW 1: Last Name | First Name | Middle Name | PWD ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Last Name</label>
              <input
                name="lastName"
                type="text"
                required
                placeholder="e.g. Gica"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">First Name</label>
              <input
                name="firstName"
                type="text"
                required
                placeholder="e.g. Hanna Mae"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Middle Name</label>
              <input
                name="middleName"
                type="text"
                placeholder="e.g. Tanggan"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[9rem]">
              <label className="text-[1.1rem] font-semibold text-white">PWD?</label>
              <select
                name="pwdStatus"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">— select —</option>
                <option>Not PWD</option>
                <option>Yes, PWD</option>
              </select>
            </section>

          </div>

          {/* ── ROW 2: Birthdate | Age | Sex ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Birthdate</label>
              <input
                name="birthdate"
                type="date"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[8rem]">
              <label className="text-[1.1rem] font-semibold text-white">Age</label>
              <input
                name="age"
                type="number"
                required
                placeholder="0"
                min="0"
                max="150"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Sex</label>
              <select
                name="gender"
                required
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">— select —</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </section>

          </div>

          {/* ── ROW 3: Birthplace | Religion | Civil Status ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Birthplace</label>
              <input
                name="birthplace"
                type="text"
                placeholder="e.g. Cagayan de Oro"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Religion</label>
              <input
                name="religion"
                type="text"
                placeholder="e.g. Roman Catholic"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Civil Status</label>
              <select
                name="civilStatus"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">— select —</option>
                <option>Single</option>
                <option>Married</option>
                <option>Widowed</option>
                <option>Separated</option>
                <option>Divorced</option>
              </select>
            </section>

          </div>

          {/* ── ROW 4: Complete Address — Appointment Status ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Complete Address</label>
              <input
                name="address"
                type="text"
                placeholder="e.g. House No., Street, Barangay, City, Province"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[17rem]">
              <label className="text-[1.1rem] font-semibold text-white">Appointment Status</label>
              <select
                name="appointmentStatus"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">— select —</option>
                <option>With appointment</option>
                <option>Without appointment</option>
              </select>
            </section>

          </div>

            {/* ── BUTTONS — centered, not full width ── */}
          <div className="flex justify-center gap-[1rem] pt-[0.5rem]">

              <button
                type="submit"
              className="text-[1.3rem] font-semibold bg-yellow-50 text-cyan-950 px-[3rem] py-[0.6rem] rounded-md hover:bg-yellow-100 cursor-pointer"
            >
              Proceed
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}