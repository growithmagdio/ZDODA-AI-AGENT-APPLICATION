import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Wrench,
  Radio,
  Palette,
  Inbox,
  Phone,
  BarChart3,
  Boxes,
  Users,
  CreditCard,
  Settings,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Moon,
  Sun,
  X,
  Compass,
} from 'lucide-react';
import { GlassBar, CommandPalette, Avatar, IconButton, SvgLensFilter, LiveIsland, LiveIslandEvent, IPhoneTabBar } from '@zdoda/ui';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { OnboardingSheet } from './OnboardingSheet';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@zdoda/ui';

interface NavSection {
  title: string;
  items: {
    label: string;
    to: string;
    icon: React.ReactNode;
    phase?: number;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Build',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px] stroke-[1.75]" /> },
      { label: 'Agents', to: '/agents', icon: <Bot className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 3 },
      { label: 'Knowledge Base', to: '/knowledge', icon: <BookOpen className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 3 },
      { label: 'Tools & Integrations', to: '/tools', icon: <Wrench className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 5 },
      { label: 'Channels', to: '/channels', icon: <Radio className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 5 },
      { label: 'Widget Studio', to: '/widget-studio', icon: <Palette className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 4 },
    ],
  },
  {
    title: 'Operate',
    items: [
      { label: 'Inbox', to: '/inbox', icon: <Inbox className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 5 },
      { label: 'Phone Numbers', to: '/phone-numbers', icon: <Phone className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 5 },
      { label: 'Analytics', to: '/analytics', icon: <BarChart3 className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 6 },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Templates', to: '/templates', icon: <Boxes className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 3 },
      { label: 'Team & Workspace', to: '/team', icon: <Users className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 6 },
      { label: 'Billing & Subscription', to: '/billing', icon: <CreditCard className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 2 },
      { label: 'Settings', to: '/settings', icon: <Settings className="w-[18px] h-[18px] stroke-[1.75]" />, phase: 6 },
    ],
  },
];

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  const toggleTheme = () => {
    const next = !darkTheme;
    setDarkTheme(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [liveEvent, setLiveEvent] = useState<LiveIslandEvent | null>(null);

  useEffect(() => {
    const handleIslandEvent = (e: any) => {
      setLiveEvent(e.detail);
    };
    window.addEventListener('zdoda:live-island', handleIslandEvent);
    return () => window.removeEventListener('zdoda:live-island', handleIslandEvent);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[var(--canvas)] overflow-hidden">
      <SvgLensFilter />
      <LiveIsland currentEvent={liveEvent} />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <OnboardingSheet />

      {/* Desktop / Tablet Sidebar (macOS Style Glass) */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 h-full glass border-r border-[var(--separator)] transition-all duration-300 z-30',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--separator)]">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[14px]">
                Z
              </div>
              <span className="font-bold text-[17px] tracking-tight text-[var(--ink)]">
                Zdoda
              </span>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[14px] mx-auto">
              Z
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1 text-[var(--ink-3)] hover:text-[var(--ink)] rounded-md cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-[var(--ink-3)] select-none">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors select-none',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-[var(--accent-tint)] text-[var(--accent-ink)] font-semibold shadow-xs'
                        : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
                    )
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Living Styleguide Dev Link */}
          <div className="pt-2 border-t border-[var(--separator)]">
            <NavLink
              to="/design"
              title={collapsed ? 'Living Styleguide' : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors select-none',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
                )
              }
            >
              <Compass className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Design System</span>}
            </NavLink>
          </div>
        </div>

        {/* User Profile Mini Footer */}
        <div className="p-3 border-t border-[var(--separator)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name || 'Dr. Sarah Mitchell'} size="sm" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[var(--ink)] truncate">
                  {user?.name || 'Dr. Sarah Mitchell'}
                </p>
                <p className="text-[11px] text-[var(--ink-3)] truncate">
                  {user?.email || 'owner@smiledental.com'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-[var(--ink-3)] hover:text-[var(--danger)] rounded-[8px] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Floating Top Glass Bar */}
        <GlassBar className="h-14 px-4 flex items-center justify-between border-b border-[var(--separator)]">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-[var(--ink)] rounded-md hover:bg-[var(--surface-2)]"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <WorkspaceSwitcher />
          </div>

          <div className="flex items-center gap-2">
            {/* ⌘K Command Palette Search Bar */}
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--surface-2)] hover:bg-[var(--surface-inset)] text-[13px] text-[var(--ink-3)] transition-colors border border-[var(--separator)] cursor-pointer select-none"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--separator)]">
                ⌘K
              </kbd>
            </button>

            {/* Quota Usage Meter (Demo) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--surface-2)] border border-[var(--separator)] text-[12px]">
              <span className="text-[var(--ink-2)] font-medium">Messages:</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">2,842 / 10,000</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent)] text-white">
                Demo
              </span>
            </div>

            {/* Theme Toggle */}
            <IconButton
              icon={darkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              aria-label="Toggle theme"
              onClick={toggleTheme}
              size="sm"
            />

            {/* Notifications */}
            <IconButton
              icon={<Bell className="w-4 h-4" />}
              aria-label="Notifications"
              onClick={() => {}}
              size="sm"
            />

            {/* Help / Docs */}
            <IconButton
              icon={<HelpCircle className="w-4 h-4" />}
              aria-label="Help & Documentation"
              onClick={() => {}}
              size="sm"
            />
          </div>
        </GlassBar>

        {/* Scrollable Workspace Body with Scroll-Edge Fade */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* iPhone Floating Tab Bar (<640px) */}
        <IPhoneTabBar
          activeTab={
            location.pathname.includes('/agents')
              ? 'agents'
              : location.pathname.includes('/inbox')
              ? 'inbox'
              : location.pathname.includes('/widget-studio')
              ? 'studio'
              : 'home'
          }
          onTabChange={(tabId) => {
            if (tabId === 'home') navigate('/dashboard');
            else if (tabId === 'agents') navigate('/agents');
            else if (tabId === 'inbox') navigate('/inbox');
            else if (tabId === 'studio') navigate('/widget-studio');
            else if (tabId === 'more') setMobileDrawerOpen(true);
          }}
          onSearchClick={() => setCmdOpen(true)}
        />
      </div>

      {/* Mobile / Tablet Drawer Sheet (<1024px) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 glass shadow-[var(--shadow-float)] border-r border-[var(--separator)] p-4 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--separator)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[14px]">
                    Z
                  </div>
                  <span className="font-bold text-[17px] text-[var(--ink)]">Zdoda</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="p-1 text-[var(--ink-3)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {NAV_SECTIONS.map((sec) => (
                  <div key={sec.title} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                      {sec.title}
                    </p>
                    {sec.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] font-medium',
                            isActive ? 'bg-[var(--accent-tint)] text-[var(--accent-ink)] font-semibold' : 'text-[var(--ink-2)]'
                          )
                        }
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--separator)] flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--ink)]">{user?.name}</span>
              <button onClick={handleLogout} className="text-[var(--danger)] text-[13px] font-semibold">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
