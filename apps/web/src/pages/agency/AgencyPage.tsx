import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Sheet, TextField, EmptyState } from '@zdoda/ui';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { api, setActiveWorkspaceId } from '../../lib/api';
import { useApiMutation, useCan, wsKey, fmt, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';

interface Branding {
  appName: string;
  logoUrl?: string;
  primaryColor: string;
  widgetFooter: string;
  customDomain?: string;
}

export const AgencyPage: React.FC = () => {
  const can = useCan();
  const q = useQuery({ queryKey: wsKey('agency'), queryFn: () => api.get<{ isAgency: boolean; branding: Branding | null; clients: { id: string; name: string; createdAt: string; messages: number; voiceSeconds: number }[] }>('/agency') });
  const [b, setB] = useState<Branding>({ appName: '', logoUrl: '', primaryColor: '#6538F5', widgetFooter: '', customDomain: '' });
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState({ name: '', websiteUrl: '' });
  useEffect(() => {
    if (q.data?.branding) setB({ logoUrl: '', customDomain: '', ...q.data.branding });
  }, [q.data?.branding]);
  const save = useApiMutation(() => api.patch('/agency/branding', b), { success: 'Branding saved for you and every client', invalidate: [['agency']] });
  const add = useApiMutation(() => api.post<{ id: string }>('/agency/clients', { name: client.name, websiteUrl: client.websiteUrl || undefined }), {
    success: 'Client workspace created',
    invalidate: [['agency']],
    onSuccess: () => {
      setOpen(false);
      setClient({ name: '', websiteUrl: '' });
    },
  });

  if (q.isLoading) return <Page title="Agency"><LoadingBlock /></Page>;
  if (q.error || !q.data) return <Page title="Agency"><ErrorBlock error={q.error} onRetry={() => q.refetch()} /></Page>;
  if (!q.data.isAgency)
    return (
      <Page title="Agency" subtitle="Resell Zdoda to your clients under your own brand.">
        <EmptyState icon={<Building2 className="w-8 h-8" />} title="Agency plan required" description="Create a workspace for each client, white-label the dashboard and widget, and see usage for all clients in one place." />
      </Page>
    );

  return (
    <Page title="Agency" subtitle="Client workspaces and white-label branding." action={can('manage_billing', 'Billing') && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>New client</Button>}>
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--separator)]">
          <p className="text-[15px] font-semibold text-[var(--ink)]">Clients</p>
          <p className="text-[12px] text-[var(--ink-3)]">Each client gets its own agents, knowledge, widget and inbox. Usage this month:</p>
        </div>
        {!q.data.clients.length ? (
          <p className="p-6 text-[13px] text-[var(--ink-3)]">No clients yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--separator)]">
            {q.data.clients.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[14px] font-medium text-[var(--ink)]">{c.name}</p>
                  <p className="text-[12px] text-[var(--ink-3)]">
                    {fmt(c.messages)} messages · {Math.ceil(c.voiceSeconds / 60)} voice min · added {timeAgo(c.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActiveWorkspaceId(c.id);
                    window.location.assign('/dashboard');
                  }}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="White-label" description="Applied to your dashboard and to every client's widget." />
        <fieldset disabled={!can('update', 'Settings')} className="grid sm:grid-cols-2 gap-4">
          <TextField label="Product name" value={b.appName} onChange={(e) => setB({ ...b, appName: e.target.value })} placeholder="Acme AI" />
          <TextField label="Logo URL" value={b.logoUrl || ''} onChange={(e) => setB({ ...b, logoUrl: e.target.value })} placeholder="https://…/logo.png" />
          <TextField label="Brand color" value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} placeholder="#6538F5" />
          <TextField label="Widget footer text" value={b.widgetFooter} onChange={(e) => setB({ ...b, widgetFooter: e.target.value })} placeholder="Powered by Acme" />
          <TextField label="Custom domain (optional)" value={b.customDomain || ''} onChange={(e) => setB({ ...b, customDomain: e.target.value })} placeholder="app.youragency.com" hint="Point a CNAME to your Zdoda host, then add the domain in Firebase Hosting." />
        </fieldset>
        <Button loading={save.isPending} disabled={b.appName.trim().length < 2 || !/^#[0-9a-f]{6}$/i.test(b.primaryColor)} onClick={() => save.mutate(undefined)}>
          Save branding
        </Button>
      </Card>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="New client workspace"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={add.isPending} disabled={client.name.trim().length < 2} onClick={() => add.mutate(undefined)}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextField label="Client business name" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} autoFocus />
          <TextField label="Website (optional)" value={client.websiteUrl} onChange={(e) => setClient({ ...client, websiteUrl: e.target.value })} placeholder="https://" />
        </div>
      </Sheet>
    </Page>
  );
};
