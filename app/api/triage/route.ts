import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AlertSchema, VerdictSchema } from '@/lib/schema';
import { buildSystemPrompt } from '@/lib/prompt';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
}

async function callClaude(alertJson: string, retryContext?: string): Promise<string> {
  const userContent = retryContext
    ? `Alert and telemetry:\n${alertJson}\n\nPrevious response failed JSON/schema validation with: ${retryContext}\nReturn valid JSON only — no fences, no prose.`
    : `Alert and telemetry:\n${alertJson}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    temperature: 0.2,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected non-text response from Claude');
  return block.text;
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const alert = AlertSchema.parse(body);
    const alertJson = JSON.stringify(alert, null, 2);

    let raw = await callClaude(alertJson);
    let parsed: unknown;

    try {
      parsed = JSON.parse(stripFences(raw));
    } catch (firstErr) {
      raw = await callClaude(alertJson, String(firstErr));
      parsed = JSON.parse(stripFences(raw));
    }

    const verdict = VerdictSchema.parse(parsed);
    return NextResponse.json(verdict);
  } catch (err) {
    console.error('[triage]', err);
    return NextResponse.json(
      { error: 'Triage failed', detail: String(err) },
      { status: 500 }
    );
  }
}
