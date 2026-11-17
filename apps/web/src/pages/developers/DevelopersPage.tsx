import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Sheet, TextField } from '@zdoda/ui';
import { KeyRound, Plus, Trash2, Copy, Check } from 'lucide-react';
import type { ApiKeyDTO } from '@zdoda/shared';
import { api, API_BASE } from '../../lib/api';
import { useApiMutation, useCan, wsKey, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, SectionTitle } from '../../components/common/Page';

export const DevelopersPage: React.FC = () => {
  const can = useCan();
  const q = useQuery({ queryKey: wsKey('api-keys'), queryFn: () => api.get<{ items: ApiKeyDTO[]; allowed: boolean }>('/api-keys') });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useApiMutation(() => api.post<{ key: string }>('/api-keys', { name }), { invalidate: [['api-keys']], onSuccess: (o) => setCreated(o.key) });
  const revoke = useApiMutation((id: string) => api.del(`/api-keys/${id}`), { success: 'Key revoked', invalidate: [['api-keys']] });
  const base = (API_BASE.startsWith('http') ? API_BASE : `${location.origin}${API_BASE}`) + '/rest';

  return (
    <Page title="Developers" subtitle="Use Zdoda from your own apps with the REST API." action={can('update', 'Settings') && q.data?.allowed && <Button icon={<Plus className="w-4 h-4" />} onClick={() => (setOpen(true), setCreated(null), setName(''))}>New API key</Button>}>
      {q.data && !q.data.allowed && (
        <Card variant="inset">
          <p className="text-[13px] text-[var(--ink-2)]">The REST API is included from the Business plan.</p>
        </Card>
      )}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--separator)]">
          <p className="text-[15px] font-semibold text-[var(--ink)]">API keys</p>
        </div>
        {q.isLoading ? (
          <div className="p-5">
            <LoadingBlock rows={2} />
          </div>
        ) : !q.data?.items.length ? (
          <p className="p-6 text-[13px] text-[var(--ink-3)]">No keys yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--separator)]">
            {q.data.items.map((k) => (
              <li key={k.id} className="flex items-center gap-3 px-5 py-3">
                <KeyRound className="w-4 h-4 text-[var(--ink-3)]" />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[var(--ink)]">{k.name}</p>
                  <p className="text-[12px] text-[var(--ink-3)] font-mono">
                    {k.prefix}… · created {timeAgo(k.createdAt)} · {k.lastUsedAt ? `last used ${timeAgo(k.lastUsedAt)}` : 'never used'}
                  </p>
                </div>
                {can('update', 'Settings') && (
                  <button aria-label={`Revoke ${k.name}`} className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)]" onClick={() => window.confirm(`Revoke “${k.name}”? Apps using it will stop working.`) && revoke.mutate(k.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="space-y-3">
        <SectionTitle title="Quick start" description="Send `Authorization: Bearer <key>` with every request." />
        <pre className="p-4 rounded-[12px] bg-[#0f0f14] text-[#e6e6f0] text-[12px] font-mono overflow-x-auto whitespace-pre">{`# List agents
curl ${base}/agents -H "Authorization: Bearer zk_live_..."

# Send a message to an agent (keep conversation_id to continue)
curl -X POST ${base}/agents/AGENT_ID/messages \\
  -H "Authorization: Bearer zk_live_..." -H "Content-Type: application/json" \\
  -d '{"message":"What are your opening hours?"}'

# Recent conversations and leads
curl ${base}/conversations -H "Authorization: Bearer zk_live_..."
curl ${base}/leads -H "Authorization: Bearer zk_live_..."

# Have an agent call someone (needs a phone number)
curl -X POST ${base}/calls -H "Authorization: Bearer zk_live_..." -H "Content-Type: application/json" \\
  -d '{"agent_id":"AGENT_ID","from":"+15550100000","to":"+15550102020","variables":{"name":"Sarah"}}'`}</pre>
      </Card>
      <Sheet open={open} onOpenChange={setOpen} title={created ? 'Copy your key now' : 'New API key'} description={created ? "For security we won't show it again." : undefined}>
        {created ? (
          <div className="flex gap-2">
            <input readOnly value={created} className="flex-1 h-10 px-3 rounded-[10px] bg-[var(--surface-2)] border border-[var(--separator)] text-[12px] font-mono text-[var(--ink)]" aria-label="API key" />
            <Button icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={() => navigator.clipboard.writeText(created).then(() => setCopied(true))}>
              Copy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="CRM sync" autoFocus />
            <Button loading={create.isPending} disabled={name.trim().length < 2} onClick={() => create.mutate(undefined)}>
              Create key
            </Button>
          </div>
        )}
      </Sheet>
    </Page>
  );
};
