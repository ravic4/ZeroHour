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
  summary: z.string(),
  analyst_baseline_minutes: z.number(),
  agent_seconds: z.number(),
});

export type Alert = z.infer<typeof AlertSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
