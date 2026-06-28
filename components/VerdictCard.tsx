import type { Verdict } from '@/lib/schema';

const STYLES = {
  true_positive: {
    border: 'border-red-800',
    bg: 'bg-red-950/40',
    text: 'text-red-400',
    bar: 'bg-red-500',
    label: 'TRUE POSITIVE',
    glyph: '■',
  },
  false_positive: {
    border: 'border-green-800',
    bg: 'bg-green-950/40',
    text: 'text-green-400',
    bar: 'bg-green-500',
    label: 'FALSE POSITIVE',
    glyph: '■',
  },
  needs_review: {
    border: 'border-amber-700',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    label: 'NEEDS REVIEW',
    glyph: '◆',
  },
} as const;

export default function VerdictCard({ verdict }: { verdict: Verdict }) {
  const s = STYLES[verdict.verdict];
  const pct = Math.round(verdict.confidence * 100);

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-6`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className={`text-2xl font-black tracking-widest ${s.text}`}>
          {s.glyph} {s.label}
        </span>
        <div className="text-right shrink-0">
          <div className={`text-4xl font-black font-mono ${s.text}`}>{pct}%</div>
          <div className="text-slate-500 text-xs uppercase tracking-widest">Confidence</div>
        </div>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full mb-4">
        <div
          className={`h-full rounded-full ${s.bar} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {verdict.post_quantum_risk && (
        <div className="flex items-center gap-1.5 mb-4 text-[10px] font-bold uppercase tracking-widest text-amber-300 border border-amber-800 bg-amber-950/30 px-2.5 py-1 rounded w-fit">
          ⚠ Post-Quantum Risk · Legacy encryption in C2 / exfil channel
        </div>
      )}

      <p className="text-slate-100 text-base font-semibold leading-relaxed mb-3">
        {verdict.summary}
      </p>
      <p className="text-slate-400 text-sm leading-relaxed">{verdict.reasoning}</p>
    </div>
  );
}
