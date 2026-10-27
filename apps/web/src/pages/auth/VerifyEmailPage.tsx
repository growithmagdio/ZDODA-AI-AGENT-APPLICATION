import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Card } from '@zdoda/ui';
import { apiRequest } from '../../lib/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please check the link from your email.');
      return;
    }

    const verify = async () => {
      try {
        await apiRequest('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification token is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)]">
      <Card className="max-w-md w-full p-8 text-center space-y-5 bg-[var(--surface)]">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin mx-auto" />
            <h1 className="text-[20px] font-bold text-[var(--ink)]">Verifying your email...</h1>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--success)]/15 text-[var(--success)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-[22px] font-bold text-[var(--ink)]">Email verified!</h1>
            <p className="text-[14px] text-[var(--ink-2)]">
              Your email has been confirmed. You can now access your dashboard and configure your AI agent.
            </p>
            <Link to="/dashboard">
              <Button variant="primary" className="w-full mt-4">
                Continue to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/15 text-[var(--danger)] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-[22px] font-bold text-[var(--ink)]">Verification Failed</h1>
            <p className="text-[14px] text-[var(--ink-2)]">{message}</p>
            <Link to="/login">
              <Button variant="secondary" className="w-full mt-4">
                Back to Sign In
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
