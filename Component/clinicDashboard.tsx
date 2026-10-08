'use client'
import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'URGENT' | 'PRIORITY' | 'REGULAR';
type ClinicCode = 'SUR' | 'PED' | 'OBG' | 'ENT' | 'IM' | 'ER';

interface Vitals {
  bp: string;     // mmHg, e.g. "120/80"
  hr: number;     // bpm
  rr: number;     // breaths/min
  temp: number;   // °C
  spo2: number;   // %
}

interface Complaint {
  complaint: string;
  duration: string;            // e.g. "3 days"
  severity: string | number;   // e.g. "Severe" or 8
  location: string;            // e.g. "Right lower abdomen"
}

interface Patient {
  id: string;
  ticketCode: string;          // e.g. "SUR-U-001"
  name: string;
  age: number;
  sex: 'M' | 'F';
  chiefComplaints: Complaint[];
  vitals?: Vitals | null;
  category: Category;
  clinic: ClinicCode;
  status: 'waiting' | 'serving' | 'done';
  queueNumber: number;
  arrivedAt: string;
  completedAt?: string;        // ISO string, set when finished
}

interface Clinic {
  code: ClinicCode;
  name: string;
  staffId: string;
  staffCode: string;
  color: string;
  isER?: boolean;
}

// ─── Clinic Definitions (config, not patient data) ───────────────────────────

const CLINICS: Clinic[] = [
  { code: 'SUR', name: 'Surgery',           staffId: 'Surgery',    staffCode: '111', color: 'cyan'   },
  { code: 'PED', name: 'Pediatrics',        staffId: 'Pediatrics', staffCode: '222', color: 'green'  },
  { code: 'OBG', name: 'OB-GYN',            staffId: 'Obgyne',     staffCode: '333', color: 'pink'   },
  { code: 'ENT', name: 'ENT',               staffId: 'ENT',        staffCode: '444', color: 'purple' },
  { code: 'IM',  name: 'Internal Medicine', staffId: 'IM',         staffCode: '555', color: 'blue'   },
  { code: 'ER',  name: 'Emergency Dept.',   staffId: 'ER',         staffCode: '666', color: 'red', isER: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// "SUR-U-001" -> "U-001", "ER-E-001" -> "E-001"
function displayNumber(ticketCode: string): string {
  return ticketCode.split('-').slice(1).join('-');
}

const CAT_ORDER: Category[] = ['URGENT', 'PRIORITY', 'REGULAR'];

const CAT_STYLE: Record<Category, { bg: string; text: string; badge: string; label: string }> = {
  URGENT:   { bg: 'bg-red-600',    text: 'text-white', badge: 'bg-red-600 text-white',    label: 'URGENT (U)'   },
  PRIORITY: { bg: 'bg-orange-400', text: 'text-white', badge: 'bg-orange-400 text-white', label: 'PRIORITY (P)' },
  REGULAR:  { bg: 'bg-green-500',  text: 'text-white', badge: 'bg-green-500 text-white',  label: 'REGULAR (R)'  },
};

function sortQueue(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const ao = CAT_ORDER.indexOf(a.category);
    const bo = CAT_ORDER.indexOf(b.category);
    if (ao !== bo) return ao - bo;
    return a.queueNumber - b.queueNumber;
  });
}

// If nobody is being served in this clinic, the next waiting patient becomes "serving"
function promoteNext(list: Patient[], clinic: ClinicCode): Patient[] {
  if (list.some(p => p.clinic === clinic && p.status === 'serving')) return list;
  const next = sortQueue(list.filter(p => p.clinic === clinic && p.status === 'waiting'))[0];
  if (!next) return list;
  return list.map(p => (p.id === next.id ? { ...p, status: 'serving' as const } : p));
}

function promoteAll(list: Patient[]): Patient[] {
  return CLINICS.reduce((acc, c) => promoteNext(acc, c.code), list);
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

// ─── Small components ─────────────────────────────────────────────────────────

function VitalsGrid({ vitals, large = false }: { vitals?: Vitals | null; large?: boolean }) {
  const items = [
    { label: 'BP',   value: vitals?.bp ?? '—',                                   unit: 'mmHg' },
    { label: 'HR',   value: vitals?.hr != null ? String(vitals.hr) : '—',        unit: 'bpm'  },
    { label: 'RR',   value: vitals?.rr != null ? String(vitals.rr) : '—',        unit: '/min' },
    { label: 'Temp', value: vitals?.temp != null ? vitals.temp.toFixed(1) : '—', unit: '°C'   },
    { label: 'SpO₂', value: vitals?.spo2 != null ? String(vitals.spo2) : '—',    unit: '%'    },
  ];
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-5 ${large ? 'gap-3' : 'gap-2'}`}>
      {items.map(v => (
        <div key={v.label} className={`rounded-xl bg-slate-900/60 border border-cyan-800/60 ${large ? 'px-4 py-3' : 'px-2 py-1.5'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{v.label}</p>
          <p className={`${large ? 'text-2xl' : 'text-sm'} font-black text-white leading-tight`}>
            {v.value} <span className="text-xs font-medium text-slate-400">{v.unit}</span>
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

// Compact card for waiting patients
function CompactCard({ patient }: { patient: Patient }) {
  const cat = CAT_STYLE[patient.category];
  const extra = patient.chiefComplaints.length - 1;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2">
      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider ${cat.badge}`}>
        {displayNumber(patient.ticketCode)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{patient.name}</p>
        <p className="truncate text-xs text-slate-400">
          {patient.age} y/o · {patient.sex} · {firstComplaint(patient)}
          {extra > 0 ? ` +${extra}` : ''}
        </p>
      </div>
    </div>
  );
}

// Large card for the patient being served. Shows the titles with "—" when empty.
function NowServingBanner({ patient, onFinish }: { patient: Patient | null; onFinish: () => void }) {
  const cat = patient ? CAT_STYLE[patient.category] : null;
  const complaints = patient?.chiefComplaints ?? [];

  return (
    <div className="w-full rounded-3xl bg-cyan-950 border border-cyan-400 ring-2 ring-cyan-400 p-6 sm:p-8">
      <p className={`text-xs font-bold tracking-widest text-cyan-400 mb-4 ${patient ? 'animate-pulse' : ''}`}>
        {patient ? '● NOW SERVING' : 'NOW SERVING'}
      </p>

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
          <Field label="Age" value={patient ? `${patient.age} y/o` : '—'} />
          <Field label="Sex" value={patient?.sex ?? '—'} />
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Arrived At</p>
            <p className="text-lg font-bold text-white">{patient?.arrivedAt ?? '—'}</p>
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

      <div className="mt-8 flex justify-end">
        <button
          onClick={onFinish}
          disabled={!patient}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-8 py-3 text-base font-bold text-white transition-colors"
        >
          Finish
        </button>
      </div>
    </div>
  );
}

// ─── Clinic Queue ─────────────────────────────────────────────────────────────

function ClinicQueue({ clinic, allPatients, onUpdate }: {
  clinic: Clinic;
  allPatients: Patient[];
  onUpdate: (patients: Patient[]) => void;
}) {
  const myPatients = allPatients.filter(p => p.clinic === clinic.code && p.status !== 'done');
  const serving = myPatients.find(p => p.status === 'serving') ?? null;
  const waiting = sortQueue(myPatients.filter(p => p.status === 'waiting'));

  const grouped: Record<Category, Patient[]> = {
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
    e1: myPatients.filter(p => p.category === 'URGENT').length,
    e2: myPatients.filter(p => p.category !== 'URGENT').length,
  };

  // Finish the current patient; the next one in line is promoted automatically
  function handleFinish(patient: Patient) {
    onUpdate(
      allPatients.map(p =>
        p.id === patient.id
          ? { ...p, status: 'done' as const, completedAt: new Date().toISOString() }
          : p
      )
    );
  }

  const isER = clinic.isER;

  return (
    <div className="text-slate-100">
      <header className={`sticky top-0 z-20 rounded-2xl border ${isER ? 'border-red-800 bg-red-950' : 'border-slate-700 bg-slate-900/95'} backdrop-blur-sm`}>
        <div className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-8 rounded-full ${isER ? 'bg-red-500' : 'bg-cyan-500'}`} />
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">NMMC · BICA</p>
              <h1 className="text-xl font-black text-white">{clinic.name} Clinic Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isER ? (
              <>
                <div className="rounded-xl bg-red-600/20 border border-red-600/40 px-3 py-1.5 text-center">
                  <p className="text-xs text-red-400 font-bold">E1</p>
                  <p className="text-2xl font-black text-red-400 leading-none">{erCounts.e1}</p>
                </div>
                <div className="rounded-xl bg-red-600/20 border border-red-600/40 px-3 py-1.5 text-center">
                  <p className="text-xs text-red-400 font-bold">E2</p>
                  <p className="text-2xl font-black text-red-400 leading-none">{erCounts.e2}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-red-600/20 border border-red-600/40 px-3 py-1.5">
                  <p className="text-xs text-red-400 font-bold">URGENT</p>
                  <p className="text-2xl font-black text-red-400 leading-none">{counts.urgent}</p>
                </div>
                <div className="rounded-xl bg-orange-500/20 border border-orange-500/40 px-3 py-1.5">
                  <p className="text-xs text-orange-400 font-bold">PRIORITY</p>
                  <p className="text-2xl font-black text-orange-400 leading-none">{counts.priority}</p>
                </div>
                <div className="rounded-xl bg-green-600/20 border border-green-600/40 px-3 py-1.5">
                  <p className="text-xs text-green-400 font-bold">REGULAR</p>
                  <p className="text-2xl font-black text-green-400 leading-none">{counts.regular}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="py-6 space-y-6">
        <NowServingBanner
          patient={serving}
          onFinish={() => { if (serving) handleFinish(serving); }}
        />

        {CAT_ORDER.filter(cat => (isER ? cat === 'URGENT' : true)).map(cat => {
          const group = grouped[cat];
          const style = CAT_STYLE[cat];
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`rounded-lg px-3 py-1 text-xs font-black tracking-widest ${style.badge}`}>{style.label}</span>
                <span className="text-sm text-slate-500">{group.length} patient{group.length !== 1 ? 's' : ''} waiting</span>
              </div>
              {group.length === 0 ? (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 py-4 text-center text-slate-500 text-sm">
                  No {cat.toLowerCase()} patients in queue
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map(p => <CompactCard key={p.id} patient={p} />)}
                </div>
              )}
            </section>
          );
        })}
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

// Recently completed: Queue | Name | Chief complaint (one) | Call again
function CompletedModal({ clinic, patients, onClose, onCallAgain }: {
  clinic: Clinic;
  patients: Patient[];
  onClose: () => void;
  onCallAgain: (p: Patient) => void;
}) {
  return (
    <ModalShell subtitle={clinic.name} title="Recently Completed" onClose={onClose} wide>
      {patients.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No completed patients yet.</p>
      ) : (
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[90px_1fr_1fr_110px] gap-4 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Queue</span>
            <span>Name</span>
            <span>Chief Complaint</span>
            <span />
          </div>
          <ul className="space-y-2">
            {patients.map(p => (
              <li
                key={p.id}
                className="grid grid-cols-[90px_1fr_1fr_110px] items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2"
              >
                <span className={`w-fit rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider ${CAT_STYLE[p.category].badge}`}>
                  {displayNumber(p.ticketCode)}
                </span>
                <span className="truncate text-sm font-semibold text-white">{p.name}</span>
                <span className="truncate text-sm text-slate-300">{firstComplaint(p)}</span>
                <button
                  onClick={() => onCallAgain(p)}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                >
                  Call again
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ModalShell>
  );
}

// Patient history: full details of every completed patient
function HistoryModal({ clinic, patients, onClose }: { clinic: Clinic; patients: Patient[]; onClose: () => void }) {
  return (
    <ModalShell subtitle={clinic.name} title="Patient History" onClose={onClose}>
      {patients.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No completed patients yet.</p>
      ) : (
        <div className="space-y-3">
          {patients.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider ${CAT_STYLE[p.category].badge}`}>
                  {displayNumber(p.ticketCode)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.age} y/o · {p.sex} · Arrived {p.arrivedAt}</p>
                </div>
                <p className="text-[11px] text-slate-500">Completed {formatDateTime(p.completedAt)}</p>
              </div>
              <div className="mt-3 space-y-1">
                {p.chiefComplaints.map((c, i) => (
                  <p key={i} className="text-xs text-slate-300">
                    <span className="font-semibold text-white">{c.complaint}</span>
                    {' · '}{c.duration || '—'}{' · '}{c.severity !== '' && c.severity != null ? c.severity : '—'}{' · '}{c.location || '—'}
                  </p>
                ))}
              </div>
              <div className="mt-3">
                <VitalsGrid vitals={p.vitals} />
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function ClinicLogin({ onLogin }: { onLogin: (id: string, code: string) => string | null }) {
  const [staffId, setStaffId] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [time, setTime] = useState(now());

  useEffect(() => {
    const t = setInterval(() => setTime(now()), 10000);
    return () => clearInterval(t);
  }, []);

  function handleSubmit() {
    setError('');
    const err = onLogin(staffId.trim(), staffCode.trim());
    if (err) setError(err);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-cyan-950 border-2 border-cyan-600 mb-4">
          <span className="text-3xl font-black text-cyan-400">B</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">BICA</h1>
        <p className="text-slate-400 text-sm mt-1">Better Informed Care Access · NMMC</p>
        <p className="text-slate-500 text-xs mt-1">{time}</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Staff Login</h2>
        <p className="text-slate-500 text-xs mb-6">Enter your credentials to access your clinic dashboard.</p>

        <div className="mb-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Staff ID</label>
          <input
            type="text"
            value={staffId}
            onChange={e => { setStaffId(e.target.value); setError(''); }}
            placeholder="e.g. NMMC-SUR-047"
            className="w-full rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Access Code</label>
          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              value={staffCode}
              onChange={e => { setStaffCode(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter access code"
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

        {error && (
          <div className="mb-4 rounded-xl bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold py-3 transition-colors"
        >
          Access Dashboard →
        </button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface ClinicDashboardProps {
  onBack: () => void;
  /** Live patient data coming in (from your API / socket / Supabase / etc.) */
  patients?: Patient[];
  /** Called whenever the dashboard changes patient status (finish / call again) */
  onPatientsChange?: (patients: Patient[]) => void;
}

export default function ClinicDashboard({ onBack, patients: incoming, onPatientsChange }: ClinicDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>(() => promoteAll(incoming ?? []));
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sync whenever new data arrives from outside
  useEffect(() => {
    if (incoming) setPatients(promoteAll(incoming));
  }, [incoming]);

  // Apply a change, auto-promote the next patient, and report it upstream
  function commit(next: Patient[]) {
    const promoted = promoteAll(next);
    setPatients(promoted);
    onPatientsChange?.(promoted);
  }

  function handleLogin(id: string, code: string): string | null {
    const clinic = CLINICS.find(c => c.staffId === id);
    if (!clinic) return 'Staff ID not found.';
    if (code !== clinic.staffCode) return 'Incorrect access code.';
    setActiveClinic(clinic);
    return null;
  }

  function handleLogout() {
    setShowCompleted(false);
    setShowHistory(false);
    setActiveClinic(null);
  }

  // Call a completed patient again: they become "serving";
  // whoever was being served goes back to waiting and keeps their place in line
  function handleCallAgain(patient: Patient) {
    commit(
      patients.map(p => {
        if (p.id === patient.id) return { ...p, status: 'serving' as const, completedAt: undefined };
        if (p.clinic === patient.clinic && p.status === 'serving') return { ...p, status: 'waiting' as const };
        return p;
      })
    );
    setShowCompleted(false);
  }

  if (!activeClinic) return <ClinicLogin onLogin={handleLogin} />;

  const completed = patients
    .filter(p => p.clinic === activeClinic.code && p.status === 'done')
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top bar: title (left) + completed button & 3-bar menu (right) */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white">OPD Specialized Clinic</h2>
            <p className="text-sm text-slate-400">Streamlining Patient Intake</p>
          </div>
          <div className="flex items-center gap-3">
            <CompletedButton count={completed.length} onClick={() => setShowCompleted(true)} />
            <MenuButton onHistory={() => setShowHistory(true)} onLogout={handleLogout} />
          </div>
        </div>

        <ClinicQueue clinic={activeClinic} allPatients={patients} onUpdate={commit} />
      </div>

      {showCompleted && (
        <CompletedModal
          clinic={activeClinic}
          patients={completed}
          onClose={() => setShowCompleted(false)}
          onCallAgain={handleCallAgain}
        />
      )}
      {showHistory && (
        <HistoryModal clinic={activeClinic} patients={completed} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
