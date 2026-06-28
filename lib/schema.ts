import { z } from 'zod';

export const AlertSchema = z.object({
  id: z.string(),
  source: z.enum(['edr', 'identity', 'network', 'email']),
  severity: z.number().min(1).max(10),
  timestamp: z.string(),
  host: z.string(),
  user: z.string(),
  raw: z.string(),
  telemetry: z.array(z.object({
    time: z.string(),
    event: z.string(),
    detail: z.string(),
  })),
  exposure_profile: z.object({
    cves: z.array(z.string()),
    unpatched_count: z.number(),
    encryption_legacy: z.boolean(),
    risk_score: z.number().min(0).max(10),
  }).optional(),
});

export const VerdictSchema = z.object({
  verdict: z.enum(['true_positive', 'false_positive', 'needs_review']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  timeline: z.array(z.object({
    time: z.string(),
    event: z.string(),
    significance: z.string(),
  })),
  mitre: z.array(z.object({
    tactic: z.string(),
    technique: z.string(),
    id: z.string(),
  })),
  evidence: z.array(z.object({
    signal: z.string(),
    why_it_matters: z.string(),
  })),
  containment: z.array(z.object({
    action: z.string(),
    target: z.string(),
    reversible: z.boolean(),
    rationale: z.string(),
  })),
  next_steps: z.array(z.object({
    step: z.string(),
    probability: z.enum(['high', 'medium', 'low']),
    timeframe: z.string(),
  })),
  post_quantum_risk: z.boolean(),
  ciso_summary: z.string(),
  summary: z.string(),
  analyst_baseline_minutes: z.number(),
  agent_seconds: z.number(),
});

export type Alert = z.infer<typeof AlertSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
