import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, TextField, Card } from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('owner@smiledental.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Safe same-site returnTo validator (prevents open redirects like returnTo=https://evil.com or //evil.com)
  const getSafeReturnTo = (target: string | null): string => {
    if (!target) return '/dashboard';
    if (target.startsWith('/') && !target.startsWith('//') && !target.includes('://')) {
      return target;
    }
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const target = getSafeReturnTo(searchParams.get('returnTo'));
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to connect to the authentication server. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)]">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-[20px] flex items-center justify-center mx-auto shadow-sm">
            Z
          </div>
          <h1 className="text-[26px] font-bold text-[var(--ink)] tracking-tight">
            Sign in to Zdoda
          </h1>
          <p className="text-[14px] text-[var(--ink-2)]">
            One Agent. Every Channel.
          </p>
        </div>

        <Card className="p-6 space-y-5 bg-[var(--surface)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[10px] bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[13px] font-medium text-[var(--danger)]">
                {error}
              </div>
            )}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-[var(--ink-2)]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-medium text-[var(--accent-ink)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <TextField
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[var(--separator)]">
            <p className="text-[13px] text-[var(--ink-2)]">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-[var(--accent-ink)] hover:underline">
                Create workspace
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo Credentials Hint */}
        <div className="p-3 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] text-center text-[12px] text-[var(--ink-3)]">
          Demo login: <code className="font-mono text-[var(--ink)]">owner@smiledental.com</code> /{' '}
          <code className="font-mono text-[var(--ink)]">Password123!</code>
        </div>
      </div>
    </div>
  );
};
