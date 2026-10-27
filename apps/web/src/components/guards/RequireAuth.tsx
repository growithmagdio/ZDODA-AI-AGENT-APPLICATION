import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../shell/AppShell';
import { Skeleton } from '@zdoda/ui';

/**
 * RequireAuth Guard:
 * - While auth status is 'loading': renders a full-screen app-shell skeleton (never redirects).
 * - When 'unauthenticated': replaces navigation to /login with encoded returnTo.
 * - When 'authenticated': renders AppShell with outlet.
 */
export const RequireAuth: React.FC = () => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full bg-[var(--canvas)] overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[var(--separator)] p-4 space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton shape="rect" className="w-7 h-7 rounded-lg" />
            <Skeleton shape="text" className="w-24 h-4" />
          </div>
          <div className="space-y-3 flex-1">
            <Skeleton shape="rect" className="h-8 rounded-lg" />
            <Skeleton shape="rect" className="h-8 rounded-lg" />
            <Skeleton shape="rect" className="h-8 rounded-lg" />
            <Skeleton shape="rect" className="h-8 rounded-lg" />
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 border-b border-[var(--separator)] px-6 flex items-center justify-between">
            <Skeleton shape="text" className="w-32 h-4" />
            <Skeleton shape="circle" className="w-8 h-8" />
          </div>
          <div className="p-8 space-y-6">
            <Skeleton shape="text" className="w-64 h-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton shape="rect" className="h-28 rounded-2xl" />
              <Skeleton shape="rect" className="h-28 rounded-2xl" />
              <Skeleton shape="rect" className="h-28 rounded-2xl" />
              <Skeleton shape="rect" className="h-28 rounded-2xl" />
            </div>
            <Skeleton shape="rect" className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <AppShell />;
};
