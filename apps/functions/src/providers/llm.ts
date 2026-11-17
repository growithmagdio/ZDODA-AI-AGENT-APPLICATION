import type { LlmProvider } from '@zdoda/shared';
import { config } from '../config.js';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}
export interface GenerateInput {
  provider: LlmProvider;
  model: string;
  system: string;
  messages: ChatTurn[];
  temperature?: number;
  maxTokens?: number;
  /** Used by the demo model to answer from retrieved knowledge without an API key. */
  context?: { snippets: string[]; fallback: string };
}
export interface GenerateResult {
  text: string;
  provider: LlmProvider;
  model: string;
  live: boolean;
  usage?: { inputTokens?: number; outputTokens?: number };
}

const TIMEOUT_MS = 45_000;

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.error || res.statusText;
    throw new Error(`LLM provider error (${res.status}): ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
  }
  return json;
}

export function providerAvailable(p: LlmProvider): boolean {
  if (p === 'anthropic') return Boolean(config.anthropicKey);
  if (p === 'openai') return Boolean(config.openaiKey);
  if (p === 'gemini') return Boolean(config.geminiKey);
  return true;
}

export function availableProviders(): LlmProvider[] {
  return (['anthropic', 'openai', 'gemini', 'mock'] as LlmProvider[]).filter(providerAvailable);
}

/**
 * Picks the provider to actually call. If the agent asks for a provider whose key is missing,
 * we fall back to the workspace default and finally to the demo model — never a fake "live" answer.
 */
export function resolveProvider(requested: LlmProvider, model: string): { provider: LlmProvider; model: string } {
  if (requested !== 'mock' && providerAvailable(requested)) return { provider: requested, model };
  const fallback = config.llmProvider;
  if (fallback !== 'mock' && providerAvailable(fallback)) return { provider: fallback, model: config.defaultModels[fallback] };
  return { provider: 'mock', model: 'zdoda-demo' };
}

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const { provider, model } = resolveProvider(input.provider, input.model);
  const temperature = input.temperature ?? 0.3;
  const maxTokens = input.maxTokens ?? 700;

  if (provider === 'anthropic') {
    const json = await post(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
      { model, max_tokens: maxTokens, temperature, system: input.system, messages: input.messages }
    );
    const text = (json.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim();
    return { text, provider, model, live: true, usage: { inputTokens: json.usage?.input_tokens, outputTokens: json.usage?.output_tokens } };
  }

  if (provider === 'openai') {
    const isReasoning = /^(gpt-5|o\d)/.test(model);
    const json = await post(
      'https://api.openai.com/v1/chat/completions',
      { authorization: `Bearer ${config.openaiKey}` },
      {
        model,
        messages: [{ role: 'system', content: input.system }, ...input.messages],
        ...(isReasoning ? { max_completion_tokens: maxTokens * 4 } : { temperature, max_tokens: maxTokens }),
      }
    );
    return {
      text: (json.choices?.[0]?.message?.content || '').trim(),
      provider,
      model,
      live: true,
      usage: { inputTokens: json.usage?.prompt_tokens, outputTokens: json.usage?.completion_tokens },
    };
  }

  if (provider === 'gemini') {
    const json = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { 'x-goog-api-key': config.geminiKey },
      {
        systemInstruction: { parts: [{ text: input.system }] },
        contents: input.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }
    );
    const text = (json.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('').trim();
    return {
      text,
      provider,
      model,
      live: true,
      usage: { inputTokens: json.usageMetadata?.promptTokenCount, outputTokens: json.usageMetadata?.candidatesTokenCount },
    };
  }

  return { text: demoAnswer(input), provider: 'mock', model: 'zdoda-demo', live: false };
}

/** Demo model: extractive answer built from the best-matching knowledge snippet. Clearly labelled. */
function demoAnswer(input: GenerateInput): string {
  const question = [...input.messages].reverse().find((m) => m.role === 'user')?.content || '';
  const snippets = input.context?.snippets || [];
  if (!snippets.length) return input.context?.fallback || "I'm not sure about that yet.";
  const qWords = new Set(question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
  const sentences = snippets
    .slice(0, 3)
    .join(' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => !/^Q:/i.test(s)) // FAQ chunks: keep the answer, not the question
    .map((s) => s.replace(/^A:\s*/i, ''))
    .filter((s) => s.length > 20 && s.length < 400);
  const scored = sentences
    .map((s, i) => ({ s, i, score: (s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter((w) => qWords.has(w)).length }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  if (!scored.length || scored[0].score === 0) return input.context?.fallback || "I'm not sure about that yet.";
  const best = scored.slice(0, 2).sort((a, b) => a.i - b.i).map((x) => x.s);
  return best.join(' ');
}
