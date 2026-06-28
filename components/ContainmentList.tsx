import type { Verdict } from '@/lib/schema';

export default function ContainmentList({
  containment,
}: {
  containment: Verdict['containment'];
}) {
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
        {containment.map((item, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
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
              <span
                className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 inline-block ${
                  item.reversible ? 'text-green-500' : 'text-amber-500'
                }`}
              >
                {item.reversible ? '● Reversible' : '◆ Irreversible'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
