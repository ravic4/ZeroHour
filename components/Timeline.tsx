import type { Verdict } from '@/lib/schema';

export default function Timeline({ timeline }: { timeline: Verdict['timeline'] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        Attack Timeline
      </h3>
      <div className="space-y-4">
        {timeline.map((entry, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1 shrink-0" />
              {i < timeline.length - 1 && (
                <div className="w-px flex-1 bg-slate-700 mt-1" />
              )}
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <div className="font-mono text-xs text-cyan-400 mb-0.5">{entry.time}</div>
              <div className="text-sm font-semibold text-slate-200 leading-snug">
                {entry.event}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                {entry.significance}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
