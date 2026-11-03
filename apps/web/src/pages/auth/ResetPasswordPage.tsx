import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button, TextField, Card } from '@zdoda/ui';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { authErrorMessage } from '../../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('oobCode') || searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (newPassword.length < 8) throw Object.assign(new Error('Please use at least 8 characters.'), { code: '' });
      await confirmPasswordReset(auth, token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(code === 'auth/expired-action-code' || code === 'auth/invalid-action-code' ? 'This reset link has expired or was already used. Request a new one.' : authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)]">
      <Card className="max-w-md w-full p-8 space-y-6 bg-[var(--surface)]">
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold text-[var(--ink)] tracking-tight">
            Create New Password
          </h1>
          <p className="text-[14px] text-[var(--ink-2)]">
            Choose a secure password of at least 8 characters.
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-[12px] bg-[var(--success)]/10 text-center space-y-2">
            <p className="text-[14px] font-semibold text-[var(--success)]">
              Password reset successfully!
            </p>
            <p className="text-[13px] text-[var(--ink-2)]">Redirecting you to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[10px] bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[13px] font-medium text-[var(--danger)]">
                {error}
              </div>
            )}

            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Update Password
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)]">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
