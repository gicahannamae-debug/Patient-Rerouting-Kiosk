'use client'
import { useRef, useState } from "react";
import CcRedflag, { type EmergencyAlert } from "@/Component/ccRedflag";
import PatientInformation from "@/Component/patientInformation";
import PrimaryClinics, { type ClinicOption, type PrimaryClinicsPayload } from "@/Component/primaryClinics";
import VsTemperature from "@/Component/vsTemperature";
import VsBloodpressure from "@/Component/vsBloodpressure";
import VsOximeter from "@/Component/vsOximeter";
import SummaryScreen from "@/Component/summaryScreen";
import type { TicketMetadata } from "@/lib/summaryTypes";
import { createQueuePatient } from "@/lib/patientRecords";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import type { PatientAgeGroup, PatientDemographics } from "@/lib/patientDemographics";

// Flow: early patient details → safety → vitals → registration → complaints → ticket
type AppStep = "safety" | "patientForm" | "vitals" | "primaryClinics" | "summary";
type VitalStage = "oximetry" | "bp" | "temperature";

type PatientInfo = {
  lastName: string;
  firstName: string;
  middleName: string;
  pwdStatus: string;
  pregnant: boolean;
  birthdate: string;
  age: string;
  ageDisplay: string;
  ageGroup: PatientAgeGroup | "";
  gender: string;
  contactNumber: string;
  address: string;
  birthplace: string;
  religion: string;
  civilStatus: string;
  appointmentStatus: string;
};

type VitalData = {
  bpSys: string;
  bpDia: string;
  hr: string;
  spo2: string;
  temperature: string;
};

type TriageSelection = {
  groupLabel: string;
  ccLabel: string;
  ccLabelCebuano: string;
  subLabel: string;
  clinic: ClinicOption | null;
  systemValue: string;
  answers: Record<string, string | string[] | number>;
};

type VitalPayload = Partial<VitalData> & {
  queue: "ER" | "URGENT" | "NORMAL";
  color: "red" | "orange" | "green" | "yellow";
  priorityOverride: boolean;
};

type VitalAssessment = Pick<VitalPayload, "queue" | "color" | "priorityOverride">;
type VitalAssessmentMap = Partial<Record<VitalStage, VitalAssessment>>;
type QueueCategory = "EMERGENCY" | "URGENT" | "PRIORITY" | "REGULAR";
const CATEGORY_RANK: Record<QueueCategory, number> = { REGULAR: 0, PRIORITY: 1, URGENT: 2, EMERGENCY: 3 };

const EMPTY_PATIENT: PatientInfo = {
  lastName: "", firstName: "", middleName: "", pwdStatus: "", pregnant: false, birthdate: "", age: "",
  ageDisplay: "", ageGroup: "", gender: "", contactNumber: "", address: "", birthplace: "",
  religion: "", civilStatus: "", appointmentStatus: "",
};
const EMPTY_VITALS: VitalData = { bpSys: "", bpDia: "", hr: "", spo2: "", temperature: "" };
const EMPTY_TRIAGE: TriageSelection = {
  groupLabel: "", ccLabel: "", ccLabelCebuano: "", subLabel: "", clinic: null, systemValue: "", answers: {},
};

// Only consultation tickets exist now
const TICKET_METADATA: TicketMetadata = {
  serviceTitle: "MEDICAL CONSULTATION",
  ticketType: "consultation",
  badgeColor: "bg-cyan-600 text-white",
};

const clinicDestinations: Record<ClinicOption | "Emergency Dept.", string> = {
  "General Surgery": "Surgical Services Wing",
  "Internal Medicine": "Internal Medicine Unit",
  "OB-GYNE": "OB-GYNE Clinic",
  Pediatrics: "Pediatrics Wing",
  "Emergency Dept.": "Emergency Department",
};

const getCurrentDate = () => new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
const getCurrentTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const readMeasurement = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

function describeCriticalVitals(vitals: VitalData, language: KioskLanguage): string {
  const findings: string[] = [];
  const spo2 = readMeasurement(vitals.spo2, 0, 100);
  const heartRate = readMeasurement(vitals.hr, 30, 250);
  const systolic = readMeasurement(vitals.bpSys, 60, 300);
  const diastolic = readMeasurement(vitals.bpDia, 40, 200);
  const temperature = readMeasurement(vitals.temperature, 30, 45);
  const low = language === "en" ? "critically low" : "kritikal nga ubos";
  const high = language === "en" ? "critically high" : "kritikal nga taas";

  if (spo2 !== null && spo2 < 90) findings.push(`SpO2 ${spo2}% (${low}, below 90%)`);
  if (heartRate !== null && heartRate < 50) findings.push(`HR ${heartRate} bpm (${low}, below 50 bpm)`);
  if (heartRate !== null && heartRate > 120) findings.push(`HR ${heartRate} bpm (${high}, above 120 bpm)`);
  if (systolic !== null && diastolic !== null) {
    if (systolic < 90 || diastolic < 60) findings.push(`BP ${systolic}/${diastolic} mmHg (${low}, SBP below 90 or DBP below 60)`);
    else if (systolic > 180 || diastolic > 120) findings.push(`BP ${systolic}/${diastolic} mmHg (${high}, SBP above 180 or DBP above 120)`);
  }
  if (temperature !== null && temperature < 35) findings.push(`Temp ${temperature.toFixed(1)} C (${low}, below 35.0 C)`);
  if (temperature !== null && temperature >= 38) findings.push(`Temp ${temperature.toFixed(1)} C (${high}, 38.0 C or higher)`);

  const intro = language === "en" ? "Critical vital readings" : "Kritikal nga vital sign";
  return findings.length > 0 ? `${intro}: ${findings.join("; ")}.` : intro;
}
const toTriageVitals = (v: VitalData) => ({
  temp: readMeasurement(v.temperature, 30, 45) ?? undefined,
  spo2: readMeasurement(v.spo2, 0, 100) ?? undefined,
  systolic: readMeasurement(v.bpSys, 60, 300) ?? undefined,
  diastolic: readMeasurement(v.bpDia, 40, 200) ?? undefined,
});

export default function Home() {
  const [step, setStep] = useState<AppStep>("safety");
  const [language, setLanguage] = useState<KioskLanguage>("en");

  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | "Emergency Dept." | null>(null);
  const [vitalStage, setVitalStage] = useState<VitalStage>("oximetry");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(EMPTY_PATIENT);
  const [vitals, setVitals] = useState<VitalData>(EMPTY_VITALS);
  const [vitalAssessments, setVitalAssessments] = useState<VitalAssessmentMap>({});
  const [isCritical, setIsCritical] = useState(false);
  const [triageSelection, setTriageSelection] = useState<TriageSelection>(EMPTY_TRIAGE);
  const [queueCode, setQueueCode] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [queueError, setQueueError] = useState("");
  const emergencyQueueCreation = useRef(false);
  const criticalTicketCounter = useRef(0);

  const resetFormState = () => {
    setLanguage("en");
    setSelectedClinic(null);
    setVitalStage("oximetry");
    setPatientInfo(EMPTY_PATIENT);
    setVitals(EMPTY_VITALS);
    setVitalAssessments({});
    setIsCritical(false);
    setTriageSelection(EMPTY_TRIAGE);
    setQueueCode("");
    setDestination("");
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setQueueError("");
  };

  const handleKioskLogout = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("bica_emergency");
    resetFormState();
    setStep("safety");
  };

  // ── Patient details and safety check ────────────────────────────────────────
  const handlePatientDemographics = (demographics: PatientDemographics) => {
    setPatientInfo(previous => ({
      ...previous,
      firstName: demographics.firstName,
      lastName: demographics.lastName,
      age: String(demographics.age),
      ageDisplay: demographics.ageDisplay,
      ageGroup: demographics.ageGroup,
      gender: demographics.gender,
      contactNumber: demographics.contactNumber,
    }));
  };

  const handleSafetyProceed = () => {
    setVitalStage("oximetry");
    setStep("vitals");
  };

  const handleEmergencyAlert = async (alert: EmergencyAlert): Promise<string> => {
    console.log("[BICA] handleEmergencyAlert called", alert);
    const patient = alert.patient;
    const ticket = await createQueuePatient({
      clinic: "Emergency Dept.",
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      age: patient.age,
      ageDisplay: patient.ageDisplay,
      ageGroup: patient.ageGroup,
      sex: patient.gender === "MALE" ? "M" : "F",
      contactNumber: patient.contactNumber,
      category: "EMERGENCY",
      emergencySource: "RED_FLAG",
      complaint: {
        complaint: alert.symptom,
        duration: "At assessment",
        severity: "Emergency",
        location: alert.clinicalCategory,
      },
      vitals: { bp: null, hr: null, temp: null, spo2: null },
      
    });
      console.log("[BICA] Emergency patient created:", {
    patientId: ticket.id,
    ticketCode: ticket.ticketCode,
    queueNumber: ticket.queueNumber,
  });
    return ticket.ticketCode;
  };

  // ── Registration form (after vital signs) ───────────────────────────────────
  const handlePatientFormProceed = (values?: PatientInfo) => {
    if (values) {
      setPatientInfo(previous => ({
        ...values,
        age: previous.age || values.age,
        ageDisplay: previous.ageDisplay || values.age,
        ageGroup: previous.ageGroup,
        contactNumber: previous.contactNumber,
      }));
    }
    setStep("primaryClinics");
  };

  const isPriorityPatient = () =>
    patientInfo.pwdStatus === "Yes, PWD" ||
    patientInfo.ageGroup === "SENIOR" ||
    patientInfo.pregnant;


  // Automatically route patients with critical vital signs to the Emergency Department
  // and create their patient record with a Firestore-generated emergency queue ticket.   
  const createQueueTicket = async (
    data: VitalData,
    payload?: PrimaryClinicsPayload,
    criticalOverride = false
  ) => {
    const assessments = Object.values(vitalAssessments);

    const critical =
      criticalOverride ||
      isCritical ||
      assessments.some(item => item?.queue === "ER");

    const hasBorderline = assessments.some(item => item?.color === "orange");
    const hasPriorityOverride =
      isPriorityPatient() ||
      assessments.some(item => item?.priorityOverride);

    const vitalCategory: QueueCategory = critical
      ? "EMERGENCY"
      : hasBorderline
        ? "URGENT"
        : hasPriorityOverride
          ? "PRIORITY"
          : "REGULAR";

    const complaintCategory: QueueCategory = payload?.triage_level ?? "REGULAR";

    const category: QueueCategory = critical
      ? "EMERGENCY"
      : CATEGORY_RANK[complaintCategory] > CATEGORY_RANK[vitalCategory]
        ? complaintCategory
        : vitalCategory;

    // Critical patients are automatically routed to the Emergency Department.
    const clinic = critical ? "Emergency Dept." : payload?.clinic;

    if (!clinic) {
      throw new Error("Select a clinic before creating the patient ticket.");
    }

    const name = [
      patientInfo.firstName,
      patientInfo.middleName,
      patientInfo.lastName,
    ]
      .map(value => value.trim())
      .filter(Boolean)
      .join(" ");

    if (
      !name ||
      !patientInfo.ageGroup ||
      !patientInfo.ageDisplay ||
      !patientInfo.contactNumber ||
      !patientInfo.gender
    ) {
      throw new Error(
        "Patient details are incomplete. Please return to Patient Details before creating a ticket."
      );
    }

    // Create the patient record and allocate a real queue number.
    const ticket = await createQueuePatient({
      clinic,
      name,
      age: Number(patientInfo.age),
      ageDisplay: patientInfo.ageDisplay,
      ageGroup: patientInfo.ageGroup,
      sex: patientInfo.gender === "MALE" ? "M" : "F",
      contactNumber: patientInfo.contactNumber,
      category,

      complaint: critical
        ? {
          complaint: "Automatic escalation from a critical vital sign",
          duration: "At assessment",
          severity: "Emergency",
          location: assessments
            .map(item => item?.color)
            .filter(Boolean)
            .join(", "),
        }
        : payload
          ? {
            complaint: payload.cc_label.slice(0, 180),
            duration: `Triage: ${payload.triage_level}`,
            severity: (payload.severity_label || "N/A").slice(0, 40),
            location: `${payload.summary_text} | ${payload.triage_reasons.join("; ")}`.slice(0, 500),
          }
          : {
            complaint: "Automatic escalation from a critical vital sign",
            duration: "At assessment",
            severity: "Emergency",
            location: assessments
              .map(item => item?.color)
              .filter(Boolean)
              .join(", "),
          },

      vitals: {
        bp: data.bpSys && data.bpDia
          ? `${data.bpSys}/${data.bpDia}`
          : null,
        hr: readMeasurement(data.hr, 30, 250),
        temp: readMeasurement(data.temperature, 30, 45),
        spo2: readMeasurement(data.spo2, 0, 100),
      },
    }
    );

    const arrivedAt = new Date(ticket.arrivedAt);

    setIsCritical(critical);
    setSelectedClinic(clinic);
    setDestination(critical ? "" : clinicDestinations[clinic]);

    // Use the actual ticket code returned by Firestore.
    // Example: ER-E-001
    setQueueCode(ticket.ticketCode);

    setTriageSelection(
      critical
        ? {
          ...EMPTY_TRIAGE,
          groupLabel: "Automatic vital-sign escalation",
          ccLabel: "Automatic vital-sign escalation",
          subLabel: "Automatic vital-sign escalation",
        }
        : payload
          ? {
            groupLabel: payload.group_label,
            ccLabel: payload.cc_label,
            ccLabelCebuano: payload.cc_label_cebuano,
            subLabel: payload.sub_label,
            clinic: payload.clinic,
            systemValue: payload.system_value,
            answers: payload.answers,
          }
          : EMPTY_TRIAGE
    );

    setDate(
      arrivedAt.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    );

    setTime(
      arrivedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setQueueError("");
    setStep("summary");
  };


  // ── Vitals ──────────────────────────────────────────────────────────────────
  const handleVitalProceed = (values: VitalPayload) => {
    const updatedVitals = { ...vitals, ...values };
    const assessment: VitalAssessment = {
      queue: values.queue,
      color: values.color,
      priorityOverride: values.priorityOverride,
    };
    const updatedAssessments = { ...vitalAssessments, [vitalStage]: assessment };
    setVitals(updatedVitals);
    setVitalAssessments(updatedAssessments);

    if (values.queue === "ER") {
      setIsCritical(true);
      if (!emergencyQueueCreation.current) {
        emergencyQueueCreation.current = true;
        setQueueError("");
        void createQueueTicket(updatedVitals, undefined, true)
          .catch(error => {
            console.error("Critical-vital ticket creation failed:", error);
            setQueueError(language === "en"
              ? "Please remain seated. A staff member will assist you shortly."
              : "Palihog magpabiling naglingkod. Motabang kanimo ang usa ka kawani sa dili madugay.");
          })
          .finally(() => {
            emergencyQueueCreation.current = false;
          });
      }
      return;
    }

    if (vitalStage === "oximetry") setVitalStage("bp");
    else if (vitalStage === "bp") setVitalStage("temperature");
    else setStep("patientForm");
  };

  // ── Header navigation ───────────────────────────────────────────────────────
  const handleNavigateStep = (targetStep: number) => {
    if (targetStep <= 1) {
      setStep("safety");
    } else if (targetStep <= 3) {
      setStep("patientForm");
    } else if (targetStep === 4) {
      setVitalStage("oximetry");
      setStep("vitals");
    } else if (targetStep === 5) {
      setStep("patientForm");
    } else if (targetStep === 6) {
      setStep("primaryClinics");
    }
  };

  const handleNavigateVitalPart = (part: number) => {
    setVitalStage(part === 1 ? "oximetry" : part === 2 ? "bp" : "temperature");
    setStep("vitals");
  };

  const handlePrimaryClinicsProceed = async (payload: PrimaryClinicsPayload) => {
    await createQueueTicket(vitals, payload);
  };

  const handleFinish = () => {
    resetFormState();
    setStep("safety");
  };

  const patientName = [patientInfo.firstName, patientInfo.middleName, patientInfo.lastName]
    .filter(Boolean)
    .join(" ");
  const complaints = language === "ceb"
    ? triageSelection.ccLabelCebuano || "Wala pay napili nga pangunang reklamo"
    : triageSelection.subLabel || triageSelection.ccLabel || triageSelection.groupLabel || "No chief complaint selected";
  const clinic = selectedClinic ?? triageSelection.clinic ?? "";

  return (
    <div
      className="min-h-screen w-full relative"
    >
      {queueError && (
        <div role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto max-w-2xl rounded-xl border border-cyan-400 bg-cyan-950 p-4 text-center font-semibold text-white shadow-xl">
          {queueError}
        </div>
      )}
      <div className="relative">
        {step === "safety" && (
          <CcRedflag
            language={language}
            onLanguageChange={setLanguage}
            onLogout={handleKioskLogout}
            onProceed={handleSafetyProceed}
            onPatientDemographics={handlePatientDemographics}
            onNavigateStep={handleNavigateStep}
            onEmergencyAlert={handleEmergencyAlert}
          />
        )}

        {step === "patientForm" && (
          <PatientInformation
            language={language}
            onLogout={handleKioskLogout}
            initialValues={patientInfo}
            onProceed={handlePatientFormProceed}
            onNavigateStep={handleNavigateStep}
          />
        )}

        {step === "vitals" && vitalStage === "bp" && (
          <VsBloodpressure
            language={language}
            isPriorityPatient={isPriorityPatient()}
            initialSystolic={vitals.bpSys}
            initialDiastolic={vitals.bpDia}
            part={2}
            onLogout={handleKioskLogout}
            onProceed={handleVitalProceed}
            onNavigateStep={handleNavigateStep}
            onNavigateVitalPart={handleNavigateVitalPart}
          />
        )}
        {step === "vitals" && vitalStage === "oximetry" && (
          <VsOximeter
            language={language}
            isPriorityPatient={isPriorityPatient()}
            initialSpo2={vitals.spo2}
            initialHeartRate={vitals.hr}
            onLogout={handleKioskLogout}
            onProceed={handleVitalProceed}
            onNavigateStep={handleNavigateStep}
            onNavigateVitalPart={handleNavigateVitalPart}
          />
        )}
        {step === "vitals" && vitalStage === "temperature" && (
          <VsTemperature
            language={language}
            isPriorityPatient={isPriorityPatient()}
            initialTemperature={vitals.temperature}
            onLogout={handleKioskLogout}
            onProceed={handleVitalProceed}
            onNavigateStep={handleNavigateStep}
            onNavigateVitalPart={handleNavigateVitalPart}
          />
        )}

        {step === "primaryClinics" && (
          <PrimaryClinics
            language={language}
            onLogout={handleKioskLogout}
            onProceed={handlePrimaryClinicsProceed}
            onNavigateStep={handleNavigateStep}
            onNavigateVitalPart={handleNavigateVitalPart}
          />
        )}

        {step === "summary" && (
          <SummaryScreen
            language={language}
            patientName={patientName}
            age={patientInfo.ageDisplay || patientInfo.age}
            ageGroup={patientInfo.ageGroup}
            gender={patientInfo.gender}
            contactNumber={patientInfo.contactNumber}
            patientAddress={patientInfo.address}
            pwdStatus={patientInfo.pwdStatus}
            bpSys={vitals.bpSys}
            bpDia={vitals.bpDia}
            hr={vitals.hr}
            spo2={vitals.spo2}
            temperature={vitals.temperature}
            complaints={isCritical ? describeCriticalVitals(vitals, language) : complaints}
            clinic={clinic}
            destination={destination}
            queueCode={queueCode}
            isCritical={isCritical}
            date={date}
            time={time}
            patientStatus="new"
            referralFrom=""
            referralDoctor=""
            referralDate=""
            referralPurpose=""
            referralDiagnosis=""
            ticketMetadata={TICKET_METADATA}
            onLogout={handleKioskLogout}
            onNavigateStep={handleNavigateStep}
            onNavigateVitalPart={handleNavigateVitalPart}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}