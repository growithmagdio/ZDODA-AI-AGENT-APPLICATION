import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, GlassBar } from '@zdoda/ui';
import { Home, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const { status } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas)] text-[var(--ink)]">
      {/* Top Brand Bar */}
      <header className="h-14 px-6 border-b border-[var(--separator)] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[14px]">
            Z
          </div>
          <span className="font-bold text-[17px] tracking-tight">Zdoda</span>
        </Link>

        <div>
          {status === 'authenticated' ? (
            <Link to="/dashboard">
              <Button variant="secondary" size="sm" icon={<LayoutDashboard className="w-3.5 h-3.5" />}>
                Open Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[64px] font-extrabold tracking-tight text-[var(--accent)] font-mono leading-none">
              404
            </span>
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
              Page Not Found
            </h1>
            <p className="text-[14px] text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
              The page you are looking for might have been moved, renamed, or does not exist.
            </p>
          </div>

          <Card className="p-6 space-y-3 bg-[var(--surface)] border border-[var(--separator)]">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full" icon={<Home className="w-4 h-4" />}>
                  Return to Home
                </Button>
              </Link>
              {status === 'authenticated' ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full" icon={<LayoutDashboard className="w-4 h-4" />}>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-[12px] text-[var(--ink-3)] border-t border-[var(--separator)]">
        Zdoda • One Agent. Every Channel.
      </footer>
    </div>
  );
};
