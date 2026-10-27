import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * PublicOnlyRoute Guard:
 * Wraps guest-only auth pages (/login, /signup).
 * If already authenticated, replaces navigation to /dashboard.
 */
export const PublicOnlyRoute: React.FC = () => {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--canvas)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
