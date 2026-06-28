import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AlertSchema, VerdictSchema } from '@/lib/schema';
import { buildSystemPrompt } from '@/lib/prompt';

const PROVIDER = process.env.PROVIDER ?? 'anthropic';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ollama = new OpenAI({ baseURL: OLLAMA_BASE_URL, apiKey: 'ollama' });

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
}

async function callLLM(alertJson: string, retryContext?: string): Promise<string> {
  const userContent = retryContext
    ? `Alert and telemetry:\n${alertJson}\n\nPrevious response failed JSON/schema validation with: ${retryContext}\nReturn valid JSON only — no fences, no prose.`
    : `Alert and telemetry:\n${alertJson}`;

  if (PROVIDER === 'ollama') {
    const res = await ollama.chat.completions.create({
      model: OLLAMA_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userContent },
      ],
    });
    return res.choices[0]?.message?.content ?? '';
  }

  // Default: Anthropic
  const message = await anthropic.messages.create({
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

    let raw = await callLLM(alertJson);
    let parsed: unknown;

    try {
      parsed = JSON.parse(stripFences(raw));
    } catch (firstErr) {
      raw = await callLLM(alertJson, String(firstErr));
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
