'use client';

import { useState, useCallback } from 'react';

interface CbomEntry {
  asset: string;
  algorithm: string;
  key_size: number;
  classification: 'QUANTUM_VULNERABLE' | 'GROVER_WEAKENED' | 'QUANTUM_SAFE' | 'UNKNOWN';
  q_day_risk: string;
  hndl: boolean;
  recommended_replacement: string | null;
}

interface ScanResult {
  total_assets: number;
  vulnerable_count: number;
  vulnerable_pct: number;
  hndl_assets: number;
  findings: CbomEntry[];
}

const CLASS_STYLES = {
  QUANTUM_VULNERABLE: { bg: 'bg-red-950/50',    border: 'border-red-800',   text: 'text-red-400',    label: 'VULNERABLE' },
  GROVER_WEAKENED:    { bg: 'bg-amber-950/50',   border: 'border-amber-700', text: 'text-amber-400',  label: 'WEAKENED'   },
  QUANTUM_SAFE:       { bg: 'bg-green-950/50',   border: 'border-green-800', text: 'text-green-400',  label: 'SAFE'       },
  UNKNOWN:            { bg: 'bg-slate-800/50',   border: 'border-slate-700', text: 'text-slate-400',  label: 'UNKNOWN'    },
} as const;

export default function QuantumScanner() {
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async (files: File[]) => {
    setScanning(true);
    setResult(null);
    setError(null);
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    try {
      const res = await fetch('http://localhost:8000/scan', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setScanning(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) runScan(files);
  }, [runScan]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) runScan(files);
    e.target.value = '';
  }, [runScan]);

  return (
    <div className="space-y-5">
      {/* Header metrics */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Assets',    value: result.total_assets,    color: 'text-slate-100' },
            { label: 'Vulnerable',      value: result.vulnerable_count, color: 'text-red-400'   },
            { label: '% Vulnerable',    value: `${result.vulnerable_pct}%`, color: result.vulnerable_pct > 50 ? 'text-red-400' : 'text-amber-400' },
            { label: 'HNDL Risk',       value: result.hndl_assets,     color: result.hndl_assets > 0 ? 'text-red-400' : 'text-green-400' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <div className={`text-3xl font-black font-mono ${m.color}`}>{m.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragging ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
        }`}
      >
        <input type="file" multiple accept=".pem,.crt,.cer,.pub,.txt" className="hidden" onChange={onFileInput} />
        <span className="text-3xl">{scanning ? '⚙️' : '🔬'}</span>
        <div className="text-center">
          <p className="text-slate-200 font-semibold">
            {scanning ? 'Scanning crypto artifacts…' : 'Drop crypto artifacts here'}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Accepts: .pem .crt .cer (X.509 certs) · .pub (SSH keys) · .txt (TLS cipher suites)
          </p>
        </div>
      </label>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/20 p-4">
          <p className="text-red-400 font-bold text-sm">Scan failed</p>
          <p className="text-red-300 text-xs font-mono mt-1">{error}</p>
          <p className="text-slate-500 text-xs mt-2">
            Make sure the PQC scanner is running: <span className="font-mono">cd pqc-service && uvicorn main:app --port 8000</span>
          </p>
        </div>
      )}

      {/* Findings table */}
      {result && result.findings.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Cryptographic Bill of Materials (CBOM)
            </h3>
            <span className="text-[10px] text-slate-600 font-mono">CycloneDX v1.4</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Asset', 'Algorithm', 'Key Size', 'Status', 'Q-Day Risk', 'HNDL', 'Replacement'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.findings.map((f, i) => {
                  const s = CLASS_STYLES[f.classification] ?? CLASS_STYLES.UNKNOWN;
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-300 max-w-[200px] truncate" title={f.asset}>
                        {f.asset}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-200 whitespace-nowrap">{f.algorithm}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{f.key_size}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.bg} ${s.border} ${s.text}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-xs font-bold ${
                        f.q_day_risk === 'high' ? 'text-red-400' :
                        f.q_day_risk === 'med'  ? 'text-amber-400' :
                        f.q_day_risk === 'low'  ? 'text-yellow-500' : 'text-green-400'
                      }`}>{f.q_day_risk}</td>
                      <td className="px-4 py-2.5 text-xs">
                        {f.hndl
                          ? <span className="text-red-400 font-bold">⚠ YES</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-cyan-400 max-w-[200px]">
                        {f.recommended_replacement ?? <span className="text-green-500">✓ Already safe</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
