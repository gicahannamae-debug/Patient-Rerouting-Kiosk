'use client'
import React from "react";

export default function vsTemperature() {
  return (

    <div className="">

      {/* ── NAV ── */}
      <nav className="w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 bg-yellow-50">
        <div className="container mx-auto flex items-center justify-between">

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">BICA</h1>
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

      {/* ── MAIN ── */}
      <div className="min-h-screen flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]">

        {/* Header */}
        <div className="flex flex-col text-center justify-center">
          <h1 className="text-[3rem] font-bold text-white">Vital Sign Measurement</h1>
          <p className="text-[1.7rem] font-serif text-white">Patient Temperature (T)</p>
        </div>

        {/* ── CONTENT CARD ── */}
        <div className="flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]">

          {/* ── LEFT: Procedure Steps ── */}
          <div className="flex flex-col gap-[0.8rem] flex-1 border border-dashed border-cyan-600 rounded-lg p-[1.5rem]">

            <h2 className="text-[1.4rem] font-bold text-white">Procedure</h2>
            <p className="text-[1.3rem] text-cyan-300">Please follow the instructions below to take your Temperature reading.</p>

            {[
              "Pick up the Temperature Gun (Infrared Thermometer) located on the right side of the kiosk.",
              "Remove any hat, bandana, or head covering before taking the reading.",
              "Point the device at the center of your forehead, about 3–5 cm (1–2 inches) away from the skin.",
              "Hold still and press the trigger button to take your reading.",
              "Read the temperature value shown on the thermometer display.",
              "Input the value in °C into the box on the right side and click Proceed.",
            ].map((step, i) => (
              <div key={i} className="flex flex-row items-start gap-[0.75rem]">
                <div className="w-[1.8rem] h-[1.8rem] flex-shrink-0 rounded-full bg-cyan-950 text-white flex items-center justify-center text-[0.85rem] font-bold mt-[0.1rem]">
                  {i + 1}
                </div>
                <p className="text-[1.3rem] text-white leading-snug">{step}</p>
              </div>
            ))}

            {/* Reminder note */}
            <div className="bg-yellow-100 border border-yellow-400 rounded-md px-[1rem] py-[0.5rem] text-[0.82rem] text-yellow-900 mt-[0.5rem]">
              <strong>Reminder:</strong> Avoid taking temperature right after physical activity, eating, or drinking hot/cold beverages. Wait at least 5 minutes before measuring.
            </div>

          </div>

          {/* ── RIGHT: Input Form ── */}
          <div className="flex flex-col gap-[1rem] w-[22rem] flex-shrink-0">

            <div className="flex flex-col text-center justify-center">
              <h2 className="text-[1.4rem] font-bold text-white">Temperature Reading</h2>
              <p className="text-[0.9rem] text-cyan-300">Enter the value shown on the thermometer.</p>
            </div>

            <form className="flex flex-col gap-[1rem]">

              <section className="flex flex-col gap-[0.25rem]">
                <label className="text-[1.1rem] font-semibold text-white">
                  Temperature (°C) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 36.8"
                  min="30"
                  max="45"
                  step="0.1"
                  className="text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </section>

              {/* Temperature Classification reference */}
              <div className="flex flex-col gap-[0.3rem] bg-cyan-950 rounded-lg px-[0.9rem] py-[0.7rem]">
                <p className="text-[0.78rem] font-semibold text-cyan-300 uppercase tracking-wider mb-[0.2rem]">Temperature Classification</p>
                {[
                  { label: "Hypothermia",     range: "< 35.0 °C",        dot: "bg-blue-400"   },
                  { label: "Normal",          range: "35.0 – 37.2 °C",   dot: "bg-green-400"  },
                  { label: "Low-grade Fever", range: "37.3 – 38.0 °C",   dot: "bg-yellow-400" },
                  { label: "Moderate Fever",  range: "38.1 – 39.0 °C",   dot: "bg-orange-400" },
                  { label: "High Fever",      range: "39.1 – 40.0 °C",   dot: "bg-red-500"    },
                  { label: "Hyperpyrexia",    range: "> 40.0 °C",        dot: "bg-red-700"    },
                ].map((item) => (
                  <div key={item.label} className="flex flex-row items-center gap-[0.5rem]">
                    <div className={`w-[0.6rem] h-[0.6rem] rounded-full flex-shrink-0 ${item.dot}`} />
                    <p className="text-[0.78rem] text-white">{item.label}</p>
                    <p className="text-[0.78rem] text-cyan-400 ml-auto">{item.range}</p>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-[0.8rem] pt-[0.25rem]">

                <button
                  type="button"
                  className="text-[1rem] font-semibold bg-transparent text-orange-50 border border-orange-100 px-[1.5rem] py-[0.5rem] rounded-md hover:bg-cyan-800 cursor-pointer"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer"
                >
                  Proceed
                </button>

              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}