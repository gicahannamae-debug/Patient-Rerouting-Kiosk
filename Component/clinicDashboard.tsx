'use client'
import React, { useState, useRef, useEffect } from 'react';
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  CalendarClock,
  Search,
  ShieldCheck,
  Inbox,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  CheckCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  getStaffClinic,
  persistPatientStatuses,
  subscribeToClinicPatients,
  type ClinicCode,
  type PatientCategory as Category,
  type PatientVitals as Vitals,
  type QueuePatient as Patient,
} from "@/lib/patientRecords";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clinic {
  code: ClinicCode;
  name: string;
  color: string;
  isER?: boolean;
}

interface QueueNotification {
  id: string;
  ticketCode: string;
  category: Category;
  clinicCode: ClinicCode;
  clinicName: string;
  createdAt: string;
  read: boolean;
}

interface PatientToast {
  id: string;
  ticketCode: string;
  clinicName: string;
  expiresAt: number;
  exiting: boolean;
}

const NOTIFICATION_PAGE_SIZE = 10;
const TOAST_LIFETIME_MS = 6000;
const TOAST_FADE_MS = 500;
const NOTIFICATION_STORAGE_PREFIX = "bica-queue-notifications-v1";

// ─── Clinic Definitions (config, not patient data) ───────────────────────────

const CLINICS: Clinic[] = [
  { code: 'SUR', name: 'Surgery', color: 'cyan' },
  { code: 'PED', name: 'Pediatrics', color: 'green' },
  { code: 'OBG', name: 'OB-GYN', color: 'pink' },
  { code: 'IM', name: 'Internal Medicine', color: 'blue' },
  { code: 'ER', name: 'Emergency Dept.', color: 'red', isER: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// "SUR-U-001" -> "U-001", "ER-E-001" -> "E-001"

function displayNumber(ticketCode: string | number | null | undefined): string {
  const code = String(ticketCode ?? "");

  if (!code) return "—";

  return code.split("-").slice(1).join("-") || code;
}


const CAT_ORDER: Category[] = ['EMERGENCY', 'URGENT', 'PRIORITY', 'REGULAR'];



const CAT_STYLE: Record<Category, { bg: string; text: string; badge: string; label: string }> = {
  EMERGENCY: { bg: 'bg-red-800', text: 'text-white', badge: 'bg-red-800 text-white', label: 'EMERGENCY (E)' },
  URGENT: { bg: 'bg-red-600', text: 'text-white', badge: 'bg-red-600 text-white', label: 'URGENT (U)' },
  PRIORITY: { bg: 'bg-orange-400', text: 'text-white', badge: 'bg-orange-400 text-white', label: 'PRIORITY (P)' },
  REGULAR: { bg: 'bg-green-500', text: 'text-white', badge: 'bg-green-500 text-white', label: 'REGULAR (R)' },
};

function sortQueue(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const ao = CAT_ORDER.indexOf(a.category);
    const bo = CAT_ORDER.indexOf(b.category);
    if (ao !== bo) return ao - bo;
    return a.queueNumber - b.queueNumber;
  });
}

// Queue entries remain waiting until clinic staff explicitly call the next patient.
// This avoids silently treating queue order as a clinical decision.
function promoteAll(list: Patient[]): Patient[] {
  return list;
}

function now(): string {
  return new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PH', {
    month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function firstComplaint(p: Patient): string {
  return p.chiefComplaints[0]?.complaint ?? '—';
}

function queueStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'waiting': return 'Open';
    case 'serving': return 'In Progress';
    case 'done': return 'Closed';
    case 'cancelled': return 'Cancelled';
    default: return 'Open';
  }
}

function queueStatusClass(status: string | undefined): string {
  switch (status) {
    case 'waiting': return 'border-cyan-500/40 bg-cyan-950/50 text-cyan-200';
    case 'serving': return 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200';
    case 'done': return 'border-slate-500/50 bg-slate-800 text-slate-300';
    case 'cancelled': return 'border-rose-500/40 bg-rose-950/50 text-rose-200';
    default: return 'border-cyan-500/40 bg-cyan-950/50 text-cyan-200';
  }
}

function QueueStatusBadge({ status }: { status: string | undefined }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${queueStatusClass(status)}`}>
      {queueStatusLabel(status)}
    </span>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function VitalsGrid({
  vitals,
  large = false,
  stacked = false,
  twoCol = false,
  emergency = false,
}: {
  vitals?: Vitals | null;
  large?: boolean;
  stacked?: boolean;
  twoCol?: boolean;
  emergency?: boolean;
}) {
  const items = [
    { label: 'BP', value: vitals?.bp ?? '—', unit: 'mmHg' },
    { label: 'HR', value: vitals?.hr != null ? String(vitals.hr) : '—', unit: 'bpm' },
    { label: 'RR', value: vitals?.rr != null ? String(vitals.rr) : '—', unit: '/min' },
    { label: 'Temp', value: vitals?.temp != null ? vitals.temp.toFixed(1) : '—', unit: '°C' },
    { label: 'SpO₂', value: vitals?.spo2 != null ? String(vitals.spo2) : '—', unit: '%' },
  ];

  const cols = stacked ? 'grid-cols-1' : twoCol ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-5';

  return (
    <div className={`grid ${cols} ${large ? 'gap-3' : 'gap-2'}`}>
      {items.map(v => (
        <div
          key={v.label}
          className={`rounded-xl border ${large ? 'px-4 py-3' : 'px-2 py-1.5'} ${
            emergency
              ? 'border-red-500/70 bg-red-950/50'
              : 'border-cyan-800/60 bg-slate-900/60'
          }`}
        >
          <p className={`text-xs font-bold uppercase tracking-wider ${emergency ? 'text-red-300' : 'text-cyan-400'}`}>
            {v.label}
          </p>
          <p className={`${large ? 'text-3xl' : 'text-sm'} font-black leading-tight ${emergency ? 'text-red-100' : 'text-white'}`}>
            {v.value}{' '}
            <span className={`text-sm font-medium ${emergency ? 'text-red-300/80' : 'text-slate-400'}`}>{v.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function DetailTile({
  label,
  value,
  emergency = false,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  emergency?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        emergency ? 'border-red-500/50 bg-red-950/40' : 'border-amber-900/60 bg-slate-900/70'
      } ${className}`}
    >
      <dt className={`text-xs font-bold uppercase tracking-wider ${emergency ? 'text-red-300' : 'text-slate-400'}`}>
        {label}
      </dt>
      <dd className={`mt-1 break-words text-xl font-bold leading-snug ${emergency ? 'text-red-50' : 'text-white'}`}>
        {value}
      </dd>
    </div>
  );
}

// Expandable service-desk row for pending patients

function CompactCard({
  patient,
  onSelect,
  onCall,
  isServing,
  isNew,
}: {
  patient: Patient;
  onSelect: (patient: Patient) => void;
  onCall: (patient: Patient) => void;
  isServing: boolean;
  isNew: boolean;
}) {
  const cat = CAT_STYLE[patient.category];

  return (
    <div className={`rounded-2xl border transition duration-300 ${isNew ? 'border-emerald-400 bg-emerald-950/35 ring-1 ring-emerald-400/40 shadow-lg shadow-emerald-950/20' : 'border-slate-700 bg-slate-800/60 hover:border-cyan-600'}`}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => onSelect(patient)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`View details for ${patient.name}`}
        >
          <span className="flex shrink-0 flex-col items-center gap-1.5">
            <span className={`rounded-lg px-3 py-2 text-xs font-black ${cat.badge}`}>
              {displayNumber(patient.ticketCode)}
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-bold text-white">{patient.name}</p>
              {isNew && <span className="rounded-full border border-emerald-400/50 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">New</span>}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>{patient.ageDisplay}</span>
              <span className="text-slate-600">·</span>
              <span>{patient.sex}</span>
              <span className="text-slate-600">·</span>
              <span className="min-w-0">{firstComplaint(patient)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">
                Created {formatDateTime(patient.arrivedAt)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] text-slate-500">
                Status: {queueStatusLabel(patient.status)}
              </span>
            </div>

          </div>

        
        </button>

        <button
          type="button"
          onClick={() => onCall(patient)}

          disabled={isServing}
          className="shrink-0 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isServing ? "Another patient is being served" : "Call patient"}
        </button>
     
      </div>
    </div>
  );
}



function PatientDetailsPopup({
  patient,
  clinics,
  minimized,
  onMinimize,
  onClose,
  onCall,
  isServing,
  onFinish,
  onForward,
  onCancel
}: {
  patient: Patient;
  clinics: Clinic[];
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onCall: () => void;
  isServing: boolean;
  
  onCancel: (patient: Patient) => void;
  onFinish: () => void;
  onForward: (destination: ClinicCode, note: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  


  const cat = CAT_STYLE[patient.category];

  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-700 bg-slate-950 shadow-2xl ring-1 ring-cyan-500/10">
        <div className="flex items-center gap-3 border-b border-cyan-900/70 bg-cyan-950/60 p-4">
          <span className="flex shrink-0 flex-col items-center gap-1.5">
            <span className={`rounded-xl px-3 py-2 text-sm font-black tracking-wider ${cat.badge}`}>
              {displayNumber(patient.ticketCode)}
            </span>
            <QueueStatusBadge status={patient.status} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white">{patient.name}</p>
            <p className="text-xs text-slate-400">Patient details minimized</p>
          </div>
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-600"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close patient details"
            className="rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-popup-title"
    >
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-cyan-800/80 bg-slate-950 shadow-2xl shadow-black/40 ring-1 ring-cyan-500/10">
        <header className="flex items-center gap-3 border-b border-cyan-800/70 bg-gradient-to-r from-cyan-950 via-slate-950 to-slate-950 p-4 sm:p-5">
          <span className="flex shrink-0 flex-col items-center gap-1.5">
            <span className={`rounded-2xl px-4 py-3 text-2xl font-black tracking-widest shadow-lg ${cat.badge}`}>
              {displayNumber(patient.ticketCode)}
            </span>
            <QueueStatusBadge status={patient.status} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 id="patient-popup-title" className="truncate text-xl font-black text-white">
              {patient.name}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {cat.label} · {patient.ageDisplay} · {patient.sex}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">Patient details</p>
          </div>

          <button
            type="button"
            onClick={onMinimize}
            className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Minimize
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="rounded-xl px-3 py-2 text-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-5">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 sm:grid-cols-4 sm:p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Age group</p>
              <p className="mt-1 font-bold text-white">{patient.ageGroup || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact</p>
              <p className="mt-1 break-words font-bold text-white">{patient.contactNumber || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Arrived at</p>
              <p className="mt-1 font-bold text-white">
                {formatDateTime(patient.arrivedAt)}
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-amber-800/70 bg-slate-900/70">
            <div className="flex items-center gap-2 border-b border-amber-900/60 bg-amber-950/30 px-4 py-3">
              <span className="h-5 w-1 rounded-full bg-amber-400" />
              <h3 className="font-black text-white">Chief Complaints</h3>
              <span className="ml-auto rounded-full border border-amber-800/70 bg-amber-950/50 px-2.5 py-1 text-xs font-bold text-amber-200">{patient.chiefComplaints.length} recorded</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="bg-slate-800/90 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5">Complaint</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.chiefComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-5 text-center text-slate-400">
                        No complaints recorded.
                      </td>
                    </tr>
                  ) : patient.chiefComplaints.map((c, i) => (
                    <tr key={i} className="border-t border-slate-800 text-slate-200">
                      <td className="px-3 py-3">{c.complaint || "—"}</td>
                      <td className="p-3">{c.duration || "—"}</td>
                      <td className="p-3">{c.severity || "—"}</td>
                      <td className="p-3">{c.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-cyan-800/70 bg-slate-900/70">
            <div className="flex items-center gap-2 border-b border-cyan-900/70 bg-cyan-950/30 px-4 py-3">
              <span className="h-5 w-1 rounded-full bg-cyan-400" />
              <h3 className="font-black text-white">Vital Signs</h3>
              <span className="ml-auto text-xs font-semibold text-cyan-300">Clinical assessment</span>
            </div>
            <div className="p-3 sm:p-4">
              <VitalsGrid vitals={patient.vitals} large />
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-800/70 bg-slate-900/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-cyan-400" />
              <h3 className="font-black text-white">Forward to another department</h3>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Choose the receiving clinic and include any necessary clinical handover information.
            </p>

            <label className="mt-4 block text-sm font-semibold text-slate-300">
              Destination department
              <select
                value={destination}
                onChange={e => {
                  setDestination(e.target.value);
                  setConfirmTransfer(false);
                }}
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-white"
              >
                <option value="">Select department</option>
                {clinics.filter(c => c.code !== patient.clinic).map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-300">
              Handover note (optional)
              <textarea
                value={handoverNote}
                onChange={e => setHandoverNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Reason for referral or information for the receiving team"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-white placeholder:text-slate-500"
              />
            </label>

            {confirmTransfer ? (
              <div className="mt-4 rounded-xl border border-amber-700 bg-amber-950/40 p-3">
                <p className="text-sm text-amber-200">
                  Confirm transfer of ticket {displayNumber(patient.ticketCode)}?
                  Ensure the receiving department is appropriate and follow your hospital's referral protocol.
                </p>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmTransfer(false)}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (destination) {
                        onForward(destination as ClinicCode, handoverNote.trim());
                      }
                    }}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500"
                  >
                    Confirm transfer
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={!destination}
                onClick={() => setConfirmTransfer(true)}
                className="mt-4 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Forward patient →
              </button>
            )}
          </section>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-cyan-900/70 bg-slate-950 p-4">
            <button
          type="button"
          onClick={() => onCancel(patient)}
          className="shrink-0 rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-2.5 text-sm font-bold text-rose-200 transition hover:bg-rose-900/60"
          aria-label={`Cancel ticket ${displayNumber(patient.ticketCode)}`}
        >
          Cancel Number
        </button>

          <button
            type="button"
            onClick={onCall}

            disabled={isServing || patient.status !== "waiting"}
            className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {patient.status === "serving"
              ? "Currently serving"
              : isServing
                ? "Another patient is being served"
                : "Call patient"}
          </button>
        </footer>
      </section>
    </div>
  );
}


// Large card for the patient being served. Shows the titles with "—" when empty.
function NowServingBanner({ patient, onFinish, onCallNext, hasWaiting }: {
  patient: Patient | null;
  onFinish: () => void;
  onCallNext: () => void;
  hasWaiting: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const cat = patient ? CAT_STYLE[patient.category] : null;
  const complaints = patient?.chiefComplaints ?? [];

  return (
    <div className="w-full rounded-3xl border border-cyan-700 bg-cyan-950/80 p-5 sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={`text-xs font-bold tracking-widest text-cyan-400 ${patient ? 'animate-pulse' : ''}`}>
            {patient ? '● NOW SERVING' : 'READY TO CALL'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className={`rounded-xl px-4 py-2 text-2xl font-black tracking-widest text-white ${cat?.bg ?? 'bg-slate-700'}`}>
              {patient ? displayNumber(patient.ticketCode) : '—'}
            </span>
            <div>
              <p className="text-lg font-bold text-white">{patient?.name ?? 'No patient currently being served'}</p>
              <p className="text-sm text-slate-300">{patient ? `${cat?.label ?? patient.category} · ${patient.ageDisplay} · ${patient.sex}` : 'Select Call next when clinic staff are ready to receive a patient.'}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-700 bg-cyan-900/60 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-800/70"
        >
          {expanded ? 'Minimize details' : 'Expand patient details'}
          <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Row 1: patient number + basic info */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className={`text-center rounded-2xl ${cat?.bg ?? 'bg-slate-700'} px-8 py-6 min-w-[170px]`}>
              <p className="text-5xl font-black text-white tracking-widest">
                {patient ? displayNumber(patient.ticketCode) : '—'}
              </p>
              <p className="mt-2 text-xs font-bold text-white/80">{cat?.label ?? 'PATIENT NUMBER'}</p>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Field label="Patient Name" value={patient?.name ?? '—'} />
              </div>
              <Field label="Age" value={patient?.ageDisplay ?? '—'} />
              <Field label="Age Group" value={patient?.ageGroup ?? '—'} />
              <Field label="Sex" value={patient?.sex ?? '—'} />
              <div className="col-span-2">
                <Field label="Contact Number" value={patient?.contactNumber || '—'} />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Arrived At
                </p>
                <p className="text-lg font-bold text-white">
                  {patient?.arrivedAt
                    ? new Date(patient.arrivedAt).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                      month: "long",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: complaints table */}
          <div className="mt-8">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Chief Complaints</p>
            <div className="overflow-x-auto rounded-2xl border border-cyan-800/60">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 bg-cyan-900/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  <span>Complaint</span>
                  <span>Duration</span>
                  <span>Severity</span>
                  <span>Location</span>
                </div>
                {complaints.length === 0 ? (
                  <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 text-base text-slate-500">
                    <span>—</span><span>—</span><span>—</span><span>—</span>
                  </div>
                ) : (
                  complaints.map((c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 border-t border-cyan-800/40 px-4 py-3 text-base text-white"
                    >
                      <span className="font-semibold">{c.complaint || '—'}</span>
                      <span>{c.duration || '—'}</span>
                      <span>{c.severity !== '' && c.severity != null ? c.severity : '—'}</span>
                      <span>{c.location || '—'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Row 3: vitals */}
          <div className="mt-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Vitals</p>
            <VitalsGrid vitals={patient?.vitals} large />
          </div>

        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        {!patient && (
          <button
            type="button"
            onClick={onCallNext}
            disabled={!hasWaiting}
            className="rounded-2xl bg-cyan-600 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            Call next patient
          </button>
        )}
        <button
          type="button"
          onClick={onFinish}
          disabled={!patient}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-8 py-3 text-base font-bold text-white transition-colors"
        >
          Finish visit
        </button>
      </div>
    </div>
  );
}

// ─── Clinic Queue ─────────────────────────────────────────────────────────────

function ClinicQueue({ clinic, allPatients, onUpdate, newlyAddedPatientIds }: {
  clinic: Clinic;
  allPatients: Patient[];
  onUpdate: (patients: Patient[]) => Promise<string | null>;
  newlyAddedPatientIds: Set<string>;
}) {
  const myPatients = allPatients.filter(p => p.clinic === clinic.code && (p.status === 'waiting' || p.status === 'serving'));
  const serving = myPatients.find(p => p.status === 'serving') ?? null;
  const waiting = sortQueue(myPatients.filter(p => p.status === 'waiting'));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Category>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');
  const [confirmFinish, setConfirmFinish] = useState<Patient | null>(null);
  const [finishError, setFinishError] = useState("");
  const [finishingVisit, setFinishingVisit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [popupMinimized, setPopupMinimized] = useState(false);

  // Call-patient state: tracks an in-flight call and any error to show staff.
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callError, setCallError] = useState("");

  const [transferNotice, setTransferNotice] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(new Date());
    };

    updateDateTime();

    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const popupPatient = selectedPatient
    ? allPatients.find(p => p.id === selectedPatient.id) ?? null
    : null;


  const matchingWaiting = waiting.filter(patient => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || [
      patient.name,
      patient.ticketCode,
      displayNumber(patient.ticketCode),
      patient.contactNumber ?? '',
      patient.ageDisplay,
      patient.ageGroup,
      patient.sex,
      ...patient.chiefComplaints.map(item => item.complaint ?? ''),
    ].some(value => String(value ?? '').toLowerCase().includes(term));
    const matchesCategory = categoryFilter === 'ALL' || patient.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Latest arrivals are shown first by default. Priority sorting is available when staff need it.
  const filteredWaiting = [...matchingWaiting].sort((a, b) => {
    if (sortOrder === 'PRIORITY') {
      const categoryDifference = CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
      return categoryDifference || a.queueNumber - b.queueNumber;
    }
    const aTime = new Date(a.arrivedAt || 0).getTime();
    const bTime = new Date(b.arrivedAt || 0).getTime();
    const validATime = Number.isFinite(aTime) ? aTime : 0;
    const validBTime = Number.isFinite(bTime) ? bTime : 0;
    const difference = sortOrder === 'NEWEST' ? validBTime - validATime : validATime - validBTime;
    return difference || b.queueNumber - a.queueNumber;
  });

  const grouped: Record<Category, Patient[]> = {
    EMERGENCY: waiting.filter(p => p.category === 'EMERGENCY'),
    URGENT: waiting.filter(p => p.category === 'URGENT'),
    PRIORITY: waiting.filter(p => p.category === 'PRIORITY'),
    REGULAR: waiting.filter(p => p.category === 'REGULAR'),
  };

  const counts = {
    urgent: grouped.URGENT.length,
    priority: grouped.PRIORITY.length,
    regular: grouped.REGULAR.length,
  };

  const erCounts = {
    e1: myPatients.filter(p => p.category === 'EMERGENCY' || p.category === 'URGENT').length,
    e2: myPatients.filter(p => p.category !== 'EMERGENCY' && p.category !== 'URGENT').length,
  };

  function formatCreatedDateTime(value: unknown): string {
    if (!value) return "Date unavailable";

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof value.toDate === "function"
    ) {
      date = value.toDate();
    } else {
      return "Date unavailable";
    }

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 8;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWaiting.length / PAGE_SIZE)
  );

  const paginatedWaiting = filteredWaiting.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  function handleReturnToQueue(patient: Patient) {
    const currentPatient = allPatients.find(p => p.id === patient.id);

    if (
      !currentPatient ||
      currentPatient.status !== "serving" ||
      currentPatient.clinic !== clinic.code
    ) {
      return;
    }

    onUpdate(
      allPatients.map(p =>
        p.id === currentPatient.id
          ? { ...p, status: "waiting" as const }
          : p
      )
    );

    setSelectedPatient(null);
    setPopupMinimized(false);
    setConfirmFinish(null);
  }



  async function handleCallPatient(patient: Patient) {
    if (serving || callingId) {
      console.warn("[call] blocked: already serving or call in progress", { serving, callingId });
      return;
    }

    const currentPatient = allPatients.find(p => p.id === patient.id);

    if (
      !currentPatient ||
      currentPatient.status !== "waiting" ||
      currentPatient.clinic !== clinic.code
    ) {
      console.warn("[call] blocked: guard failed", {
        found: !!currentPatient,
        status: currentPatient?.status,
        patientClinic: currentPatient?.clinic,
        dashboardClinic: clinic.code,
      });
      setCallError("This patient can't be called (status or clinic mismatch). Check the console.");
      return;
    }

    setCallingId(currentPatient.id);
    setCallError("");

    const error = await onUpdate(
      allPatients.map(p =>
        p.id === currentPatient.id
          ? { ...p, status: "serving" as const }
          : p
      )
    );

    setCallingId(null);

    if (error) {
      console.error("[call] persist failed:", error);
      setCallError(`Could not call patient: ${error}`);
      return;
    }

    setSelectedPatient(null);
    setPopupMinimized(false);
  }

  function handleCancel(patient: Patient) {
    const currentPatient = allPatients.find(p => p.id === patient.id);
    if (!currentPatient || currentPatient.clinic !== clinic.code || (currentPatient.status !== 'waiting' && currentPatient.status !== 'serving')) {
      setConfirmCancel(null);
      return;
    }

    onUpdate(allPatients.map(p => p.id === currentPatient.id
      ? { ...p, status: 'cancelled', completedAt: undefined }
      : p
    ));
    setConfirmCancel(null);
    setSelectedPatient(current => current?.id === patient.id ? null : current);
    setPopupMinimized(false);
  }

  async function handleFinish(patient: Patient) {
    const currentPatient = allPatients.find(p => p.id === patient.id);

    if (!currentPatient || currentPatient.status === "done") {
      setConfirmFinish(null);
      return;
    }

    setFinishingVisit(true);
    setFinishError("");
    try {
      const error = await onUpdate(
        allPatients.map(p =>
          p.id === currentPatient.id
            ? {
              ...p,
              status: "done" as const,
              completedAt: new Date().toISOString(),
            }
            : p
        )
      );
      if (error) {
        setFinishError(error);
        return;
      }

      setConfirmFinish(null);
      setSelectedPatient(current =>
        current?.id === patient.id ? null : current
      );
      setPopupMinimized(false);
    } finally {
      setFinishingVisit(false);
    }
  }


  const isER = clinic.isER;
  const isEmergency = serving?.category === 'EMERGENCY';

  return (
    <div className="text-slate-100">
      <header
        className={`sticky top-0 z-20 rounded-2xl border ${isER
          ? "border-red-800 bg-red-950"
          : "border-slate-700 bg-slate-900/95"
          } backdrop-blur-sm`}
      >
        <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Clinic title */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-2.5 rounded-full ${isER ? "bg-red-500" : "bg-cyan-500"
                }`}
            />

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                BICA · OPD
              </p>
              <h1 className="text-xl font-black text-white">
                {clinic.name} Clinic Dashboard
              </h1>
            </div>
          </div>

          {/* Counts and current date/time */}
          <div className="flex flex-wrap items-center gap-3">
            {isER ? (
              <>
                <div className="rounded-xl border border-red-600/40 bg-red-600/20 px-3 py-1.5 text-center">
                  <p className="text-xs font-bold text-red-400">E1</p>
                  <p className="text-2xl font-black leading-none text-red-400">
                    {erCounts.e1}
                  </p>
                </div>

                <div className="rounded-xl border border-red-600/40 bg-red-600/20 px-3 py-1.5 text-center">
                  <p className="text-xs font-bold text-red-400">E2</p>
                  <p className="text-2xl font-black leading-none text-red-400">
                    {erCounts.e2}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-red-600/40 bg-red-600/20 px-3 py-1.5 text-center">
                  <p className="text-xs font-bold text-red-400">URGENT</p>
                  <p className="text-2xl font-black leading-none text-red-400">
                    {counts.urgent}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-500/40 bg-orange-500/20 px-3 py-1.5 text-center">
                  <p className="text-xs font-bold text-orange-400">PRIORITY</p>
                  <p className="text-2xl font-black leading-none text-orange-400">
                    {counts.priority}
                  </p>
                </div>

                <div className="rounded-xl border border-green-600/40 bg-green-600/20 px-3 py-1.5 text-center">
                  <p className="text-xs font-bold text-green-400">REGULAR</p>
                  <p className="text-2xl font-black leading-none text-green-400">
                    {counts.regular}
                  </p>
                </div>
              </>
            )}

            {/* Current date and time */}
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${isER
                ? "border-red-600/40 bg-red-600/10"
                : "border-cyan-500/30 bg-cyan-500/10"
                }`}
            >
              <CalendarClock
                size={24}
                color={isER ? "#f87171" : "#67e8f9"}
                aria-hidden="true"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Date & Time
                </p>

                <p className="text-sm font-bold text-white">
                  {currentDateTime
                    ? currentDateTime.toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })
                    : "Loading date..."}
                </p>

                <p
                  className={`text-sm font-semibold ${isER ? "text-red-300" : "text-cyan-300"
                    }`}
                >
                  {currentDateTime
                    ? currentDateTime.toLocaleTimeString("en-PH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })
                    : "Loading time..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-5 space-y-5">
        {waiting.some(p => p.category === 'EMERGENCY') && (
          <div role="alert" className="rounded-2xl border border-red-500/70 bg-red-950/70 px-4 py-4">
            <p className="font-black tracking-wide text-red-200">Emergency-category ticket in the waiting queue</p>
            <p className="mt-1 text-sm text-red-100">Please follow the hospital-approved emergency escalation protocol and assess promptly. BICA triage information is not a diagnosis and must not replace clinical judgment.</p>
          </div>
        )}

        {callError && (
          <div role="alert" className="rounded-2xl border border-red-700 bg-red-950/60 px-4 py-3 text-sm text-red-200">
            {callError}
          </div>
        )}

        <section
          className={`relative overflow-hidden rounded-2xl border shadow-xl transition-all duration-500 ${serving
            ? isEmergency
              ? "border-red-500/80 bg-slate-900 shadow-red-500/20 ring-1 ring-red-500/30"
              : "border-cyan-400/80 bg-slate-900 shadow-cyan-500/15 ring-1 ring-cyan-400/20"
            : "border-slate-700 bg-slate-900"
            }`}
        >
          {/* Active patient glow */}
          {serving && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -inset-1 animate-pulse rounded-2xl blur-xl ${isEmergency ? "bg-red-500/10" : "bg-cyan-400/5"}`}
            />
          )}

          <div className="relative">
            {/* High-contrast Now Serving header */}
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${serving
              ? isEmergency
                ? "border-red-500/40 bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900"
                : "border-cyan-400/30 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-900"
              : "border-slate-700 bg-slate-950/50"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${serving
                  ? isEmergency
                    ? "border-red-400/50 bg-red-500/15 text-red-200"
                    : "border-cyan-300/50 bg-cyan-400/15 text-cyan-200"
                  : "border-slate-700 bg-slate-800 text-slate-400"}`}>
                  <span className="text-xl font-black">{serving ? "#" : "—"}</span>
                </div>
                <div>
                  <h2 className={`text-xl font-black tracking-wide ${serving ? (isEmergency ? "text-red-100" : "text-cyan-100") : "text-white"}`}>NOW SERVING</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Patient consultation & clinical information</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 rounded-full border px-3 py-2 ${serving ? "border-emerald-400/40 bg-emerald-950/60" : "border-slate-700 bg-slate-950/70"}`}>
                <span className="relative flex h-3 w-3">
                  {serving && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${serving
                      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                      : "bg-slate-500"
                      }`}
                  />
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${serving ? "text-emerald-300" : "text-slate-400"
                    }`}
                >
                  {serving ? "Serving" : "Idle"}
                </span>
              </div>
            </div>

            {serving ? (
              <div className="space-y-4 p-4 sm:p-5">
                {/* Ticket + identity */}
                <div className={`grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-[minmax(180px,0.7fr)_minmax(0,2fr)] sm:items-center ${
                  isEmergency
                    ? 'border-red-500/60 bg-gradient-to-r from-red-950/70 via-slate-950 to-red-950/40'
                    : 'border-cyan-400/30 bg-gradient-to-r from-slate-950 via-slate-950 to-cyan-950/40'
                }`}>
                  <div className={`flex min-h-28 flex-col justify-center rounded-lg border border-white/10 px-5 py-4 ${CAT_STYLE[serving.category].badge}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Ticket Number</p>
                    <p className="mt-1 break-words text-5xl font-black leading-none tracking-tight sm:text-6xl">{displayNumber(serving.ticketCode)}</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-wide">{serving.category || 'Uncategorized'}</p>
                    <div className="mt-3"><QueueStatusBadge status={serving.status} /></div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isEmergency ? 'text-red-300' : 'text-cyan-300'}`}>Current Patient</p>
                        <h3 className="mt-1 break-words text-3xl font-black leading-tight text-white sm:text-4xl">{serving.name || 'Unnamed Patient'}</h3>
                        <p className="mt-2 text-lg text-slate-200">
                          Age: <span className="font-bold">{serving.ageDisplay || serving.age || 'Not specified'}</span>
                          <span className="mx-2 text-slate-600">·</span>
                          Sex: <span className="font-bold">{serving.sex || 'Not specified'}</span>
                        </p>
                      </div>
                      <div className="min-w-[150px] rounded-lg border border-violet-400/30 bg-violet-950/30 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">Age Group</p>
                        <p className="mt-1 text-lg font-bold text-white">{serving.ageGroup || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-800 pt-3 text-sm text-slate-300">
                      <span>Queue: <span className="font-semibold text-white">{serving.ticketCode || 'Not available'}</span></span>
                      <span>Contact: <span className="font-semibold text-white">{serving.contactNumber || 'Not provided'}</span></span>
                      <span>Arrived: <span className="font-semibold text-white">{formatDateTime(serving.arrivedAt)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Clinical details */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
                  <section className={`min-w-0 rounded-xl border border-l-4 p-4 sm:p-5 ${
                    isEmergency
                      ? 'border-red-500/60 border-l-red-500 bg-red-950/30'
                      : 'border-amber-400/40 border-l-amber-400 bg-slate-950/70'
                  }`}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${isEmergency ? 'animate-pulse bg-red-500' : 'bg-amber-400'}`} />
                      <h3 className={`text-sm font-black uppercase tracking-[0.14em] ${isEmergency ? 'text-red-200' : 'text-amber-200'}`}>
                        Complaint Details
                      </h3>
                      <span className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-bold ${
                        isEmergency ? 'border-red-500/60 bg-red-950/60 text-red-200' : 'border-amber-800/70 bg-amber-950/50 text-amber-200'
                      }`}>
                        {serving.chiefComplaints.length} recorded
                      </span>
                    </div>

                    {serving.chiefComplaints.length > 0 ? (
                      <div className="space-y-4">
                        {serving.chiefComplaints.map((complaint, index) => (
                          <div
                            key={`${complaint.complaint}-${index}`}
                            className={`rounded-xl border p-4 ${isEmergency ? 'border-red-800/70 bg-slate-900/70' : 'border-amber-900/60 bg-slate-900/70'}`}
                          >
                            <p className={`text-xs font-bold uppercase tracking-wider ${isEmergency ? 'text-red-300' : 'text-slate-400'}`}>
                              Chief Complaint
                            </p>
                            <p className={`mt-1 whitespace-pre-wrap break-words text-2xl font-black leading-snug sm:text-3xl ${isEmergency ? 'text-red-100' : 'text-white'}`}>
                              {complaint.complaint || 'Not specified'}
                            </p>

                            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <DetailTile label="Duration" value={complaint.duration || '—'} emergency={isEmergency} />
                              <DetailTile
                                label="Severity"
                                value={complaint.severity !== '' && complaint.severity != null ? complaint.severity : '—'}
                                emergency={isEmergency}
                              />
                              <DetailTile label="Location" value={complaint.location || '—'} emergency={isEmergency} />
                            </dl>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-slate-400">No complaint recorded.</p>
                    )}
                  </section>

                  <section className={`min-w-0 rounded-xl border border-l-4 p-4 sm:p-5 ${
                    isEmergency
                      ? 'border-red-500/60 border-l-red-500 bg-red-950/30'
                      : 'border-rose-400/40 border-l-rose-400 bg-slate-950/70'
                  }`}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${isEmergency ? 'animate-pulse bg-red-500' : 'bg-rose-400'}`} />
                      <h3 className={`text-sm font-black uppercase tracking-[0.14em] ${isEmergency ? 'text-red-200' : 'text-rose-200'}`}>
                        Vital Signs
                      </h3>
                    </div>
                    {serving.vitals ? (
                      <VitalsGrid vitals={serving.vitals} large twoCol emergency={isEmergency} />
                    ) : (
                      <p className="text-lg text-slate-500">No vital signs recorded.</p>
                    )}
                  </section>
                </div>

                {/* Patient queue actions */}
                <div className="flex flex-col justify-between gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center">
                  <p className="text-xs leading-5 text-slate-500">
                    Return the patient to the waiting queue or finish the visit after consultation.
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleReturnToQueue(serving)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 transition hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      Return to Queue
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFinishError("");
                        setConfirmFinish(serving);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      Finish Visit
                    </button>
                 
                  </div>
                </div>



              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-8 text-center">
                <p className="font-semibold text-slate-300">
                  No patient is currently being served.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Call a waiting patient to display their information here.
                </p>
              </div>
            )}
          </div>
        </section>



        {confirmFinish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="finish-confirm-title">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h2 id="finish-confirm-title" className="text-lg font-black text-white">Finish this queue visit?</h2>
              <p className="mt-2 text-sm text-slate-300">Ticket <strong>{displayNumber(confirmFinish.ticketCode)}</strong> will leave the active queue and remain available in Recently Completed and Patient History.</p>
              {finishError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-200">
                  Could not finish this visit: {finishError}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" disabled={finishingVisit} onClick={() => setConfirmFinish(null)} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Keep active</button>
                <button type="button" disabled={finishingVisit} onClick={() => void handleFinish(confirmFinish)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">{finishingVisit ? "Saving…" : "Confirm finish"}</button>
              </div>
            </div>
          </div>
        )}

        {confirmCancel && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true" aria-labelledby="cancel-confirm-title">
            <div className="w-full max-w-md rounded-2xl border border-rose-700/70 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-300"><X size={22} /></div>
              <h2 id="cancel-confirm-title" className="text-lg font-black text-white">Cancel this queue ticket?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Ticket <strong>{displayNumber(confirmCancel.ticketCode)}</strong> will be marked <span className="font-bold text-rose-300">Cancelled</span> and removed from the active queue. The patient record will remain saved.</p>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmCancel(null)} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">Keep ticket</button>
                <button type="button" onClick={() => handleCancel(confirmCancel)} className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">Confirm cancellation</button>
              </div>
            </div>
          </div>
        )}



        <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow-xl">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-700 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                <ClipboardList className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  Pending / New Entries
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  Review patient entries and manage their queue status.
                </p>
              </div>
            </div>

            {/* Category counts */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-red-700/50 bg-red-950/50 px-3 py-2 text-xs font-bold text-red-300">
                Urgent <span className="ml-1">{grouped.URGENT.length}</span>
              </span>
              <span className="rounded-lg border border-orange-700/50 bg-orange-950/50 px-3 py-2 text-xs font-bold text-orange-300">
                Priority <span className="ml-1">{grouped.PRIORITY.length}</span>
              </span>
              <span className="rounded-lg border border-green-700/50 bg-green-950/50 px-3 py-2 text-xs font-bold text-green-300">
                Regular <span className="ml-1">{grouped.REGULAR.length}</span>
              </span>
            </div>
          </div>

          {/* Search and filters */}
          <div className="grid gap-3 border-b border-slate-700 bg-slate-950/40 px-4 py-4 md:grid-cols-[minmax(0,1fr)_200px_200px_auto] md:px-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Search entries
              </span>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, ticket, contact, or complaint..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Triage category
              </span>
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as "ALL" | Category)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="ALL">All categories</option>
                {CAT_ORDER.filter(
                  (category) =>
                    !isER || category === "EMERGENCY" || category === "URGENT"
                ).map((category) => (
                  <option key={category} value={category}>
                    {CAT_STYLE[category].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Sort patients
              </span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as "NEWEST" | "OLDEST" | "PRIORITY")}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="NEWEST">Latest added first</option>
                <option value="OLDEST">Oldest added first</option>
                <option value="PRIORITY">Triage priority</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("ALL");
                  setSortOrder("NEWEST");
                  setCurrentPage(1);
                }}
                disabled={!searchTerm && categoryFilter === "ALL" && sortOrder === "NEWEST"}
                className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
              >
                Clear filters
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-4">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-bold text-white">
                  {filteredWaiting.length === 0
                    ? 0
                    : (currentPage - 1) * PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(currentPage * PAGE_SIZE, filteredWaiting.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-white">
                  {filteredWaiting.length}
                </span>{" "}
                matching entries
              </p>
              <p className="text-xs text-slate-500">
                {waiting.length} pending in total
              </p>
            </div>
          </div>

          {/* Privacy reminder */}
          <div className="border-b border-slate-700/70 px-4 py-3 sm:px-5">
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Patient names, contact details, complaints, and vitals are staff-only
              information. Do not display these details on public waiting-room screens.
            </p>
          </div>

          {/* Patient entries */}
          {filteredWaiting.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
                <Inbox className="h-6 w-6 text-slate-500" />
              </div>
              <p className="mt-3 font-semibold text-slate-200">
                {waiting.length === 0
                  ? "No pending patients"
                  : "No matching entries"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {waiting.length === 0
                  ? "New patient entries will appear here when they join the queue."
                  : "Try another search term or clear the filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-700 bg-slate-950/30 px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Patient / Ticket details
                </p>
              </div>

              <div className="space-y-3 p-3 sm:p-4">
                {paginatedWaiting.map((patient) => (
                  <CompactCard
                    key={patient.id}
                    patient={patient}
                    onSelect={(p) => {
                      setSelectedPatient(p);
                      setPopupMinimized(false);
                      setTransferNotice("");
                    }}
                    onCall={handleCallPatient}
                   
                    isServing={!!serving || !!callingId}
                    isNew={newlyAddedPatientIds.has(patient.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-700 bg-slate-950/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-slate-400">
                  Page <span className="font-bold text-white">{currentPage}</span> of{" "}
                  <span className="font-bold text-white">{totalPages}</span>
                  <span className="ml-2 text-slate-500">
                    · {PAGE_SIZE} entries per page
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>




        {popupPatient && (
          <PatientDetailsPopup
            key={popupPatient.id}
            patient={popupPatient}
            clinics={CLINICS}
            minimized={popupMinimized}
            onMinimize={() => setPopupMinimized(value => !value)}
            onClose={() => {
              setSelectedPatient(null);
              setPopupMinimized(false);
              setTransferNotice("");
            }}
             onCancel={(p) => setConfirmCancel(p)}
            onCall={() => handleCallPatient(popupPatient)}
            isServing={!!serving || !!callingId}
            onFinish={() => setConfirmFinish(popupPatient)}
            onForward={(destination, note) => {
              setTransferNotice(
                `Transfer to ${CLINICS.find(c => c.code === destination)?.name ?? destination
                } has not been processed. No changes were made to the live queue.`
              );
            }}
          />
        )}



        {transferNotice && (
          <div
            role="alert"
            className="fixed bottom-5 left-5 right-5 z-[60] mx-auto max-w-xl rounded-xl border border-amber-700 bg-amber-950 p-4 text-sm text-amber-100 shadow-xl"
          >
            <p>{transferNotice}</p>
            <button
              type="button"
              onClick={() => setTransferNotice("")}
              className="mt-3 rounded-lg border border-amber-700 px-3 py-1.5 font-semibold hover:bg-amber-900"
            >
              Dismiss
            </button>
          </div>
        )}


      </main>
    </div>
  );
}

// ─── Top bar: Completed button + 3-bar menu ───────────────────────────────────

function CompletedButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-11 items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
    >
      Recently Completed
      <span className="rounded-lg bg-cyan-600 px-2 py-0.5 text-sm font-black">{count}</span>
    </button>
  );
}

function MenuButton({ onHistory, onLogout }: { onHistory: () => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Menu"
        className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <span className="block h-0.5 w-5 rounded bg-white" />
        <span className="block h-0.5 w-5 rounded bg-white" />
        <span className="block h-0.5 w-5 rounded bg-white" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            <button
              onClick={() => { setOpen(false); onHistory(); }}
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Patient History
            </button>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="block w-full border-t border-slate-700 px-4 py-3 text-left text-sm font-semibold text-red-400 hover:bg-slate-700 transition-colors"
            >
              Clinic Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function ModalShell({ subtitle, title, onClose, children, wide = false }: {
  subtitle: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} max-h-[85vh] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{subtitle}</p>
            <h2 className="text-xl font-black text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-800">
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// Recently completed: last 24 hours, paginated list + consistent patient details popup.
const COMPLETED_PAGE_SIZE = 8;

function CompletedPatientDetailsPopup({
  patient,
  onClose,
  onRequeue,
  onCallNow,
  showActions = true,
}: {
  patient: Patient;
  onClose: () => void;
  onRequeue: (patient: Patient) => void;
  onCallNow: (patient: Patient) => void;
  showActions?: boolean;
}) {
  const cat = CAT_STYLE[patient.category];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="completed-patient-title" onClick={e => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-cyan-800/80 bg-slate-950 shadow-2xl shadow-black/40 ring-1 ring-cyan-500/10">
        <header className="flex items-center gap-3 border-b border-cyan-800/70 bg-gradient-to-r from-cyan-950 via-slate-950 to-slate-950 p-4 sm:p-5">
          <span className={`shrink-0 rounded-2xl px-4 py-3 text-2xl font-black tracking-widest shadow-lg ${cat.badge}`}>{displayNumber(patient.ticketCode)}</span>
          <div className="min-w-0 flex-1">
            <h2 id="completed-patient-title" className="truncate text-xl font-black text-white">{patient.name}</h2>
            <p className="mt-1 text-sm text-slate-300">{cat.label} · {patient.ageDisplay} · {patient.sex}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">Completed patient details</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close patient details" className="rounded-xl px-3 py-2 text-lg text-slate-400 hover:bg-slate-800 hover:text-white">✕</button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-5">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 sm:grid-cols-4 sm:p-4">
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Age group</p><p className="mt-1 font-bold text-white">{patient.ageGroup || '—'}</p></div>
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact</p><p className="mt-1 break-words font-bold text-white">{patient.contactNumber || '—'}</p></div>
            <div className="col-span-2"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Arrived at</p><p className="mt-1 font-bold text-white">{formatDateTime(patient.arrivedAt)}</p></div>
            <div className="col-span-2 sm:col-span-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed at</p><p className="mt-1 font-bold text-emerald-300">{formatDateTime(patient.completedAt)}</p></div>
          </div>
          <section className="overflow-hidden rounded-2xl border border-amber-800/70 bg-slate-900/70">
            <div className="flex items-center gap-2 border-b border-amber-900/60 bg-amber-950/30 px-4 py-3"><span className="h-5 w-1 rounded-full bg-amber-400" /><h3 className="font-black text-white">Chief Complaints</h3><span className="ml-auto rounded-full border border-amber-800/70 bg-amber-950/50 px-2.5 py-1 text-xs font-bold text-amber-200">{patient.chiefComplaints.length} recorded</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="bg-slate-800/90 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2.5">Complaint</th><th className="p-3">Duration</th><th className="p-3">Severity</th><th className="p-3">Location</th></tr></thead><tbody>{patient.chiefComplaints.length === 0 ? <tr><td colSpan={4} className="p-5 text-center text-slate-400">No complaints recorded.</td></tr> : patient.chiefComplaints.map((c, i) => <tr key={i} className="border-t border-slate-800 text-slate-200"><td className="px-3 py-3">{c.complaint || '—'}</td><td className="p-3">{c.duration || '—'}</td><td className="p-3">{c.severity || '—'}</td><td className="p-3">{c.location || '—'}</td></tr>)}</tbody></table></div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-cyan-800/70 bg-slate-900/70">
            <div className="flex items-center gap-2 border-b border-cyan-900/70 bg-cyan-950/30 px-4 py-3"><span className="h-5 w-1 rounded-full bg-cyan-400" /><h3 className="font-black text-white">Vital Signs</h3><span className="ml-auto text-xs font-semibold text-cyan-300">Clinical assessment</span></div>
            <div className="p-3 sm:p-4"><VitalsGrid vitals={patient.vitals} large /></div>
          </section>
        </div>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-cyan-900/70 bg-slate-950 p-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">Close</button>
          {showActions && <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onRequeue(patient)} className="rounded-xl border border-cyan-700 bg-cyan-950/70 px-4 py-3 text-sm font-bold text-cyan-200 hover:bg-cyan-900">Add back to queue</button>
            <button type="button" onClick={() => onCallNow(patient)} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500">Call immediately</button>
          </div>}
        </footer>
      </section>
    </div>
  );
}

function CompletedModal({ clinic, patients, onClose, onRequeue, onCallNow }: {
  clinic: Clinic;
  patients: Patient[];
  onClose: () => void;
  onRequeue: (p: Patient) => void;
  onCallNow: (p: Patient) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const totalPages = Math.max(1, Math.ceil(patients.length / COMPLETED_PAGE_SIZE));
  const visiblePatients = patients.slice((page - 1) * COMPLETED_PAGE_SIZE, page * COMPLETED_PAGE_SIZE);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <ModalShell subtitle={clinic.name} title="Recently Completed · Last 24 Hours" onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-900/60 bg-cyan-950/20 px-3 py-2.5">
        <p className="text-sm text-slate-300"><span className="font-black text-white">{patients.length}</span> completed {patients.length === 1 ? 'patient' : 'patients'} in the last 24 hours</p>
        <p className="text-xs text-slate-500">Newest completion first · Select a patient for details</p>
      </div>
      {patients.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No patients completed in the last 24 hours.</p> : <>
        <div className="space-y-2">
          {visiblePatients.map(p => (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-3 transition-colors hover:border-cyan-700 sm:flex-row sm:items-center">
              <button type="button" onClick={() => setSelectedPatient(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`View completed patient ${p.name}`}>
                <span className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${CAT_STYLE[p.category].badge}`}>{displayNumber(p.ticketCode)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-bold text-white">{p.name}</span><span className="mt-1 block truncate text-xs text-slate-400">{p.ageDisplay} · {p.sex} · {firstComplaint(p)}</span><span className="mt-1 block text-[11px] text-emerald-300">Completed {formatDateTime(p.completedAt)}</span></span>
                <span className="hidden text-sm font-semibold text-cyan-400 sm:block">Details →</span>
              </button>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <button type="button" onClick={() => onRequeue(p)} className="rounded-lg border border-cyan-700 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-950/70">Add to queue</button>
                <button type="button" onClick={() => onCallNow(p)} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500">Call now</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">Page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{totalPages}</span> · {COMPLETED_PAGE_SIZE} entries per page</p>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setPage(v => Math.max(1, v - 1))} disabled={page <= 1} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button><button type="button" onClick={() => setPage(v => Math.min(totalPages, v + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40">Next<ChevronRight className="h-4 w-4" /></button></div>
        </div>
      </>}
      {selectedPatient && <CompletedPatientDetailsPopup patient={selectedPatient} onClose={() => setSelectedPatient(null)} onRequeue={p => onRequeue(p)} onCallNow={p => onCallNow(p)} />}
    </ModalShell>
  );
}

// Full-page patient history with search, filters, date range, sorting, and pagination.
const HISTORY_PAGE_SIZE = 10;

function PatientHistoryPage({ clinic, patients, onBack }: { clinic: Clinic; patients: Patient[]; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | Category>('ALL');
  const [sort, setSort] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filtered = patients.filter((p) => {
    const completedDate = p.completedAt ? new Date(p.completedAt) : null;
    if (!completedDate || !Number.isFinite(completedDate.getTime())) return false;
    const dateKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}-${String(completedDate.getDate()).padStart(2, '0')}`;
    if (category !== 'ALL' && p.category !== category) return false;
    if (dateFrom && dateKey < dateFrom) return false;
    if (dateTo && dateKey > dateTo) return false;
    const term = search.trim().toLowerCase();
    if (term) {
      const searchable = [p.name, p.ticketCode, p.contactNumber ?? '', ...p.chiefComplaints.map(c => c.complaint)].join(' ').toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'PRIORITY') {
      const priority = CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
      if (priority !== 0) return priority;
    }
    const aTime = new Date(a.completedAt ?? 0).getTime();
    const bTime = new Date(b.completedAt ?? 0).getTime();
    return sort === 'OLDEST' ? aTime - bTime : bTime - aTime;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE);
  const clearFilters = () => { setSearch(''); setCategory('ALL'); setSort('NEWEST'); setDateFrom(''); setDateTo(''); setPage(1); };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-700 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <button type="button" onClick={onBack} aria-label="Back to clinic dashboard" className="mt-1 rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-200 transition hover:border-cyan-700 hover:bg-slate-700"><ChevronLeft size={20} /></button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{clinic.name}</p>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Patient History</h1>
              <p className="mt-1 text-sm text-slate-400">All completed queue entries · Search, filter, sort, and review by completion date.</p>
            </div>
          </div>
          <div className="rounded-xl border border-cyan-800/70 bg-cyan-950/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Matching records</p>
            <p className="mt-1 text-2xl font-black text-white">{filtered.length}</p>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow-xl">
          <div className="grid gap-3 border-b border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Search patients</span>
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Name, ticket, contact, complaint…" className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500" /></div>
            </label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Triage category</span><select value={category} onChange={e => { setCategory(e.target.value as 'ALL' | Category); setPage(1); }} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"><option value="ALL">All categories</option>{CAT_ORDER.map(c => <option key={c} value={c}>{CAT_STYLE[c].label}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Sort by</span><select value={sort} onChange={e => { setSort(e.target.value as 'NEWEST' | 'OLDEST' | 'PRIORITY'); setPage(1); }} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"><option value="NEWEST">Newest completed</option><option value="OLDEST">Oldest completed</option><option value="PRIORITY">Triage priority</option></select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Completed from</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Completed to</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" /></label>
            <div className="flex items-end"><button type="button" onClick={clearFilters} disabled={!search && category === 'ALL' && sort === 'NEWEST' && !dateFrom && !dateTo} className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Clear</button></div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
            <p className="text-xs text-slate-400">Showing <span className="font-bold text-white">{filtered.length ? (safePage - 1) * HISTORY_PAGE_SIZE + 1 : 0}–{Math.min(safePage * HISTORY_PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-white">{filtered.length}</span> completed entries</p>
            <p className="text-xs text-slate-500">Completion date and time are shown for each record.</p>
          </div>

          {visible.length === 0 ? <div className="px-5 py-16 text-center"><ClipboardList className="mx-auto mb-3 text-slate-600" size={32} /><p className="font-bold text-slate-200">No completed entries found</p><p className="mt-1 text-sm text-slate-500">Try changing the search, category, or date range.</p></div> : <div className="divide-y divide-slate-800">
            {visible.map(p => <button key={p.id} type="button" onClick={() => setSelectedPatient(p)} aria-label={`View details for ${p.name}, ticket ${displayNumber(p.ticketCode)}`} className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-cyan-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 sm:flex-row sm:items-center sm:px-5">
              <span className={`flex min-w-[82px] shrink-0 items-center justify-center rounded-xl px-3 py-3 text-sm font-black tracking-wide ${CAT_STYLE[p.category].badge}`}>{displayNumber(p.ticketCode)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="font-bold text-white">{p.name}</span><span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">{p.category}</span></span>
                <span className="mt-1 block text-sm text-slate-300">{p.ageDisplay} · {p.ageGroup} · {p.sex}</span>
                <span className="mt-1 block truncate text-xs text-slate-400">Complaint: {p.chiefComplaints.map(c => c.complaint).filter(Boolean).join(', ') || '—'}</span>
                {p.contactNumber && <span className="mt-1 block text-xs text-slate-500">Contact: {p.contactNumber}</span>}
              </span>
              <span className="flex shrink-0 items-center justify-between gap-3 sm:min-w-[220px] sm:justify-end">
                <span className="rounded-xl border border-emerald-900/70 bg-emerald-950/20 px-3 py-2 sm:min-w-[190px]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">Completed at</span><span className="mt-1 block text-sm font-semibold text-slate-100">{formatDateTime(p.completedAt)}</span>
                  <span className="mt-1 block text-xs text-slate-500">Arrived: {formatDateTime(p.arrivedAt)}</span>
                </span>
                <span className="text-xs font-bold text-cyan-300">Details →</span>
              </span>
            </button>)}
          </div>}

          <footer className="flex flex-col gap-3 border-t border-slate-700 bg-slate-950/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">Page <span className="font-bold text-white">{safePage}</span> of <span className="font-bold text-white">{totalPages}</span> · {HISTORY_PAGE_SIZE} entries per page</p>
            <div className="flex items-center gap-2"><button type="button" onClick={() => setPage(v => Math.max(1, v - 1))} disabled={safePage <= 1} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} />Previous</button><button type="button" onClick={() => setPage(v => Math.min(totalPages, v + 1))} disabled={safePage >= totalPages} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40">Next<ChevronRight size={16} /></button></div>
          </footer>
        </section>
      </div>
      {selectedPatient && <CompletedPatientDetailsPopup patient={selectedPatient} onClose={() => setSelectedPatient(null)} onRequeue={() => setSelectedPatient(null)} onCallNow={() => setSelectedPatient(null)} showActions={false} />}
    </main>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function ClinicLogin({
  onLogin,
  errorMessage,
}: {
  onLogin: (email: string, password: string) => Promise<string | null>;
  errorMessage: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState(now());

  useEffect(() => {
    const t = setInterval(() => setTime(now()), 10000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit() {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const err = await onLogin(email.trim(), password);
      if (err) setError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-cyan-950 border-2 border-cyan-600 mb-4">
          <span className="text-3xl font-black text-cyan-400">B</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">BICA</h1>
        <p className="text-slate-400 text-sm mt-1">Better Informed Care Access · Outpatient Department</p>
        <p className="text-slate-500 text-xs mt-1">{time}</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Staff Login</h2>
        <p className="text-slate-500 text-xs mb-6">Enter your credentials to access your clinic dashboard.</p>

        <div className="mb-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Staff Email</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="name@hospital.org"
            className="w-full rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Access Code</label>
          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); }}
              placeholder="Enter password"
              className="w-full rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 pr-16 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCode(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              {showCode ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {(error || errorMessage) && (
          <div className="mb-4 rounded-xl bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <span>⚠</span> {error || errorMessage}
          </div>
        )}

        <button
          onClick={() => { void handleSubmit(); }}
          disabled={isSubmitting || !email.trim() || !password}
          className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold py-3 transition-colors"
        >
          {isSubmitting ? "Signing in…" : "Access Dashboard →"}
        </button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClinicDashboard() {
  const [patientState, setPatientState] = useState<{ clinic: ClinicCode; patients: Patient[] } | null>(null);
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [patientError, setPatientError] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const patients = patientState && activeClinic?.code === patientState.clinic ? patientState.patients : [];
  const [newPatientToasts, setNewPatientToasts] = useState<PatientToast[]>([]);
  const [newlyAddedPatientIds, setNewlyAddedPatientIds] = useState<Set<string>>(new Set());
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [notificationLog, setNotificationLog] = useState<QueueNotification[]>([]);
  const [showNotificationLog, setShowNotificationLog] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const seenPatientIdsRef = useRef<Set<string> | null>(null);
  const soundContextRef = useRef<AudioContext | null>(null);
  const [hydratedNotificationClinic, setHydratedNotificationClinic] = useState<ClinicCode | null>(null);
  const unreadNotificationCount = notificationLog.filter((item) => !item.read).length;
  const pageCount = Math.max(1, Math.ceil(notificationLog.length / NOTIFICATION_PAGE_SIZE));
  const visibleNotifications = notificationLog.slice(
    (notificationPage - 1) * NOTIFICATION_PAGE_SIZE,
    notificationPage * NOTIFICATION_PAGE_SIZE
  );

  // Load a separate history for each clinic on this browser/device.
  useEffect(() => {
    if (!activeClinic || typeof window === "undefined") return;
    setHydratedNotificationClinic(null);
    try {
      const stored = window.localStorage.getItem(`${NOTIFICATION_STORAGE_PREFIX}:${activeClinic.code}`);
      const parsed = stored ? JSON.parse(stored) : [];
      setNotificationLog(Array.isArray(parsed) ? parsed : []);
      setNotificationPage(1);
    } catch {
      setNotificationLog([]);
      setNotificationPage(1);
    } finally {
      setHydratedNotificationClinic(activeClinic.code);
    }
  }, [activeClinic?.code]);

  // Keep the log across logout and browser refreshes. This is browser-local storage,
  // not a shared/server-side audit trail.
  useEffect(() => {
    if (!activeClinic || typeof window === "undefined") return;
    if (hydratedNotificationClinic !== activeClinic.code) return;
    try {
      window.localStorage.setItem(
        `${NOTIFICATION_STORAGE_PREFIX}:${activeClinic.code}`,
        JSON.stringify(notificationLog)
      );
    } catch (error) {
      console.error("Could not save the local notification history.", error);
    }
  }, [activeClinic?.code, notificationLog, hydratedNotificationClinic]);

  function playNotificationPing(force = false) {
    if ((!soundEnabled && !force) || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;
      const context = soundContextRef.current ?? new AudioContextClass();
      soundContextRef.current = context;
      if (context.state === "suspended") void context.resume();

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1174.66, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.23);
    } catch {
      // Browser audio may be blocked until the staff interacts with the page.
    }
  }

  // Auth listener (single copy; the duplicate was removed).
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    // Always start at the staff login when the dashboard is opened
    signOut(auth)
      .catch(() => {})
      .finally(() => {
        if (!mounted) return;
        unsubscribe = onAuthStateChanged(
          auth,
          user => {
            if (!user) {
              if (mounted) {
                setActiveClinic(null);
                setLoadingPatients(false);
                setAuthReady(true);
              }
              return;
            }

            void getStaffClinic(user.uid)
              .then(code => {
                if (!mounted) return;
                setActiveClinic(CLINICS.find(clinic => clinic.code === code) ?? null);
                setLoadingPatients(true);
                setPatientError("");
                setLoginError("");
                setAuthReady(true);
              })
              .catch(async error => {
                if (!mounted) return;
                setActiveClinic(null);
                setLoadingPatients(false);
                setLoginError(error instanceof Error ? error.message : "Could not verify staff access.");
                setAuthReady(true);
                await signOut(auth);
              });
          },
          error => {
            if (!mounted) return;
            setLoadingPatients(false);
            setLoginError(error.message);
            setAuthReady(true);
          },
        );
      });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!activeClinic) {
      seenPatientIdsRef.current = null;
      highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
      highlightTimersRef.current.clear();
      setNewlyAddedPatientIds(new Set());
      setNewPatientToasts([]);
      setPatientState(null);
      setLoadingPatients(false);
      return;
    }

    const clinicCode = activeClinic.code;

    // The initial snapshot establishes the baseline and does not notify.
    seenPatientIdsRef.current = null;
    highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
    highlightTimersRef.current.clear();
    setNewlyAddedPatientIds(new Set());
    setNewPatientToasts([]);
    setLoadingPatients(true);

    const unsubscribe = subscribeToClinicPatients(
      clinicCode,
      (updatedPatients) => {
        const seenIds = seenPatientIdsRef.current;

        if (seenIds === null) {
          seenPatientIdsRef.current = new Set(
            updatedPatients.map((patient) => patient.id)
          );

          setPatientState({
            clinic: clinicCode,
            patients: updatedPatients,
          });
          setPatientError("");
          setLoadingPatients(false);
          return;
        }

        const newPatients = updatedPatients.filter(
          (patient) => !seenIds.has(patient.id)
        );

        // Add every observed ID so routine queue updates don't alert again.
        updatedPatients.forEach((patient) => {
          seenIds.add(patient.id);
        });

        if (newPatients.length > 0) {
          const addedIds = newPatients.map((patient) => patient.id);
          setNewlyAddedPatientIds((previous) => new Set([...previous, ...addedIds]));
          addedIds.forEach((id) => {
            const existingTimer = highlightTimersRef.current.get(id);
            if (existingTimer) clearTimeout(existingTimer);
            const timer = setTimeout(() => {
              setNewlyAddedPatientIds((previous) => {
                const next = new Set(previous);
                next.delete(id);
                return next;
              });
              highlightTimersRef.current.delete(id);
            }, 15000);
            highlightTimersRef.current.set(id, timer);
          });

          const detectedAt = new Date().toISOString();
          const newRecords: QueueNotification[] = newPatients.map((patient) => ({
            id: `${clinicCode}-${patient.id}-${detectedAt}`,
            ticketCode: patient.ticketCode,
            category: patient.category,
            clinicCode,
            clinicName: CLINICS.find((clinic) => clinic.code === clinicCode)?.name ?? clinicCode,
            createdAt: detectedAt,
            read: false,
          }));

          setNotificationLog((previous) => [...newRecords, ...previous]);
          setNewPatientToasts((previous) => [
            ...newPatients.map((patient, index) => ({
              id: `${patient.id}-${detectedAt}-${index}`,
              ticketCode: patient.ticketCode,
              clinicName: CLINICS.find((clinic) => clinic.code === clinicCode)?.name ?? clinicCode,
              expiresAt: Date.now() + TOAST_LIFETIME_MS,
              exiting: false,
            })),
            ...previous,
          ]);
          playNotificationPing();
        }

        setPatientState({
          clinic: clinicCode,
          patients: updatedPatients,
        });
        setPatientError("");
        setLoadingPatients(false);
      },
      (error) => {
        setPatientError(
          error instanceof Error
            ? error.message
            : "Could not load the live clinic queue."
        );
        setLoadingPatients(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeClinic?.code]);

  useEffect(() => {
    return () => {
      highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
      highlightTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (newPatientToasts.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    newPatientToasts.forEach((toast) => {
      const fadeDelay = Math.max(0, toast.expiresAt - Date.now() - TOAST_FADE_MS);
      const removeDelay = Math.max(0, toast.expiresAt - Date.now());
      if (!toast.exiting) {
        timers.push(setTimeout(() => {
          setNewPatientToasts((previous) => previous.map((item) =>
            item.id === toast.id ? { ...item, exiting: true } : item
          ));
        }, fadeDelay));
      }
      timers.push(setTimeout(() => {
        setNewPatientToasts((previous) => previous.filter((item) => item.id !== toast.id));
      }, removeDelay));
    });

    return () => timers.forEach(clearTimeout);
  }, [newPatientToasts]);

  function markNotificationRead(id: string) {
    setNotificationLog((previous) => previous.map((item) => item.id === id ? { ...item, read: true } : item));
  }

  function markAllNotificationsRead() {
    setNotificationLog((previous) => previous.map((item) => ({ ...item, read: true })));
  }

  async function commit(next: Patient[]): Promise<string | null> {
    const promoted = promoteAll(next);
    try {
      await persistPatientStatuses(patients, promoted);
      if (activeClinic) setPatientState({ clinic: activeClinic.code, patients: promoted });
      setPatientError("");
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the queue.";
      setPatientError(message);
      return message;
    }
  }

  async function handleLogin(email: string, password: string): Promise<string | null> {
    setLoginError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const clinicCode = await getStaffClinic(credential.user.uid);
      const clinic = CLINICS.find(item => item.code === clinicCode);
      if (!clinic) throw new Error("This staff account has an invalid clinic assignment.");
      setLoadingPatients(true);
      setPatientError("");
      setActiveClinic(clinic);
      return null;
    } catch (error) {
      if (auth.currentUser) await signOut(auth);
      const message = error instanceof FirebaseError
        ? error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password"
          ? "Email or password is incorrect."
          : error.message
        : error instanceof Error
          ? error.message
          : "Could not sign in to the clinic dashboard.";
      setLoginError(message);
      return message;
    }
  }

  async function handleLogout() {
    setShowCompleted(false);
    setShowHistory(false);
    setActiveClinic(null);
    setLoadingPatients(false);
    try {
      await signOut(auth);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Could not sign out of the clinic dashboard.");
    }
  }

  // Re-queue a completed patient as waiting, preserving the active serving patient.
  function handleRequeueCompleted(patient: Patient) {
    commit(patients.map(p => p.id === patient.id
      ? { ...p, status: 'waiting' as const, completedAt: undefined }
      : p));
    setShowCompleted(false);
  }

  // Call a completed patient immediately. If another patient is being served,
  // return that patient to waiting rather than leaving two patients as serving.
  function handleCallCompletedNow(patient: Patient) {
    commit(patients.map(p => {
      if (p.id === patient.id) return { ...p, status: 'serving' as const, completedAt: undefined };
      if (p.clinic === patient.clinic && p.status === 'serving') return { ...p, status: 'waiting' as const };
      return p;
    }));
    setShowCompleted(false);
  }

  if (!authReady) {
    return <div className="min-h-screen bg-slate-900 p-8 text-center text-slate-300">Checking staff sign-in…</div>;
  }
  if (!activeClinic) return <ClinicLogin onLogin={handleLogin} errorMessage={loginError} />;

  const allCompleted = patients
    .filter(p => p.clinic === activeClinic.code && p.status === 'done')
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());
  const completedLast24Hours = allCompleted.filter(p => {
    if (!p.completedAt) return false;
    const completedAtMs = new Date(p.completedAt).getTime();
    const ageMs = Date.now() - completedAtMs;
    return Number.isFinite(completedAtMs) && ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;
  });

  if (showHistory) {
    return <PatientHistoryPage clinic={activeClinic} patients={allCompleted} onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top bar: title (left) + completed button & 3-bar menu (right) */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white">OPD Specialized Clinic</h2>
            <p className="text-sm text-slate-400">Live clinic queue · Staff-controlled patient calling</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowNotificationLog((open) => !open);
                markAllNotificationsRead();
              }}
              aria-label={`Notifications, ${unreadNotificationCount} unread`}
              aria-expanded={showNotificationLog}
              className="relative flex h-11 items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Bell className="h-5 w-5 text-cyan-300" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white ring-2 ring-slate-900">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) {
                  setSoundEnabled(false);
                } else {
                  setSoundEnabled(true);
                  playNotificationPing(true);
                }
              }}
              aria-label={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
              title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-200 transition hover:bg-slate-700"
            >
              {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <CompletedButton count={completedLast24Hours.length} onClick={() => setShowCompleted(true)} />
            <MenuButton onHistory={() => setShowHistory(true)} onLogout={handleLogout} />
          </div>
        </div>

        {loginError && (
          <p role="alert" className="mb-4 rounded-xl border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {loginError}
          </p>
        )}
        {patientError && (
          <p role="alert" className="mb-4 rounded-xl border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            Live patient data error: {patientError}
          </p>
        )}
        <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
          {newPatientToasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto rounded-2xl border border-cyan-400/30 bg-slate-900 p-4 shadow-2xl shadow-black/30 transition-all duration-500 ease-in-out ${toast.exiting ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                  <ClipboardList size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">New Patient Added</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Ticket <span className="font-bold text-cyan-300">{displayNumber(toast.ticketCode)}</span> has been added to the {toast.clinicName} queue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPatientToasts((previous) => previous.filter((item) => item.id !== toast.id))}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showNotificationLog && (
          <section
            role="region"
            aria-label="Notification history"
            className="fixed right-4 top-20 z-[90] flex max-h-[75vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
              <div>
                <h3 className="font-black text-white">Notification History</h3>
                <p className="text-xs text-slate-400">{notificationLog.length} records · saved on this browser</p>
              </div>
              <button type="button" onClick={() => setShowNotificationLog(false)} aria-label="Close notification history" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Bell className="mx-auto mb-3 text-slate-500" size={28} />
                  <p className="font-semibold text-slate-200">No notifications yet</p>
                  <p className="mt-1 text-sm text-slate-400">New queue entries will appear here.</p>
                </div>
              ) : visibleNotifications.map((notification) => (
                <div key={notification.id} className={`border-b border-slate-800 px-4 py-3 ${notification.read ? "bg-slate-900" : "bg-cyan-950/30"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-slate-600" : "bg-cyan-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-white">Ticket {displayNumber(notification.ticketCode)}</p>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{notification.category}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">Added to {notification.clinicName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
                    </div>
                    {!notification.read && (
                      <button type="button" onClick={() => markNotificationRead(notification.id)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/50">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-700 px-4 py-3">
              <p className="text-xs text-slate-400">Page {notificationPage} of {pageCount}</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={notificationPage <= 1} onClick={() => setNotificationPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                  Previous
                </button>
                <button type="button" disabled={notificationPage >= pageCount} onClick={() => setNotificationPage((page) => Math.min(pageCount, page + 1))} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          </section>
        )}
        {loadingPatients && <p role="status" className="mb-4 rounded-xl border border-cyan-800 bg-cyan-950/40 px-4 py-3 text-sm text-cyan-200">Connecting to the live clinic queue…</p>}
        {!loadingPatients && !patientError && <p role="status" className="mb-4 text-xs text-emerald-300">● Live queue connected</p>}
        <ClinicQueue clinic={activeClinic} allPatients={patients} onUpdate={commit} newlyAddedPatientIds={newlyAddedPatientIds} />

      </div>


      {showCompleted && (
        <CompletedModal
          clinic={activeClinic}
          patients={completedLast24Hours}
          onClose={() => setShowCompleted(false)}
          onRequeue={handleRequeueCompleted}
          onCallNow={handleCallCompletedNow}
        />
      )}
    </div>
  );
}