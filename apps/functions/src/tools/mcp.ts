/** Minimal MCP client over Streamable HTTP (JSON-RPC 2.0). Supports tools/list and tools/call. */
import { assertPublicUrl } from '../rag/extract.js';

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

async function rpc(url: string, token: string | null, method: string, params: unknown, sessionId?: string | null) {
  await assertPublicUrl(url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  const sid = res.headers.get('mcp-session-id');
  const text = await res.text();
  if (!res.ok) throw new Error(`MCP server returned HTTP ${res.status}`);
  let payload: any;
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    const data = text
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .filter(Boolean)
      .pop();
    payload = data ? JSON.parse(data) : {};
  } else payload = text ? JSON.parse(text) : {};
  if (payload.error) throw new Error(`MCP error: ${payload.error.message || 'unknown'}`);
  return { result: payload.result, sessionId: sid || sessionId || null };
}

async function session(url: string, token: string | null) {
  const init = await rpc(url, token, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'zdoda', version: '1.0' } });
  // Notify initialized (fire and forget; servers may return 202)
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init.sessionId ? { 'mcp-session-id': init.sessionId } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  }).catch(() => {});
  return init.sessionId;
}

export async function mcpListTools(url: string, token: string | null): Promise<McpTool[]> {
  const sid = await session(url, token);
  const { result } = await rpc(url, token, 'tools/list', {}, sid);
  return (result?.tools || []) as McpTool[];
}

export async function mcpCallTool(url: string, token: string | null, name: string, args: Record<string, unknown>): Promise<string> {
  const sid = await session(url, token);
  const { result } = await rpc(url, token, 'tools/call', { name, arguments: args }, sid);
  const parts = (result?.content || []).map((c: any) => (c.type === 'text' ? c.text : JSON.stringify(c))).join('\n');
  return result?.isError ? `Error: ${parts}` : parts || 'Done.';
}
