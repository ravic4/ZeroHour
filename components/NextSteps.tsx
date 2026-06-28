import type { Verdict } from '@/lib/schema';

const PROB_STYLES = {
  high:   { dot: 'bg-red-500',    badge: 'bg-red-950/60 text-red-300 border-red-800' },
  medium: { dot: 'bg-amber-500',  badge: 'bg-amber-950/60 text-amber-300 border-amber-700' },
  low:    { dot: 'bg-yellow-600', badge: 'bg-yellow-950/60 text-yellow-400 border-yellow-700' },
} as const;

export default function NextSteps({ steps }: { steps: Verdict['next_steps'] }) {
  if (!steps.length) return null;

  return (
    <div className="rounded-xl border border-red-900/60 bg-red-950/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-red-400">
          ⚡ Predicted Adversary Next Steps
        </h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-red-900 bg-red-950 border border-red-900/60 px-2 py-0.5 rounded">
          If Uncontained
        </span>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const style = PROB_STYLES[s.probability];
          return (
            <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-100 font-medium leading-snug">{s.step}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${style.badge}`}>
                    {s.probability} probability
                  </span>
                  <span className="text-xs text-slate-500">{s.timeframe}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
