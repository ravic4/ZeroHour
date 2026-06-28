import type { Verdict } from '@/lib/schema';

export default function EvidenceList({ evidence }: { evidence: Verdict['evidence'] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        Evidence
      </h3>
      <div className="space-y-3">
        {evidence.map((e, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-cyan-500 mt-0.5 shrink-0 font-mono text-sm">→</span>
            <div>
              <div className="text-sm font-semibold text-slate-200 leading-snug">{e.signal}</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {e.why_it_matters}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
