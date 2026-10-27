import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, TextField, Card } from '@zdoda/ui';
import { apiRequest } from '../../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)]">
      <Card className="max-w-md w-full p-8 space-y-6 bg-[var(--surface)]">
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold text-[var(--ink)] tracking-tight">
            Reset Password
          </h1>
          <p className="text-[14px] text-[var(--ink-2)]">
            Enter your email and we'll send a password recovery link.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-[12px] bg-[var(--success)]/10 border border-[var(--success)]/20 text-center space-y-3">
            <p className="text-[14px] font-medium text-[var(--success)]">
              Check your inbox!
            </p>
            <p className="text-[13px] text-[var(--ink-2)]">
              If an account exists for {email}, a password reset link has been dispatched. (Check Mailpit at localhost:8025 in dev).
            </p>
            <Link to="/login" className="inline-block text-[13px] font-semibold text-[var(--accent-ink)] hover:underline pt-2">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Account Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              required
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
            <div className="text-center pt-2">
              <Link to="/login" className="text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)]">
                Cancel and return to login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
