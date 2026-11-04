import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, TextField, Card } from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { googleSignInEnabled, showDemoLogin } from '../../lib/firebase';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(showDemoLogin ? 'owner@smiledental.com' : '');
  const [password, setPassword] = useState(showDemoLogin ? 'Password123!' : '');
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

          {googleSignInEnabled && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                setError('');
                try {
                  await loginWithGoogle();
                  navigate(getSafeReturnTo(searchParams.get('returnTo')), { replace: true });
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Google sign-in failed');
                }
              }}
            >
              <GoogleIcon /> Continue with Google
            </Button>
          )}

          <div className="text-center pt-2 border-t border-[var(--separator)]">
            <p className="text-[13px] text-[var(--ink-2)]">
              Don't have an account?{' '}
              <Link to={`/signup${searchParams.get('returnTo') ? `?returnTo=${encodeURIComponent(searchParams.get('returnTo')!)}` : ''}`} className="font-semibold text-[var(--accent-ink)] hover:underline">
                Create workspace
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo Credentials Hint (local emulator / demo deployments only) */}
        {showDemoLogin && <div className="p-3 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] text-center text-[12px] text-[var(--ink-3)]">
          Demo login: <code className="font-mono text-[var(--ink)]">owner@smiledental.com</code> /{' '}
          <code className="font-mono text-[var(--ink)]">Password123!</code>
        </div>}
      </div>
    </div>
  );
};

export const GoogleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
