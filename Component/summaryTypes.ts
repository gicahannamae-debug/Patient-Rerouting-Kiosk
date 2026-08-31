'use client';

export type PatientStatus = "new" | "returning" | "referred";
export type TicketType = "consultation" | "lab" | "followup" | "ancillary" | "emergency";

export type TicketMetadata = {
  serviceTitle: string;
  ticketType: TicketType;
  badgeColor: string;
};

export type SummaryScreenProps = {
  patientName?: string;
  age?: string | number;
  gender?: string;
  patientAddress?: string;
  pwdStatus?: string;
  bpSys?: string | number;
  bpDia?: string | number;
  hr?: string | number;
  spo2?: string | number;
  temperature?: string | number;
  complaints?: string;
  clinic?: string;
  destination?: string;
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
  ticketMetadata?: TicketMetadata;
};
