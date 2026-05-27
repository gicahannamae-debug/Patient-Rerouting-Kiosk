'use client'
import React, { useState } from 'react';

const BicaTriage = () => {
  const [selectedClinic, setSelectedClinic] = useState<any>(null);

  const clinics = [
    { id: 'ent', title: 'Ear, Nose & Throat', sub: 'Ear pain · sinusitis · hoarseness', badge: 'ENT' },
    { id: 'eye', title: 'Eyes', sub: 'Blurry vision · eye pain · redness', badge: 'Ophthalmology' },
    { id: 'dental', title: 'Teeth & Mouth', sub: 'Toothache · extraction · cleaning', badge: 'Dental Medicine' },
    { id: 'gen', title: 'General / Check-up', sub: 'Headache · colds · UTI · maintenance', badge: 'Family Medicine' },
    { id: 'lung', title: 'Chest & Lungs', sub: 'Chronic cough · asthma · COPD', badge: 'Pulmonary' },
    { id: 'mental', title: 'Mental Health', sub: 'Anxiety · depression · addiction', badge: 'Psychiatry' },
    { id: 'surgery', title: 'Abdomen & Wounds', sub: 'Abdominal pain · hernia · abscess', badge: 'Surgery' },
    { id: 'obgyn', title: 'Women\'s Health', sub: 'Prenatal · vaginal bleeding · pelvic', badge: 'OB-GYN' },
    { id: 'nephro', title: 'Kidney & Urinary', sub: 'Urination issues · edema · dialysis', badge: 'Nephrology' },
    { id: 'bones', title: 'Bones & Joints', sub: 'Fractures · joint pain · back pain', badge: 'Orthopaedics' },
    { id: 'peds', title: 'Children\'s Health', sub: 'Fever · vaccination · newborn care', badge: 'Pediatrics <19' },
    { id: 'onco', title: 'Cancer & Tumor', sub: 'Chemo follow-up · tumor screening', badge: 'Oncology' },
  ];

  return (
    <div className="bg-cyan-950 min-h-screen flex flex-col items-center py-[3rem] hidden">
      {/* Navigation */}
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-orange-50 mb-12">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p className="w-full">Better Informed Care Access</p>
          </div>
          <div className="pr-[2rem]">
            <ul className="flex space-x-8 text-xl font-semibold">
              <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Vital Signs |</a></li>
              <li><a href="#" className="text-orange-900 underline cursor-pointer">Chief Complaints |</a></li>
              <li><a href="#" className="cursor-pointer hover:underline">Summary |</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="flex flex-col text-center justify-center mb-8">
        <h1 className="text-[3rem] font-bold text-white">Chief Complaints</h1>
        <p className="text-[1.7rem] font-serif text-white">Select the clinic corresponding to your concerns.</p>
      </div>

      {/* Main Content Area - 3 Column Grid */}
      <div className="flex flex-col gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">
        
        <div className="grid grid-cols-3 gap-[1rem]">
          {clinics.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClinic(c)}
              className={`text-left p-[1rem] rounded-sm border transition-all ${
                selectedClinic?.id === c.id 
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-cyan-950 border-stone-300 hover:border-orange-300'
              }`}
            >
              <div className={`font-semibold text-[1.1rem] ${selectedClinic?.id === c.id ? 'text-cyan-950' : 'text-white'}`}>{c.title}</div>
              <div className={`text-[0.9rem] mt-1 ${selectedClinic?.id === c.id ? 'text-cyan-800' : 'text-sky-200'}`}>{c.sub}</div>
              <span className={`inline-block text-[0.8rem] font-bold px-[0.5rem] py-[0.1rem] rounded-full mt-2 ${selectedClinic?.id === c.id ? 'bg-cyan-950 text-orange-200' : 'bg-cyan-800 text-sky-200'}`}>
                {c.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Result Strip */}
        <div className={`mt-[1rem] p-[1rem] rounded-sm flex items-center justify-between border ${selectedClinic ? 'bg-orange-50 border-orange-300' : 'bg-cyan-950 border-stone-300'}`}>
          <div>
            <p className={`text-[0.9rem] font-semibold ${selectedClinic ? 'text-cyan-900' : 'text-sky-200'}`}>Selected clinic</p>
            <div className={`font-semibold text-[1.2rem] ${selectedClinic ? 'text-cyan-950' : 'text-white'}`}>
              {selectedClinic ? `${selectedClinic.title} Clinic` : 'No selection yet'}
            </div>
          </div>
          <button 
            disabled={!selectedClinic}
            className={`text-[1.3rem] font-semibold px-[2rem] py-[0.4rem] rounded-md transition-colors ${selectedClinic ? 'bg-cyan-950 text-white hover:bg-cyan-900' : 'bg-stone-300 text-cyan-950 cursor-not-allowed'}`}
          >
            Proceed →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BicaTriage;