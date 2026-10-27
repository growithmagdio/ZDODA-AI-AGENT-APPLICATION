import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  IconButton,
  StatusPill,
  SegmentedControl,
  Switch,
  Card,
  StatCard,
  GroupedList,
  LargeTitleHeader,
  Sheet,
  EmptyState,
  Skeleton,
  TextField,
  Select,
  Avatar,
  Badge,
  LiquidGlass,
  IPhoneTabBar,
  IPhoneNavBar,
  BottomSheet,
  SheetDetent,
  ActionSheet,
  LiveIsland,
  LiveIslandEvent,
  SwipeRow,
  PullToRefresh,
  LongPressContextMenu,
  PhoneFrame,
  haptics,
} from '@zdoda/ui';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Phone,
  BarChart,
  Settings,
  Shield,
  Layers,
  Palette,
  Check,
  RefreshCw,
  Trash2,
  Archive,
  Pin,
  Flame,
  Smartphone,
  Eye,
} from 'lucide-react';
import { mountWidget } from '@zdoda/widget';
import { DEFAULT_WIDGET_CONFIG } from '@zdoda/shared';

export const DesignPage: React.FC = () => {
  const [segmentedValue, setSegmentedValue] = useState<'monthly' | 'yearly'>('monthly');
  const [switchActive, setSwitchActive] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetDetent, setBottomSheetDetent] = useState<SheetDetent>('medium');
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectVal, setSelectVal] = useState('violet');
  const [activeTab, setActiveTab] = useState('home');

  // Dynamic Island simulation state
  const [islandEvent, setIslandEvent] = useState<LiveIslandEvent | null>({
    id: 'sim-call-1',
    type: 'call',
    title: 'Voice Assistant Active',
    subtitle: 'Smile Dental • Inbound Caller',
    durationSeconds: 24,
    isMuted: false,
    onAction: (actionId) => {
      if (actionId === 'endCall') setIslandEvent(null);
      else if (actionId === 'toggleMute') {
        setIslandEvent((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
      }
    },
  });

  const triggerIsland = (evt: LiveIslandEvent | null) => {
    window.dispatchEvent(new CustomEvent('zdoda:live-island', { detail: evt }));
  };

  // Widget preview inside PhoneFrame
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (widgetContainerRef.current) {
      const instance = mountWidget(widgetContainerRef.current, DEFAULT_WIDGET_CONFIG, { mode: 'preview' });
      return () => instance.destroy();
    }
  }, []);

  return (
    <div className="space-y-16 max-w-5xl mx-auto py-8">
      <LargeTitleHeader
        title="Living Design System & Styleguide"
        subtitle="Apple-inspired UI component kit with native iOS Liquid Glass, fluid spring-driven gestures, Dynamic Island, and phone simulator."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Smartphone className="w-4 h-4" />}
              onClick={() => {
                haptics.snap();
                setBottomSheetOpen(true);
              }}
            >
              Bottom Sheet
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => {
                haptics.tap();
                setSheetOpen(true);
              }}
            >
              Desktop Sheet
            </Button>
          </div>
        }
      />

      {/* 1. iOS Liquid Glass Material */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              1. iOS Liquid Glass Material (Rule 05)
            </h2>
            <p className="text-[14px] text-[var(--ink-2)] mt-1">
              Multi-layer glass material: SVG refraction lens (`#zd-lens`), `blur(24px) saturate(1.6)`, specular rim gradient, and press scale physics.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            60fps Native Hardware
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Regular Liquid Glass */}
          <LiquidGlass
            variant="regular"
            interactive
            className="p-6 rounded-2xl flex flex-col justify-between h-44 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Variant: Regular
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                  72% Surface
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)]">
                Navigation Bars & Sheets Glass
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1">
                Tap or click to test the authentic iOS 0.96 scale down and 1.08 brightness response.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <span>Press me for tactile feedback</span>
            </div>
          </LiquidGlass>

          {/* Clear Liquid Glass */}
          <div className="relative rounded-2xl overflow-hidden h-44 p-1 flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-purple-700 to-pink-600">
            <LiquidGlass
              variant="clear"
              interactive
              dimmed
              className="w-11/12 p-4 rounded-xl text-white cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Variant: Clear (Dimmed)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20">
                  25% Translucent
                </span>
              </div>
              <h4 className="text-base font-bold text-white">
                Over Bright Media & Video
              </h4>
              <p className="text-xs text-white/70 mt-1">
                Features 35% black dimming layer and 10px blur for voice call controls and widget launchers.
              </p>
            </LiquidGlass>
          </div>
        </div>
      </section>

      {/* 2. Dynamic Island Live Activity Simulator */}
      <section className="space-y-4">
        <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          2. Dynamic Island Live Activity (`&lt;LiveIsland&gt;`)
        </h2>
        <p className="text-[14px] text-[var(--ink-2)]">
          Pinned top-center black capsule morphing with spring physics into an expanded card with actions.
        </p>

        <Card className="p-4 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon={<Phone className="w-4 h-4 text-emerald-500" />}
            onClick={() => {
              haptics.tap();
              triggerIsland({
                id: 'active-call',
                type: 'call',
                title: 'Inbound Dental Call',
                subtitle: 'Dr. Sarah Mitchell • Dental Assistant AI',
                durationSeconds: 45,
                isMuted: false,
                onAction: (act) => {
                  if (act === 'endCall') triggerIsland(null);
                  else if (act === 'toggleMute') {
                    triggerIsland({
                      id: 'active-call',
                      type: 'call',
                      title: 'Inbound Dental Call (Muted)',
                      subtitle: 'Dr. Sarah Mitchell • Dental Assistant AI',
                      durationSeconds: 46,
                      isMuted: true,
                    });
                  }
                },
              });
            }}
          >
            Simulate Active Call
          </Button>

          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4 text-amber-500" />}
            onClick={() => {
              haptics.tap();
              triggerIsland({
                id: 'ingestion-job',
                type: 'ingestion',
                title: 'Indexing Clinic Brochure',
                subtitle: 'RAG Knowledge Pipeline • 3 sources',
                progressPercent: 68,
                onAction: () => setSheetOpen(true),
              });
            }}
          >
            Simulate Knowledge Ingestion
          </Button>

          <Button
            variant="secondary"
            icon={<Sparkles className="w-4 h-4 text-accent" />}
            onClick={() => {
              haptics.tap();
              triggerIsland({
                id: 'widget-publish',
                type: 'publish',
                title: 'Widget Published Live',
                subtitle: 'smiledental.com • Production v1.2',
                onAction: () => setBottomSheetOpen(true),
              });
            }}
          >
            Simulate Widget Publish
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              haptics.tap();
              triggerIsland(null);
            }}
          >
            Clear Island
          </Button>
        </Card>
      </section>

      {/* 3. iPhone Navigation & Gestures */}
      <section className="space-y-4">
        <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-accent" />
          3. iPhone Navigation & Floating Controls
        </h2>
        <p className="text-[14px] text-[var(--ink-2)]">
          Floating tab bar capsule with spring sliding lens, search button, and swipe actions on list rows.
        </p>

        {/* Tab Bar Preview Container */}
        <div className="p-8 rounded-2xl bg-surface-2/60 border border-border flex flex-col items-center justify-center gap-6">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Interactive Floating Capsule Tab Bar (Mobile & Desktop Preview)
          </span>

          <div className="w-full max-w-md">
            <IPhoneTabBar
              previewMode
              className="w-full flex justify-center"
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId)}
              onSearchClick={() => setSheetOpen(true)}
            />
          </div>
        </div>

        {/* Swipe Actions on Rows */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Interactive Swipe Rows (Swipe Left: Archive/Delete, Swipe Right: Pin/Read)
          </span>

          <SwipeRow
            onArchive={() => alert('Archived conversation with Sarah M.')}
            onDelete={() => alert('Deleted conversation')}
            onMarkRead={() => alert('Marked as read')}
            onPin={() => alert('Pinned thread')}
          >
            <div className="p-4 border border-border rounded-xl flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <Avatar name="Sarah Mitchell" size="md" />
                <div>
                  <h4 className="text-sm font-semibold text-label">Sarah Mitchell</h4>
                  <p className="text-xs text-secondary">
                    "I would like to reschedule my dental cleaning to next Tuesday..."
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-tertiary">2m ago</span>
            </div>
          </SwipeRow>

          <SwipeRow
            onArchive={() => alert('Archived Priya S.')}
            onDelete={() => alert('Deleted Priya S.')}
            onMarkRead={() => alert('Marked read')}
            onPin={() => alert('Pinned Priya S.')}
          >
            <div className="p-4 border border-border rounded-xl flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <Avatar name="Priya Sharma" size="md" />
                <div>
                  <h4 className="text-sm font-semibold text-label">Priya Sharma</h4>
                  <p className="text-xs text-secondary">
                    "What are your teeth whitening prices for new patients?"
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-tertiary">14m ago</span>
            </div>
          </SwipeRow>
        </div>
      </section>

      {/* 4. Long Press Context Menu & Tactile Haptics */}
      <section className="space-y-4">
        <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-tight">
          4. Tactile Long Press Context Menu (500ms Hold)
        </h2>
        <p className="text-[14px] text-[var(--ink-2)]">
          Press and hold for 500ms (or right click): item lifts (`scale 1.03`), background blurs, and glass menu appears.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LongPressContextMenu
            items={[
              { label: 'Edit Agent Prompt', icon: <Bot className="w-4 h-4" />, onClick: () => {} },
              { label: 'Publish to Website', icon: <Sparkles className="w-4 h-4" />, onClick: () => {} },
              { label: 'View Analytics', icon: <BarChart className="w-4 h-4" />, onClick: () => {} },
              {
                label: 'Delete Agent',
                icon: <Trash2 className="w-4 h-4" />,
                destructive: true,
                onClick: () => setActionSheetOpen(true),
              },
            ]}
          >
            <Card className="p-5 flex items-center justify-between border-2 border-dashed border-border/70 hover:border-accent/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-bold">
                  DA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-label">Dental Assistant</h4>
                  <p className="text-xs text-secondary">Hold 500ms for Glass Context Menu</p>
                </div>
              </div>
              <StatusPill status="demo" />
            </Card>
          </LongPressContextMenu>

          <Card className="p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-label">Destructive Action Sheet</h4>
              <p className="text-xs text-secondary mt-1">
                Bottom glass panel with red destructive choice and separate cancel capsule.
              </p>
            </div>
            <Button
              variant="destructive"
              className="mt-3 w-fit"
              onClick={() => {
                haptics.warning();
                setActionSheetOpen(true);
              }}
            >
              Trigger Action Sheet
            </Button>
          </Card>
        </div>
      </section>

      {/* 5. Phone Simulator with Real Widget Preview */}
      <section className="space-y-4">
        <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-accent" />
          5. Smartphone Simulator (`&lt;PhoneFrame&gt;`)
        </h2>
        <p className="text-[14px] text-[var(--ink-2)]">
          CSS-only titanium frame with dynamic island cutout, 3D cursor tilt, and in-situ Shadow DOM chat widget.
        </p>

        <div className="flex justify-center p-6 bg-surface-2/40 rounded-3xl border border-border">
          <PhoneFrame enableTilt>
            {/* Sample Smile Dental Mobile Site Content */}
            <div className="p-4 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="font-bold text-sm text-label">Smile Dental Clinic</span>
                <span className="text-[11px] font-semibold text-accent">Open Today</span>
              </div>

              <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20">
                <h4 className="text-xs font-bold text-accent">Emergency Care & Appointments</h4>
                <p className="text-[11px] text-secondary mt-0.5">
                  Book online or chat with our Dental Assistant 24/7.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-label">Featured Services</h5>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-xs">
                  Teeth Whitening & Cleaning — $180
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-xs">
                  Invisalign Consultation — Free
                </div>
              </div>
            </div>

            {/* Embedded Live Widget Container */}
            <div ref={widgetContainerRef} />
          </PhoneFrame>
        </div>
      </section>

      {/* 6. Status Pills (Honesty Contract) */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-bold text-[var(--ink)] tracking-tight">
          6. Status Pills (Honesty Contract — Rule 01)
        </h2>
        <Card className="flex flex-wrap items-center gap-3">
          <StatusPill status="live" />
          <StatusPill status="test_mode" />
          <StatusPill status="demo" />
          <StatusPill status="setup_required" />
          <StatusPill status="coming_soon" />
        </Card>
      </section>

      {/* 7. Bottom Sheet with Detents Modal */}
      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="iOS Bottom Sheet with Detents"
        detent={bottomSheetDetent}
        onDetentChange={setBottomSheetDetent}
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Drag the handle or swipe down to snap between medium (~52%) and large (~92%) detents. Drag down past threshold to dismiss with rubberband physics.
          </p>

          <div className="p-3 bg-surface-2/60 rounded-xl border border-border text-xs space-y-1">
            <div className="font-semibold text-label">Active Detent: {bottomSheetDetent}</div>
            <div className="text-secondary">Background page scales to 0.94 with 16px radius.</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                haptics.snap();
                setBottomSheetDetent(bottomSheetDetent === 'medium' ? 'large' : 'medium');
              }}
            >
              Toggle Detent
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                haptics.tap();
                setBottomSheetOpen(false);
              }}
            >
              Close Sheet
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* 8. Destructive Action Sheet */}
      <ActionSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title="Delete Dental Assistant Agent?"
        message="This will unpublish the agent from website chat, WhatsApp, and telephony channels. This action cannot be undone."
        options={[
          {
            label: 'Delete Agent Permanently',
            destructive: true,
            onClick: () => alert('Agent deleted'),
          },
        ]}
      />

      {/* Desktop Sheet Demo */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Interactive Apple Sheet"
        description="Centered 24px-radius on desktop, bottom sheet on mobile with accessible focus trapping."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setSheetOpen(false)}>
              Confirm Action
            </Button>
          </>
        }
      >
        <p className="text-[14px] text-[var(--ink-2)] leading-relaxed">
          This sheet demonstrates the Apple Human Interface Guidelines specification: spring animations, accessible Esc dismiss, and clear single-task focus.
        </p>
      </Sheet>
    </div>
  );
};
