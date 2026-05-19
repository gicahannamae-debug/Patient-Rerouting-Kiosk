'use client' 
import React from "react";

interface CatProps {
  isPatientCat:boolean;
  // setIsPatientCat: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function PatientCategory ({isPatientCat}:CatProps){

console.log("Props PatienCat received:", {isPatientCat});

     return (
      
    <div className={``}>
     {/* Logo Wrapper */}
  <nav className="w-full-absolute pl-[2rem] pt-[1rem] text-cyan-950 bg-yellow-50">
        
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

      <div>
      <div className={` h-screen flex flex-col gap-[0.9rem] items-center justify-center bg-cyan-950`}>

      {/* Patient Category Wrapper */}
        <div className=" flex flex-col text-center w-full justify-center align-center ">
        <h1 className="text-[3rem] font-bold font-Sans-serif text-white">Patient Category</h1>
        <p className="text-[1.7rem] font-serif">Please select what applies.</p>
        </div>

     <div className="flex flex-row gap-[8rem]">
        <button className=" w-[16rem] h-[16rem] text-[3rem] font-semibold bg-green-300 hower:bg-orange-100 text-white px-[1rem] py-[.5rem] rounded-md "> Old Patient</button>
        <button className=" w-[16rem] h-[16rem] text-[3rem] font-semibold bg-blue-300 hower:bg-orange-100 text-white px-[1rem] py-[.5rem] rounded-md "> New Patient</button>
        <button className=" w-[16rem] h-[16rem] text-[3rem] font-semibold bg-red-300 hower:bg-orange-100 text-white px-[1rem] py-[.5rem] rounded-md "> Referred Patient</button>
        </div>
     </div>

      </div>
      </div> 
     ); 
}