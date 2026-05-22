'use client';
import React from 'react';

export default function ccInputconcern() {
  return (

    <div className="">

      {/* Logo Wrapper */}
            <nav className="w-full pl-8 pt-4 pb-4 pr-8 text-cyan-950 bg-yellow-50">
                <div className="container mx-auto flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">BICA</h1>
                    <p>Better Informed Care Access</p>
                </div>
                <ul className="md:flex space-x-8 hidden text-xl font-semibold">
                    <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
                    <li><a href="#" className="cursor-pointer hover:underline">Vital Signs |</a></li>
                    <li><a href="#" className="cursor-pointer hover:underline text-orange-600 underline">Chief Complaints |</a></li>
                    <li><a href="#" className="cursor-pointer hover:underline">Summary |</a></li>
                </ul>
                </div>
            </nav>

      
      {/* MAIN Content */}
        <div className="min-h-screen flex flex-col gap-3 items-center justify-center bg-cyan-950 py-12 border">

          <div className="flex flex-col text-center">
                <p className="text-orange-300 text-sm font-bold uppercase tracking-widest mb-1"> Input Chief Complaints</p>
                <h1 className="text-4xl font-bold text-white">Please tell us what you feel and your complain!</h1>
                <p className="text-xl font-serif text-white mt-1">So we can help you.</p>
          </div>

     {/* ── Input Patient Concern── */}
      <div className="flex flex-row items-center justify-center gap-5 bg-cyan-900 px-10 py-8 rounded-xl w-[70rem]">
          {/* ── ROW 1: General */}
          <div className="flex flex-col justify-evenly gap-[1rem]">

            <section className="flex flex-col gap-[0.25rem] w-full-absolute">
              <label className="text-[1.1rem] font-semibold text-white">
                General Body Complaint Parts 
              </label>
              <p className="text-[0.75rem] text-cyan-400">Which body part of you hurts?</p>
              <input
                type="text"
                placeholder="eg. eyes"
                className=" w-[35rem] text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300 tracking-widest"
              />
            </section>
             {/* ── ROW 2: Narrow Down */}
            <section className="flex flex-col gap-[0.25rem] w-full-absolute">
              <label className="text-[1.1rem] font-semibold text-white">Chief Complaints</label>
              <p className="text-[0.75rem] text-cyan-400">Tell us what do you feel?.</p>
              <input
                type="text"
                placeholder="e.g. blurring of eye vision"
                className="w-[35rem] text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </section>

        {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">

                <button
                  type="button"
                  className="text-[1rem] font-semibold bg-transparent text-orange-50 border border-orange-100 px-[1.5rem] py-[0.5rem] rounded-md hover:bg-cyan-800 cursor-pointer"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer"
                >
                  Proceed
                </button>

              </div>
      </div>

      </div>
    </div>
    </div>
    );
}