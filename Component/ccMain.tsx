'use client'
import React, { useState } from "react";

export default function CcMain() {
  // Simple state toggles to change what displays inside your HTML grid container
  const [activeScreen, setActiveScreen] = useState("categories");
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [selectedClinic, setSelectedClinic] = useState("");

  return (
    <div className="bg-[#083344] min-h-screen font-sans">

      {/* ── NAV BAR (Styled exactly like your HTML layout) ── */}
      <nav className="w-full bg-[#fefce8] px-8 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-[#083344]">BICA</h1>
          <p className="text-xs text-cyan-900">Better Informed Care Access</p>
        </div>
        <ul className="flex space-x-6">
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline">Triage Form |</a></li>
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline">Vital Signs |</a></li>
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline text-[#0e4f68] underline">Chief Complaints |</a></li>
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline">Summary |</a></li>
        </ul>
      </nav>

      {/* ── MAIN CONTENT GRID AREA ── */}
      <div className="flex flex-col items-center justify-center py-12 px-4 gap-6">

        {/* Header Texts */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white">Chief Complaints</h2>
          <p className="text-xl font-serif text-white mt-1">
            {activeScreen === "categories" 
              ? "Select the area where you feel the problem." 
              : "Select your main concern."}
          </p>
        </div>

        {/* ── THE CORE DESIGN CARD ── */}
        <div className="w-full max-w-3xl bg-[#0e4f68] rounded-xl px-10 py-8 flex flex-col gap-4 shadow-xl">
          
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            {activeScreen === "categories" ? "Where is the problem?" : "Symptom Checklist:"}
          </p>

          {/* VIEW 1: Main Category Grid (Your original HTML design buttons) */}
          {activeScreen === "categories" && (
            <div className="grid grid-cols-2 gap-4">

              {/* Head & Neck Button */}
              <button 
                onClick={() => setActiveScreen("head-neck")}
                className="bg-[#083344] border-2 border-[#1e5f7a] rounded-xl px-6 py-6 flex flex-col items-center justify-center gap-3 text-center hover:border-orange-300 hover:bg-[#1e5f7a] transition-all cursor-pointer group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6L15 21H9l.3-6A7 7 0 0112 2z"/>
                </svg>
                <div>
                  <p className="text-white text-lg font-bold">Head &amp; Neck</p>
                  <p className="text-orange-200 text-xs mt-1">Ear, eye, dental, headache</p>
                </div>
              </button>

              {/* Chest & Breathing Button */}
              <button 
                onClick={() => setActiveScreen("chest")}
                className="bg-[#083344] border-2 border-[#1e5f7a] rounded-xl px-6 py-6 flex flex-col items-center justify-center gap-3 text-center hover:border-orange-300 hover:bg-[#1e5f7a] transition-all cursor-pointer group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v6M8 10c-2 1-4 3-4 6a2 2 0 004 0v-2m8-4c2 1 4 3 4 6a2 2 0 01-4 0v-2"/>
                </svg>
                <div>
                  <p className="text-white text-lg font-bold">Chest &amp; Breathing</p>
                  <p className="text-orange-200 text-xs mt-1">Cough, asthma, mental health</p>
                </div>
              </button>

              {/* Stomach & Body Button */}
              <button className="opacity-50 bg-[#083344] border-2 border-[#1e5f7a] rounded-xl px-6 py-6 flex flex-col items-center justify-center gap-3 text-center">
                <p className="text-white text-lg font-bold">Stomach &amp; Body</p>
              </button>

              {/* Others Button */}
              <button className="opacity-50 bg-[#083344] border-2 border-[#1e5f7a] rounded-xl px-6 py-6 flex flex-col items-center justify-center gap-3 text-center">
                <p className="text-white text-lg font-bold">Others</p>
              </button>

            </div>
          )}

          {/* VIEW 2: Head & Neck Symptoms Sub-Menu */}
          {activeScreen === "head-neck" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                
                <button 
                  onClick={() => { setSelectedSymptom("Ear Discharge / Pain"); setSelectedClinic("ENT"); }}
                  className={`px-6 py-6 rounded-xl border-2 font-bold text-center transition-all ${selectedSymptom === "Ear Discharge / Pain" ? "bg-[#fefce8] text-[#083344] border-orange-300" : "bg-[#083344] text-white border-[#1e5f7a]"}`}
                >
                  Ear Discharge / Pain
                </button>

                <button 
                  onClick={() => { setSelectedSymptom("Blurry Vision / Eye Pain"); setSelectedClinic("Ophthalmology"); }}
                  className={`px-6 py-6 rounded-xl border-2 font-bold text-center transition-all ${selectedSymptom === "Blurry Vision / Eye Pain" ? "bg-[#fefce8] text-[#083344] border-orange-300" : "bg-[#083344] text-white border-[#1e5f7a]"}`}
                >
                  Blurry Vision / Eye Pain
                </button>

              </div>

              {selectedSymptom && (
                <div className="mt-4 p-4 bg-[#083344] text-white text-center rounded-xl border border-orange-200">
                  Routing to: <span className="font-bold text-orange-200">{selectedClinic} Clinic</span>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: Chest & Breathing Symptoms Sub-Menu */}
          {activeScreen === "chest" && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setSelectedSymptom("Difficulty Breathing"); setSelectedClinic("ER"); }}
                className="bg-[#083344] text-white border-2 border-[#1e5f7a] p-6 rounded-xl font-bold"
              >
                Difficulty Breathing
              </button>
            </div>
          )}

        </div>

        {/* ── DYNAMIC NAVIGATION ACTIONS FOOTER ── */}
        <div className="w-full max-w-3xl flex justify-between items-center">
          <button
            onClick={() => {
              if (activeScreen !== "categories") {
                setActiveScreen("categories");
                setSelectedSymptom("");
              }
            }}
            className="text-sm font-bold text-[#fefce8] border border-orange-100 px-5 py-2 rounded-lg hover:bg-[#0e4f68] transition-colors cursor-pointer"
          >
            ← {activeScreen === "categories" ? "Back to safety check" : "Back to body areas"}
          </button>

          {activeScreen !== "categories" && (
            <button
              disabled={!selectedSymptom}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${selectedSymptom ? "bg-[#fefce8] text-[#083344]" : "bg-slate-600 text-slate-400 cursor-not-allowed"}`}
            >
              Proceed →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}