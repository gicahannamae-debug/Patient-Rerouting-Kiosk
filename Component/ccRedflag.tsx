'use client';
import React, { useState } from "react";

export default function CcRedflag() {
  // Simple state to see if the kiosk triggered an emergency redirection alert
  const [isEmergency, setIsEmergency] = useState(false);
  const [alertData, setAlertData] = useState({ symptom: "", clinic: "" });

  const handleGoEmergency = (symptom: string, clinic: string) => {
    setAlertData({ symptom, clinic });
    setIsEmergency(true);
    
    // Optional: Keep your original session storage logic intact for your data pipeline
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bica_emergency', JSON.stringify({ symptom, clinic }));
    }
  };

  return (
   <div className="">

      {/* NAV */}
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
      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="flex flex-col items-center justify-center py-12 px-4 gap-6 bg-cyan-950">

        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white">Safety Check</h2>
          <p className="text-xl font-serif text-white mt-1">Are you experiencing any of the following right now?</p>
        </div>

        {/* ── DYNAMIC VIEW: EMERGENCY SCREEN FLASH ALERT ── */}
        {isEmergency ? (
          <div className="w-full max-w-3xl bg-red-600 border-4 border-white text-white rounded-xl p-8 text-center shadow-2xl animate-pulse">
            <h3 className="text-3xl font-extrabold mb-2">🔴 IMMEDIATE ER REDIRECTION 🔴</h3>
            <p className="text-lg mb-4">Detected: <span className="font-bold underline">{alertData.symptom}</span></p>
            <p className="text-xl font-medium bg-red-950 px-4 py-3 rounded-lg inline-block">
              Please get your ticket and proceed immediately to the ER!
            </p>
            <button 
              onClick={() => setIsEmergency(false)} 
              className="block mx-auto mt-6 text-xs text-red-200 hover:underline opacity-70"
            >
              Cancel / Reset Kiosk
            </button>
          </div>
        ) : (
          /* ── DEFAULT VIEW: RED FLAG CARD ── */
          <>
            <div className="w-full max-w-3xl bg-red-950 border-2 border-red-400 rounded-xl p-6 shadow-xl">
              
              <h3 className="flex items-center gap-2 text-red-300 text-sm font-bold uppercase tracking-wider mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                Tap immediately if any of these apply to you — you will be directed to the emergency area
              </h3>

              <div className="grid grid-cols-2 gap-3">

                {/* Red flag 1 */}
                <button 
                  onClick={() => handleGoEmergency('Severe chest pain / gasping for air', 'ER / Cardiology')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Severe chest pain</p>
                </button>

                {/* Red flag 2 */}
                <button 
                  onClick={() => handleGoEmergency('Severe chest pain / gasping for air', 'ER / Cardiology')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Gasping for air</p>
                </button>

                {/* Red flag 3 */}
                <button 
                  onClick={() => handleGoEmergency('Loss of consciousness / sudden paralysis', 'Neurology ER')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Loss of consciousness</p>
                </button>

                {/* Red flag 4 */}
                <button 
                  onClick={() => handleGoEmergency('Loss of consciousness / sudden paralysis', 'Neurology ER')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Sudden paralysis</p>
                </button>

                {/* Red flag 5 */}
                <button 
                  onClick={() => handleGoEmergency('Heavy active bleeding / open fractures', 'Trauma / Surgery ER')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Heavy active bleeding</p>
                  </button>

                 {/* Red flag 6 */}
                <button 
                  onClick={() => handleGoEmergency('Heavy active bleeding / open fractures', 'Trauma / Surgery ER')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Open fractures</p>
                  </button>


                {/* Red flag 7 */}
                <button 
                  onClick={() => handleGoEmergency('Continuous seizures', 'ER / Neurology')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Continuous seizures</p>
                </button>

                {/* Red flag 8 */}
                <button 
                  onClick={() => handleGoEmergency('Thesis', 'ER / Neurology')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Thesis</p>
                </button>

              </div>
            </div>

            {/* Safe Proceed Action Row */}
            <div className="w-full max-w-3xl">
              <button
                onClick={() => console.log("Moving cleanly to Chief Complaints view step...")}
                className="w-full text-center bg-[#083344] border-2 border-[#fefce8] text-white text-base font-bold py-3 rounded-lg hover:bg-[#0e4f68] transition-colors cursor-pointer block"
              >
                None of these apply to me — proceed to symptom check →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}