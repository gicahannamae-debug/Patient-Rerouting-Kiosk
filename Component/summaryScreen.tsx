'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { TicketMetadata } from "../lib/summaryTypes";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";
import type { PatientAgeGroup } from "@/lib/patientDemographics";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryScreenProps {
  language: KioskLanguage;
  patientName: string;
  age: string;
  ageGroup: PatientAgeGroup | "";
  gender: string;
  contactNumber: string;
  patientAddress: string;
  pwdStatus: string;
  bpSys: string;
  bpDia: string;
  hr: string;
  spo2: string;
  temperature: string;
  complaints: string;
  clinic: string;
  destination: string;
  queueCode: string;
  date: string;
  time: string;
  patientStatus?: "new" | "returning" | "referred";
  // Referral props are no longer used (new patients only) but stay optional
  // so the parent doesn't break if it still passes them.
  referralFrom?: string;
  referralDoctor?: string;
  referralDate?: string;
  referralPurpose?: string;
  referralDiagnosis?: string;
  ticketMetadata?: TicketMetadata;
  /** Emergency ticket mode: uses neutral messaging and a physical-size receipt preview. */
  isCritical?: boolean;
  /** Called after printing finishes -> parent resets to the welcome screen */
  onFinish: () => void;
  onLogout?: () => void;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
  /** Optional thermal printer handler. Falls back to browser printing. */
  onPrintTicket?: (payload: { queueCode: string; imageDataUrl: string }) => void | Promise<void>;
}

type Phase = "preview" | "printing" | "done" | "error";

// ─── Timing ───────────────────────────────────────────────────────────────────

/** Minimum seconds to show the "printing" state after tapping Print */
const PRINTING_SECONDS = 6;
/** Seconds to show "Ticket printed" (advisory stays visible) before returning to the welcome screen */
const DONE_SECONDS = 8;

// ─── Receipt image ────────────────────────────────────────────────────────────
// 80mm paper = 576 dots wide. For 58mm paper use RECEIPT_WIDTH = 384 and
// PAPER_MM = "58mm".

const RECEIPT_WIDTH = 576;
const PAPER_MM = "80mm";

interface ReceiptData {
  serviceTitle: string;
  patientName: string;
  age: string;
  ageGroup: PatientAgeGroup | "";
  gender: string;
  contactNumber: string;
  address: string;
  pwdStatus: string;
  bpSys: string;
  bpDia: string;
  hr: string;
  spo2: string;
  temperature: string;
  complaints: string;
  criticalNote: string;
  clinic: string;
  destination: string;
  queueCode: string;
  date: string;
  time: string;
}

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

function buildReceiptImage(d: ReceiptData, language: KioskLanguage): string {
  const W = RECEIPT_WIDTH;
  const PAD = 24;
  const FONT = '"Courier New", monospace';

  const tall = document.createElement("canvas");
  tall.width = W;
  tall.height = 3200;
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

  const leftText = (str: string, size: number, weight = "bold") => {
    ctx.textAlign = "left";
    ctx.font = `${weight} ${size}px ${FONT}`;
    for (const line of wrapText(ctx, str, W - PAD * 2)) {
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

  /** "LABEL ........ value" on one line, or stacked when the value is long */
  const row = (label: string, value: string) => {
    const v = value && value.trim() ? value : "N/A";
    ctx.font = `normal 24px ${FONT}`;
    const lw = ctx.measureText(`${label} `).width;
    ctx.font = `bold 24px ${FONT}`;
    const vw = ctx.measureText(v).width;
    if (lw + vw + 16 <= W - PAD * 2) {
      ctx.textAlign = "left";
      ctx.font = `normal 24px ${FONT}`;
      ctx.fillText(label, PAD, y);
      ctx.textAlign = "right";
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(v, W - PAD, y);
      y += 34;
    } else {
      leftText(label, 24, "normal");
      leftText(v, 26);
      y += 6;
    }
  };

  // Header
  centered("BICA", 60);
  centered("Better Informed Care Access", 22, "normal");
  y += 4;
  centered(language === "en" ? d.serviceTitle : "KONSULTASYONG MEDIKAL", 26);
  dashed();

  row(language === "en" ? "DATE:" : "PETSA:", d.date);
  row(language === "en" ? "TIME:" : "ORAS:", d.time);
  dashed();

  // Queue number (white on black block)
  centered(language === "en" ? "QUEUE NUMBER" : "NUMERO SA PILA", 24, "normal");
  let size = 96;
  ctx.font = `bold ${size}px ${FONT}`;
  while (ctx.measureText(d.queueCode).width > W - PAD * 2 - 24 && size > 30) {
    size -= 2;
    ctx.font = `bold ${size}px ${FONT}`;
  }
  const blockH = Math.round(size * 1.35);
  ctx.fillStyle = "#000";
  ctx.fillRect(PAD, y, W - PAD * 2, blockH);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillText(d.queueCode, W / 2, y + Math.round(size * 0.18));
  ctx.fillStyle = "#000";
  y += blockH + 16;

  if (d.criticalNote) {
    centered(d.criticalNote, 24, "normal");
  } else {
    centered(language === "en" ? "PROCEED TO" : "ADTO SA", 22, "normal");
    centered(language === "en" ? d.destination : ({
      "Surgical Services Wing": "Pakpak sa Serbisyo sa Operasyon",
      "Internal Medicine Unit": "Yunit sa Internal Medicine",
      "OB-GYNE Clinic": "Klinika sa OB-GYNE",
      "Pediatrics Wing": "Pakpak sa Pediatrics",
    }[d.destination] ?? d.destination), 30);
    centered(language === "en" ? d.clinic : ({
      "General Surgery": "General Surgery",
      "Internal Medicine": "Internal Medicine",
      "OB-GYNE": "OB-GYNE",
      Pediatrics: "Pediatrics",
    }[d.clinic] ?? d.clinic), 24, "normal");
  }
  dashed();

  // Patient
  leftText(language === "en" ? "PATIENT" : "PASYENTE", 26);
  y += 4;
  row(language === "en" ? "STATUS:" : "KAHIMTANG:", language === "en" ? "New Patient" : "Bag-ong Pasyente");
  row(language === "en" ? "NAME:" : "NGALAN:", d.patientName);
  row(language === "en" ? "AGE:" : "EDAD:", d.age);
  row(language === "en" ? "AGE GROUP:" : "GRUPO SA EDAD:", d.ageGroup || "N/A");
  row(language === "en" ? "SEX:" : "SEKSO:", language === "en" ? d.gender : d.gender === "MALE" || d.gender === "Male" ? "LALAKI" : "BABAYE");
  row(language === "en" ? "CONTACT:" : "KONTAK:", d.contactNumber);
  row(language === "en" ? "PWD:" : "PWD:", language === "en" ? d.pwdStatus : d.pwdStatus === "Not PWD" ? "DILI PWD" : "OO, PWD");
  row(language === "en" ? "ADDRESS:" : "ADDRESS:", d.address);
  dashed();

  // Vitals (respiratory rate removed)
  leftText(language === "en" ? "VITAL SIGNS" : "MGA VITAL SIGN", 26);
  y += 4;
  row("BP:", `${d.bpSys}/${d.bpDia} mmHg`);
  row(language === "en" ? "HEART RATE:" : "PITIK SA KASINGKASING:", `${d.hr} bpm`);
  row("SpO2:", `${d.spo2} %`);
  row(language === "en" ? "TEMP:" : "TEMP:", `${d.temperature} C`);
  dashed();

  // Complaint and neutral critical-route note.
  leftText(language === "en" ? "CHIEF COMPLAINT" : "PANGUNAHING REKLAMO", 26);
  y += 4;
  if (d.complaints) leftText(d.complaints, 26, "normal");
  if (!d.complaints && !d.criticalNote) leftText("N/A", 26);
  dashed();

  // Footer
  centered(language === "en" ? "Present this slip to the triage nurse or clinic window." : "Ipakita kini nga papel sa triage nurse o sa bintana sa klinika.", 24);
  y += 6;
  centered(language === "en" ? "Keep this ticket with you." : "Tipigi kini nga tiket.", 22, "normal");

  // Crop to content (+ bottom margin for the cutter)
  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.ceil(y + PAD + 48);
  const octx = out.getContext("2d")!;
  octx.fillStyle = "#fff";
  octx.fillRect(0, 0, out.width, out.height);
  octx.drawImage(tall, 0, 0);

  return out.toDataURL("image/jpeg", 1.0);
}

/** Browser print of the receipt image (thermal printer installed as a system
 *  printer; run Chrome with --kiosk-printing to skip the print dialog). */
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

export default function SummaryScreen({
  language,
  patientName,
  age,
  ageGroup,
  gender,
  contactNumber,
  patientAddress,
  pwdStatus,
  bpSys,
  bpDia,
  hr,
  spo2,
  temperature,
  complaints,
  clinic,
  destination,
  queueCode,
  date,
  time,
  ticketMetadata,
  isCritical = false,
  onFinish,
  onLogout,
  onNavigateStep,
  onNavigateVitalPart,
  onPrintTicket,
}: SummaryScreenProps) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("preview");
  const [secondsUntilRestart, setSecondsUntilRestart] = useState(30);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isCritical) return;
    const timer = window.setInterval(() => {
      setSecondsUntilRestart(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCritical]);

  // Build the receipt image from the patient data
  const data: ReceiptData = {
    serviceTitle: ticketMetadata?.serviceTitle ?? "MEDICAL CONSULTATION",
    patientName,
    age,
    ageGroup,
    gender,
    contactNumber,
    address: patientAddress,
    pwdStatus,
    bpSys,
    bpDia,
    hr,
    spo2,
    temperature,
    complaints,
    criticalNote: isCritical
      ? language === "en" ? "Please wait for a staff member." : "Palihog hulat sa usa ka kawani."
      : "",
    clinic,
    destination,
    queueCode,
    date,
    time,
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setReceiptUrl(buildReceiptImage(data, language)), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), language]);

  const handlePrint = useCallback(async () => {
    if (!receiptUrl || phase === "printing" || phase === "done") return;
    setPhase("printing");

    try {
      const minWait = new Promise<void>(r => setTimeout(r, PRINTING_SECONDS * 1000));
      const job = onPrintTicket
        ? Promise.resolve(onPrintTicket({ queueCode, imageDataUrl: receiptUrl }))
        : printImage(receiptUrl);
      await Promise.all([job, minWait]);

      if (!mounted.current) return;
      setPhase("done");
      if (!isCritical) {
        setTimeout(() => {
          if (mounted.current) onFinish();
        }, DONE_SECONDS * 1000);
      }
    } catch {
      if (mounted.current) setPhase("error");
    }
  }, [isCritical, onFinish, onPrintTicket, phase, queueCode, receiptUrl]);

  if (isCritical) {
    return (
      <main className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-cyan-950 px-4 py-6 text-white sm:px-8">
        <style>{`
          @keyframes bica-print {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .bica-print-bar { animation: bica-print 1.4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .bica-print-bar { animation: none; }
          }
        `}</style>
        {phase === "done" ? (
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
              onClick={onFinish}
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
                {receiptUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={receiptUrl} alt={`Ticket ${queueCode}`} className="h-auto max-h-[70vh] w-full object-contain" />
                ) : (
                  <p className="text-lg font-semibold text-slate-500">
                    {language === "en" ? "Preparing ticket…" : "Giandam ang tiket…"}
                  </p>
                )}
              </div>
              {phase === "preview" && (
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!receiptUrl}
                  className="inline-flex min-h-14 w-full max-w-md items-center justify-center gap-3 rounded-lg bg-emerald-700 px-6 py-3 text-xl font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 00-2-2v-4H9v4a2 2 0 00-2 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {language === "en" ? "Print ticket" : "I-imprinta ang tiket"}
                </button>
              )}
              {phase === "printing" && (
                <div role="status" className="w-full max-w-sm text-center">
                  <p className="text-lg font-semibold text-cyan-100">{language === "en" ? "Printing ticket…" : "Gi-imprinta ang tiket…"}</p>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cyan-900">
                    <div className="bica-print-bar h-full w-1/3 rounded-full bg-emerald-500" />
                  </div>
                </div>
              )}
              {phase === "error" && (
                <button type="button" onClick={handlePrint} className="rounded-lg bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-600">
                  {language === "en" ? "Try printing again" : "Sulayi pag-imprinta pag-usab"}
                </button>
              )}
          </section>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col justify-between font-sans">
      <style>{`
        @keyframes bica-print {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .bica-print-bar { animation: bica-print 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bica-print-bar { animation: none; }
        }
      `}</style>

      <KioskHeader
        language={language}
        activeStep={7}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        <h2 className="text-4xl font-extrabold text-white text-center">
          {language === "en" ? "Your Triage Ticket" : "Imong Tiket sa Triage"}
        </h2>

        <div className="flex w-full items-center justify-center">
          <div className="flex w-full flex-col items-center gap-6">
            <div
              className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-2xl"
              style={{ height: "56vh" }}
            >
              {receiptUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receiptUrl}
                  alt={`Triage ticket ${queueCode}`}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <div className="px-16 text-lg font-semibold text-gray-500">
                  {language === "en" ? "Preparing ticket…" : "Giandam ang tiket…"}
                </div>
              )}
            </div>

            {phase === "preview" && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={!receiptUrl}
                className="w-full max-w-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-3xl font-black py-6 px-10 rounded-2xl shadow-[0_10px_30px_rgba(5,150,105,0.4)] transition-all active:scale-95 border-2 border-emerald-300 flex items-center justify-center gap-4 cursor-pointer tracking-wider"
              >
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>{language === "en" ? "PRINT TICKET" : "I-IMPRINTA ANG TIKET"}</span>
              </button>
            )}

            {phase === "printing" && (
              <div className="w-full max-w-md text-center">
                <p className="text-3xl font-bold text-cyan-100">
                  {language === "en" ? "Printing your ticket…" : "Gi-imprinta ang imong tiket…"}
                </p>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-cyan-900">
                  <div className="bica-print-bar h-full w-1/3 rounded-full bg-emerald-400" />
                </div>
              </div>
            )}

            {phase === "done" && (
              <p className="text-3xl font-bold text-emerald-300 text-center">
                {language === "en" ? "Ticket printed ✓ Please take your ticket." : "Na-imprinta na ang tiket ✓ Palihog kuhaa kini."}
              </p>
            )}

            {phase === "error" && (
              <div className="w-full max-w-xl text-center">
                <p className="text-2xl font-bold text-yellow-300">
                  {language === "en" ? "Could not print. Please try again or ask staff for help." : "Dili ma-imprinta. Sulayi pag-usab o pangayo og tabang sa kawani."}
                </p>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-600 px-8 py-3 text-xl font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  {language === "en" ? "Try again" : "Sulayi pag-usab"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        {language === "en" ? "BICA Outpatient Self-Service Kiosk" : "Kiosk sa Outpatient sa BICA"}
      </footer>
    </div>
  );
}