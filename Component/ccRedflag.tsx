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
  onEmergencyAlert?: (alert: EmergencyAlert) => Promise<string>;
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
const WELCOME_BACKGROUND = "/bg3.jpg";

const CLINIC_CODE: Record<ClinicName, string> = {
  "OB-GYN": "OB",
  "Internal Medicine": "IM",
  "Surgery": "SUR",
  "Pediatrics": "PED",
};

// Order of the context sections on the symptom list
const CLINIC_ORDER: ClinicName[] = [PED, OBG, IM, SUR];

// Secondary context labels for symptoms (NOT clinic destinations)
const CLINIC_CONTEXT: Record<ClinicName, { en: string; ceb: string }> = {
  "Pediatrics": {
    en: "For children",
    ceb: "Para sa mga bata",
  },
  "OB-GYN": {
    en: "Pregnancy and women’s health",
    ceb: "Pagmabdos ug panglawas sa kababayen-an",
  },
  "Internal Medicine": {
    en: "Adult medical conditions",
    ceb: "Mga medikal nga kondisyon sa hamtong",
  },
  "Surgery": {
    en: "Injury, bleeding, and acute surgical conditions",
    ceb: "Kadaot, pagdugo, ug dinaliang kondisyon nga pang-surgery",
  },
};

// Used when one symptom applies to several sections (e.g. OB-GYN • IM • Surgery)
const SHARED_CONTEXT = {
  en: "For adults and pregnant patients",
  ceb: "Para sa mga hamtong ug mga nagmabdos",
};

type ScreenStep = "welcome" | "demographics" | "safetyIntro" | "screening" | "erTicket";
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
  tall.height = 2800;
  const ctx = tall.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, tall.height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";

  let y = PAD;
  const centered = (text: string, size: number, weight = "bold") => {
    ctx.textAlign = "center";
    ctx.font = `${weight} ${size}px ${FONT}`;
    for (const line of wrapText(ctx, text, W - PAD * 2)) {
      ctx.fillText(line, W / 2, y);
      y += size * 1.25;
    }
  };
  const leftText = (text: string, size: number, weight = "bold") => {
    ctx.textAlign = "left";
    ctx.font = `${weight} ${size}px ${FONT}`;
    for (const line of wrapText(ctx, text, W - PAD * 2)) {
      ctx.fillText(line, PAD, y);
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
  const row = (label: string, value: string) => {
    const text = value.trim() || "N/A";
    ctx.font = `normal 24px ${FONT}`;
    const labelWidth = ctx.measureText(`${label} `).width;
    ctx.font = `bold 24px ${FONT}`;
    const valueWidth = ctx.measureText(text).width;
    if (labelWidth + valueWidth + 16 <= W - PAD * 2) {
      ctx.textAlign = "left";
      ctx.font = `normal 24px ${FONT}`;
      ctx.fillText(label, PAD, y);
      ctx.textAlign = "right";
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(text, W - PAD, y);
      y += 34;
    } else {
      leftText(label, 24, "normal");
      leftText(text, 26);
      y += 6;
    }
  };

  centered("BICA", 60);
  centered("Better Informed Care Access", 22, "normal");
  y += 4;
  centered(language === "en" ? "MEDICAL CONSULTATION" : "KONSULTASYONG MEDIKAL", 26);
  dashed();

  const now = new Date();
  row(language === "en" ? "DATE:" : "PETSA:", now.toLocaleDateString());
  row(language === "en" ? "TIME:" : "ORAS:", now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  dashed();

  centered(language === "en" ? "QUEUE NUMBER" : "NUMERO SA PILA", 24, "normal");
  let size = 96;
  ctx.font = `bold ${size}px ${FONT}`;
  while (ctx.measureText(data.ticketNumber).width > W - PAD * 2 - 24 && size > 30) {
    size -= 2;
    ctx.font = `bold ${size}px ${FONT}`;
  }
  const blockHeight = Math.round(size * 1.35);
  ctx.fillStyle = "#000";
  ctx.fillRect(PAD, y, W - PAD * 2, blockHeight);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillText(data.ticketNumber, W / 2, y + Math.round(size * 0.18));
  ctx.fillStyle = "#000";
  y += blockHeight + 16;
  dashed();
  centered(language === "en" ? "Please wait for a staff member." : "Palihog hulat sa usa ka kawani.", 24, "normal");
  dashed();

  leftText(language === "en" ? "PATIENT" : "PASYENTE", 26);
  y += 4;
  row(language === "en" ? "STATUS:" : "KAHIMTANG:", language === "en" ? "New Patient" : "Bag-ong Pasyente");
  row(language === "en" ? "NAME:" : "NGALAN:", `${data.patient.firstName} ${data.patient.lastName}`);
  row(language === "en" ? "AGE:" : "EDAD:", data.patient.ageDisplay);
  row(language === "en" ? "AGE GROUP:" : "GRUPO SA EDAD:", data.patient.ageGroup);
  row(language === "en" ? "SEX:" : "SEKSO:", data.patient.gender === "MALE" ? language === "en" ? "Male" : "Lalaki" : language === "en" ? "Female" : "Babaye");
  row(language === "en" ? "CONTACT:" : "KONTAK:", data.patient.contactNumber);
  dashed();

  leftText(language === "en" ? "CHIEF COMPLAINT" : "PANGUNAHING REKLAMO", 26);
  y += 4;
  leftText(data.symptom, 26, "normal");
  dashed();
  centered(language === "en" ? "Keep this ticket with you." : "Tipigi kini nga tiket.", 22, "normal");

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
  const [alertStatus, setAlertStatus] = useState<"pending" | "sent" | "failed">("sent");
  const [secondsUntilRestart, setSecondsUntilRestart] = useState(30);
  const printedFor = useRef<string | null>(null);

  const selectedCategory = CATEGORIES.find(c => c.id === categoryId) ?? null;

  // Group symptoms by their context (Pediatrics → OB-GYN → Internal Medicine → Surgery)
  const experienceGroups = selectedCategory
    ? Object.values(
        selectedCategory.experiences.reduce<
          Record<string, { clinics: ClinicName[]; experiences: Experience[] }>
        >((groups, exp) => {
          const key = exp.clinics.join("|");
          if (!groups[key]) groups[key] = { clinics: exp.clinics, experiences: [] };
          groups[key].experiences.push(exp);
          return groups;
        }, {})
      ).sort((a, b) => {
        const rank = (g: { clinics: ClinicName[] }) =>
          Math.min(...g.clinics.map(c => CLINIC_ORDER.indexOf(c)));
        return rank(a) - rank(b) || a.clinics.length - b.clinics.length;
      })
    : [];

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

  // Prepare the receipt preview; printing starts only when the patient taps Print.
  useEffect(() => {
    if (screenStep !== "erTicket") return;
    if (!alertData.ticketNumber || !alertData.patient) return;
    if (printedFor.current === alertData.ticketNumber) return;
    printedFor.current = alertData.ticketNumber;
    const ticketData = { ...alertData, patient: alertData.patient };
    setPrintStatus("generating");
    const timer = window.setTimeout(() => {
      try {
        setReceiptUrl(buildReceiptImage(ticketData, language));
        setPrintStatus("idle");
      } catch {
        setPrintStatus("error");
      }
    }, 0);
    return () => window.clearTimeout(timer);
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

  const handleSelectExperience = async (exp: Experience) => {
    if (!selectedCategory || !patientDetails) return;

    const alert: EmergencyAlert = {
      ticketNumber: "",
      symptom: exp.text,
      patient: patientDetails,
      category: selectedCategory.name,
      clinicalCategory: selectedCategory.clinical,
      clinics: exp.clinics,
      createdAt: new Date().toISOString(),
    };

    setReceiptUrl(null);
    setPrintStatus("idle");
    setAlertData({ symptom: exp.text, ticketNumber: "", patient: patientDetails });
    setAlertStatus(onEmergencyAlert ? "pending" : "failed");
    setScreenStep("erTicket");

    if (!onEmergencyAlert) return;
    try {
      const queuedTicketCode = await onEmergencyAlert(alert);
      setAlertData(previous => ({ ...previous, ticketNumber: queuedTicketCode }));
      setAlertStatus("sent");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bica_emergency", JSON.stringify({ symptom: exp.text, ticketNumber: queuedTicketCode }));
      }
    } catch (error) {
      console.error("Red-flag staff alert failed:", error);
      setAlertStatus("failed");
    }
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
    setAlertStatus("sent");
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

  // Offer the same 30-second restart countdown as the critical-vital summary.
  useEffect(() => {
    if (screenStep !== "erTicket" || printStatus !== "printed") return;
    setSecondsUntilRestart(30);
    const timer = window.setInterval(() => {
      setSecondsUntilRestart(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screenStep, printStatus]);

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



      {/* STEP 1: SAFETY CHECK (Emergency symptom screening) */}
      {screenStep === "screening" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-6xl mx-auto w-full">

          <div className="text-center w-full mb-6">
            <h2 className="text-5xl font-bold text-white">
              {language === "en" ? "Safety Check" : "Pagsusi sa Kaluwasan"}
            </h2>

            <p className="text-3xl font-semibold text-cyan-200 mt-3">
              {language === "en" ? "Check for emergency symptoms" : "Susiha ang mga sintomas sa emerhensiya"}
            </p>

            <p className="text-lg text-cyan-100/80 mt-2 max-w-3xl mx-auto">
              {language === "en"
                ? "If any of these symptoms apply to you right now, you will be directed to the Emergency Department."
                : "Kung adunay niini nga sintomas nga naa kanimo karon, ipadala ka sa Emergency Department."}
            </p>

            {view === "experiences" && selectedCategory && (
              <p className="text-base font-semibold text-cyan-300 mt-3">
                {language === "en" ? selectedCategory.name : selectedCategory.nameCeb}
              </p>
            )}
          </div>

          <div className="w-full bg-red-950/90 border-red-500/60 border-2 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-red-500/30 pb-4 mb-6">

              <div className="flex items-center gap-3 text-red-300 font-bold uppercase tracking-wider text-base">
                <span aria-hidden="true" className="text-2xl leading-none">🚨</span>
                <span>
                  {language === "en"
                    ? "EMERGENCY CHECK: LIFE-THREATENING SYMPTOMS"
                    : "PAGSUSI SA EMERHENSIYA: MGA SINTOMAS NGA NAGHULGA SA KINABUHI"}
                </span>
              </div>

              <span className="text-sm text-red-100 bg-red-900 border-red-600 px-4 py-1.5 rounded-full border font-semibold self-start sm:self-auto">
                {view === "categories"
                  ? language === "en"
                    ? "Tap the symptom type that applies"
                    : "Pilia ang matang sa sintomas nga angay kanimo"
                  : language === "en"
                    ? "Tap the symptom that best describes what you are experiencing."
                    : "Pilia ang sintomas nga labing naghulagway sa imong nasinati."}
              </span>
            </div>

            <div className="min-h-[360px] flex flex-col justify-between gap-6">

              {/* SYMPTOM TYPE SELECTION */}
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
                        {language === "en" ? cat.name : cat.nameCeb}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* SYMPTOM SELECTION */}
              {view === "experiences" && selectedCategory && (
                <div className="flex flex-col gap-8">
                  {experienceGroups.map((group, groupIndex) => {
                    const isShared = group.clinics.length > 1;
                    const context = isShared ? SHARED_CONTEXT : CLINIC_CONTEXT[group.clinics[0]];
                    return (
                      <section key={groupIndex} className="w-full">
                        {/* CONTEXT LABEL (secondary — not a destination) */}
                        <div className="mb-4 border-b border-red-500/30 pb-3">
                          <h3 className="text-lg sm:text-xl font-bold text-red-100">
                            {group.clinics.join(" • ")}
                          </h3>
                          <p className="text-sm sm:text-base text-red-200/80">
                            {language === "en" ? context.en : context.ceb}
                          </p>
                        </div>

                        {/* SYMPTOM CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                          {group.experiences.map((exp, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectExperience(exp)}
                              className="w-full max-w-xl min-h-[140px] flex items-center justify-center rounded-2xl border border-red-500/50 bg-red-900/70 p-6 text-center transition-all hover:bg-red-700 active:scale-[0.98] cursor-pointer group"
                            >
                              <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-red-50 group-hover:text-white">
                                {language === "en" ? exp.text : exp.textCeb}
                              </p>
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
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
                    {language === "en" ? "← Choose another symptom type" : "← Pagpili og laing matang sa sintomas"}
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
                      ? "None apply → Continue to Vital Signs"
                      : "Walay mag-apply → Padayon sa Vital Signs"}
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      )}


      {/* Red-flag tickets use the same print-then-notice flow as critical vitals. */}
      {screenStep === "erTicket" && (
        <main className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-cyan-950 px-4 py-6 text-white sm:px-8">
          {printStatus === "printed" ? (
            <section role="status" aria-live="polite" className="w-full max-w-5xl py-10 text-center">
              <h1 className="text-5xl font-extrabold leading-tight sm:text-6xl">
                {language === "en" ? "Please stay where you are." : "Palihog pagpabilin sa imong nahimutangan."}
              </h1>
              <p className="mx-auto mt-8 max-w-4xl text-2xl leading-relaxed text-cyan-100 sm:text-3xl">
                {language === "en" ? "Staff has been alerted." : "Gipahibalo na ang mga kawani."}
              </p>
              {secondsUntilRestart > 0 && (
                <p className="mt-8 text-xl font-semibold text-cyan-300">
                  {language === "en" ? `New patient can start in ${secondsUntilRestart} seconds.` : `Makapagsugod ang bag-ong pasyente sulod sa ${secondsUntilRestart} segundo.`}
                </p>
              )}
              <button
                type="button"
                onClick={handleReset}
                disabled={secondsUntilRestart > 0}
                className="mx-auto mt-6 min-h-14 w-full max-w-xl rounded-lg bg-cyan-700 px-6 py-4 text-xl font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {language === "en" ? "Proceed / Start New Patient" : "Padayon / Sugdi ang Bag-ong Pasyente"}
              </button>
            </section>
          ) : (
            <section className="flex w-full max-w-5xl flex-col items-center gap-5" aria-label={language === "en" ? "Your ticket" : "Imong tiket"}>
              <h1 className="text-center text-3xl font-bold sm:text-4xl">
                {language === "en" ? "Your ticket" : "Imong tiket"}
              </h1>
              <div className="flex w-[80mm] max-w-full items-center justify-center overflow-hidden rounded-lg bg-white shadow-lg">
                {alertStatus === "pending" ? (
                  <p className="text-lg font-semibold text-slate-500">
                    {language === "en" ? "Contacting staff…" : "Gipahibalo ang mga kawani…"}
                  </p>
                ) : alertStatus === "failed" ? (
                  <p className="px-4 text-center text-lg font-semibold text-slate-500">
                    {language === "en" ? "Please ask a staff member for help." : "Palihog pangayo og tabang sa usa ka kawani."}
                  </p>
                ) : receiptUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={receiptUrl}
                    alt={language === "en" ? `Emergency ticket ${alertData.ticketNumber}` : `Tiket sa emerhensiya ${alertData.ticketNumber}`}
                    className="h-auto max-h-[70vh] w-full object-contain"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-500">
                    {language === "en" ? "Preparing ticket…" : "Giandam ang tiket…"}
                  </p>
                )}
              </div>

              {printStatus === "idle" && receiptUrl && alertData.patient && (
                <button
                  type="button"
                  onClick={() => void doPrint(receiptUrl, { ...alertData, patient: alertData.patient! })}
                  className="inline-flex min-h-14 w-full max-w-md items-center justify-center gap-3 rounded-lg bg-emerald-700 px-6 py-3 text-xl font-bold text-white hover:bg-emerald-600"
                >
                  {language === "en" ? "Print ticket" : "I-imprinta ang tiket"}
                </button>
              )}

              {(printStatus === "generating" || printStatus === "printing") && (
                <div role="status" className="w-full max-w-sm text-center">
                  <p className="text-lg font-semibold text-cyan-100">{statusText[printStatus]}</p>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cyan-900">
                    <div className="bica-print-bar h-full w-1/3 rounded-full bg-emerald-500" />
                  </div>
                </div>
              )}

              {printStatus === "error" && receiptUrl && alertData.patient && (
                <button
                  type="button"
                  onClick={() => void doPrint(receiptUrl, { ...alertData, patient: alertData.patient! })}
                  className="rounded-lg bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-600"
                >
                  {language === "en" ? "Try printing again" : "Sulayi pag-imprinta pag-usab"}
                </button>
              )}
            </section>
          )}
        </main>
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