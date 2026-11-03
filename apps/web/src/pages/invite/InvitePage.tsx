import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '@zdoda/ui';
import { api, ApiError, setActiveWorkspaceId } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const InvitePage: React.FC = () => {
  const { token = '' } = useParams();
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['invite', token], queryFn: () => api.get(`/invites/${token}`), enabled: status === 'authenticated', retry: false });

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      const out = await api.post(`/invites/${token}/accept`);
      setActiveWorkspaceId(out.workspaceId);
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept the invite');
    } finally {
      setBusy(false);
    }
  };

  const returnTo = encodeURIComponent(`/invite/${token}`);
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)]">
      <Card className="w-full max-w-[420px] p-6 space-y-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-[20px] flex items-center justify-center mx-auto">Z</div>
        {status === 'unauthenticated' ? (
          <>
            <h1 className="text-[22px] font-bold text-[var(--ink)]">You've been invited to Zdoda</h1>
            <p className="text-[14px] text-[var(--ink-2)]">Sign in or create an account with the email the invite was sent to.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate(`/signup?returnTo=${returnTo}`)}>Create account</Button>
              <Button variant="outline" onClick={() => navigate(`/login?returnTo=${returnTo}`)}>
                Sign in
              </Button>
            </div>
          </>
        ) : q.isLoading || status === 'loading' ? (
          <p className="text-[14px] text-[var(--ink-3)]">Loading invite…</p>
        ) : q.error ? (
          <>
            <h1 className="text-[20px] font-bold text-[var(--ink)]">Invite not found</h1>
            <p className="text-[14px] text-[var(--ink-2)]">The link may be wrong or the invite was revoked.</p>
            <Link to="/dashboard" className="text-[14px] font-semibold text-[var(--accent-ink)]">Go to dashboard</Link>
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-bold text-[var(--ink)]">Join {q.data.workspaceName}</h1>
            <p className="text-[14px] text-[var(--ink-2)]">
              {q.data.invitedByName} invited <b>{q.data.email}</b> as {String(q.data.role).toLowerCase()}.
            </p>
            {q.data.status !== 'pending' && q.data.status !== 'accepted' && <p className="text-[13px] text-[var(--danger)]">This invite is {q.data.status}.</p>}
            {user && user.email !== q.data.email && (
              <p className="text-[13px] text-[var(--danger)]">
                You're signed in as {user.email}.{' '}
                <button className="underline" onClick={() => logout()}>
                  Switch account
                </button>
              </p>
            )}
            {error && <p className="text-[13px] text-[var(--danger)]">{error}</p>}
            <Button className="w-full" loading={busy} disabled={user?.email !== q.data.email || !['pending', 'accepted'].includes(q.data.status)} onClick={accept}>
              Accept invite
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};
