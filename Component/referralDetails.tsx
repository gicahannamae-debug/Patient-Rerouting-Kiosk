'use client'
import React from "react";

export default function referralDetails() {
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
          <h1 className="text-[3rem] font-bold text-white">Referral Details</h1>
          <p className="text-[1.7rem] font-serif text-white">Please fill-up all necessary information.</p>
        </div>

        {/* ── FORM CARD ── */}
        <form className="flex flex-col gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">

          {/* ── ROW 1: Referring Facility | Facility Type ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Referring Hospital / Clinic</label>
              <input
                type="text"
                placeholder="e.g. Bukidnon Provincial Hospital"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Facility Type</label>
              <select className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300">
                <option value="">— select —</option>
                <option>Barangay Health Center</option>
                <option>Rural Health Unit (RHU)</option>
                <option>District Hospital</option>
                <option>Provincial Hospital</option>
                <option>Private Hospital / Clinic</option>
                <option>Other</option>
              </select>
            </section>

          </div>

          {/* ── ROW 2: Referring Doctor | Contact No. | Date of Referral ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Referring Doctor</label>
              <input
                type="text"
                placeholder="e.g. Dr. Juan Dela Cruz"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Doctor's Contact No.</label>
              <input
                type="tel"
                placeholder="e.g. 09XX-XXX-XXXX"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[14rem]">
              <label className="text-[1.1rem] font-semibold text-white">Date of Referral</label>
              <input
                type="date"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

          </div>

          {/* ── ROW 3: Diagnosis | Purpose of Referral ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Diagnosis / Chief Complaint from Referring Facility</label>
              <input
                type="text"
                placeholder="e.g. Community-acquired pneumonia, severe"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Purpose of Referral</label>
              <select className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300">
                <option value="">— select —</option>
                <option>Further management / higher level of care</option>
                <option>Specialist consultation</option>
                <option>Diagnostic / laboratory services</option>
                <option>Surgical intervention</option>
                <option>ICU / critical care admission</option>
                <option>Lack of equipment or supplies</option>
                <option>Patient / family request</option>
                <option>Other</option>
              </select>
            </section>

          </div>

          {/* ── ROW 4: Interventions done | Referral Form No. ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Interventions / Treatments Given Before Referral</label>
              <input
                type="text"
                placeholder="e.g. O2 support started, IV fluids given, medications given"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[14rem]">
              <label className="text-[1.1rem] font-semibold text-white">Referral Form No.</label>
              <input
                type="text"
                placeholder="e.g. RF-2026-00123"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-yellow-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </section>

          </div>

          {/* ── NOTICE ── */}
          <div className="bg-yellow-100 border border-yellow-400 rounded-md px-[1rem] py-[0.6rem] text-[0.85rem] text-yellow-900">
            <strong>Note:</strong> Please present the physical referral slip to the triage nurse after submitting this form.
          </div>

          {/* ── BUTTONS — centered, not full width ── */}
          <div className="flex justify-center gap-[1rem] pt-[0.5rem]">

            <button
              type="button"
              className="text-[1.1rem] font-semibold bg-transparent text-yellow-50 border border-yellow-100 px-[2rem] py-[0.6rem] rounded-md hover:bg-cyan-800 cursor-pointer"
            >
              ← Back
            </button>

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