'use client'
import React from "react";

export type ServiceWorkflowType = 'referred' | 'diagnostics' | 'followup';

interface ReferralDetailsProps {
  selectedServiceType?: ServiceWorkflowType;
  onBack?: () => void;
  onProceed?: (values: Record<string, string>) => void;
}

export default function ReferralDetails({ selectedServiceType, onBack, onProceed }: ReferralDetailsProps) {
  const serviceType: ServiceWorkflowType = selectedServiceType ?? 'referred';

  return (
    <div className="w-full min-h-screen bg-cyan-950 flex flex-col font-sans antialiased selection:bg-yellow-200">

      {/* ── NAV ── */}
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

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 my-4">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
            Service & Referral Details
          </h1>
          <p className="text-lg md:text-xl font-medium text-cyan-200/70 tracking-wide">
            Select service type and provide request details.
          </p>
        </div>

        {/* ── FORM CARD ── */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const data: Record<string, string> = { serviceWorkflow: serviceType };
            formData.forEach((value, key) => {
              data[key] = value.toString();
            });
            onProceed?.(data);
          }}
          className="flex flex-col gap-6 bg-cyan-900 p-8 rounded-2xl max-w-4xl w-full border border-cyan-800/60 shadow-2xl"
        >
          {/* ══════════════ OPTION A: REFERRED PATIENT ══════════════ */}
          {serviceType === 'referred' && (
            <>
              <div className="border-b border-cyan-800 pb-2">
                <span className="text-yellow-300 font-bold text-sm tracking-wider uppercase">
                  Route: Vital Signs → Triage Nurse → Doctor Consultation
                </span>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Referring Hospital / Clinic *</label>
                  <input
                    required
                    name="referringFacility"
                    type="text"
                    placeholder="e.g. Bukidnon Provincial Hospital"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Facility Level / Type</label>
                  <select
                    name="facilityType"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="">— Select facility type —</option>
                    <option>Barangay Health Station (BHS)</option>
                    <option>Rural Health Unit (RHU) / Health Center</option>
                    <option>District / Primary Hospital</option>
                    <option>Provincial Hospital</option>
                    <option>Private Clinic / Hospital</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Referring Doctor</label>
                  <input
                    name="referringDoctor"
                    type="text"
                    placeholder="Dr. Juan Dela Cruz"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Doctor / Clinic Contact</label>
                  <input
                    name="referringContact"
                    type="tel"
                    placeholder="09XX-XXX-XXXX"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Target Specialty Clinic *</label>
                  <select
                    required
                    name="targetSpecialty"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="">— Select specialty —</option>
                    <option>Internal Medicine</option>
                    <option>Pediatrics</option>
                    <option>Obstetrics & Gynecology (OB-GYN)</option>
                    <option>General Surgery</option>
                    <option>Orthopedics</option>
                    <option>Ophthalmology (Eye)</option>
                    <option>ENT / HNS</option>
                    <option>Dermatology</option>
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Admitting / Working Diagnosis *</label>
                  <input
                    required
                    name="referralDiagnosis"
                    type="text"
                    placeholder="e.g. Acute Gastroenteritis with Moderate Dehydration"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Referral Form / Control No.</label>
                  <input
                    name="referralFormNo"
                    type="text"
                    placeholder="e.g. RF-2026-00412"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>
            </>
          )}

          {/* ══════════════ OPTION B: DIAGNOSTICS & LABS ══════════════ */}
          {serviceType === 'diagnostics' && (
            <>
              <div className="border-b border-cyan-800 pb-2">
                <span className="text-emerald-300 font-bold text-sm tracking-wider uppercase">
                  Route: Direct Queue Ticket → Laboratory / Radiology Desk (Skips Vital Signs)
                </span>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Target Service Department *</label>
                  <select
                    required
                    name="targetDepartment"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="">— Select department —</option>
                    <option value="lab">Clinical Laboratory (Blood, Urine, Stool)</option>
                    <option value="xray">Radiology - X-Ray</option>
                    <option value="ultrasound">Radiology - Ultrasound / CT Scan</option>
                    <option value="cardio">Cardio-Pulmonary (ECG, 2D-Echo)</option>
                    <option value="rehab">Physical Therapy / Rehab Medicine</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Request Type *</label>
                  <select
                    required
                    name="diagnosticRequestType"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="">— Select order status —</option>
                    <option>Has Doctor&apos;s Order Slip / Request Form</option>
                    <option>Scheduled Appointment / Fasting Exam</option>
                    <option>Direct Walk-in Testing</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Ordering Doctor / Facility</label>
                  <input
                    name="orderingPhysician"
                    type="text"
                    placeholder="e.g. Dr. Maria Santos / OPD Clinic 3"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Requested Test Name(s)</label>
                  <input
                    name="requestedTests"
                    type="text"
                    placeholder="e.g. CBC, Urinalysis, Chest X-Ray PA view"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>
            </>
          )}

          {/* ══════════════ OPTION C: CLINIC FOLLOW-UP ══════════════ */}
          {serviceType === 'followup' && (
            <>
              <div className="border-b border-cyan-800 pb-2">
                <span className="text-blue-300 font-bold text-sm tracking-wider uppercase">
                  Route: Vital Signs → Specific Specialty Clinic Queue
                </span>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Target Specialty Clinic *</label>
                  <select
                    required
                    name="followupClinic"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="">— Select clinic —</option>
                    <option>Internal Medicine Follow-up</option>
                    <option>Pediatric Subspecialty</option>
                    <option>OB-GYN / Post-Natal</option>
                    <option>Post-Operative Surgery</option>
                    <option>Orthopedic / Fracture Clinic</option>
                    <option>Hypertension / Diabetes Clinic</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Attending Physician (If known)</label>
                  <input
                    name="attendingDoctor"
                    type="text"
                    placeholder="e.g. Dr. Ramos"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Hospital ID / Blue Card No.</label>
                  <input
                    name="patientHospitalId"
                    type="text"
                    placeholder="e.g. NMMC-2025-XXXXX"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-semibold text-white">Last Visit / Appointment Date</label>
                  <input
                    name="lastVisitDate"
                    type="date"
                    className="text-base text-cyan-950 border border-stone-300 bg-yellow-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── ACTION BUTTONS ── */}
          <div className="flex justify-center gap-4 pt-4 border-t border-cyan-800">
            <button
              type="button"
              onClick={() => onBack?.()}
              className="text-base font-bold text-yellow-50 border border-yellow-100/50 px-8 py-3 rounded-lg hover:bg-cyan-800 transition-colors"
            >
              ← Back
            </button>

            <button
              type="submit"
              className="text-lg font-bold bg-yellow-50 text-cyan-950 px-10 py-3 rounded-lg hover:bg-yellow-100 shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              {serviceType === 'diagnostics' ? 'Issue Diagnostic Ticket →' : 'Proceed to Vital Signs →'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}