'use client' 
import React from "react";

// Using a type union to accurately track the 3 distinct selections
export type PatientCategoryType = 'old' | 'new' | 'referred' | null;

interface CatProps {
  selectedCategory: PatientCategoryType;
  onCategorySelect: (category: PatientCategoryType) => void;
  onBack?: () => void;
}

export default function PatientCategory({ selectedCategory, onCategorySelect, onBack }: CatProps) {
  
  // High-fidelity styling configuration for each button category
  const categories = [
    { 
      id: 'old' as const, 
      label: 'Old Patient', 
      textColor: 'text-emerald-600', 
      borderColor: 'hover:border-emerald-500',
      activeClass: 'bg-emerald-50/90 border-emerald-500 shadow-emerald-900/20 ring-4 ring-emerald-500/20'
    },
    { 
      id: 'new' as const, 
      label: 'New Patient', 
      textColor: 'text-blue-600', 
      borderColor: 'hover:border-blue-500',
      activeClass: 'bg-blue-50/90 border-blue-500 shadow-blue-900/20 ring-4 ring-blue-500/20'
    },
    { 
      id: 'referred' as const, 
      label: 'Referred Patient', 
      textColor: 'text-rose-600', 
      borderColor: 'hover:border-rose-500',
      activeClass: 'bg-rose-50/90 border-rose-500 shadow-rose-900/20 ring-4 ring-rose-500/20'
    },
  ];

  return (
    <div className="w-full min-h-screen bg-cyan-950 flex flex-col font-sans antialiased selection:bg-yellow-200">
      
      {/* Navigation Bar */}
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-yellow-50 shadow-lg border-b border-yellow-100 flex items-center justify-between">
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
      <div className="flex-1 flex flex-col gap-[2.5rem] items-center justify-center pb-[4rem]">
        {onBack && (
          <button
            onClick={onBack}
            className="self-start ml-[2rem] text-base text-white/80 hover:text-white"
          >
            ← Back to Welcome
          </button>
        )}
        
        {/* Header Text Wrapper */}
        <div className="text-center space-y-2">
          <h1 className="text-[3.5rem] font-black tracking-tight text-white drop-shadow-sm">
            Patient Category
          </h1>
          <p className="text-[1.5rem] font-medium text-cyan-200/70 tracking-wide">
            Please select what applies to the patient.
          </p>
        </div>

        {/* Improved Category Buttons Container */}
        <div className="flex flex-row gap-[5rem]">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`
                  w-[18rem] h-[18rem] p-[2rem] rounded-2xl font-bold text-[2.2rem] leading-tight
                  flex items-center justify-center text-center border-2
                  transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                  shadow-2xl cursor-pointer transform hover:-translate-y-2 active:scale-95
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