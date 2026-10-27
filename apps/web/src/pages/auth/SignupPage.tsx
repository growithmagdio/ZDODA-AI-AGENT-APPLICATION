import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextField, Card } from '@zdoda/ui';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, workspaceName);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Signup failed. Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)]">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-[20px] flex items-center justify-center mx-auto shadow-sm">
            Z
          </div>
          <h1 className="text-[26px] font-bold text-[var(--ink)] tracking-tight">
            Create your Zdoda workspace
          </h1>
          <p className="text-[14px] text-[var(--ink-2)]">
            Deploy your first multi-channel AI agent in minutes.
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
              label="Your Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Alex Rivera"
              required
            />

            <TextField
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@riveraclinic.com"
              required
            />

            <TextField
              label="Password (min 8 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <TextField
              label="Workspace or Clinic Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Rivera Dental Studio"
              hint="You can invite team members and add more workspaces later."
            />

            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
              Create Workspace
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[var(--separator)]">
            <p className="text-[13px] text-[var(--ink-2)]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--accent-ink)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
