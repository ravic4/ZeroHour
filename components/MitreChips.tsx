import type { Verdict } from '@/lib/schema';

const TACTIC_COLORS: Record<string, string> = {
  'Credential Access':   'border-red-700     bg-red-950/60    text-red-300',
  'Defense Evasion':     'border-purple-700  bg-purple-950/60 text-purple-300',
  'Lateral Movement':    'border-orange-700  bg-orange-950/60 text-orange-300',
  'Command and Control': 'border-pink-700    bg-pink-950/60   text-pink-300',
  'Initial Access':      'border-blue-700    bg-blue-950/60   text-blue-300',
  'Collection':          'border-yellow-700  bg-yellow-950/60 text-yellow-300',
  'Exfiltration':        'border-rose-700    bg-rose-950/60   text-rose-300',
  'Discovery':           'border-teal-700    bg-teal-950/60   text-teal-300',
  'Persistence':         'border-indigo-700  bg-indigo-950/60 text-indigo-300',
  'Execution':           'border-cyan-700    bg-cyan-950/60   text-cyan-300',
};

function chipColor(tactic: string): string {
  return TACTIC_COLORS[tactic] ?? 'border-slate-700 bg-slate-800 text-slate-300';
}

export default function MitreChips({ mitre }: { mitre: Verdict['mitre'] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        MITRE ATT&amp;CK
      </h3>
      {mitre.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="text-green-400">✓</span>
          No ATT&amp;CK techniques identified — false positive confirmed.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {mitre.map((m, i) => (
            <div
              key={i}
              className={`border rounded-lg px-3 py-2 text-xs ${chipColor(m.tactic)}`}
            >
              <div className="font-mono font-bold text-[11px]">{m.id}</div>
              <div className="font-semibold mt-0.5">{m.technique}</div>
              <div className="opacity-60 text-[10px] mt-0.5 uppercase tracking-wide">
                {m.tactic}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
