'use client';
import { useEffect, useState } from 'react';
import type { Verdict } from '@/lib/schema';

export default function TimeSaved({
  verdict,
}: {
  verdict: Pick<Verdict, 'analyst_baseline_minutes' | 'agent_seconds'>;
}) {
  const { analyst_baseline_minutes, agent_seconds } = verdict;
  const savedSecs = analyst_baseline_minutes * 60 - agent_seconds;
  const savedMin = Math.floor(savedSecs / 60);
  const savedSec = Math.round(savedSecs % 60);
  const pctFaster = ((savedSecs / (analyst_baseline_minutes * 60)) * 100).toFixed(1);

  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDisplayed(0);
    const duration = 1200;
    const step = 16;
    const increment = analyst_baseline_minutes / (duration / step);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= analyst_baseline_minutes) {
        setDisplayed(analyst_baseline_minutes);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, step);
    return () => clearInterval(timer);
  }, [analyst_baseline_minutes]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
        Time Saved
      </h3>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Analyst baseline</span>
          <span className="font-mono text-red-400 font-bold text-xl tabular-nums">
            {displayed}m
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Agent response</span>
          <span className="font-mono text-green-400 font-bold text-xl tabular-nums">
            {agent_seconds}s
          </span>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Saved</span>
          <span className="font-mono text-cyan-400 font-bold text-sm">
            {savedMin}m {savedSec}s
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-700 to-cyan-400 rounded-full transition-all duration-1000"
            style={{ width: `${pctFaster}%` }}
          />
        </div>
        <div className="text-right mt-1.5">
          <span className="text-xs font-bold text-cyan-400">{pctFaster}% faster</span>
        </div>
      </div>
    </div>
  );
}
