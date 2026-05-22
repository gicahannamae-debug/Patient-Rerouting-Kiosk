'use client' 
import React from 'react';

interface CatProps {
  isPatientCat:boolean;
  setIsPatientCat: React.Dispatch<React.SetStateAction<boolean>>;
}


export default function WelcomeScreen({isPatientCat, setIsPatientCat}:CatProps) {

console.log("Props received:", { isPatientCat, setIsPatientCat });

  function handleForm (){
    setIsPatientCat(!isPatientCat);
  }

  return (
    <div className={``}>
{/* ── NAV ── */}
        <div className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-yellow-50">

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
            <p className="w-full">Better Informed Care Access</p>
          </div>
        </div>
    
    {/* Welcome Wrapper */}
    <div className="flex flex-col gap-[9px] flex-1 items-center  justify-center bg-cyan-950 font-sans w-full-absolute h-screen">
      <h1 className="text-[6rem] font-bold font-Sans-serif text-white ">Welcome to OPD</h1>
      <p className="w-[40rem] text-[1.51rem] flex text-center text-white ">Please use this Kiosk to begin with self triage. This will help us understand your need and expedite your care.</p>
      <button onClick={handleForm} className=" text-[1.875rem] font-semibold hover:cursor-pointer bg-orange-50 hover:bg-orange-100 text-cyan-950 px-[1.875rem] py-[.5rem] rounded-md">Start Self Service Triage </button>
    </div>
    </div> 
  ); 
}