'use client';
import { useState } from 'react';
import type { Verdict } from '@/lib/schema';

export default function CISOSummary({ verdict }: { verdict: Verdict }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(verdict.ciso_summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            CISO / Board Brief
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-800 px-2 py-0.5 rounded">
            Non-Technical
          </span>
        </div>
        <button
          onClick={copy}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-colors border-slate-700 text-slate-400 hover:border-cyan-700 hover:text-cyan-400 hover:bg-cyan-950/30"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{verdict.ciso_summary}</p>
    </div>
  );
}
