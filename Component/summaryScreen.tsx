'use client';
import React, { useEffect, useRef, useState } from "react";
import type { TicketMetadata } from "./summaryTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryScreenProps {
  patientName: string;
  age: string;
  gender: string;
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
  /** Called after printing finishes -> parent resets to the welcome screen */
  onFinish: () => void;
  /** Optional thermal printer handler. Falls back to browser printing. */
  onPrintTicket?: (payload: { queueCode: string; imageDataUrl: string }) => void | Promise<void>;
}

type Phase = "preview" | "printing" | "done" | "error";

// ─── Timing ───────────────────────────────────────────────────────────────────

/** Minimum seconds to show the "printing" state after tapping Print */
const PRINTING_SECONDS = 6;
/** Seconds to show "Ticket printed" before returning to the welcome screen */
const DONE_SECONDS = 2;

// ─── Receipt image ────────────────────────────────────────────────────────────
// 80mm paper = 576 dots wide. For 58mm paper use RECEIPT_WIDTH = 384 and
// PAPER_MM = "58mm".

const RECEIPT_WIDTH = 576;
const PAPER_MM = "80mm";

interface ReceiptData {
  serviceTitle: string;
  patientName: string;
  age: string;
  gender: string;
  address: string;
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

function buildReceiptImage(d: ReceiptData): string {
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
  centered(d.serviceTitle, 26);
  dashed();

  // Date / time
  row("DATE:", d.date);
  row("TIME:", d.time);
  dashed();

  // Queue number (white on black block)
  centered("QUEUE NUMBER", 24, "normal");
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

  centered("PROCEED TO", 22, "normal");
  centered(d.destination, 30);
  centered(d.clinic, 24, "normal");
  dashed();

  // Patient
  leftText("PATIENT", 26);
  y += 4;
  row("STATUS:", "New Patient");
  row("NAME:", d.patientName);
  row("AGE:", d.age);
  row("SEX:", d.gender);
  row("PWD:", d.pwdStatus);
  row("ADDRESS:", d.address);
  dashed();

  // Vitals
  leftText("VITAL SIGNS", 26);
  y += 4;
  row("BP:", `${d.bpSys}/${d.bpDia} mmHg`);
  row("HEART RATE:", `${d.hr} bpm`);
  row("SpO2:", `${d.spo2} %`);
  row("TEMP:", `${d.temperature} C`);
  dashed();

  // Complaint
  leftText("CHIEF COMPLAINT", 26);
  y += 4;
  leftText(d.complaints || "N/A", 26);
  dashed();

  // Footer
  centered("Present this slip to the triage", 24);
  centered("nurse or clinic window.", 24);
  y += 6;
  centered("Keep this ticket with you.", 22, "normal");
  centered("Hintayin po ang tawag sa inyong numero.", 22, "normal");

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
  patientName,
  age,
  gender,
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
  onFinish,
  onPrintTicket,
}: SummaryScreenProps) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("preview");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Build the receipt image from the patient data
  const data: ReceiptData = {
    serviceTitle: ticketMetadata?.serviceTitle ?? "MEDICAL CONSULTATION",
    patientName,
    age,
    gender,
    address: patientAddress,
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
  };

  useEffect(() => {
    setReceiptUrl(buildReceiptImage(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  const handlePrint = async () => {
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
      setTimeout(() => {
        if (mounted.current) onFinish();
      }, DONE_SECONDS * 1000);
    } catch {
      if (mounted.current) setPhase("error");
    }
  };

  const shrunk = phase !== "preview" && phase !== "error";

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

      {/* HEADER */}
      <nav className="w-full px-8 py-4 bg-yellow-50 shadow-md">
        <h1 className="text-3xl font-extrabold tracking-wide text-cyan-950">BICA</h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-800">Better Informed Care Access</p>
      </nav>

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        <h2 className="text-4xl font-extrabold text-white text-center">
          {phase === "preview" || phase === "error" ? "Your Triage Ticket" : "Please wait"}
        </h2>

        {/* Receipt preview: large, shrinks while printing */}
        <div
          className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-2xl transition-all duration-700 ease-in-out"
          style={{ height: shrunk ? "22vh" : "58vh" }}
        >
          {receiptUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receiptUrl}
              alt={`Triage ticket ${queueCode}`}
              className="h-full w-auto object-contain"
            />
          ) : (
            <div className="px-16 text-lg font-semibold text-gray-500">Preparing ticket…</div>
          )}
        </div>

        {/* Below the receipt: print button, then status */}
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
            <span>PRINT TICKET</span>
          </button>
        )}

        {phase === "printing" && (
          <div className="w-full max-w-xl text-center">
            <p className="text-3xl font-bold text-cyan-100">Printing your ticket…</p>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-cyan-900">
              <div className="bica-print-bar h-full w-1/3 rounded-full bg-emerald-400" />
            </div>
          </div>
        )}

        {phase === "done" && (
          <p className="text-3xl font-bold text-emerald-300 text-center">
            Ticket printed ✓ Please take your ticket.
          </p>
        )}

        {phase === "error" && (
          <div className="w-full max-w-xl text-center">
            <p className="text-2xl font-bold text-yellow-300">Could not print. Please try again or ask staff for help.</p>
            <button
              type="button"
              onClick={handlePrint}
              className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-600 px-8 py-3 text-xl font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 text-center text-cyan-300/60 text-sm border-t border-cyan-900">
        BICA Outpatient Self-Service Kiosk
      </footer>
    </div>
  );
}