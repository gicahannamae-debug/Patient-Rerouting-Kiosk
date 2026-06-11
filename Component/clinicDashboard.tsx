'use client'
import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'URGENT' | 'PRIORITY' | 'REGULAR';
type ClinicCode = 'SUR' | 'PED' | 'OBG' | 'ENT' | 'IM' | 'ER';

interface Patient {
  id: string;
  ticketCode: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  chiefComplaints: string[];
  category: Category;
  clinic: ClinicCode;
  status: 'waiting' | 'serving' | 'done';
  queueNumber: number;
  arrivedAt: string;
  completedAt?: string;
}

interface Clinic {
  code: ClinicCode;
  name: string;
  staffId: string;
  staffCode: string;
  color: string;
  isER?: boolean;
}

// ─── Clinic Definitions ───────────────────────────────────────────────────────

const CLINICS: Clinic[] = [
  { code: 'SUR', name: 'Surgery',           staffId: 'sur', staffCode: 's123', color: 'cyan'   },
  { code: 'PED', name: 'Pediatrics',        staffId: 'pedia', staffCode: 'p123', color: 'green'  },
  { code: 'OBG', name: 'OB-GYN',           staffId: 'obgyn', staffCode: 'o123', color: 'pink'   },
  { code: 'ENT', name: 'ENT',              staffId: 'ent', staffCode: 'e123', color: 'purple' },
  { code: 'IM',  name: 'Internal Medicine', staffId: 'im',  staffCode: 'i123', color: 'blue'   },
  { code: 'ER',  name: 'Emergency Dept.',  staffId: 'er',  staffCode: 'e123', color: 'red', isER: true },
];

// ─── Seed / Mock Data ─────────────────────────────────────────────────────────

function generateTicket(clinic: ClinicCode, cat: Category, num: number): string {
  const catCode = cat === 'URGENT' ? 'U' : cat === 'PRIORITY' ? 'P' : cat === 'REGULAR' ? 'R' : 'E';
  return `${clinic}-${catCode}-${String(num).padStart(3, '0')}`;
}

const SEED_PATIENTS: Patient[] = [
  // Surgery
  { id:'p1',  ticketCode: generateTicket('SUR','URGENT',1),   name:'Maria Santos',    age:58, sex:'F', chiefComplaints:['Severe abdominal pain','Vomiting'],       category:'URGENT',   clinic:'SUR', status:'waiting', queueNumber:1,  arrivedAt:'08:12' },
  { id:'p2',  ticketCode: generateTicket('SUR','URGENT',2),   name:'Ricardo Diaz',    age:44, sex:'M', chiefComplaints:['Post-op wound dehiscence'],               category:'URGENT',   clinic:'SUR', status:'waiting', queueNumber:2,  arrivedAt:'08:30' },
  { id:'p3',  ticketCode: generateTicket('SUR','PRIORITY',1), name:'Elena Cruz',      age:36, sex:'F', chiefComplaints:['Inguinal hernia','Pain on movement'],      category:'PRIORITY', clinic:'SUR', status:'waiting', queueNumber:3,  arrivedAt:'08:45' },
  { id:'p4',  ticketCode: generateTicket('SUR','REGULAR',1),  name:'Jose Reyes',      age:62, sex:'M', chiefComplaints:['Skin cyst removal follow-up'],            category:'REGULAR',  clinic:'SUR', status:'waiting', queueNumber:4,  arrivedAt:'09:00' },
  // Pediatrics
  { id:'p5',  ticketCode: generateTicket('PED','URGENT',1),   name:'Leo Aquino',      age:3,  sex:'M', chiefComplaints:['High fever 40°C','Febrile seizure'],      category:'URGENT',   clinic:'PED', status:'waiting', queueNumber:1,  arrivedAt:'08:20' },
  { id:'p6',  ticketCode: generateTicket('PED','PRIORITY',1), name:'Ana Bautista',    age:7,  sex:'F', chiefComplaints:['Persistent cough','Mild wheezing'],       category:'PRIORITY', clinic:'PED', status:'waiting', queueNumber:2,  arrivedAt:'08:50' },
  { id:'p7',  ticketCode: generateTicket('PED','REGULAR',1),  name:'Carlo Mendoza',   age:5,  sex:'M', chiefComplaints:['Routine vaccination'],                    category:'REGULAR',  clinic:'PED', status:'waiting', queueNumber:3,  arrivedAt:'09:10' },
  // OB-GYN
  { id:'p8',  ticketCode: generateTicket('OBG','URGENT',1),   name:'Lina Villanueva', age:28, sex:'F', chiefComplaints:['Vaginal bleeding','Abdominal cramps'],    category:'URGENT',   clinic:'OBG', status:'waiting', queueNumber:1,  arrivedAt:'08:05' },
  { id:'p9',  ticketCode: generateTicket('OBG','PRIORITY',1), name:'Grace Flores',    age:32, sex:'F', chiefComplaints:['Prenatal check-up — 3rd trimester'],      category:'PRIORITY', clinic:'OBG', status:'waiting', queueNumber:2,  arrivedAt:'08:55' },
  { id:'p10', ticketCode: generateTicket('OBG','REGULAR',1),  name:'Luz Tan',         age:45, sex:'F', chiefComplaints:['Pap smear follow-up'],                    category:'REGULAR',  clinic:'OBG', status:'waiting', queueNumber:3,  arrivedAt:'09:05' },
  // ENT
  { id:'p11', ticketCode: generateTicket('ENT','URGENT',1),   name:'Ramon Garcia',    age:50, sex:'M', chiefComplaints:['Sudden hearing loss','Dizziness'],        category:'URGENT',   clinic:'ENT', status:'waiting', queueNumber:1,  arrivedAt:'08:35' },
  { id:'p12', ticketCode: generateTicket('ENT','PRIORITY',1), name:'Nora Ocampo',     age:39, sex:'F', chiefComplaints:['Nasal polyp obstruction'],                category:'PRIORITY', clinic:'ENT', status:'waiting', queueNumber:2,  arrivedAt:'09:00' },
  { id:'p13', ticketCode: generateTicket('ENT','REGULAR',1),  name:'Ben Navarro',     age:29, sex:'M', chiefComplaints:['Throat irritation','Tonsil swelling'],    category:'REGULAR',  clinic:'ENT', status:'waiting', queueNumber:3,  arrivedAt:'09:20' },
  // Internal Medicine
  { id:'p14', ticketCode: generateTicket('IM','URGENT',1),    name:'Dolores Lim',     age:70, sex:'F', chiefComplaints:['Chest tightness','Shortness of breath'],  category:'URGENT',   clinic:'IM',  status:'waiting', queueNumber:1,  arrivedAt:'08:00' },
  { id:'p15', ticketCode: generateTicket('IM','PRIORITY',1),  name:'Felix Castro',    age:55, sex:'M', chiefComplaints:['Uncontrolled hypertension','Headache'],   category:'PRIORITY', clinic:'IM',  status:'waiting', queueNumber:2,  arrivedAt:'08:40' },
  { id:'p16', ticketCode: generateTicket('IM','REGULAR',1),   name:'Myra Dela Cruz',  age:48, sex:'F', chiefComplaints:['Diabetes monitoring follow-up'],          category:'REGULAR',  clinic:'IM',  status:'waiting', queueNumber:3,  arrivedAt:'09:15' },
  // ER
  { id:'p17', ticketCode: 'ER-E-001', name:'Andres Ramos',    age:34, sex:'M', chiefComplaints:['Severe chest pain','Diaphoresis'],          category:'URGENT',   clinic:'ER',  status:'waiting', queueNumber:1,  arrivedAt:'08:02' },
  { id:'p18', ticketCode: 'ER-E-002', name:'Cynthia Rojas',   age:21, sex:'F', chiefComplaints:['RTA — head trauma','LOC episode'],          category:'URGENT',   clinic:'ER',  status:'waiting', queueNumber:2,  arrivedAt:'08:18' },
  { id:'p19', ticketCode: 'ER-E-003', name:'Mario Dela Vega', age:65, sex:'M', chiefComplaints:['Stroke symptoms — facial droop'],           category:'URGENT',   clinic:'ER',  status:'waiting', queueNumber:3,  arrivedAt:'08:44' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_ORDER: Category[] = ['URGENT', 'PRIORITY', 'REGULAR'];

const CAT_STYLE: Record<Category, { bg: string; text: string; badge: string; label: string }> = {
  URGENT:   { bg: 'bg-red-600',    text: 'text-white',       badge: 'bg-red-600 text-white',         label: 'URGENT (U)'   },
  PRIORITY: { bg: 'bg-orange-400', text: 'text-white',       badge: 'bg-orange-400 text-white',      label: 'PRIORITY (P)' },
  REGULAR:  { bg: 'bg-green-500',  text: 'text-white',       badge: 'bg-green-500 text-white',       label: 'REGULAR (R)'  },
};

function sortQueue(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const ao = CAT_ORDER.indexOf(a.category);
    const bo = CAT_ORDER.indexOf(b.category);
    if (ao !== bo) return ao - bo;
    return a.queueNumber - b.queueNumber;
  });
}

function now(): string {
  return new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PatientCard({ patient, onServe, onDone, isServing }: {
  patient: Patient;
  onServe: () => void;
  onDone: () => void;
  isServing: boolean;
}) {
  const cat = CAT_STYLE[patient.category];
  return (
    <div className={`rounded-2xl border ${isServing ? 'border-cyan-400 bg-cyan-950/80 ring-2 ring-cyan-400' : 'border-slate-700 bg-slate-800/60'} p-4 transition-all duration-300`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold tracking-wider ${cat.badge}`}>
            {patient.ticketCode}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{patient.name}</p>
            <p className="text-xs text-slate-400">{patient.age} y/o · {patient.sex === 'M' ? 'Male' : 'Female'} · Arrived {patient.arrivedAt}</p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-2 items-end">
          {!isServing && patient.status === 'waiting' && (
            <button onClick={onServe} className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold px-3 py-1.5 transition-colors">
              Call Now
            </button>
          )}
          <button onClick={onDone} className={`rounded-xl ${isServing ? 'bg-slate-600 hover:bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white text-xs font-bold px-3 py-1.5 transition-colors`}>
            {isServing ? 'Done' : 'Finish'}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {patient.chiefComplaints.map((c, i) => (
          <span key={i} className="rounded-lg bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{c}</span>
        ))}
      </div>
      {isServing && (
        <p className="mt-2 text-xs font-semibold text-cyan-400 tracking-wide animate-pulse">● NOW SERVING</p>
      )}
    </div>
  );
}

function NowServingBanner({ patient, canFinish, onFinish }: { patient: Patient | null; canFinish: boolean; onFinish: () => void }) {
  if (!patient) return null;
  const cat = CAT_STYLE[patient.category];
  return (
    <div className="rounded-2xl bg-cyan-950 border border-cyan-400 ring-2 ring-cyan-400 p-6 mb-6">
      <p className="text-xs font-bold tracking-widest text-cyan-400 mb-3">NOW SERVING</p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`text-center rounded-2xl ${cat.bg} px-6 py-4 min-w-[120px]`}>
          <p className="text-3xl font-black text-white tracking-widest">{patient.ticketCode}</p>
          <p className={`mt-1 text-xs font-bold text-white/80`}>{cat.label}</p>
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Patient Name</p>
            <p className="text-lg font-bold text-white">{patient.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Age / Sex</p>
            <p className="text-lg font-bold text-white">{patient.age} y/o · {patient.sex === 'M' ? 'Male' : 'Female'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Arrived At</p>
            <p className="text-lg font-bold text-white">{patient.arrivedAt}</p>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Chief Complaints</p>
            <div className="flex flex-wrap gap-1.5">
              {patient.chiefComplaints.map((c, i) => (
                <span key={i} className="rounded-lg bg-cyan-800 text-cyan-100 px-2.5 py-0.5 text-sm font-medium">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {canFinish && (
        <div className="mt-6 flex justify-end">
          <button onClick={onFinish} className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors">
            Finish patient
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Clinic Dashboard ─────────────────────────────────────────────────────────

function ClinicQueue({ clinic, allPatients, onUpdate, onLogout }: {
  clinic: Clinic;
  allPatients: Patient[];
  onUpdate: (patients: Patient[]) => void;
  onLogout: () => void;
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

  function handleServe(patient: Patient) {
    const updated = allPatients.map(p => {
      if (p.id === patient.id) return { ...p, status: 'serving' as const };
      if (p.clinic === clinic.code && p.status === 'serving') return { ...p, status: 'done' as const, completedAt: new Date().toLocaleString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
      return p;
    });
    onUpdate(updated);
  }

  function handleDone(patient: Patient) {
    const updated = allPatients.map(p =>
      p.id === patient.id ? { ...p, status: 'done' as const, completedAt: p.completedAt ?? new Date().toLocaleString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } : p
    );
    onUpdate(updated);
  }

  const isER = clinic.isER;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b ${isER ? 'border-red-800 bg-red-950' : 'border-slate-700 bg-slate-900/95'} backdrop-blur-sm`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-8 rounded-full ${isER ? 'bg-red-500' : 'bg-cyan-500'}`} />
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">NMMC · BICA</p>
              <h1 className="text-xl font-black text-white">{clinic.name} Clinic Dashboard </h1>
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Now Serving */}
        <NowServingBanner
          patient={serving}
          canFinish={!!serving && waiting.length === 0}
          onFinish={() => { if (serving) handleDone(serving); }}
        />

        {/* Queue by category */}
        {CAT_ORDER.filter(cat => isER ? cat === 'URGENT' : true).map(cat => {
          const group = grouped[cat];
          const style = CAT_STYLE[cat];
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`rounded-lg px-3 py-1 text-xs font-black tracking-widest ${style.badge}`}>{style.label}</span>
                <span className="text-sm text-slate-500">{group.length} patient{group.length !== 1 ? 's' : ''} waiting</span>
              </div>
              {group.length === 0 ? (
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 py-6 text-center text-slate-500 text-sm">
                  No {cat.toLowerCase()} patients in queue
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.map(p => (
                    <PatientCard
                      key={p.id}
                      patient={p}
                      isServing={false}
                      onServe={() => handleServe(p)}
                      onDone={() => handleDone(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {myPatients.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/40 py-16 text-center">
            <p className="text-4xl mb-3">✓</p>
            <p className="text-lg font-bold text-white">All clear — no patients in queue</p>
            <p className="text-sm text-slate-500 mt-1">New patients will appear here when registered at the kiosk.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function ClinicLogin({ onLogin }: { onLogin: (id: string, code: string) => string | null }) {
  const [staffId, setStaffId] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
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
      {/* Logo */}
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
}

export default function ClinicDashboard({ onBack }: ClinicDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
  const [recentlyDone, setRecentlyDone] = useState<Patient[]>([]);

  function handleLogin(id: string, code: string): string | null {
    const clinic = CLINICS.find(c => c.staffId === id);
    if (!clinic) return 'Staff ID not found.';
    if (code !== clinic.staffCode) return 'Incorrect access code.';
    setRecentlyDone([]);
    setActiveClinic(clinic);
    return null;
  }

  function handleLogout() {
    setRecentlyDone([]);
    setActiveClinic(null);
  }

  function handleClearLogs() {
    setRecentlyDone([]);
  }

  // Track transitions to 'done' and show them in a sidebar
  const prevPatientsRef = React.useRef<Map<string, string>>(new Map());

  React.useEffect(() => {
    const prevMap = prevPatientsRef.current;
    const nowDone = patients.filter(p => p.status === 'done' && prevMap.get(p.id) !== 'done');

    if (nowDone.length > 0) {
      setRecentlyDone(prev => [...nowDone, ...prev]);
    }

    const newMap = new Map<string, string>();
    patients.forEach(p => newMap.set(p.id, p.status));
    prevPatientsRef.current = newMap;
  }, [patients]);

  if (activeClinic) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-white">OPD Specialized Clinic </h2>
              <p className="text-sm text-slate-400">Streamlining Patient Intake </p>
            </div>
            <ClinicQueue
              clinic={activeClinic}
              allPatients={patients}
              onUpdate={setPatients}
              onLogout={handleLogout}
            />
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 sticky top-6 space-y-4">
            
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Recently Completed</p>
                <p className="mt-1 text-3xl font-black text-white">{recentlyDone.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-300">Recent completions</h3>
                  {recentlyDone.length > 0 && (
                    <button onClick={handleClearLogs} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300 hover:text-white">
                      Clear
                    </button>
                  )}
                </div>
                {recentlyDone.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent completions</p>
                ) : (
                  <ul className="space-y-3 max-h-[420px] overflow-y-auto">
                    {recentlyDone.map(p => (
                      <li key={p.id} className="rounded-lg bg-slate-800 p-3 border border-slate-700">
                        <p className="font-semibold text-white truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.ticketCode} · Arrived {p.arrivedAt}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Completed {p.completedAt ?? '—'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
        <div className="fixed bottom-4 left-4 z-50">
          <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-sm font-black text-white shadow-lg hover:bg-slate-800">
            E
          </button>
        </div>
      </div>
    );
  }

  return <ClinicLogin onLogin={handleLogin} />;
}