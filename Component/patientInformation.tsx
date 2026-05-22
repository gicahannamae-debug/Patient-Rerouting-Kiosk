'use client'
import React from "react";

export default function patientInformation() {
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
          <h1 className="text-[3rem] font-bold text-white">Triage Assessment Form</h1>
          <p className="text-[1.7rem] font-serif text-white">Please fill-up all necessary information.</p>
        </div>

        {/* ── FORM CARD ── */}
        <form className="flex flex-col gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">

          {/* ── ROW 1: Last Name | First Name | Middle Name | PWD ── */}
          <div className="flex flex-row justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Gica"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">First Name</label>
              <input
                type="text"
                placeholder="e.g. Hanna Mae"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Middle Name</label>
              <input
                type="text"
                placeholder="e.g. Tanggan"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[9rem]">
              <label className="text-[1.1rem] font-semibold text-white">PWD?</label>
              <select className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300">
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
                type="date"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] w-[8rem]">
              <label className="text-[1.1rem] font-semibold text-white">Age</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                max="150"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Sex</label>
              <select className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="">— select —</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </section>

          </div>

          {/* ── ROW 3: Address ── */}
          <div className="flex flex-row gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] flex-1">
              <label className="text-[1.1rem] font-semibold text-white">Address</label>
              <input
                type="text"
                placeholder="e.g. House No., Street, Barangay, City, Province"
                className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

          </div>

          {/* ── PROCEED BUTTON — centered, not full width ── */}
          <div className="flex justify-center pt-[0.5rem]">
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