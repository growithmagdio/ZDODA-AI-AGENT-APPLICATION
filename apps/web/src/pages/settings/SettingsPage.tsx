import React, { useEffect, useState } from 'react';
import { Button, Card, TextField, Select, StatusPill } from '@zdoda/ui';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useSystemStatus, useWorkspace } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Page, SectionTitle } from '../../components/common/Page';

const CATEGORIES = ['Healthcare', 'Dental', 'Real estate', 'E-commerce', 'Education', 'Restaurant / Hospitality', 'SaaS / Tech', 'Local services', 'Agency', 'Other'];

export const SettingsPage: React.FC = () => {
  const { user, firebaseUser, refresh, resetPassword, resendVerification } = useAuth();
  const toast = useToast();
  const can = useCan();
  const { data: ws } = useWorkspace();
  const sys = useSystemStatus();
  const [name, setName] = useState(user?.name || '');
  const [wsForm, setWsForm] = useState({ name: '', category: '', websiteUrl: '', supportEmail: '', timezone: '' });

  useEffect(() => {
    if (ws) setWsForm({ name: ws.workspace.name, category: ws.workspace.category || '', websiteUrl: ws.workspace.websiteUrl || '', supportEmail: ws.workspace.supportEmail || '', timezone: ws.workspace.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone });
  }, [ws]);

  const saveProfile = useApiMutation(() => api.patch('/auth/profile', { name }), { success: 'Profile saved', onSuccess: () => refresh() });
  const saveWs = useApiMutation(() => api.patch('/workspaces/current', wsForm), { success: 'Workspace saved', invalidate: [['workspace']], onSuccess: () => refresh() });
  const editableWs = can('update', 'Settings');

  return (
    <Page title="Settings" subtitle="Your profile, workspace details and system status.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="space-y-4">
          <SectionTitle title="Your profile" />
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Email" value={user?.email || ''} disabled hint={firebaseUser?.emailVerified ? 'Verified' : 'Not verified yet'} />
          <div className="flex flex-wrap gap-2">
            <Button loading={saveProfile.isPending} disabled={name.trim().length < 2 || name === user?.name} onClick={() => saveProfile.mutate(undefined)}>
              Save profile
            </Button>
            {!firebaseUser?.emailVerified && (
              <Button variant="outline" onClick={() => resendVerification().then(() => toast('Verification email sent'))}>
                Resend verification
              </Button>
            )}
            {firebaseUser?.providerData.some((p) => p.providerId === 'password') && (
              <Button variant="ghost" onClick={() => resetPassword(user!.email).then(() => toast('Password reset email sent', { description: `Check ${user!.email}` }))}>
                Change password
              </Button>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle title="Workspace" description={editableWs ? undefined : 'Only owners and admins can change these.'} />
          <fieldset disabled={!editableWs} className="space-y-4">
            <TextField label="Business name" value={wsForm.name} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} />
            <Select label="Industry" value={wsForm.category} onChange={(e) => setWsForm({ ...wsForm, category: e.target.value })} options={[{ value: '', label: 'Choose…' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
            <TextField label="Website" value={wsForm.websiteUrl} onChange={(e) => setWsForm({ ...wsForm, websiteUrl: e.target.value })} placeholder="https://" />
            <TextField label="Support email" value={wsForm.supportEmail} onChange={(e) => setWsForm({ ...wsForm, supportEmail: e.target.value })} placeholder="hello@yourbusiness.com" />
            <TextField label="Time zone" value={wsForm.timezone} onChange={(e) => setWsForm({ ...wsForm, timezone: e.target.value })} />
            <Button loading={saveWs.isPending} onClick={() => saveWs.mutate(undefined)} disabled={wsForm.name.trim().length < 2}>
              Save workspace
            </Button>
          </fieldset>
        </Card>

        <Card className="space-y-3 lg:col-span-2">
          <SectionTitle title="System status" description="Which services are connected on the server. Anything in demo mode works, but with simulated results." />
          {sys.data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['AI answers', sys.data.llm.live, sys.data.llm.live ? sys.data.llm.provider : 'Demo model'],
                ['Knowledge search', sys.data.embeddings.live, sys.data.embeddings.live ? sys.data.embeddings.provider : 'Keyword (demo)'],
                ['Payments', sys.data.payments.live, sys.data.payments.live ? 'Stripe' : 'Demo billing'],
                ['Email', sys.data.email.live, sys.data.email.live ? 'Resend' : 'Not configured'],
              ].map(([label, live, detail]) => (
                <div key={String(label)} className="p-3 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] space-y-1.5">
                  <p className="text-[13px] font-semibold text-[var(--ink)]">{label}</p>
                  <p className="text-[12px] text-[var(--ink-3)] capitalize">{detail as string}</p>
                  <StatusPill status={live ? 'live' : 'demo'} label={live ? 'Live' : 'Demo'} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
};
