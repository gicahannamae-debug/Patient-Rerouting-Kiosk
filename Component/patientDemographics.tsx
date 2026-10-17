'use client';

import { useState, type FormEvent } from "react";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import { classifyPatientAge, type PatientAgeUnit, type PatientDemographics } from "@/lib/patientDemographics";

interface PatientDemographicsFormProps {
  language: KioskLanguage;
  onSubmit: (patient: PatientDemographics) => void;
  onBack: () => void;
}

const inputClass =
  "w-full rounded-xl border border-cyan-200 bg-white px-4 py-3 text-lg text-cyan-950 shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-300";
const labelClass = "mb-1 block text-sm font-bold text-cyan-50 sm:text-base";

const AGE_GROUP_LABELS = {
  INFANT: "Infant",
  CHILD: "Child",
  ADOLESCENT: "Adolescent",
  ADULT: "Adult",
  SENIOR: "Senior",
} as const;

export default function PatientDemographicsForm({
  language,
  onSubmit,
  onBack,
}: PatientDemographicsFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit] = useState<PatientAgeUnit>("years");
  const [gender, setGender] = useState<PatientDemographics["gender"] | "">("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState("");

  const isEnglish = language === "en";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const age = Number(ageValue);
    if (!Number.isInteger(age) || ageValue.trim() === "") {
      setError(isEnglish ? "Enter the patient's age as a whole number." : "Isulod ang edad sa pasyente isip tibuok nga numero.");
      return;
    }
    if ((ageUnit === "months" && (age < 0 || age > 11)) || (ageUnit === "years" && (age < 1 || age > 150))) {
      setError(isEnglish ? "Enter an age from 0–11 months or 1–150 years." : "Isulod ang edad nga 0–11 ka bulan o 1–150 ka tuig.");
      return;
    }
    if (!gender) {
      setError(isEnglish ? "Select the patient's sex." : "Pilia ang sekso sa pasyente.");
      return;
    }

    const normalizedContact = contactNumber.trim();
    const digitCount = normalizedContact.replace(/\D/g, "").length;
    if (!/^[+()\d\s.-]+$/.test(normalizedContact) || digitCount < 7 || digitCount > 15) {
      setError(isEnglish ? "Enter a valid contact number with 7–15 digits." : "Isulod ang hustong numero sa kontak nga adunay 7–15 ka numero.");
      return;
    }

    const ageDetails = classifyPatientAge(age, ageUnit);
    onSubmit({
      firstName: firstName.trim().toUpperCase(),
      lastName: lastName.trim().toUpperCase(),
      ...ageDetails,
      gender,
      contactNumber: normalizedContact,
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 px-4 py-8 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl space-y-6 rounded-3xl border border-cyan-400/30 bg-slate-900/90 p-6 text-white shadow-2xl sm:p-10"
      >
        <header>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">BICA · OPD</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {isEnglish ? "Patient Details" : "Impormasyon sa Pasyente"}
          </h1>
          <p className="mt-2 text-base text-cyan-100 sm:text-lg">
            {isEnglish ? "Please enter these details before the safety check." : "Palihog isulod kining mga detalye sa dili pa ang pagsusi sa kaluwasan."}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="basic-first-name">
              {isEnglish ? "First name" : "Ngalan"}
            </label>
            <input
              id="basic-first-name"
              required
              autoComplete="given-name"
              maxLength={100}
              value={firstName}
              onChange={event => setFirstName(event.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ""))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="basic-last-name">
              {isEnglish ? "Last name" : "Apelyido"}
            </label>
            <input
              id="basic-last-name"
              required
              autoComplete="family-name"
              maxLength={100}
              value={lastName}
              onChange={event => setLastName(event.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ""))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="basic-age">
              {isEnglish ? "Age" : "Edad"}
            </label>
            <div className="flex gap-2">
              <input
                id="basic-age"
                required
                type="number"
                min={ageUnit === "months" ? 0 : 1}
                max={ageUnit === "months" ? 11 : 150}
                step="1"
                inputMode="numeric"
                value={ageValue}
                onChange={event => setAgeValue(event.target.value)}
                className={inputClass}
              />
              <select
                aria-label={isEnglish ? "Age unit" : "Yunit sa edad"}
                value={ageUnit}
                onChange={event => {
                  setAgeUnit(event.target.value as PatientAgeUnit);
                  setAgeValue("");
                }}
                className={`${inputClass} max-w-36`}
              >
                <option value="years">{isEnglish ? "Years" : "Tuig"}</option>
                <option value="months">{isEnglish ? "Months" : "Bulan"}</option>
              </select>
            </div>
            {ageValue !== "" &&
              Number.isInteger(Number(ageValue)) &&
              ((ageUnit === "months" && Number(ageValue) >= 0 && Number(ageValue) <= 11) ||
                (ageUnit === "years" && Number(ageValue) >= 1 && Number(ageValue) <= 150)) && (
              <p className="mt-1 text-sm text-cyan-200">
                {AGE_GROUP_LABELS[classifyPatientAge(Number(ageValue), ageUnit).ageGroup]}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="basic-contact">
              {isEnglish ? "Contact number" : "Numero sa kontak"}
            </label>
            <input
              id="basic-contact"
              required
              type="tel"
              autoComplete="tel"
              maxLength={20}
              value={contactNumber}
              onChange={event => setContactNumber(event.target.value.replace(/[^+()\d\s.-]/g, ""))}
              className={inputClass}
            />
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>{isEnglish ? "Sex" : "Sekso"}</legend>
          <div className="flex flex-wrap gap-3">
            {(["MALE", "FEMALE"] as const).map(value => (
              <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-cyan-200/40 px-4 py-2 text-lg">
                <input
                  type="radio"
                  name="basic-sex"
                  required
                  value={value}
                  checked={gender === value}
                  onChange={() => setGender(value)}
                  className="h-5 w-5 accent-yellow-400"
                />
                {isEnglish ? (value === "MALE" ? "Male" : "Female") : (value === "MALE" ? "Lalaki" : "Babaye")}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-xl bg-red-950 px-4 py-3 font-semibold text-red-100">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <button
            type="button"
            onClick={onBack}
            className="min-h-14 rounded-2xl border-2 border-cyan-100/60 px-5 py-4 text-lg font-bold text-cyan-50 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300"
          >
            {isEnglish ? "Back to Welcome" : "Balik sa Welcome"}
          </button>
          <button
            type="submit"
            className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-600 px-6 py-4 text-xl font-black text-white shadow-lg transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300"
          >
            {isEnglish ? "Continue to Safety Check" : "Padayon sa Pagsusi sa Kaluwasan"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </main>
  );
}
