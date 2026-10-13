
'use client';

import React, { useState } from "react";
import KioskHeader from "@/Component/kioskHeader";

export interface PatientInfoValues {
  lastName: string;
  firstName: string;
  middleName: string;
  pwdStatus: string;
  birthdate: string;
  age: string;
  gender: string;
  address: string;
  birthplace: string;
  religion: string;
  civilStatus: string;
  appointmentStatus: string;
}

interface PatientInformationProps {
  onLogout?: () => void;
  onProceed?: (values: PatientInfoValues) => void;
  onNavigateStep?: (step: number) => void;
}



const toUppercase = (value: string) => value.toUpperCase();

const sanitizeName = (value: string) =>
  value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "").toUpperCase();

const sanitizeText = (value: string) =>
  value.replace(/[^a-zA-ZÀ-ÿ0-9\s.,'-]/g, "").toUpperCase();



const initialValues: PatientInfoValues = {
  lastName: "",
  firstName: "",
  middleName: "",
  pwdStatus: "Not PWD",
  birthdate: "",
  age: "",
  gender: "",
  address: "",
  birthplace: "",
  religion: "",
  civilStatus: "",
  appointmentStatus: "Without appointment",
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-stone-300 bg-orange-50 px-3 py-3 text-base text-cyan-950 focus:outline-none focus:ring-2 focus:ring-yellow-400";

const labelClass = "mb-1 block text-sm font-semibold text-white sm:text-base";

function calculateAge(birthdate: string): string {
  if (!birthdate) return "";

  const birth = new Date(`${birthdate}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birth.getTime()) || birth > today) return "";

  let age = today.getFullYear() - birth.getFullYear();

  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate());

  if (beforeBirthday) age--;

  return age >= 0 && age <= 150 ? String(age) : "";
}

export default function PatientInformation({
  onLogout,
  onProceed,
  onNavigateStep,
}: PatientInformationProps) {
  const [values, setValues] =
    useState<PatientInfoValues>(initialValues);

  const [error, setError] = useState("");

  function updateField<K extends keyof PatientInfoValues>(
    field: K,
    value: PatientInfoValues[K]
  ) {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lastName = values.lastName.trim();
    const firstName = values.firstName.trim();

    if (!lastName || !firstName) {
      setError("Please enter the patient's first and last name.");
      return;
    }

    if (!values.birthdate) {
      setError("Please enter the patient's birthdate.");
      return;
    }

    const age = calculateAge(values.birthdate);

    if (age === "") {
      setError("Please enter a valid birthdate that is not in the future.");
      return;
    }

    if (!values.gender) {
      setError("Please select the patient's sex.");
      return;
    }

    const submittedValues: PatientInfoValues = {
      ...values,
      lastName,
      firstName,
      middleName: values.middleName.trim(),
      address: values.address.trim(),
      birthplace: values.birthplace.trim(),
      religion: values.religion.trim(),
      age,
    };

    // Pass validated values to the parent component.
    onProceed?.(submittedValues);
  }

  return (
    <div className="flex min-h-screen flex-col bg-cyan-950 font-sans">
      <KioskHeader
        activeStep={3}
        onNavigateStep={onNavigateStep}
        onLogout={onLogout}
      />

      <main className="flex flex-1 flex-col items-center gap-6 px-4 py-8 sm:px-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-white sm:text-5xl">
            Triage Assessment Form
          </h1>
          <p className="mt-2 text-lg text-cyan-100 sm:text-xl">
            Please fill in the necessary information.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-6xl space-y-6 rounded-2xl border border-cyan-700 bg-cyan-900 p-5 shadow-xl sm:p-8"
        >
          {/* Personal information */}
          <section>
            <h2 className="mb-4 border-b border-cyan-700 pb-2 text-xl font-bold text-yellow-300">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass} htmlFor="lastName">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  required
                  maxLength={100}
                  value={values.lastName}
                  onChange={(e) => updateField("lastName", sanitizeName(e.target.value))}
                  className={inputClass}
                  placeholder="e.g. Gica"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="firstName">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  maxLength={100}
                  value={values.firstName}
                  onChange={(e) =>
                    updateField("firstName", sanitizeName(e.target.value))
                  }
                  className={inputClass}
                  placeholder="e.g. Hanna Mae"
                />
              </div>


              <div>
                <label className={labelClass} htmlFor="middleName">
                  Middle Name
                </label>
                <input
                  id="middleName"
                  name="middleName"
                  autoComplete="additional-name"
                  maxLength={100}
                  value={values.middleName}
                  onChange={(e) =>
                    updateField("middleName", sanitizeName(e.target.value))
                  }
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="pwdStatus">
                  PWD Status
                </label>

                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pwdStatus"
                      value="Not PWD"
                      checked={values.pwdStatus === "Not PWD"}
                      onChange={(e) => updateField("pwdStatus", e.target.value)}
                      className="h-4 w-4 accent-cyan-600"
                    />
                    <span>NOT PWD</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pwdStatus"
                      value="Yes, PWD"
                      checked={values.pwdStatus === "Yes, PWD"}
                      onChange={(e) => updateField("pwdStatus", e.target.value)}
                      className="h-4 w-4 accent-cyan-600"
                    />
                    <span>YES, PWD</span>
                  </label>
                </div>
              </div>

            </div>
          </section>

          {/* Birthdate and demographic information */}
          <section>
            <h2 className="mb-4 border-b border-cyan-700 pb-2 text-xl font-bold text-yellow-300">
              Demographic Information
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass} htmlFor="birthdate">
                  Birthdate *
                </label>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  required
                  max={new Date().toLocaleDateString("en-CA")}
                  value={values.birthdate}
                  onChange={(e) => {
                    const birthdate = e.target.value;
                    setValues((previous) => ({
                      ...previous,
                      birthdate,
                      age: calculateAge(birthdate),
                    }));
                    setError("");
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="age">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  readOnly
                  value={values.age}
                  className={`${inputClass} cursor-not-allowed bg-stone-200`}
                  placeholder="Auto-calculated"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="gender">
                  Sex *
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={values.gender}
                  onChange={(e) => updateField("gender", e.target.value.toUpperCase())}
                  className={inputClass}
                >
                  <option value="">SELECT SEX</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="civilStatus">
                  Civil Status
                </label>
                <select
                  id="civilStatus"
                  name="civilStatus"
                  value={values.civilStatus}
                  onChange={(e) =>
                    updateField("civilStatus", e.target.value.toUpperCase())
                  }
                  className={inputClass}
                >
                  <option value="">SELECT STATUS</option>
                  <option value="SINGLE">SINGLE</option>
                  <option value="MARRIED">MARRIED</option>
                  <option value="WIDOWED">WIDOWED</option>
                  <option value="SEPARATED">SEPARATED</option>
                  <option value="DIVORCED">DIVORCED</option>
                </select>
              </div>
            </div>
          </section>

          {/* Additional information */}
          <section>
            <h2 className="mb-4 border-b border-cyan-700 pb-2 text-xl font-bold text-yellow-300">
              Additional Information
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass} htmlFor="birthplace">
                  Birthplace
                </label>
                <input
                  id="birthplace"
                  name="birthplace"
                  maxLength={200}
                  value={values.birthplace}
                  onChange={(e) =>
                    updateField("birthplace", sanitizeText(e.target.value))
                  }
                  className={inputClass}
                  placeholder="e.g. Cagayan de Oro"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="religion">
                  Religion
                </label>
                <input
                  id="religion"
                  name="religion"
                  maxLength={100}
                  value={values.religion}
                  onChange={(e) =>
                    updateField("religion", sanitizeName(e.target.value))
                  }
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="appointmentStatus">
                  Appointment Status
                </label>

                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="appointmentStatus"
                      value="Without appointment"
                      checked={values.appointmentStatus === "Without appointment"}
                      onChange={(e) =>
                        updateField("appointmentStatus", e.target.value)
                      }
                      className="h-4 w-4 accent-cyan-600"
                    />
                    <span>WITHOUT APPOINTMENT</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="appointmentStatus"
                      value="With appointment"
                      checked={values.appointmentStatus === "With appointment"}
                      onChange={(e) =>
                        updateField("appointmentStatus", e.target.value)
                      }
                      className="h-4 w-4 accent-cyan-600"
                    />
                    <span>WITH APPOINTMENT</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass} htmlFor="address">
                  Complete Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  maxLength={500}
                  rows={2}
                  value={values.address}
                  onChange={(e) =>
                    updateField("address", sanitizeText(e.target.value))
                  }
                  className={inputClass}
                  placeholder="House No., Street, Barangay, City, Province"
                />
              </div>
            </div>
          </section>


          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-300 bg-red-950 p-3 font-semibold text-red-100"
            >
              {error}
            </p>
          )}

          <div className="flex justify-center border-t border-cyan-700 pt-5">
            <button
              type="submit"
              className="w-full rounded-xl bg-yellow-300 px-10 py-4 text-xl font-extrabold text-cyan-950 transition-colors hover:bg-yellow-200 active:scale-[0.99] sm:w-auto"
            >
              Proceed →
            </button>
          </div>

          <p className="text-center text-xs text-cyan-200/70">
            * Required fields
          </p>
        </form>
      </main>
    </div>
  );
}
