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
    <div className="bg-[#083344] min-h-screen font-sans">

      {/* ── NAV BAR ── */}
      <nav className="w-full bg-[#fefce8] px-8 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-[#083344]">BICA</h1>
          <p className="text-xs text-cyan-900">Better Informed Care Access</p>
        </div>
        <ul className="flex space-x-6">
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline text-[#0e4f68] underline">Triage Form |</a></li>
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline">Vital Signs |</a></li>
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline">Chief Complaints |</a></li>
          <li><a href="#" className="text-sm font-semibold text-[#083344] hover:underline">Summary |</a></li>
        </ul>
      </nav>

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="flex flex-col items-center justify-center py-12 px-4 gap-6">

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
              Please proceed immediately to the <span className="text-yellow-300 font-black">{alertData.clinic}</span> desk!
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
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                Tap immediately if any of these apply to you — you will be directed to the emergency area
              </h3>

              <div className="grid grid-cols-2 gap-3">

                {/* Red flag 1 */}
                <button 
                  onClick={() => handleGoEmergency('Severe chest pain / gasping for air', 'ER / Cardiology')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Severe chest pain / gasping for air</p>
                  <p className="text-red-300 text-xs mt-1 font-semibold">→ ER / Cardiology — RED ALERT</p>
                </button>

                {/* Red flag 2 */}
                <button 
                  onClick={() => handleGoEmergency('Loss of consciousness / sudden paralysis', 'Neurology ER')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Loss of consciousness / sudden paralysis</p>
                  <p className="text-red-300 text-xs mt-1 font-semibold">→ Neurology ER — RED ALERT</p>
                </button>

                {/* Red flag 3 */}
                <button 
                  onClick={() => handleGoEmergency('Heavy active bleeding / open fractures', 'Trauma / Surgery ER')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Heavy active bleeding / open fractures</p>
                  <p className="text-red-300 text-xs mt-1 font-semibold">→ Trauma / Surgery ER — RED ALERT</p>
                </button>

                {/* Red flag 4 */}
                <button 
                  onClick={() => handleGoEmergency('Continuous seizures', 'ER / Neurology')}
                  className="bg-red-800 border border-red-400 rounded-lg px-4 py-4 text-left hover:bg-red-700 transition-colors cursor-pointer group"
                >
                  <p className="text-red-100 text-base font-bold group-hover:text-white">Continuous seizures</p>
                  <p className="text-red-300 text-xs mt-1 font-semibold">→ ER / Neurology — RED ALERT</p>
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