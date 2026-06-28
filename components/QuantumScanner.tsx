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

interface RemediateResult {
  algorithm: string;
  kind: 'kem' | 'signature';
  public_key_bytes: number;
  secret_key_bytes: number;
  ciphertext_bytes: number;
  shared_secret_bytes: number;
  keygen_ms: number;
  encapsulate_ms: number;
  decapsulate_ms: number;
  handshake_verified: boolean;
  public_key_preview: string;
  library: string;
  notes: string;
}

function recommendedAlgFor(entry: CbomEntry): string {
  const r = entry.recommended_replacement?.toLowerCase() ?? '';
  if (r.includes('ml-dsa')) return 'ML-DSA-65';
  return 'ML-KEM-768';
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
  const [remediating, setRemediating] = useState<string | null>(null); // asset key
  const [remediation, setRemediation] = useState<RemediateResult | null>(null);
  const [remediateError, setRemediateError] = useState<string | null>(null);

  const runRemediate = useCallback(async (entry: CbomEntry) => {
    setRemediating(entry.asset);
    setRemediation(null);
    setRemediateError(null);
    try {
      const alg = recommendedAlgFor(entry);
      const res = await fetch(`http://localhost:8000/remediate?alg=${encodeURIComponent(alg)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      setRemediation(await res.json());
    } catch (err) {
      setRemediateError(String(err));
    } finally {
      setRemediating(null);
    }
  }, []);

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

      {/* Remediation error */}
      {remediateError && (
        <div className="rounded-xl border border-red-800 bg-red-950/20 p-4">
          <p className="text-red-400 font-bold text-sm">PQC remediation failed</p>
          <p className="text-red-300 text-xs font-mono mt-1">{remediateError}</p>
          <p className="text-slate-500 text-xs mt-2">
            Requires liboqs + oqs-python. Check{' '}
            <span className="font-mono">GET /remediate/status</span> on the scanner service.
          </p>
        </div>
      )}

      {/* Remediation result panel */}
      {remediation && (
        <div className="rounded-xl border border-cyan-700 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-1">
                Live PQC Remediation · {remediation.library}
              </p>
              <h3 className="text-lg font-black text-cyan-300">
                {remediation.algorithm} keypair generated
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                remediation.handshake_verified
                  ? 'border-green-700 bg-green-950/40 text-green-400'
                  : 'border-red-700 bg-red-950/40 text-red-400'
              }`}
            >
              {remediation.handshake_verified
                ? remediation.kind === 'kem'
                  ? '✓ Handshake verified'
                  : '✓ Signature verified'
                : '✗ Verification failed'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Public key</div>
              <div className="font-mono font-bold text-cyan-300 text-lg">{remediation.public_key_bytes} B</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Secret key</div>
              <div className="font-mono font-bold text-cyan-300 text-lg">{remediation.secret_key_bytes} B</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">
                {remediation.kind === 'kem' ? 'Ciphertext' : 'Signature'}
              </div>
              <div className="font-mono font-bold text-cyan-300 text-lg">{remediation.ciphertext_bytes} B</div>
            </div>
            {remediation.kind === 'kem' && (
              <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Shared secret</div>
                <div className="font-mono font-bold text-cyan-300 text-lg">{remediation.shared_secret_bytes} B</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Keygen</div>
              <div className="font-mono font-bold text-green-400 text-lg">{remediation.keygen_ms} ms</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">
                {remediation.kind === 'kem' ? 'Encapsulate' : 'Sign'}
              </div>
              <div className="font-mono font-bold text-green-400 text-lg">{remediation.encapsulate_ms} ms</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">
                {remediation.kind === 'kem' ? 'Decapsulate' : 'Verify'}
              </div>
              <div className="font-mono font-bold text-green-400 text-lg">{remediation.decapsulate_ms} ms</div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 mb-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
              Public key (first 32 bytes, hex)
            </div>
            <div className="font-mono text-xs text-slate-400 break-all">
              {remediation.public_key_preview}…
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{remediation.notes}</p>
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
                  {['Asset', 'Algorithm', 'Key Size', 'Status', 'Q-Day Risk', 'HNDL', 'Replacement', 'Remediate'].map((h) => (
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
                      <td className="px-4 py-2.5">
                        {f.classification === 'QUANTUM_VULNERABLE' ? (
                          <button
                            onClick={() => runRemediate(f)}
                            disabled={remediating !== null}
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-cyan-700 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {remediating === f.asset ? '⚙ Generating…' : '⚛ Generate'}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
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
