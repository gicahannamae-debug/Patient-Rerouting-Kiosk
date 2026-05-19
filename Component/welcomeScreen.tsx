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

    {/* Logo Wrapper */}
  <body className="bg-white">
  <nav className="w-full-absolute pl-[2rem] pt-[1rem] text-cyan-950 bg-orange-50">
        
        <div className="container mx-auto flex items-center justify-between">

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold ">BICA</h1>
            <p className="w-full">Better Informed Care Access</p>
          </div>

          <div className="pr-[2rem]">
          <ul className="md:flex space-x-8 hidden text-xl font-semibold w-full">
            <li><a href="#" className="cursor-pointer hover:underline">Triage Form |</a></li>
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
</body>

    {/* Welcome Wrapper */}
    <div className="flex flex-col gap-[9px] flex-1 items-center  justify-center bg-cyan-950 font-sans w-full-absolute h-screen">
      <h1 className="text-[6rem] font-bold font-Sans-serif text-white ">Welcome to OPD</h1>
      <p className="w-[40rem] text-[1.51rem] flex text-center text-white ">Please use this Kiosk to begin with self triage. This will help us understand your need and expedite your care.</p>
      <button onClick={handleForm} className=" text-[1.875rem] font-semibold hover:cursor-pointer bg-orange-50 hover:bg-orange-100 text-cyan-950 px-[1.875rem] py-[.5rem] rounded-md">Start Self Service Triage </button>
    </div>

    </div> 
  ); 
}