'use client';
import React, { useState } from "react";

export type PatientType = 'old' | 'new' | 'referred' | null;
export type ServiceType = 'consultation' | 'lab_diagnostics' | 'followup' | 'other' | null;

export interface CategorySelection {
  patientType: PatientType;
  serviceType: ServiceType;
}

interface CatProps {
  selectedCategory?: CategorySelection;
  onCategorySelect?: (selection: CategorySelection) => void;
  onBack?: () => void;
}

export default function PatientCategory({ selectedCategory, onCategorySelect, onBack }: CatProps) {
  const [patientType, setPatientType] = useState<PatientType>(selectedCategory?.patientType || null);
  const [serviceType, setServiceType] = useState<ServiceType>(selectedCategory?.serviceType || null);

  const patientTypeOptions = [
    {
      id: 'old' as const,
      label: 'Returning / Old Patient',
      desc: 'Has an existing hospital record',
      color: 'emerald',
      activeClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400',
    },
    {
      id: 'new' as const,
      label: 'New Patient',
      desc: 'First time visiting this hospital',
      color: 'blue',
      activeClass: 'bg-blue-500/20 border-blue-400 text-blue-100 ring-2 ring-blue-400',
    },
    {
      id: 'referred' as const,
      label: 'Referred Patient',
      desc: 'Has a referral slip from another clinic/doctor',
      color: 'purple',
      activeClass: 'bg-purple-500/20 border-purple-400 text-purple-100 ring-2 ring-purple-400',
    },
  ];

  const serviceTypeOptions = [
    {
      id: 'consultation' as const,
      label: 'Medical Consultation',
      desc: 'See a doctor for symptoms or checkup',
    },
    {
      id: 'lab_diagnostics' as const,
      label: 'Laboratory & Diagnostics',
      desc: 'Blood tests, X-Ray, Ultrasound, etc.',
    },
    {
      id: 'followup' as const,
      label: 'Follow-up / Result Review',
      desc: 'Reviewing test results with doctor',
    },
    {
      id: 'other' as const,
      label: 'Other OPD Services',
      desc: 'Clearances, certificates, ancillary services',
    },
  ];

  const handlePatientSelect = (id: PatientType) => {
    setPatientType(id);
    if (onCategorySelect) {
      onCategorySelect({ patientType: id, serviceType: serviceType ?? null });
    }
  };

  const handleServiceSelect = (id: ServiceType) => {
    if (!patientType) return;
    setServiceType(id);
    if (onCategorySelect) {
      onCategorySelect({ patientType, serviceType: id });
    }
  };

  const isComplete = patientType !== null && serviceType !== null;

  return (
    <div className="w-full min-h-screen bg-cyan-950 flex flex-col font-sans antialiased selection:bg-yellow-200 justify-between">
      
      {/* Navigation Bar */}
      <nav className="w-full px-8 py-4 text-cyan-950 bg-yellow-50 shadow-lg border-b border-yellow-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-wider text-cyan-950">BICA</h1>
          <p className="text-xs font-medium tracking-wide uppercase text-cyan-800/80">Better Informed Care Access</p>
        </div>

        <div className="flex items-center">
          <ul className="flex space-x-8 text-lg font-bold text-cyan-900/90">
            <li><a href="#" className="cursor-pointer hover:text-cyan-600 transition-colors duration-200">Triage Form</a></li>
            <li className="text-cyan-200 font-light">|</li>
            <li><a href="#" className="cursor-pointer hover:text-cyan-600 transition-colors duration-200">Vital Signs</a></li>
            <li className="text-cyan-200 font-light">|</li>
            <li><a href="#" className="cursor-pointer hover:text-cyan-600 transition-colors duration-200">Chief Complaints</a></li>
            <li className="text-cyan-200 font-light">|</li>
            <li><a href="#" className="cursor-pointer hover:text-cyan-600 transition-colors duration-200">Summary</a></li>
          </ul>
        </div>
      </nav>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full space-y-6">
        
        {onBack && (
          <button
            onClick={onBack}
            className="self-start text-base text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Safety Check
          </button>
        )}
        
        {/* Header Text */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
            Patient Registration & Service
          </h1>
          <p className="text-lg md:text-xl font-medium text-cyan-200/70 tracking-wide">
            Please select your patient category and the service you require today.
          </p>
        </div>

        {/* 2-COLUMN SINGLE SCREEN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* COLUMN 1: PATIENT TYPE */}
          <div className="bg-cyan-900/40 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-sm flex flex-col space-y-4">
            <div className="border-b border-cyan-500/30 pb-3">
              <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">
                Patient Type
              </h2>
              <p className="text-sm text-cyan-200/80">Who is receiving care today?</p>
            </div>

            <div className="flex flex-col space-y-3 flex-1 justify-center">
              {patientTypeOptions.map((opt) => {
                const isSelected = patientType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePatientSelect(opt.id)}
                    className={`
                      w-full p-5 rounded-2xl text-left border-2 transition-all duration-200 cursor-pointer
                      flex flex-col justify-center space-y-1 min-h-[5rem]
                      ${isSelected 
                        ? opt.activeClass 
                        : 'bg-white/10 border-white/10 text-white hover:bg-white/20 hover:border-white/30'
                      }
                    `}
                  >
                    <div className="text-xl font-bold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-lg">✓</span>}
                    </div>
                    <span className="text-xs opacity-80 font-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: PURPOSE / SERVICE TYPE */}
          <div className={`bg-cyan-900/40 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-sm flex flex-col space-y-4 transition-all duration-300 ${patientType ? 'opacity-100 scale-100' : 'opacity-45 blur-[1px] scale-[0.99]'}`}>
            <div className="border-b border-cyan-500/30 pb-3">
              <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">
                Purpose of Visit
              </h2>
              <p className="text-sm text-cyan-200/80">What service do you need today?</p>
            </div>

            <div className="flex flex-col space-y-3 flex-1 justify-center">
              {serviceTypeOptions.map((opt) => {
                const isSelected = serviceType === opt.id;
                const isDisabled = !patientType;
                return (
                  <button
                    key={opt.id}
                    disabled={isDisabled}
                    onClick={() => handleServiceSelect(opt.id)}
                    className={`
                      w-full p-4 rounded-2xl text-left border-2 transition-all duration-200
                      flex flex-col justify-center space-y-1 min-h-[4.5rem]
                      ${isDisabled
                        ? 'bg-white/5 border-white/10 text-white/45 cursor-not-allowed'
                        : isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-100 ring-2 ring-amber-400 cursor-pointer'
                          : 'bg-white/10 border-white/10 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer'
                      }
                    `}
                  >
                    <div className="text-lg font-bold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-lg">✓</span>}
                    </div>
                    <span className="text-xs opacity-80 font-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* PROCEED INDICATOR */}
        <div className="w-full flex justify-end pt-2">
          <div className="text-sm font-semibold text-cyan-300">
            {!isComplete ? (
              <span className="opacity-70 animate-pulse">Select 1 option from each column to continue</span>
            ) : (
              <span className="text-emerald-400 font-bold">Selection complete ✓</span>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        BICA Outpatient Self-Service Kiosk • Northern Mindanao Medical Center[cite: 1]
      </footer>

    </div>
  );
}