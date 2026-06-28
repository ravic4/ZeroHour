const VERDICT_EXAMPLE = `{
  "verdict": "true_positive",
  "confidence": 0.95,
  "reasoning": "Mimikatz credential dumping followed by lateral movement via PsExec is a classic attack chain consistent with an active intrusion.",
  "timeline": [
    { "time": "14:23:00", "event": "Mimikatz LSASS dump", "significance": "Credential harvesting from memory" },
    { "time": "14:24:10", "event": "PsExec lateral movement", "significance": "Attacker pivoting to domain controller using stolen credentials" }
  ],
  "mitre": [
    { "tactic": "Credential Access", "technique": "OS Credential Dumping: LSASS Memory", "id": "T1003.001" },
    { "tactic": "Lateral Movement", "technique": "Remote Services: SMB/Windows Admin Shares", "id": "T1021.002" }
  ],
  "evidence": [
    { "signal": "mimikatz.exe process creation", "why_it_matters": "Mimikatz is a well-known credential dumping tool with no legitimate use on a workstation" },
    { "signal": "PsExec connection to domain controller", "why_it_matters": "Immediate lateral movement suggests automated or scripted attack chain" }
  ],
  "containment": [
    { "action": "Isolate host from network", "target": "CORP-WS-114", "reversible": true, "rationale": "Stop further credential use and lateral movement" },
    { "action": "Force password reset", "target": "jsmith", "reversible": false, "rationale": "Credentials are compromised and must be rotated immediately" },
    { "action": "Block PsExec on perimeter", "target": "Firewall ruleset", "reversible": true, "rationale": "Limit lateral movement capability" }
  ],
  "summary": "Active credential theft and lateral movement by a threat actor using Mimikatz and PsExec — immediate containment required.",
  "analyst_baseline_minutes": 45,
  "agent_seconds": 4
}`;

export function buildSystemPrompt(): string {
  return `You are a Tier-1 SOC analyst. Given a security alert and telemetry, return ONLY valid JSON.

REQUIRED OUTPUT FORMAT — every field is mandatory, match this structure exactly:
${VERDICT_EXAMPLE}

Rules:
- verdict: exactly one of true_positive, false_positive, needs_review
- confidence: number 0.0–1.0
- timeline: array of objects each with "time", "event", AND "significance" fields
- mitre: array of objects each with "tactic", "technique", AND "id" fields — use [] for false positives
- evidence: array of objects each with "signal" AND "why_it_matters" fields
- containment: array of objects each with "action", "target", "reversible" (boolean), AND "rationale" fields
- analyst_baseline_minutes: integer — realistic minutes a human analyst would spend
- agent_seconds: integer — AI analysis time, typically 2–8
- Return raw JSON only. No markdown fences. No text before or after the JSON.`;
}
