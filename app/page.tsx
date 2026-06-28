'use client';

import { useState, useCallback } from 'react';
import type { Alert, Verdict } from '@/lib/schema';
import { getDemoAlerts, getDemoVerdict, ALERT_LABELS } from '@/lib/demo';
import VerdictCard from '@/components/VerdictCard';
import Timeline from '@/components/Timeline';
import MitreChips from '@/components/MitreChips';
import ContainmentList from '@/components/ContainmentList';
import TimeSaved from '@/components/TimeSaved';
import EvidenceList from '@/components/EvidenceList';
import NextSteps from '@/components/NextSteps';
import CISOSummary from '@/components/CISOSummary';
import ExposureProfile from '@/components/ExposureProfile';
import QuantumScanner from '@/components/QuantumScanner';

type Tab = 'triage' | 'quantum';

const SOURCE_STYLES: Record<string, string> = {
  edr:      'bg-blue-900/50  text-blue-300  border-blue-700',
  identity: 'bg-purple-900/50 text-purple-300 border-purple-700',
  network:  'bg-orange-900/50 text-orange-300 border-orange-700',
  email:    'bg-teal-900/50  text-teal-300  border-teal-700',
};

const SEVERITY_COLOR = (s: number) =>
  s >= 8 ? 'text-red-400' : s >= 6 ? 'text-amber-400' : 'text-green-400';

const DEMO_ALERTS = getDemoAlerts();

export default function Page() {
  const [tab, setTab] = useState<Tab>('triage');
  const [demoMode, setDemoMode] = useState(true);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const triage = useCallback(
    async (alert: Alert) => {
      setSelected(alert);
      setVerdict(null);
      setError(null);
      setElapsed(null);
      setLoading(true);
      const start = Date.now();

      try {
        if (demoMode) {
          await new Promise((r) => setTimeout(r, 800));
          const cached = getDemoVerdict(alert.id);
          if (!cached) throw new Error('No cached verdict for this alert');
          setVerdict(cached);
          setElapsed((Date.now() - start) / 1000);
        } else {
          const res = await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
          }
          const data: Verdict = await res.json();
          setVerdict(data);
          setElapsed((Date.now() - start) / 1000);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [demoMode]
  );

  return (
    <div className="min-h-screen bg-[#060d18] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#060d18]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-cyan-400 text-2xl font-black tracking-widest">⚡ ZEROHOUR</span>
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/60 rounded-lg p-1">
              {([['triage', '🛡 Triage'], ['quantum', '⚛ Quantum']] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${
                    tab === t
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setDemoMode((d) => !d);
              setVerdict(null);
              setSelected(null);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest transition-colors ${
              demoMode
                ? 'border-cyan-700 text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40'
                : 'border-slate-700 text-slate-400 bg-slate-800/40 hover:bg-slate-700/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-cyan-400' : 'bg-slate-500'}`} />
            {demoMode ? 'Demo Mode' : 'Live Mode'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quantum tab */}
        {tab === 'quantum' && (
          <section>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Quantum Readiness Scanner
              </p>
              <p className="text-slate-600 text-xs">
                Upload X.509 certs, SSH public keys, or TLS cipher-suite lists to scan for quantum-vulnerable cryptography.
              </p>
            </div>
            <QuantumScanner demoMode={demoMode} />
          </section>
        )}

        {/* Triage tab */}
        {tab === 'triage' && <>
        {/* Alert Picker */}
        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Incoming Alerts — Select to Triage
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {DEMO_ALERTS.map((alert) => {
              const label = ALERT_LABELS[alert.id];
              const isActive = selected?.id === alert.id;
              return (
                <button
                  key={alert.id}
                  onClick={() => triage(alert)}
                  disabled={loading}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'border-cyan-600 bg-cyan-950/30 shadow-lg shadow-cyan-900/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/60'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${
                        SOURCE_STYLES[alert.source]
                      }`}
                    >
                      {alert.source.toUpperCase()}
                    </span>
                    <span className={`font-mono font-black text-lg ${SEVERITY_COLOR(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-100 leading-snug mb-1">
                    {label?.title ?? alert.id}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug">
                    {label?.description}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-600">{alert.host}</span>
                    <span className="text-slate-700">·</span>
                    <span className="font-mono text-[10px] text-slate-600">{alert.user}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-cyan-800 bg-cyan-950/20 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-400 font-bold text-lg tracking-widest uppercase">
                Zerohour Analyzing
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {demoMode ? 'Loading cached verdict…' : 'Calling AI model · Validating schema…'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-800 bg-red-950/20 p-6">
            <p className="text-red-400 font-bold mb-1">Triage failed</p>
            <p className="text-red-300 text-sm font-mono">{error}</p>
            {!demoMode && (
              <p className="text-slate-500 text-xs mt-2">
                Tip: Enable Demo Mode to run without an API key.
              </p>
            )}
          </div>
        )}

        {/* Verdict */}
        {verdict && !loading && (
          <div className="space-y-4">
            {elapsed !== null && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-green-500">●</span>
                Verdict rendered in {elapsed.toFixed(2)}s
                {demoMode && ' (demo mode — cached result)'}
              </div>
            )}

            <VerdictCard verdict={verdict} />

            {selected?.exposure_profile && (
              <ExposureProfile profile={selected.exposure_profile} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <Timeline timeline={verdict.timeline} />
              </div>
              <div className="lg:col-span-1">
                <MitreChips mitre={verdict.mitre} />
              </div>
              <div className="lg:col-span-1">
                <TimeSaved verdict={verdict} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <EvidenceList evidence={verdict.evidence} />
              <ContainmentList containment={verdict.containment} />
            </div>

            {verdict.next_steps.length > 0 && (
              <NextSteps steps={verdict.next_steps} />
            )}

            <CISOSummary verdict={verdict} />
          </div>
        )}

        {/* Empty state */}
        {!loading && !verdict && !error && (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-slate-400 font-semibold mb-1">Select an alert to begin triage</p>
            <p className="text-slate-600 text-sm">
              {demoMode
                ? 'Demo mode: instant offline verdicts from cached fixtures.'
                : 'Live mode: real AI analysis via Claude claude-sonnet-4-6.'}
            </p>
          </div>
        )}
        </>}
      </main>

      <footer className="border-t border-slate-800/50 mt-12 py-4 text-center">
        <p className="text-xs text-slate-700">
          ZEROHOUR · Containment actions are recommendations only · No live host commands are executed
        </p>
      </footer>
    </div>
  );
}
