'use client'
import React from "react";

interface HospitalNumberProps {
  onBack?: () => void;
  onProceed?: (values: {
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
  }) => void;
}

export default function hospitalNumber({ onBack, onProceed }: HospitalNumberProps) {
  return (

    <div className="">

      {/* ── NAV ── */}
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-orange-50">
        <div className="container mx-auto flex items-center justify-between">

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p className="w-full">Better Informed Care Access</p>
          </div>

          <div className="pr-[2rem]">
            <ul className="md:flex space-x-8 hidden text-xl font-semibold w-full">
              <li><a href="#" className="cursor-pointer hover:underline text-orange-600 underline">Triage Form |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Vital Signs |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Chief Complaints |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Summary |</a></li>
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
          <h1 className="text-[3rem] font-bold text-white">Returning Patient</h1>
          <p className="text-[1.7rem] font-serif text-white">Please fill-up all necessary information.</p>
        </div>

        {/* ── FORM CARD ── */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onProceed?.({
                hospitalNumber: (formData.get("hospitalNumber") as string) ?? "",
                lastName: (formData.get("lastName") as string) ?? "",
                firstName: (formData.get("firstName") as string) ?? "",
                middleName: (formData.get("middleName") as string) ?? "",
                birthdate: (formData.get("birthdate") as string) ?? "",
                age: (formData.get("age") as string) ?? "",
                gender: (formData.get("gender") as string) ?? "",
                contactNumber: (formData.get("contactNumber") as string) ?? "",
                purpose: (formData.get("purpose") as string) ?? "",
                completeAddress: (formData.get("completeAddress") as string) ?? "",
                birthplace: (formData.get("birthplace") as string) ?? "",
                religion: (formData.get("religion") as string) ?? "",
                civilStatus: (formData.get("civilStatus") as string) ?? "",
                appointmentStatus: (formData.get("appointmentStatus") as string) ?? "",
              });
            }}
            className="flex flex-col gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]"
          >
          {/* ── ROW 1: Hospital Number | PhilHealth ID ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                Hospital Number (HN)
              </label>
              <input
                name="hospitalNumber"
                type="text"
                placeholder="e.g. 2024-000123"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300 tracking-widest"
              />
              <p className="text-[0.75rem] text-cyan-400">Found on your NMMC ID card or previous prescription.</p>
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

          {/* ── ROW 2: Last Name | First Name | Middle Name ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                Last Name 
              </label>
              <input
                name="lastName"
                type="text"
                placeholder="e.g. Dela Cruz"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                First Name 
              </label>
              <input
                name="firstName"
                type="text"
                placeholder="e.g. Juan"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Middle Name</label>
              <input
                name="middleName"
                type="text"
                placeholder="e.g. Santos"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

          </div>

          {/* ── ROW 3: Birthdate | Age | Sex ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                Birthdate
              </label>
              <input
                name="birthdate"
                type="date"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="text-[0.75rem] text-cyan-400">Must match your registered record exactly.</p>
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[8rem]">
              <label className="text-[1.1rem] font-semibold text-white">
                Age
              </label>
              <input
                name="age"
                type="number"
                placeholder="0"
                min="0"
                max="150"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                Sex
              </label>
              <select
                name="gender"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">— select —</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </section>

          </div>

          {/* ── ROW 4: Birthplace | Religion | Civil Status ── */}
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

          {/* ── ROW 5: Complete Address ── */}
          <div className="flex flex-row gap-[1rem]">
            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Complete Address</label>
              <input
                name="completeAddress"
                type="text"
                placeholder="e.g. House No., Street, Barangay, City, Province"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>
          </div>

          {/* ── ROW 6: Contact Number | Purpose of Visit ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                Registered Contact Number
              </label>
              <input
                name="contactNumber"
                type="tel"
                placeholder="e.g. 09XX-XXX-XXXX"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="text-[0.75rem] text-cyan-400">Used to verify and confirm your identity.</p>
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">
                Purpose of Visit
              </label>
              <select
                name="purpose"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">— select —</option>
                <option>Check up</option>
                <option>Follow up</option>
              </select>
            </section>

          </div>

          {/* ── BUTTONS — centered ── */}
          <div className="flex justify-center gap-[1rem] pt-[0.5rem]">

            <button
              type="button"
              onClick={() => onBack?.()}
              className="text-[1.1rem] font-semibold bg-transparent text-orange-50 border border-orange-100 px-[2rem] py-[0.6rem] rounded-md hover:bg-cyan-800 cursor-pointer"
            >
              ← Back
            </button>

            <button
              type="submit"
              className="text-[1.3rem] font-semibold bg-orange-50 text-cyan-950 px-[3rem] py-[0.6rem] rounded-md hover:bg-orange-100 cursor-pointer"
            >
              Proceed
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}