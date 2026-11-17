import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, Sheet, TextField, EmptyState, Badge } from '@zdoda/ui';
import { Bot, Plus, Copy, Trash2, ChevronRight } from 'lucide-react';
import { MODEL_CATALOG, type AgentDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useWorkspace, wsKey, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock } from '../../components/common/Page';

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const can = useCan();
  const { data: ws } = useWorkspace();
  const q = useQuery({ queryKey: wsKey('agents'), queryFn: () => api.get<{ items: AgentDTO[] }>('/agents') });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const create = useApiMutation((n: string) => api.post<AgentDTO>('/agents', { name: n }), {
    invalidate: [['agents'], ['workspace']],
    onSuccess: (a) => navigate(`/agents/${a.id}`),
  });
  const duplicate = useApiMutation((id: string) => api.post(`/agents/${id}/duplicate`), { success: 'Agent duplicated', invalidate: [['agents'], ['workspace']] });
  const remove = useApiMutation((id: string) => api.del(`/agents/${id}`), { success: 'Agent deleted', invalidate: [['agents'], ['workspace']] });

  const atLimit = ws ? ws.usage.agents >= ws.usage.agentLimit : false;

  return (
    <Page
      title="Agents"
      subtitle="Each agent has its own instructions, knowledge and model. Connect one to a channel to go live."
      action={
        can('create', 'Agent') && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)} disabled={atLimit} title={atLimit ? 'Upgrade your plan to add more agents' : undefined}>
            New agent
          </Button>
        )
      }
    >
      {atLimit && can('create', 'Agent') && (
        <Card variant="inset" className="flex items-center justify-between gap-4">
          <p className="text-[13px] text-[var(--ink-2)]">
            You're using {ws?.usage.agents} of {ws?.usage.agentLimit} agents on your plan.
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/billing')}>
            Upgrade
          </Button>
        </Card>
      )}
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.items.length ? (
        <EmptyState icon={<Bot className="w-8 h-8" />} title="No agents yet" description="Create your first AI agent to answer customer questions." actionLabel="New agent" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {q.data.items.map((a) => {
            const model = MODEL_CATALOG.find((m) => m.id === a.model?.id);
            return (
              <Card key={a.id} className="flex flex-col gap-4 hover:border-[var(--accent)]/40 transition-colors">
                <button className="text-left flex items-start gap-3" onClick={() => navigate(`/agents/${a.id}`)}>
                  <div className="w-11 h-11 rounded-[12px] bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-[var(--ink)] truncate">{a.name}</p>
                      <ChevronRight className="w-4 h-4 text-[var(--ink-3)] ml-auto shrink-0" />
                    </div>
                    <p className="text-[13px] text-[var(--ink-3)] line-clamp-2 mt-0.5">{a.description || 'No description'}</p>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={a.status === 'published' ? 'live' : 'setup_required'} label={a.status === 'published' ? 'Published' : 'Draft'} />
                  <Badge variant="outline">{model?.label || a.model?.id}</Badge>
                  <span className="text-[12px] text-[var(--ink-3)] ml-auto">Edited {timeAgo(a.updatedAt)}</span>
                </div>
                {(can('create', 'Agent') || can('delete', 'Agent')) && (
                  <div className="flex gap-2 pt-3 border-t border-[var(--separator)]">
                    {can('create', 'Agent') && (
                      <Button size="sm" variant="ghost" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => duplicate.mutate(a.id)} disabled={atLimit}>
                        Duplicate
                      </Button>
                    )}
                    {can('delete', 'Agent') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-[var(--danger)] ml-auto"
                        onClick={() => window.confirm(`Delete “${a.name}”? This cannot be undone.`) && remove.mutate(a.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="New agent"
        description="Give it a name — you can change everything later."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={create.isPending} disabled={name.trim().length < 2} onClick={() => create.mutate(name.trim())}>
              Create agent
            </Button>
          </div>
        }
      >
        <TextField label="Agent name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front Desk Assistant" autoFocus />
      </Sheet>
    </Page>
  );
};
