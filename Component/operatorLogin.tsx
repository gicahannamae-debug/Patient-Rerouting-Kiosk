'use client'
import React, { useState } from 'react';

export default function OperatorLogin({ onLogin }: { onLogin: () => void }) {
  const [opId, setOpId] = useState('');
  const [opCode, setOpCode] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit() {
    // Demo credential: id: operator, code: op1234
    if (opId.trim() === 'operator' && opCode.trim() === 'op1234') {
      setErr('');
      onLogin();
    } else {
      setErr('Invalid operator credentials');
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/bg3.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/82" />
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-800/78 border border-slate-700 p-6 shadow-2xl backdrop-blur-md">
        <h2 className="text-lg font-bold mb-2">Operator Login</h2>
        <p className="text-sm text-slate-400 mb-4">Sign in to access mode selector.</p>

        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1">Operator ID</label>
          <input value={opId} onChange={e => { setOpId(e.target.value); setErr(''); }} className="w-full rounded-xl px-3 py-2 bg-slate-700 text-white" placeholder="operator" />
        </div>

        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1">Access Code</label>
          <input value={opCode} onChange={e => { setOpCode(e.target.value); setErr(''); }} type="password" className="w-full rounded-xl px-3 py-2 bg-slate-700 text-white" placeholder="op1234" />
        </div>

        {err && <div className="mb-3 text-sm text-red-400">{err}</div>}

        <div className="flex gap-2">
          <button onClick={handleSubmit} className="flex-1 rounded-xl bg-cyan-600 px-3 py-2 font-bold">Sign in</button>
          <button onClick={() => { setOpId('operator'); setOpCode('op1234'); handleSubmit(); }} className="rounded-xl px-3 py-2 bg-slate-700">Demo</button>
        </div>
      </div>
    </div>
  );
}
