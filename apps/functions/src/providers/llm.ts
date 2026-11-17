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
  /** Function calling: definitions + executor. Up to 4 tool rounds per reply. */
  tools?: { name: string; description: string; parameters: Record<string, any> }[];
  onToolCall?: (name: string, args: Record<string, any>) => Promise<string>;
}
export interface GenerateResult {
  text: string;
  provider: LlmProvider;
  model: string;
  live: boolean;
  usage?: { inputTokens?: number; outputTokens?: number };
  toolCalls?: { name: string; args: Record<string, any>; result: string }[];
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

  const tools = input.onToolCall && input.tools?.length ? input.tools : [];
  const calls: { name: string; args: Record<string, any>; result: string }[] = [];
  const run = async (name: string, args: Record<string, any>) => {
    const result = await input.onToolCall!(name, args || {});
    calls.push({ name, args, result });
    return result;
  };
  const usage = { inputTokens: 0, outputTokens: 0 };
  const MAX_ROUNDS = 4;

  if (provider === 'anthropic') {
    const messages: any[] = input.messages.map((m) => ({ role: m.role, content: m.content }));
    for (let round = 0; ; round++) {
      const json = await post(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
        {
          model,
          max_tokens: maxTokens,
          temperature,
          system: input.system,
          messages,
          ...(tools.length && round < MAX_ROUNDS ? { tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })) } : {}),
        }
      );
      usage.inputTokens += json.usage?.input_tokens || 0;
      usage.outputTokens += json.usage?.output_tokens || 0;
      const uses = (json.content || []).filter((b: any) => b.type === 'tool_use');
      if (!uses.length || round >= MAX_ROUNDS) {
        const text = (json.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim();
        return { text, provider, model, live: true, usage, toolCalls: calls };
      }
      messages.push({ role: 'assistant', content: json.content });
      const results = [];
      for (const u of uses) results.push({ type: 'tool_result', tool_use_id: u.id, content: await run(u.name, u.input) });
      messages.push({ role: 'user', content: results });
    }
  }

  if (provider === 'openai') {
    const isReasoning = /^(gpt-5|o\d)/.test(model);
    const messages: any[] = [{ role: 'system', content: input.system }, ...input.messages];
    for (let round = 0; ; round++) {
      const json = await post(
        'https://api.openai.com/v1/chat/completions',
        { authorization: `Bearer ${config.openaiKey}` },
        {
          model,
          messages,
          ...(isReasoning ? { max_completion_tokens: maxTokens * 4 } : { temperature, max_tokens: maxTokens }),
          ...(tools.length && round < MAX_ROUNDS ? { tools: tools.map((t) => ({ type: 'function', function: t })) } : {}),
        }
      );
      usage.inputTokens += json.usage?.prompt_tokens || 0;
      usage.outputTokens += json.usage?.completion_tokens || 0;
      const msg = json.choices?.[0]?.message || {};
      if (!msg.tool_calls?.length || round >= MAX_ROUNDS) return { text: (msg.content || '').trim(), provider, model, live: true, usage, toolCalls: calls };
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}');
        } catch {
          /* bad json from model */
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: await run(tc.function.name, args) });
      }
    }
  }

  if (provider === 'gemini') {
    const contents: any[] = input.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    for (let round = 0; ; round++) {
      const json = await post(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        { 'x-goog-api-key': config.geminiKey },
        {
          systemInstruction: { parts: [{ text: input.system }] },
          contents,
          generationConfig: { temperature, maxOutputTokens: maxTokens },
          ...(tools.length && round < MAX_ROUNDS
            ? {
                tools: [
                  {
                    functionDeclarations: tools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      ...(Object.keys(t.parameters?.properties || {}).length ? { parameters: t.parameters } : {}),
                    })),
                  },
                ],
              }
            : {}),
        }
      );
      usage.inputTokens += json.usageMetadata?.promptTokenCount || 0;
      usage.outputTokens += json.usageMetadata?.candidatesTokenCount || 0;
      const parts = json.candidates?.[0]?.content?.parts || [];
      const fcs = parts.filter((p: any) => p.functionCall);
      if (!fcs.length || round >= MAX_ROUNDS) return { text: parts.map((p: any) => p.text || '').join('').trim(), provider, model, live: true, usage, toolCalls: calls };
      contents.push({ role: 'model', parts });
      const responses = [];
      for (const p of fcs) responses.push({ functionResponse: { name: p.functionCall.name, response: { result: await run(p.functionCall.name, p.functionCall.args) } } });
      contents.push({ role: 'user', parts: responses });
    }
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
