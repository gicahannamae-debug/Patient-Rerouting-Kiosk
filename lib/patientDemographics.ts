export type PatientAgeGroup = "INFANT" | "CHILD" | "ADOLESCENT" | "ADULT" | "SENIOR";
export type PatientAgeUnit = "months" | "years";

export interface PatientDemographics {
  firstName: string;
  lastName: string;
  age: number;
  ageDisplay: string;
  ageGroup: PatientAgeGroup;
  gender: "MALE" | "FEMALE";
  contactNumber: string;
}

export function classifyPatientAge(value: number, unit: PatientAgeUnit): {
  age: number;
  ageDisplay: string;
  ageGroup: PatientAgeGroup;
} {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Age must be a non-negative whole number.");
  }

  if (unit === "months") {
    if (value > 11) throw new Error("Age in months must be between 0 and 11.");
    return {
      age: 0,
      ageDisplay: `${value} ${value === 1 ? "month" : "months"}`,
      ageGroup: "INFANT",
    };
  }

  if (value < 1 || value > 150) {
    throw new Error("Age in years must be between 1 and 150.");
  }

  return {
    age: value,
    ageDisplay: `${value} ${value === 1 ? "year" : "years"}`,
    ageGroup:
      value <= 11 ? "CHILD"
        : value <= 17 ? "ADOLESCENT"
          : value <= 59 ? "ADULT"
            : "SENIOR",
  };
}
