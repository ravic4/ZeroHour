import type { Alert } from '@/lib/schema';

type Profile = NonNullable<Alert['exposure_profile']>;

export default function ExposureProfile({ profile }: { profile: Profile }) {
  const riskColor =
    profile.risk_score >= 8
      ? 'text-red-400'
      : profile.risk_score >= 6
      ? 'text-amber-400'
      : 'text-green-400';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Asset Exposure Profile
        </h3>
        {profile.encryption_legacy && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest border border-amber-700 text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded">
            ⚠ Post-Quantum Risk — Legacy Encryption
          </span>
        )}
      </div>
      <div className="flex items-center gap-8 mb-4">
        <div>
          <div className={`text-3xl font-black font-mono ${riskColor}`}>
            {profile.risk_score.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">Risk Score</div>
        </div>
        <div>
          <div className="text-3xl font-black font-mono text-red-400">{profile.unpatched_count}</div>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">Unpatched CVEs</div>
        </div>
      </div>
      {profile.cves.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.cves.map((cve) => (
            <span
              key={cve}
              className="font-mono text-[10px] font-bold text-red-300 bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded"
            >
              {cve}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
