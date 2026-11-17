/**
 * Workspace tools the AI can call (chat and voice share this).
 * Each stored tool expands into one or more function definitions (OpenAI-style JSON schema).
 */
import { createHmac } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { ToolInputSchema, type ToolInput } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { decrypt } from '../lib/util.js';
import { assertPublicUrl } from '../rag/extract.js';
import { mcpCallTool, mcpListTools } from './mcp.js';
import { calendarAvailability, calendarBook, sheetsAppend } from './google.js';

export interface FunctionDef {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: Record<string, unknown>; required: string[] };
  speakWhileRunning?: string;
}

interface Loaded {
  id: string;
  tool: ToolInput;
}

const schemaFromParams = (params: ToolInput['parameters']): FunctionDef['parameters'] => ({
  type: 'object',
  properties: Object.fromEntries(params.map((p) => [p.name, { type: p.type, description: p.description }])),
  required: params.filter((p) => p.required).map((p) => p.name),
});

async function loadTools(ws: string, ids?: string[]): Promise<Loaded[]> {
  const snap = await paths.tools(ws).get();
  return snap.docs
    .filter((d) => d.get('enabled') !== false && (!ids?.length || ids.includes(d.id)))
    .map((d) => ({ id: d.id, tool: ToolInputSchema.parse(d.data()) }));
}

async function secretOf(ws: string, id: string): Promise<string | null> {
  const s = await paths.secrets(ws).doc(`tool_${id}`).get();
  return s.exists ? decrypt(s.get('value')) : null;
}

const mcpCache = new Map<string, { at: number; tools: { name: string; description?: string; inputSchema?: any }[] }>();

/** Function definitions for an agent. Empty `ids` = every enabled tool in the workspace. */
export async function toolDefinitionsFor(ws: string, ids?: string[]): Promise<FunctionDef[]> {
  const tools = await loadTools(ws, ids);
  const defs: FunctionDef[] = [];
  for (const { id, tool } of tools) {
    const speak = tool.speakWhileRunning;
    if (tool.kind === 'google_calendar') {
      defs.push({
        name: `${tool.name}_availability`,
        description: `Check free appointment slots on a date. ${tool.description}`,
        parameters: { type: 'object', properties: { date: { type: 'string', description: 'Date as YYYY-MM-DD' } }, required: ['date'] },
        speakWhileRunning: speak,
      });
      defs.push({
        name: `${tool.name}_book`,
        description: `Book an appointment once the customer has chosen a free slot. ${tool.description}`,
        parameters: {
          type: 'object',
          properties: {
            start_time: { type: 'string', description: 'Start as ISO date-time, e.g. 2026-12-01T10:30' },
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Customer phone' },
            email: { type: 'string', description: 'Customer email' },
            notes: { type: 'string', description: 'Reason for the visit' },
          },
          required: ['start_time', 'name'],
        },
        speakWhileRunning: speak,
      });
    } else if (tool.kind === 'gohighlevel') {
      defs.push({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            notes: { type: 'string', description: 'What the customer wants' },
          },
          required: ['name'],
        },
        speakWhileRunning: speak,
      });
    } else if (tool.kind === 'mcp') {
      try {
        const cached = mcpCache.get(id);
        const list = cached && Date.now() - cached.at < 5 * 60_000 ? cached.tools : await mcpListTools(String(tool.config.url), await secretOf(ws, id));
        mcpCache.set(id, { at: Date.now(), tools: list });
        for (const t of list.slice(0, 20)) {
          defs.push({
            name: `${tool.name}__${t.name}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64),
            description: t.description || t.name,
            parameters: (t.inputSchema as FunctionDef['parameters']) || { type: 'object', properties: {}, required: [] },
            speakWhileRunning: speak,
          });
        }
      } catch (e: any) {
        await paths.tools(ws).doc(id).update({ lastError: String(e.message).slice(0, 200) }).catch(() => {});
      }
    } else {
      defs.push({ name: tool.name, description: tool.description, parameters: schemaFromParams(tool.parameters), speakWhileRunning: speak });
    }
  }
  return defs;
}

const fill = (tpl: string, args: Record<string, unknown>) => tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => (args[k] === undefined ? '' : String(args[k])));

async function execute(ws: string, id: string, tool: ToolInput, fn: string, args: Record<string, any>, ctx: { conversationId: string; channel: string }): Promise<string> {
  const cfg = tool.config || {};
  switch (tool.kind) {
    case 'api_request': {
      const method = String(cfg.method || 'POST').toUpperCase();
      const url = fill(String(cfg.url || ''), Object.fromEntries(Object.entries(args).map(([k, v]) => [k, encodeURIComponent(String(v))])));
      await assertPublicUrl(url);
      const secret = await secretOf(ws, id);
      const headers: Record<string, string> = { 'content-type': 'application/json', ...(cfg.headers || {}) };
      if (secret && cfg.secretHeader) headers[String(cfg.secretHeader)] = secret;
      const body = method === 'GET' ? undefined : cfg.bodyTemplate ? fill(String(cfg.bodyTemplate), Object.fromEntries(Object.entries(args).map(([k, v]) => [k, JSON.stringify(v).slice(1, -1)]))) : JSON.stringify(args);
      const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(15_000) });
      const text = (await res.text()).slice(0, 3000);
      if (!res.ok) throw new Error(`API returned HTTP ${res.status}: ${text.slice(0, 200)}`);
      return text || 'Done.';
    }
    case 'webhook': {
      const url = String(cfg.url || '');
      await assertPublicUrl(url);
      const body = JSON.stringify({ tool: tool.name, args, conversationId: ctx.conversationId, channel: ctx.channel, sentAt: new Date().toISOString() });
      const secret = await secretOf(ws, id);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(secret ? { 'x-zdoda-signature': 'sha256=' + createHmac('sha256', secret).update(body).digest('hex') } : {}) },
        body,
        signal: AbortSignal.timeout(15_000),
      });
      const text = (await res.text()).slice(0, 3000);
      if (!res.ok) throw new Error(`Webhook returned HTTP ${res.status}`);
      return text || 'Done.';
    }
    case 'google_calendar':
      return fn.endsWith('_availability') ? calendarAvailability(ws, id, cfg, String(args.date)) : calendarBook(ws, id, cfg, args);
    case 'google_sheets':
      return sheetsAppend(ws, id, cfg, args, tool.parameters.map((p) => p.name));
    case 'gohighlevel': {
      const key = await secretOf(ws, id);
      if (!key) throw new Error('GoHighLevel API key missing');
      const [firstName, ...rest] = String(args.name || '').split(' ');
      const res = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, version: '2021-07-28', 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          locationId: cfg.locationId,
          firstName,
          lastName: rest.join(' ') || undefined,
          email: args.email || undefined,
          phone: args.phone || undefined,
          source: 'Zdoda AI agent',
          tags: cfg.tags ? String(cfg.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : ['zdoda'],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `GoHighLevel HTTP ${res.status}`);
      const contactId = json.contact?.id;
      if (contactId && args.notes) {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: { authorization: `Bearer ${key}`, version: '2021-07-28', 'content-type': 'application/json' },
          body: JSON.stringify({ body: String(args.notes) }),
        }).catch(() => {});
      }
      return 'Saved the contact in the CRM.';
    }
    case 'mcp': {
      const remote = fn.slice(tool.name.length + 2);
      const list = mcpCache.get(id)?.tools || (await mcpListTools(String(cfg.url), await secretOf(ws, id)));
      const real = list.find((t) => t.name.replace(/[^a-zA-Z0-9_]/g, '_') === remote)?.name || remote;
      return mcpCallTool(String(cfg.url), await secretOf(ws, id), real, args);
    }
  }
}

/** Runs a function call by name. Never throws: errors come back as text the AI can explain. */
export async function runTool(ws: string, fnName: string, args: Record<string, any>, ctx: { conversationId: string; channel: string }): Promise<{ result: string; ok: boolean }> {
  const tools = await loadTools(ws);
  const match = tools.find(({ tool }) => fnName === tool.name || fnName.startsWith(`${tool.name}_`) || fnName.startsWith(`${tool.name}__`));
  if (!match) return { ok: false, result: `Tool ${fnName} is not available.` };
  const ref = paths.tools(ws).doc(match.id);
  try {
    const result = await execute(ws, match.id, match.tool, fnName, args || {}, ctx);
    await ref.update({ lastRunAt: FieldValue.serverTimestamp(), lastError: null }).catch(() => {});
    return { ok: true, result: result.slice(0, 4000) };
  } catch (e: any) {
    const msg = String(e?.message || e).slice(0, 300);
    await ref.update({ lastRunAt: FieldValue.serverTimestamp(), lastError: msg }).catch(() => {});
    return { ok: false, result: `The ${match.tool.name} tool failed: ${msg}` };
  }
}
