'use client';

export type PatientStatus = "new" | "returning" | "referred";

export type SummaryScreenProps = {
  patientName?: string;
  age?: string | number;
  gender?: string;
  bpSys?: string | number;
  bpDia?: string | number;
  hr?: string | number;
  spo2?: string | number;
  temperature?: string | number;
  complaints?: string;
  clinic?: string;
  queueCode?: string;
  date?: string;
  time?: string;
  patientStatus?: PatientStatus;
  referralFrom?: string;
  referralDoctor?: string;
  referralDate?: string;
  referralPurpose?: string;
  referralFormNo?: string;
  referralDiagnosis?: string;
};
