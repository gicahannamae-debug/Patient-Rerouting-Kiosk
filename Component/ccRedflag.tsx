'use client';
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import PatientDemographicsForm from "@/Component/patientDemographics";
import type { PatientDemographics } from "@/lib/patientDemographics";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClinicName = "OB-GYN" | "Internal Medicine" | "Surgery" | "Pediatrics";

interface Experience {
  text: string;
  textCeb: string;
  clinics: ClinicName[];
}

interface RedFlagCategory {
  id: string;
  name: string;
  nameCeb: string;
  clinical: string;
  experiences: Experience[];
}

/** Payload sent to the ER dashboard the moment an emergency is detected */
export interface EmergencyAlert {
  ticketNumber: string;
  symptom: string;
  patient: PatientDemographics;
  category: string;
  clinicalCategory: string;
  clinics: ClinicName[];
  createdAt: string; // ISO string
}

/** Payload handed to your thermal printer handler */
export interface EmergencyPrintPayload {
  symptom: string;
  ticketNumber: string;
  patient: PatientDemographics;
  /** JPEG data URL of the receipt (black & white, thermal width) */
  imageDataUrl: string;
}

interface CcRedflagProps {
  language: KioskLanguage;
  onLanguageChange: (language: KioskLanguage) => void;
  onLogout?: () => void;
  onNavigateStep?: (step: number) => void;
  /** Called when the patient answers "NONE apply" (no emergency) */
  onProceed?: () => void;
  onPatientDemographics: (patient: PatientDemographics) => void;
  /** Called IMMEDIATELY when an emergency is selected (before printing) */
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
  /** Send the receipt image to your thermal printer. If omitted, the image is
   *  printed through the browser (hidden iframe, 80mm page). */
  onPrintEmergencyTicket?: (payload: EmergencyPrintPayload) => void | Promise<void>;
  /** Called when the kiosk resets back to Welcome */
  onEmergencyDone?: () => void;
}

// ─── Safety check data (Emergency / ABCs only) ───────────────────────────────

const OBG: ClinicName = "OB-GYN";
const IM: ClinicName = "Internal Medicine";
const SUR: ClinicName = "Surgery";
const PED: ClinicName = "Pediatrics";

const EMERGENCY_TITLE = "Life-Threatening Emergencies (The ABCs)";


const CATEGORIES: RedFlagCategory[] = [
  {
    id: "airway",
    name: "Choking & Mouth/Throat Blockages",
    nameCeb: "Pagtuok ug Pagbabag sa Baba o Tutunlan",
    clinical: "A – Airway",
    experiences: [
      {
        clinics: [OBG, IM, SUR],
        text: "Cannot speak, cough, or breathe due to a blocked throat.",
        textCeb: "Dili makasulti, makaubo, o makaginhawa tungod sa pagbabag sa tutunlan.",
      },
      {
        clinics: [OBG, IM, SUR],
        text: "Severe allergic reaction causing the tongue or throat to swell shut.",
        textCeb: "Grabe nga reaksiyon sa alerhiya nga maoy hinungdan sa paghubag sa dila o tutunlan hangtod mababagan ang pagginhawa.",
      },
      {
        clinics: [PED],
        text: "Child swallowed an object (toy, coin) and is gasping or turning blue.",
        textCeb: "Nakalamoy ang bata og butang (sama sa dulaan o sensilyo) ug naglisod pagginhawa o nangasul ang panit.",
      },
      {
        clinics: [PED],
        text: "Child is choking and cannot make any sound or cry.",
        textCeb: "Natuk-an ang bata ug dili makahimo og tingog o makahilak.",
      },
    ],
  },
  {
    id: "breathing",
    name: "Severe Breathing Difficulty",
    nameCeb: "Grabe nga Kalisod sa Pagginhawa",
    clinical: "B – Breathing",
    experiences: [
      {
        clinics: [IM, SUR],
        text: "Sudden, severe shortness of breath or gasping for air.",
        textCeb: "Kalit ug grabeng kalisod sa pagginhawa o hangos nga pagpangita og hangin.",
      },
      {
        clinics: [IM, SUR],
        text: "Unable to speak a full sentence without stopping to breathe.",
        textCeb: "Dili makahuman og sulti sa usa ka tibuok nga sentence nga dili mohunong aron moginhawa.",
      },
      {
        clinics: [OBG],
        text: "Sudden, sharp chest pain with extreme shortness of breath during pregnancy.",
        textCeb: "Kalit ug tusok nga sakit sa dughan uban sa grabeng kalisod sa pagginhawa samtang nagmabdos.",
      },
      {
        clinics: [PED],
        text: "Child is breathing dangerously fast.",
        textCeb: "Delikado kaayo kapaspas ang pagginhawa sa bata.",
      },
      {
        clinics: [PED],
        text: "Child's ribs pull in tightly with each breath (sucking in under the chest).",
        textCeb: "Mokulob pag-ayo ang palibot sa gusok sa bata sa matag ginhawa, ilabi na sa ilawom sa dughan.",
      },
    ],
  },
  {
    id: "circulation",
    name: "Chest Pain & Severe Bleeding",
    nameCeb: "Sakit sa Dughan ug Grabeng Pagdugo",
    clinical: "C – Circulation",
    experiences: [
      {
        clinics: [IM],
        text: "Heavy, crushing chest pain or pressure spreading to the arm or jaw.",
        textCeb: "Grabe ug murag gipislit o gipugos nga sakit o kabug-at sa dughan nga mikaylap ngadto sa bukton o apapangig.",
      },
      {
        clinics: [IM],
        text: "Heart racing dangerously fast out of nowhere with dizziness.",
        textCeb: "Kalit nga kusog ug kapaspas nga pagpitik sa kasingkasing uban sa pagkalipong.",
      },
      {
        clinics: [OBG],
        text: "Heavy vaginal bleeding during pregnancy (soaking a menstrual pad in 1 hour).",
        textCeb: "Grabeng pagdugo gikan sa puwerta samtang nagmabdos (mabasa pag-ayo sa dugo ang usa ka menstrual pad sulod sa usa ka oras).",
      },
      {
        clinics: [OBG],
        text: "Sudden, gushing loss of blood.",
        textCeb: "Kalit ug kusog nga pag-agas sa dugo.",
      },
      {
        clinics: [PED],
        text: "Child is completely pale or blue around the lips.",
        textCeb: "Grabeng pamutla sa bata o pagkangulon sa palibot sa mga ngabil.",
      },
      {
        clinics: [PED],
        text: "Heavy bleeding from a deep wound that won't stop with pressure.",
        textCeb: "Grabeng pagdugo gikan sa lawom nga samad nga dili mohunong bisan pugngan o pisliton.",
      },
      {
        clinics: [SUR],
        text: "Blood is spurting heavily from a deep cut or severe injury.",
        textCeb: "Kusog nga nagbuswak ang dugo gikan sa lawom nga samad o grabeng kadaot.",
      },
      {
        clinics: [SUR],
        text: "Bleeding that does not stop after 10 minutes of direct pressure.",
        textCeb: "Pagdugo nga dili mohunong human pugngan o pisliton diretso sulod sa 10 minutos.",
      },
    ],
  },
];


const SAFETY_STEP_INDEX = 1;
const TICKET_STEP_INDEX = 7;

/** Seconds on the ticket screen before returning to Welcome */
const TICKET_SCREEN_SECONDS = 20;
const WELCOME_BACKGROUND = "/bg3.jpg";

const CLINIC_CODE: Record<ClinicName, string> = {
  "OB-GYN": "OB",
  "Internal Medicine": "IM",
  "Surgery": "SUR",
  "Pediatrics": "PED",
};

type ScreenStep = "welcome" | "demographics" | "safetyIntro" | "screening" | "emergency" | "erTicket";
type PrintStatus = "idle" | "generating" | "printing" | "printed" | "error";

// ─── Thermal receipt image ────────────────────────────────────────────────────
// 80mm paper = 576 dots wide. For 58mm paper use RECEIPT_WIDTH = 384 and
// PAPER_MM = "58mm".

const RECEIPT_WIDTH = 576;
const PAPER_MM = "80mm";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildReceiptImage(data: { symptom: string; ticketNumber: string; patient: PatientDemographics }, language: KioskLanguage): string {
  const W = RECEIPT_WIDTH;
  const PAD = 24;
  const FONT = '"Courier New", monospace';

  const tall = document.createElement("canvas");
  tall.width = W;
  tall.height = 2400;
  const ctx = tall.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, tall.height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";

  let y = PAD;

  const centered = (str: string, size: number, weight = "bold") => {
    ctx.textAlign = "center";
    ctx.font = `${weight} ${size}px ${FONT}`;
    for (const line of wrapText(ctx, str, W - PAD * 2)) {
      ctx.fillText(line, W / 2, y);
      y += size * 1.25;
    }
  };

  const dashed = () => {
    y += 8;
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 16;
  };

  // Header
  centered(language === "en" ? "Welcome to Bica" : "Maayong pag-abot sa BICA", 48);
  centered(language === "en" ? "Emergency Triage Slip" : "Papel sa Emergency Triage", 24, "normal");
  centered(language === "en" ? "OPD Kiosk" : "Kiosk sa OPD", 24, "normal");
  dashed();

  // Date / time row
  const now = new Date();
  ctx.font = `normal 24px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(`${language === "en" ? "DATE" : "PETSA"}: ${now.toLocaleDateString()}`, PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(
    `${language === "en" ? "TIME" : "ORAS"}: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    W - PAD,
    y
  );
  y += 34;
  dashed();

  ctx.textAlign = "left";
  ctx.font = `normal 24px ${FONT}`;
  ctx.fillText(language === "en" ? "PATIENT DETAILS" : "IMPORMASYON SA PASYENTE", PAD, y);
  y += 32;
  const patientRows = [
    [language === "en" ? "NAME" : "NGALAN", `${data.patient.firstName} ${data.patient.lastName}`],
    [language === "en" ? "AGE" : "EDAD", `${data.patient.ageDisplay} · ${data.patient.ageGroup}`],
    [language === "en" ? "SEX" : "SEKSO", data.patient.gender],
    [language === "en" ? "CONTACT" : "KONTAK", data.patient.contactNumber],
  ];
  for (const [label, value] of patientRows) {
    ctx.font = `normal 24px ${FONT}`;
    ctx.fillText(`${label}:`, PAD, y);
    y += 30;
    for (const line of wrapText(ctx, value, W - PAD * 2)) {
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(line, PAD + 12, y);
      y += 30;
    }
  }
  dashed();

  // Emergency banner (white on black, since thermal paper has no red)
  const bannerH = 64;
  ctx.fillStyle = "#000";
  ctx.fillRect(PAD, y, W - PAD * 2, bannerH);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `bold 38px ${FONT}`;
  ctx.fillText(language === "en" ? "*** EMERGENCY ***" : "*** EMERHENSIYA ***", W / 2, y + 12);
  ctx.fillStyle = "#000";
  y += bannerH + 16;

  // Complaint
  ctx.textAlign = "left";
  ctx.font = `normal 24px ${FONT}`;
  ctx.fillText(language === "en" ? "CHIEF COMPLAINT:" : "PANGUNAHING REKLAMO:", PAD, y);
  y += 32;
  centered(data.symptom, 30);
  dashed();

  // Destination
  centered(language === "en" ? "DESTINATION" : "PADULNGAN", 22, "normal");
  centered(language === "en" ? "EMERGENCY ROOM (ER)" : "EMERGENCY ROOM (ER)", 36);
  y += 8;
  centered(language === "en" ? "PRIORITY QUEUE CODE" : "KODE SA PRAYORIDAD SA PILA", 22, "normal");

  // Ticket number, shrunk to fit the paper width
  let size = 84;
  ctx.font = `bold ${size}px ${FONT}`;
  while (ctx.measureText(data.ticketNumber).width > W - PAD * 2 && size > 30) {
    size -= 2;
    ctx.font = `bold ${size}px ${FONT}`;
  }
  centered(data.ticketNumber, size);
  dashed();

  {/* FOOTER */ }
  <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
    BICA Outpatient Self-Service Kiosk
  </footer>

  // Crop to content (+ bottom margin so the cutter doesn't clip the text)
  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.ceil(y + PAD + 48);
  const octx = out.getContext("2d")!;
  octx.fillStyle = "#fff";
  octx.fillRect(0, 0, out.width, out.height);
  octx.drawImage(tall, 0, 0);

  return out.toDataURL("image/jpeg", 1.0);
}

/** Browser print of the receipt image (works with a thermal printer installed
 *  as a system printer; run Chrome with --kiosk-printing to skip the dialog). */
function printImage(dataUrl: string): Promise<void> {
  return new Promise(resolve => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow!;
    const doc = win.document;
    doc.open();
    doc.write(
      `<!doctype html><html><head><style>
        @page { size: ${PAPER_MM} auto; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        img { width: ${PAPER_MM}; display: block; }
      </style></head><body><img id="receipt" src="${dataUrl}"></body></html>`
    );
    doc.close();

    const img = doc.getElementById("receipt") as HTMLImageElement;
    const go = () => {
      win.focus();
      win.print();
      setTimeout(() => {
        iframe.remove();
        resolve();
      }, 1000);
    };
    if (img.complete) go();
    else img.onload = go;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CcRedflag({
  language,
  onLanguageChange,
  onLogout,
  onNavigateStep,
  onProceed,
  onPatientDemographics,
  onEmergencyAlert,
  onPrintEmergencyTicket,
  onEmergencyDone,
}: CcRedflagProps) {
  const [screenStep, setScreenStep] = useState<ScreenStep>("welcome");
  const [patientDetails, setPatientDetails] = useState<PatientDemographics | null>(null);
  const [alertData, setAlertData] = useState<{ symptom: string; ticketNumber: string; patient: PatientDemographics | null }>({
    symptom: "",
    ticketNumber: "",
    patient: null,
  });

  const [view, setView] = useState<"categories" | "experiences">("categories");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintStatus>("idle");
  const printedFor = useRef<string | null>(null);

  const selectedCategory = CATEGORIES.find(c => c.id === categoryId) ?? null;


  // ADDED 10-14-2026


  const experienceGroups = selectedCategory
  ? Object.values(
      selectedCategory.experiences.reduce<
        Record<
          string,
          { clinics: ClinicName[]; experiences: Experience[] }
        >
      >((groups, exp) => {
        const key = exp.clinics.join("|");

        if (!groups[key]) {
          groups[key] = {
            clinics: exp.clinics,
            experiences: [],
          };
        }

        groups[key].experiences.push(exp);
        return groups;
      }, {})
    )
  : [];

  //END OF ADDED 10-14-2026

  // ── Printing ────────────────────────────────────────────────────────────────

  const doPrint = async (url: string, data: { symptom: string; ticketNumber: string; patient: PatientDemographics }) => {
    try {
      setPrintStatus("printing");
      if (onPrintEmergencyTicket) {
        await onPrintEmergencyTicket({ ...data, imageDataUrl: url });
      } else {
        await printImage(url);
      }
      setPrintStatus("printed");
    } catch {
      setPrintStatus("error");
    }
  };

  // Auto: build the receipt image, show the preview, then print once
  useEffect(() => {
    if (screenStep !== "erTicket") return;
    if (!alertData.ticketNumber || !alertData.patient) return;
    if (printedFor.current === alertData.ticketNumber) return;
    printedFor.current = alertData.ticketNumber;
    const ticketData = { ...alertData, patient: alertData.patient };

    (async () => {
      try {
        setPrintStatus("generating");
        const url = buildReceiptImage(ticketData, language);
        setReceiptUrl(url);
        // let the preview paint before the print dialog/handler takes over
        await new Promise(r => setTimeout(r, 900));
        await doPrint(url, ticketData);
      } catch {
        setPrintStatus("error");
      }
    })();
  }, [screenStep, alertData, language]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const resetScreening = () => {
    setView("categories");
    setCategoryId(null);
  };

  const handleSelectCategory = (id: string) => {
    setCategoryId(id);
    setView("experiences");
  };

  const handleSelectExperience = (exp: Experience) => {
    if (!selectedCategory || !patientDetails) return;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const clinicTag = exp.clinics.map(c => CLINIC_CODE[c]).join("/");
    const ticketNumber = `ER-${clinicTag}-${randomNum}`;

    setAlertData({ symptom: exp.text, ticketNumber, patient: patientDetails });
    setScreenStep("emergency");

    if (typeof window !== "undefined") {
      sessionStorage.setItem("bica_emergency", JSON.stringify({ symptom: exp.text, ticketNumber }));
    }

    // Notify the ER dashboard right away (do NOT wait for printing)
    onEmergencyAlert?.({
      ticketNumber,
      symptom: exp.text,
      patient: patientDetails,
      category: selectedCategory.name,
      clinicalCategory: selectedCategory.clinical,
      clinics: exp.clinics,
      createdAt: new Date().toISOString(),
    });
  };

  const handleNone = () => {
    onProceed?.();
  };

  const handlePrevious = () => {
    setView("categories");
    setCategoryId(null);
  };

  const handleReset = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bica_emergency");
    }
    printedFor.current = null;
    setReceiptUrl(null);
    setPrintStatus("idle");
    setAlertData({ symptom: "", ticketNumber: "", patient: null });
    resetScreening();
    setScreenStep("welcome");
    onEmergencyDone?.();
  };

  const handleNavigateStep = (step: number) => {
    if (step === 0) {
      resetScreening();
      setAlertData({ symptom: "", ticketNumber: "", patient: null });
      setScreenStep("welcome");
      return;
    }
    onNavigateStep?.(step);
  };

  // Auto-return to Welcome after the ticket screen has been up for N seconds
  useEffect(() => {
    if (screenStep !== "erTicket") return;
    const timer = setTimeout(handleReset, TICKET_SCREEN_SECONDS * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenStep]);

  // ── Progress indicator state ────────────────────────────────────────────────

  const activeStep =
    screenStep === "welcome"
      ? 0
      : screenStep === "erTicket"
        ? TICKET_STEP_INDEX
        : SAFETY_STEP_INDEX;

  const currentPart = view === "experiences" ? 2 : 1;

  const statusText: Record<PrintStatus, string> = {
    idle: "",
    generating: language === "en" ? "Preparing your ticket…" : "Giandam ang imong tiket…",
    printing: language === "en" ? "Printing your ticket…" : "Gi-imprinta ang imong tiket…",
    printed: language === "en" ? "Ticket printed ✓ Please take it with you." : "Na-imprinta na ang tiket ✓ Palihog kuhaa kini.",
    error: language === "en" ? "Could not print. Staff will assist you." : "Dili ma-imprinta. Motabang ang kawani.",
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans ${
        screenStep === "welcome" ? "bg-slate-950" : "bg-cyan-950"
      }`}
    >
      <style>{`
        @keyframes bica-flash {
          0%, 100% { background-color: #450a0a; }
          50%      { background-color: #dc2626; }
        }
        .bica-flash { animation: bica-flash 1.2s ease-in-out infinite; }

        @keyframes bica-breathe {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50%      { transform: scale(1.1);  opacity: 1; }
        }
        .bica-breathe { animation: bica-breathe 6s ease-in-out infinite; }

        @keyframes bica-print {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .bica-print-bar { animation: bica-print 1.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .bica-flash { animation: none; background-color: #991b1b; }
          .bica-breathe { animation: none; }
          .bica-print-bar { animation: none; }
        }
      `}</style>

      {screenStep !== "welcome" && screenStep !== "demographics" && (
        <KioskHeader
          language={language}
          activeStep={activeStep}
          vitalPart={activeStep === SAFETY_STEP_INDEX ? currentPart : undefined}
          onNavigateStep={handleNavigateStep}
          onLogout={onLogout}
        />
      )}


      {/* START OF UI COMPONENTS -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/}


      {/* STEP 0: WELCOME */}
      {screenStep === "welcome" && (
        <main
          className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-8"
          style={{
            backgroundImage: `url("${WELCOME_BACKGROUND}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/55 via-cyan-950/35 to-indigo-950/65" />
          <section className="w-full max-w-4xl rounded-[2rem] border border-white/70 bg-white/90 p-6 text-center shadow-2xl backdrop-blur-md sm:p-10">
            <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 sm:h-40 sm:w-40">
              <Image
                src="/kiosk-removebg-preview.png"
                alt="BICA patient kiosk"
                width={300}
                height={300}
                priority
                className="h-28 w-28 object-contain sm:h-36 sm:w-36"
              />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-800">BICA · OPD</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              {language === "en" ? "Welcome" : "Maayong pag-abot"}
            </h1>
            <p className="mt-2 text-base font-semibold text-slate-600 sm:text-lg">
              {language === "en" ? "Better Informed Care Access" : "Outpatient Department Kiosk"}
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <h2 className="mb-4 text-lg font-bold text-slate-700 sm:text-xl">
                {language === "en" ? "Select your preferred language" : "Pilia ang imong gustong pinulongan"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange("en");
                    resetScreening();
                    setScreenStep("demographics");
                  }}
                  className="rounded-2xl border-2 border-cyan-800 bg-cyan-900 px-5 py-5 text-xl font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-400 sm:text-2xl"
                >
                  English <span aria-hidden="true" className="ml-2">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange("ceb");
                    resetScreening();
                    setScreenStep("demographics");
                  }}
                  className="rounded-2xl border-2 border-cyan-800 bg-cyan-900 px-5 py-5 text-xl font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-400 sm:text-2xl"
                >
                  Cebuano <span className="text-base font-semibold">(Bisaya)</span>
                  <span aria-hidden="true" className="ml-2">→</span>
                </button>
              </div>
            </div>
          </section>

          <p className="mt-4 text-center text-xs font-medium text-white/90">
            {language === "en" ? "Outpatient Department" : "Departamento sa Outpatient"}
          </p>
        </main>
      )}

      {screenStep === "demographics" && (
        <PatientDemographicsForm
          language={language}
          onBack={() => setScreenStep("welcome")}
          onSubmit={patient => {
            setPatientDetails(patient);
            onPatientDemographics(patient);
            setScreenStep("safetyIntro");
          }}
        />
      )}

      {screenStep === "safetyIntro" && (
        <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 px-5 py-12">
          <section className="flex w-full max-w-5xl flex-row items-center gap-4 rounded-3xl border border-cyan-400/30 bg-slate-900/75 p-5 text-left text-white shadow-2xl backdrop-blur sm:gap-10 sm:p-12">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black sm:text-5xl">
                {language === "en" ? "Safety Check" : "Pagsusi sa Kaluwasan"}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-cyan-50 sm:text-2xl">
                {language === "en"
                  ? "We’ll check for emergency symptoms. Select any that apply."
                  : "Susihon nato ang mga sintomas sa emerhensiya. Pilia ang naa kanimo."}
              </p>
              <button
                type="button"
                onClick={() => {
                  resetScreening();
                  setScreenStep("screening");
                }}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-600 px-4 py-4 text-base font-black text-white shadow-lg transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 sm:mt-9 sm:min-h-16 sm:px-6 sm:py-5 sm:text-2xl"
              >
                {language === "en" ? "Proceed to Safety Check" : "Padayon sa Pagsusi sa Kaluwasan"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <Image
              src="/safety-check-icon.png"
              alt=""
              aria-hidden="true"
              width={320}
              height={320}
              className="h-24 w-24 shrink-0 object-contain sm:h-40 sm:w-40 md:h-56 md:w-56"
            />
          </section>
        </main>
      )}



      {/* STEP 1: SAFETY CHECK (Emergency only) */}
      {screenStep === "screening" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">

          <div className="text-center w-full mb-6">
            <h2 className="text-5xl font-bold text-white">
              {language === "en" ? "Safety Check" : "Pagsusi sa Kaluwasan"}
            </h2>

            <p className="text-2xl text-cyan-200 mt-2">
              {view === "categories"
                ? language === "en"
                  ? "Are you experiencing any of the following right now?"
                  : "Nasinati ba nimo ang bisan hain niini karon?"
                : language === "en"
                  ? `${selectedCategory?.name} — which one applies to you?`
                  : `${selectedCategory?.name} — hain niini ang imong nasinati?`}
            </p>
          </div>

          <div className="w-full bg-red-950/90 border-red-500/60 border-2 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-red-500/30 pb-4 mb-6">

              <div className="flex items-center gap-3 text-red-300 font-bold uppercase tracking-wider text-base">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 flex-shrink-0 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>

                <span>
                  {language === "en"
                    ? `Emergency Check: ${EMERGENCY_TITLE}`
                    : "Pagsusi sa emerhensiya: Mga emerhensiyang naghulga sa kinabuhi (ABCs)"}
                </span>
              </div>

              <span className="text-sm text-red-100 bg-red-900 border-red-600 px-4 py-1.5 rounded-full border font-semibold self-start sm:self-auto">
                {view === "categories"
                  ? language === "en"
                    ? "Tap the one that applies"
                    : "Pilia ang angay kanimo"
                  : language === "en"
                    ? "Tap what you are experiencing"
                    : "Pilia ang imong nasinati"}
              </span>
            </div>

            <div className="min-h-[360px] flex flex-col justify-between gap-6">

              {/* CATEGORY SELECTION */}
              {view === "categories" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 justify-items-center">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className="w-full max-w-md bg-red-900/70 border-red-500/50 hover:bg-red-700 border rounded-2xl p-6 text-left active:scale-[0.98] transition-all cursor-pointer group flex items-center justify-center min-h-[180px]"
                    >
                      <p className="text-red-50 group-hover:text-white text-3xl font-bold leading-snug text-center">
                        {language === "en"
                          ? cat.name
                          : cat.nameCeb}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              
              {/* EXPERIENCE SELECTION */}
              {view === "experiences" && selectedCategory && (
                <div className="flex flex-col gap-8">
                  {experienceGroups.map((group, groupIndex) => (
                    <section key={groupIndex} className="w-full">
                      {/* CLINIC GROUP HEADING */}
                      <div className="flex items-center gap-3 mb-4 border-b border-red-500/40 pb-3">
                        <div className="h-8 w-1.5 rounded-full bg-yellow-400" />

                        <h3 className="text-xl sm:text-2xl font-extrabold text-yellow-300">
                          {group.clinics.join(" • ")}
                        </h3>

                        <span className="ml-auto text-sm text-red-200">
                          {group.experiences.length}{" "}
                          {language === "en" ? "options" : "kapilian"}
                        </span>
                      </div>

                      {/* SYMPTOM SELECTIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                        {group.experiences.map((exp, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectExperience(exp)}
                            className="w-full max-w-xl min-h-[140px] flex items-center justify-center rounded-2xl border border-red-500/50 bg-red-900/70 p-6 text-center transition-all hover:bg-red-700 active:scale-[0.98] cursor-pointer group"
                          >
                            <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-red-50 group-hover:text-white">
                              {language === "en"
                                ? exp.text
                                : exp.textCeb}
                            </p>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-red-500/30">

                {view === "experiences" ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="w-full sm:w-auto px-6 py-4 bg-transparent border border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {language === "en"
                      ? "← Choose another category"
                      : "← Pagpili og laing kategorya"}
                  </button>
                ) : (
                  <span />
                )}

                {view === "categories" && (
                  <button
                    type="button"
                    onClick={handleNone}
                    className="w-full sm:w-auto px-8 py-4 bg-cyan-900 border-2 border-cyan-400 text-white text-xl font-bold rounded-xl hover:bg-cyan-800 transition-colors shadow-lg cursor-pointer"
                  >
                    {language === "en"
                      ? "NONE apply — Continue to Vital Signs →"
                      : "WALA niini — Padayon sa Pagsukod sa Vital Sign →"}
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      )}


      {/* STEP 2: EMERGENCY ALERT (silent, flashing red) */}
      {screenStep === "emergency" && (
        <div
          role="alert"
          className="bica-flash flex-1 flex flex-col items-center justify-center px-6 py-12 text-center w-full"
        >
          <div className="w-full max-w-4xl text-white">
            <h3 className="text-5xl sm:text-7xl font-black mb-4 tracking-tight drop-shadow-lg">
              {language === "en" ? "EMERGENCY" : "EMERHENSIYA"}
            </h3>

            <p className="text-2xl sm:text-3xl mb-8">
              {language === "en" ? "Emergency symptom detected:" : "Nakit-an nga sintomas sa emerhensiya:"}{" "}
              <span className="font-bold underline decoration-white">
                {alertData.symptom}
              </span>
            </p>

            <div className="mx-auto mb-8 w-fit rounded-2xl border-2 border-white bg-red-950 px-10 py-4 shadow-2xl">
              <span className="block text-xs font-bold uppercase tracking-widest text-red-300">{language === "en" ? "Queue Number" : "Numero sa Pila"}</span>
              <span className="block text-5xl sm:text-6xl font-black tracking-wider text-white">{alertData.ticketNumber}</span>
            </div>

            {alertData.patient && (
              <div className="mx-auto mb-8 grid max-w-3xl gap-3 rounded-2xl border border-red-300/60 bg-red-950/80 p-5 text-left sm:grid-cols-2">
                <p><span className="font-bold">{language === "en" ? "Patient" : "Pasyente"}:</span> {alertData.patient.firstName} {alertData.patient.lastName}</p>
                <p><span className="font-bold">{language === "en" ? "Age" : "Edad"}:</span> {alertData.patient.ageDisplay} · {alertData.patient.ageGroup}</p>
                <p><span className="font-bold">{language === "en" ? "Sex" : "Sekso"}:</span> {alertData.patient.gender}</p>
                <p><span className="font-bold">{language === "en" ? "Contact" : "Kontak"}:</span> {alertData.patient.contactNumber}</p>
              </div>
            )}

            <div className="bg-slate-950/90 p-10 rounded-2xl border border-red-500/50 max-w-2xl mx-auto shadow-inner flex flex-col items-center gap-8">
              <p className="text-2xl sm:text-3xl font-bold leading-relaxed text-red-100">
                {language === "en"
                  ? "Please stay where you are. Staff has been alerted."
                  : "Palihog pagpabilin sa imong nahimutangan. Gipahibalo na ang mga kawani."}
              </p>

              <button
                onClick={() => setScreenStep("erTicket")}
                className="w-full max-w-md bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-2xl font-bold py-5 px-8 rounded-xl shadow-[0_8px_25px_rgba(220,38,38,0.5)] transition-all active:scale-95 border border-red-300 flex items-center justify-center gap-4 cursor-pointer"
              >
                <span>{language === "en" ? "Continue to Print Ticket →" : "Padayon sa pag-imprinta sa tiket →"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TOP HALF = stay calm, BOTTOM HALF = receipt preview + printing */}
      {screenStep === "erTicket" && (
        <div className="flex-1 flex flex-col w-full">
          {/* TOP HALF: calm notification */}
          <div className="flex-1 basis-0 min-h-0 flex flex-col items-center justify-center bg-gradient-to-b from-cyan-900 via-teal-900 to-teal-800 px-8 py-6 text-center">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="bica-breathe absolute h-44 w-44 rounded-full bg-teal-300/20" />
              <div className="bica-breathe absolute h-32 w-32 rounded-full bg-teal-200/30" style={{ animationDelay: "0.4s" }} />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-3xl text-teal-900 shadow-xl">
                ♥
              </div>
            </div>

            <h2 className="mb-3 text-4xl font-extrabold text-white sm:text-6xl">
              {language === "en" ? "Please stay calm and relax." : "Palihog kalma lang ug pagpahayahay."}
            </h2>
            <p className="max-w-4xl text-2xl font-semibold leading-relaxed text-teal-100 sm:text-4xl">
              {language === "en"
                ? "Our staff is coming to help you. Please wait here."
                : "Padulong na ang among mga kawani aron motabang kanimo. Palihog paghulat dinhi."}
            </p>
            <p className="mt-3 max-w-4xl text-xl text-teal-200/90 sm:text-2xl">
              {language === "en"
                ? "Please remain calm. Our staff is on the way to help you."
                : "Palihog kalma lang. Padulong na ang among mga kawani aron motabang kanimo."}
            </p>
          </div>

          {/* BOTTOM HALF: small receipt preview + printing status */}
          <div className="flex-1 basis-0 min-h-0 flex flex-row items-center justify-center gap-12 bg-red-950 border-t-4 border-red-500/60 px-8 py-6">
            <div className="flex h-[30vh] items-center justify-center overflow-hidden rounded-lg bg-white shadow-2xl">
              {receiptUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receiptUrl}
                  alt={language === "en" ? `Emergency ticket ${alertData.ticketNumber}` : `Tiket sa emerhensiya ${alertData.ticketNumber}`}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <div className="flex h-full w-40 items-center justify-center px-3 text-center text-sm font-semibold text-gray-500">
                  {language === "en" ? "Preparing ticket…" : "Giandam ang tiket…"}
                </div>
              )}
            </div>

            <div className="flex max-w-md flex-col items-start gap-4">
              <p
                className={`text-3xl font-black sm:text-4xl ${printStatus === "error"
                  ? "text-yellow-300"
                  : printStatus === "printed"
                    ? "text-emerald-300"
                    : "text-red-100"
                  }`}
              >
                {statusText[printStatus]}
              </p>

              {(printStatus === "generating" || printStatus === "printing") && (
                <div className="h-3 w-full overflow-hidden rounded-full bg-red-900">
                  <div className="bica-print-bar h-full w-1/3 rounded-full bg-red-400" />
                </div>
              )}

              {receiptUrl && alertData.patient && (printStatus === "printed" || printStatus === "error") && (
                <button
                  type="button"
                  onClick={() => {
                    const patient = alertData.patient;
                    if (patient) void doPrint(receiptUrl, { ...alertData, patient });
                  }}
                  className="rounded-xl border border-red-300 bg-red-600 px-6 py-2 text-lg font-bold text-white hover:bg-red-500 active:bg-red-700 cursor-pointer"
                >
                  {language === "en" ? "Print again" : "I-imprinta pag-usab"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        {language === "en"
          ? "BICA Outpatient Self-Service Kiosk"
          : "Kiosk sa Outpatient sa BICA"}
      </footer>
    </div>
  );
}