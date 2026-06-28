'use client';
import { useState } from 'react';
import type { Verdict } from '@/lib/schema';

function mockLines(action: string, target: string): string[] {
  const a = action.toLowerCase();
  if (a.includes('isolat') && !a.includes('audit')) {
    return [
      `[ZEROHOUR] Connecting to EDR API...`,
      `[ZEROHOUR] Locating host: ${target}`,
      `[SUCCESS] Network isolation command dispatched`,
      `[SUCCESS] Host removed from production VLAN — quarantine VLAN-999 assigned`,
      `[INFO] Forensic memory snapshot preserved for post-incident review`,
    ];
  }
  if (a.includes('revoke') || a.includes('token') || a.includes('app')) {
    return [
      `[ZEROHOUR] Connecting to identity provider...`,
      `[ZEROHOUR] Targeting application / account: ${target}`,
      `[SUCCESS] Bearer token revoked`,
      `[SUCCESS] Refresh token invalidated`,
      `[INFO] All active API sessions terminated`,
    ];
  }
  if (a.includes('reset') || a.includes('password') || a.includes('session')) {
    return [
      `[ZEROHOUR] Connecting to Active Directory...`,
      `[ZEROHOUR] Targeting account: ${target}`,
      `[SUCCESS] Temporary password set — NTLM hash chain invalidated`,
      `[SUCCESS] All active sessions force-logged out`,
      `[INFO] Reset notification sent to registered backup email`,
    ];
  }
  if (a.includes('block') || a.includes('firewall') || a.includes('dns')) {
    return [
      `[ZEROHOUR] Connecting to firewall management API...`,
      `[ZEROHOUR] Creating block rule for: ${target}`,
      `[SUCCESS] Destination blocked on all 65,535 ports at perimeter`,
      `[SUCCESS] DNS sinkhole entry propagated to all resolvers`,
      `[INFO] Block rule confirmed across 12 edge nodes`,
    ];
  }
  if (a.includes('audit') || a.includes('review') || a.includes('log') || a.includes('preserve')) {
    return [
      `[ZEROHOUR] Querying audit log pipeline...`,
      `[ZEROHOUR] Scope: ${target}`,
      `[SUCCESS] Log events exported to secure immutable storage`,
      `[SUCCESS] SIEM ticket created: INC-20260628-0041`,
      `[INFO] Analyst review queue updated`,
    ];
  }
  if (a.includes('notify') || a.includes('legal') || a.includes('dpo') || a.includes('ciso')) {
    return [
      `[ZEROHOUR] Drafting incident notification...`,
      `[ZEROHOUR] Recipients: ${target}`,
      `[SUCCESS] Encrypted notification sent via secure channel`,
      `[SUCCESS] Incident record created in GRC system`,
      `[INFO] GDPR Article 33 — 72-hour disclosure clock started`,
    ];
  }
  if (a.includes('contact') || a.includes('out-of-band')) {
    return [
      `[ZEROHOUR] Initiating out-of-band contact...`,
      `[ZEROHOUR] Channel: verified backup contact for ${target}`,
      `[SUCCESS] Alert notification sent`,
      `[INFO] Auto-suspend activates in 5 minutes if no response`,
    ];
  }
  if (a.includes('re-enroll') || a.includes('mfa') || a.includes('fido')) {
    return [
      `[ZEROHOUR] Connecting to identity provider MFA config...`,
      `[ZEROHOUR] Targeting: ${target}`,
      `[SUCCESS] Voice-call MFA channel disabled`,
      `[SUCCESS] FIDO2 re-enrollment link sent to verified recovery email`,
      `[INFO] Account flagged for mandatory step-up on next login`,
    ];
  }
  return [
    `[ZEROHOUR] Dispatching action...`,
    `[ZEROHOUR] Target: ${target}`,
    `[SUCCESS] Action completed`,
    `[INFO] Event logged to SIEM`,
  ];
}

interface SimState {
  lines: string[];
  cursor: number;
  done: boolean;
}

export default function ContainmentList({
  containment,
}: {
  containment: Verdict['containment'];
}) {
  const [sims, setSims] = useState<Record<number, SimState>>({});

  function simulate(idx: number, action: string, target: string) {
    if (sims[idx]) return;
    const lines = mockLines(action, target);
    setSims((prev) => ({ ...prev, [idx]: { lines, cursor: 0, done: false } }));

    let i = 0;
    const tick = () => {
      i++;
      if (i >= lines.length) {
        setSims((prev) => ({ ...prev, [idx]: { ...prev[idx]!, cursor: i, done: true } }));
        return;
      }
      setSims((prev) => ({ ...prev, [idx]: { ...prev[idx]!, cursor: i } }));
      setTimeout(tick, 380);
    };
    setTimeout(tick, 380);
  }

  function dismiss(idx: number) {
    setSims((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Containment Plan
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-800 px-2 py-1 rounded">
          Recommendations Only
        </span>
      </div>
      <div className="space-y-3">
        {containment.map((item, i) => {
          const sim = sims[i];
          const canSimulate =
            !item.action.toLowerCase().startsWith('no action') &&
            !item.action.toLowerCase().includes('tune ');
          return (
            <div key={i} className="rounded-lg border border-slate-700/50 overflow-hidden">
              <div className="flex gap-3 p-3 bg-slate-800/50">
                <span
                  className={`text-base mt-0.5 shrink-0 ${
                    item.reversible ? 'text-green-400' : 'text-amber-400'
                  }`}
                >
                  {item.reversible ? '↩' : '⚠'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-100">{item.action}</span>
                  </div>
                  <div className="font-mono text-xs text-cyan-400 bg-slate-700/60 px-2 py-0.5 rounded mb-1.5 inline-block max-w-full truncate">
                    {item.target}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.rationale}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.reversible ? 'text-green-500' : 'text-amber-500'
                      }`}
                    >
                      {item.reversible ? '● Reversible' : '◆ Irreversible'}
                    </span>
                    {canSimulate && !sim && (
                      <button
                        onClick={() => simulate(i, item.action, item.target)}
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-cyan-800 text-cyan-500 bg-cyan-950/30 hover:bg-cyan-900/40 transition-colors"
                      >
                        ▶ Simulate
                      </button>
                    )}
                    {sim?.done && (
                      <button
                        onClick={() => dismiss(i)}
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        ✕ Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {sim && (
                <div className="bg-[#080f08] border-t border-slate-800/60 p-3 font-mono text-xs space-y-0.5">
                  {sim.lines.slice(0, sim.cursor + 1).map((line, li) => (
                    <div
                      key={li}
                      className={
                        line.startsWith('[SUCCESS]')
                          ? 'text-green-400'
                          : line.startsWith('[INFO]')
                          ? 'text-slate-500'
                          : 'text-cyan-300'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  {!sim.done && <span className="text-cyan-400 animate-pulse">█</span>}
                  {sim.done && (
                    <div className="text-green-500 font-bold mt-1">
                      ✓ SIMULATION COMPLETE — ZEROHOUR
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
