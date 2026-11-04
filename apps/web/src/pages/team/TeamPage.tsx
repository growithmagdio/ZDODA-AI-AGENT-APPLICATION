import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Sheet, TextField, Select, Avatar, Badge } from '@zdoda/ui';
import { UserPlus, Copy, Trash2, Check } from 'lucide-react';
import type { WorkspaceRole } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useWorkspace, wsKey, timeAgo } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';

const ROLES: { value: WorkspaceRole; label: string; desc: string }[] = [
  { value: 'OWNER', label: 'Owner', desc: 'Everything, including billing' },
  { value: 'ADMIN', label: 'Admin', desc: 'Everything except billing' },
  { value: 'BUILDER', label: 'Builder', desc: 'Agents, knowledge, widget' },
  { value: 'AGENT', label: 'Support agent', desc: 'Inbox replies only' },
  { value: 'VIEWER', label: 'Viewer', desc: 'Read-only' },
];

export const TeamPage: React.FC = () => {
  const can = useCan();
  const { user } = useAuth();
  const { data: ws } = useWorkspace();
  const manage = can('manage_team', 'Team');
  const q = useQuery({ queryKey: wsKey('team'), queryFn: () => api.get('/team/members') });
  const audit = useQuery({ queryKey: wsKey('audit'), queryFn: () => api.get('/workspaces/current/audit-log'), enabled: manage });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('BUILDER');
  const [lastLink, setLastLink] = useState<{ link: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const invite = useApiMutation(() => api.post('/team/invites', { email, role }), { invalidate: [['team']], onSuccess: (out) => setLastLink(out) });
  const changeRole = useApiMutation(({ uid, role: r }: { uid: string; role: WorkspaceRole }) => api.patch(`/team/members/${uid}`, { role: r }), { success: 'Role updated', invalidate: [['team']] });
  const removeMember = useApiMutation((uid: string) => api.del(`/team/members/${uid}`), { success: 'Member removed', invalidate: [['team']] });
  const revoke = useApiMutation((token: string) => api.del(`/team/invites/${token}`), { success: 'Invite revoked', invalidate: [['team']] });
  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => (setCopied(text), setTimeout(() => setCopied(null), 1500)));

  return (
    <Page
      title="Team"
      subtitle={`People who can work in ${ws?.workspace.name || 'this workspace'}.`}
      action={manage && <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => (setOpen(true), setLastLink(null), setEmail(''))}>Invite</Button>}
    >
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <Card className="p-0 overflow-hidden">
            <ul className="divide-y divide-[var(--separator)]">
              {q.data.members.map((m: any) => (
                <li key={m.uid} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Avatar name={m.name || m.email} size="sm" />
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-[14px] font-medium text-[var(--ink)]">
                      {m.name} {m.uid === user?.id && <Badge variant="outline">You</Badge>}
                    </p>
                    <p className="text-[12px] text-[var(--ink-3)]">{m.email}</p>
                  </div>
                  {manage && m.uid !== user?.id ? (
                    <select
                      aria-label={`Role for ${m.email}`}
                      value={m.role}
                      onChange={(e) => changeRole.mutate({ uid: m.uid, role: e.target.value as WorkspaceRole })}
                      className="h-9 px-2 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)]"
                    >
                      {ROLES.filter((r) => ws?.role === 'OWNER' || !['OWNER', 'ADMIN'].includes(r.value) || r.value === m.role).map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{ROLES.find((r) => r.value === m.role)?.label}</Badge>
                  )}
                  {(manage || m.uid === user?.id) && (
                    <button
                      aria-label={m.uid === user?.id ? 'Leave workspace' : `Remove ${m.email}`}
                      title={m.uid === user?.id ? 'Leave workspace' : 'Remove'}
                      className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--danger)] hover:bg-[var(--surface-2)]"
                      onClick={() => window.confirm(m.uid === user?.id ? 'Leave this workspace?' : `Remove ${m.email} from the workspace?`) && removeMember.mutate(m.uid, { onSuccess: () => m.uid === user?.id && window.location.assign('/dashboard') })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {q.data.invites.length > 0 && (
            <Card className="space-y-3">
              <SectionTitle title="Pending invites" description="Invites expire after 7 days." />
              <ul className="divide-y divide-[var(--separator)]">
                {q.data.invites.map((i: any) => (
                  <li key={i.token} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-[14px] text-[var(--ink)]">{i.email}</p>
                      <p className="text-[12px] text-[var(--ink-3)]">
                        {ROLES.find((r) => r.value === i.role)?.label} · sent {timeAgo(i.createdAt)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" icon={copied === i.link ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={() => copy(i.link)}>
                      Copy link
                    </Button>
                    {manage && (
                      <Button size="sm" variant="ghost" onClick={() => revoke.mutate(i.token)}>
                        Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {manage && audit.data?.items?.length > 0 && (
            <Card className="space-y-3">
              <SectionTitle title="Activity" description="Recent changes in this workspace" />
              <ul className="divide-y divide-[var(--separator)] max-h-[360px] overflow-y-auto">
                {audit.data.items.map((a: any) => (
                  <li key={a.id} className="flex items-center gap-3 py-2 text-[13px]">
                    <span className="text-[var(--ink)] font-medium">{a.actorEmail || 'System'}</span>
                    <span className="text-[var(--ink-2)]">{a.action.replace(/[._]/g, ' ')}</span>
                    <span className="ml-auto text-[12px] text-[var(--ink-3)]">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Invite a teammate"
        description="They'll join this workspace with the role you choose."
        footer={
          !lastLink && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={invite.isPending} disabled={!/\S+@\S+\.\S+/.test(email)} onClick={() => invite.mutate()}>
                Send invite
              </Button>
            </div>
          )
        }
      >
        {lastLink ? (
          <div className="space-y-3">
            <p className="text-[14px] text-[var(--ink)]">{lastLink.emailSent ? `We emailed ${email} an invite.` : 'Invite created. Email sending is not set up yet, so share this link yourself:'}</p>
            <div className="flex gap-2">
              <input readOnly value={lastLink.link} className="flex-1 h-10 px-3 rounded-[10px] bg-[var(--surface-2)] border border-[var(--separator)] text-[12px] font-mono text-[var(--ink)]" aria-label="Invite link" />
              <Button icon={copied === lastLink.link ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={() => copy(lastLink.link)}>
                Copy
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@business.com" autoFocus />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              options={ROLES.filter((r) => r.value !== 'OWNER' && (ws?.role === 'OWNER' || r.value !== 'ADMIN')).map((r) => ({ value: r.value, label: `${r.label} — ${r.desc}` }))}
            />
          </div>
        )}
      </Sheet>
    </Page>
  );
};
