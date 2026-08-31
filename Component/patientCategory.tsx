'use client' 
import React from "react";

export type PatientCategoryType = 'old' | 'new' | 'referred' | null;

interface CatProps {
  selectedCategory: PatientCategoryType;
  onCategorySelect: (category: PatientCategoryType) => void;
  onBack?: () => void;
}

export default function PatientCategory({ selectedCategory, onCategorySelect, onBack }: CatProps) {
  
  const categories = [
    { 
      id: 'old' as const, 
      label: 'Old Patient', 
      textColor: 'text-emerald-600', 
      borderColor: 'hover:border-emerald-500',
      activeClass: 'bg-emerald-50/90 border-emerald-500 shadow-emerald-900/20 ring-4 ring-emerald-500/20',
      gridCol: 'col-span-1'
    },
    { 
      id: 'new' as const, 
      label: 'New Patient', 
      textColor: 'text-blue-600', 
      borderColor: 'hover:border-blue-500',
      activeClass: 'bg-blue-50/90 border-blue-500 shadow-blue-900/20 ring-4 ring-blue-500/20',
      gridCol: 'col-span-1'
    },
    { 
      id: 'referred' as const, 
      label: 'Others: Referred Patient, Follow-up Check up, Laboratories and Diagnostic Services', 
      textColor: 'text-rose-600', 
      borderColor: 'hover:border-rose-500',
      activeClass: 'bg-rose-50/90 border-rose-500 shadow-rose-900/20 ring-4 ring-rose-500/20',
      gridCol: 'col-span-2' // Spans across both columns underneath!
    },
  ];

  return (
    <div className="w-full min-h-screen bg-cyan-950 flex flex-col font-sans antialiased selection:bg-yellow-200">
      
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        {onBack && (
          <button
            onClick={onBack}
            className="self-start text-base text-white/80 hover:text-white transition-colors"
          >
            ← Back to Welcome
          </button>
        )}
        
        {/* Header Text Wrapper */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
            Patient Category
          </h1>
          <p className="text-lg md:text-xl font-medium text-cyan-200/70 tracking-wide">
            Please select what applies to the patient.
          </p>
        </div>

        {/* Arranged Grid Container */}
        <div className="grid grid-cols-2 gap-6 max-w-4xl w-full">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`
                  ${cat.gridCol}
                  p-8 rounded-2xl font-bold text-xl md:text-2xl leading-snug
                  flex items-center justify-center text-center border-2 min-h-[12rem]
                  transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                  shadow-2xl cursor-pointer transform hover:-translate-y-1 active:scale-98
                  ${cat.textColor} ${cat.borderColor}
                  ${isSelected 
                    ? cat.activeClass 
                    : 'bg-white border-transparent hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
                  }
                `}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      </div>
    </div> 
  ); 
}